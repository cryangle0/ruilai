package com.ruilai.module.dashboard;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.trade.entity.PurchaseOrder;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import com.ruilai.common.time.ChinaTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final SalesOrderMapper soMapper;
    private final SnCodeMapper snMapper;
    private final PurchaseOrderMapper poMapper;
    private final ExceptionTicketMapper exMapper;
    private final ReturnOrderMapper rtMapper;
    private final ProductMapper productMapper;

    public Map<String, Object> overview() {
        Map<String, Object> out = new HashMap<>();
        out.put("l1Count", l1Mapper.selectCount(Wrappers.<AgentL1>lambdaQuery().eq(AgentL1::getStatus, "启用")));
        out.put("l2Count", l2Mapper.selectCount(Wrappers.<AgentL2>lambdaQuery()
                .eq(AgentL2::getAuditStatus, "approved").eq(AgentL2::getPending, 0)));
        LocalDateTime monthStart = ChinaTime.today().withDayOfMonth(1).atStartOfDay();
        var sos = soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                .eq(SalesOrder::getStatus, "done").ge(SalesOrder::getCreatedAt, monthStart));
        int monthSales = sos.stream().mapToInt(s -> s.getScanned() == null ? 0 : s.getScanned().size()).sum();
        out.put("monthSales", monthSales);
        out.put("boundSn", snMapper.selectCount(Wrappers.<SnCode>lambdaQuery().eq(SnCode::getStatus, "bound")));
        out.put("pendingPo", poMapper.selectCount(Wrappers.<PurchaseOrder>lambdaQuery()
                .in(PurchaseOrder::getStatus, "pending", "cosigning")));
        out.put("openEx", exMapper.selectCount(Wrappers.<ExceptionTicket>lambdaQuery()
                .in(ExceptionTicket::getStatus, "待处理", "会签中")));
        out.put("pendingAssign", l2Mapper.selectCount(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getPending, 1)));
        out.put("pendingAudit", l2Mapper.selectCount(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getAuditStatus, "pending")));
        out.put("pendingReturn", rtMapper.selectCount(Wrappers.<ReturnOrder>lambdaQuery().eq(ReturnOrder::getStatus, "pending")));
        long pendingDisable = l1Mapper.selectList(null).stream().filter(DashboardService::pendingCosign).count()
                + l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getPending, 0)).stream().filter(DashboardService::pendingCosignL2).count();
        out.put("pendingDisable", pendingDisable);
        return out;
    }

    private static boolean pendingCosign(AgentL1 a) {
        if (a == null || "停用".equals(a.getStatus()) || a.getDisableCosign() == null) return false;
        boolean a1 = Boolean.TRUE.equals(a.getDisableCosign().get("admin1"));
        boolean a2 = Boolean.TRUE.equals(a.getDisableCosign().get("admin2"));
        return (a1 || a2) && !(a1 && a2);
    }

    private static boolean pendingCosignL2(AgentL2 a) {
        if (a == null || "停用".equals(a.getStatus()) || a.getDisableCosign() == null) return false;
        boolean a1 = Boolean.TRUE.equals(a.getDisableCosign().get("admin1"));
        boolean a2 = Boolean.TRUE.equals(a.getDisableCosign().get("admin2"));
        return (a1 || a2) && !(a1 && a2);
    }

    public Map<String, Object> stats(String l1Id, String l2Id, String fromStr, String toStr) {
        LocalDate from = parseDate(fromStr, ChinaTime.today().withDayOfMonth(1));
        LocalDate to = parseDate(toStr, ChinaTime.today());
        Map<String, String> productNames = new HashMap<>();
        for (Product p : productMapper.selectList(null)) {
            productNames.put(p.getId(), p.getName());
        }

        List<PurchaseOrder> pos = poMapper.selectList(Wrappers.<PurchaseOrder>lambdaQuery()
                .in(PurchaseOrder::getStatus, List.of("approved", "approvedPending")));
        List<SalesOrder> sos = soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery().eq(SalesOrder::getStatus, "done"));
        List<SnCode> sns = snMapper.selectList(null);
        List<ReturnOrder> rts = rtMapper.selectList(null);

        int purchaseAll;
        int purchaseRange;
        Map<String, Integer> purchaseByDay = new LinkedHashMap<>();
        if (StringUtils.hasText(l2Id)) {
            List<SalesOrder> inbound = sos.stream()
                    .filter(s -> "distribute".equals(s.getChannel()) && l2Id.equals(s.getL2Id()))
                    .toList();
            purchaseAll = sumSoQty(inbound);
            purchaseRange = sumSoQty(inbound.stream().filter(s -> inRange(s.getCreatedAt(), from, to)).toList());
            inbound.forEach(s -> addDay(purchaseByDay, s.getCreatedAt(), soQty(s)));
        } else {
            List<PurchaseOrder> scoped = pos.stream()
                    .filter(p -> !StringUtils.hasText(l1Id) || l1Id.equals(p.getL1Id()))
                    .toList();
            purchaseAll = sumPoQty(scoped);
            purchaseRange = sumPoQty(scoped.stream().filter(p -> inRange(poTime(p), from, to)).toList());
            scoped.forEach(p -> addDay(purchaseByDay, poTime(p), poQty(p)));
        }

        int salesAll;
        int salesRange;
        int distAll;
        int distRange;
        int directAll;
        int directRange;
        int actAll;
        int actRange;
        Map<String, Integer> salesByDay = new LinkedHashMap<>();
        Map<String, Integer> productMap = new HashMap<>();
        if (StringUtils.hasText(l2Id)) {
            List<SnCode> bound = sns.stream()
                    .filter(s -> "bound".equals(s.getStatus()) && l2Id.equals(s.getL2Id()))
                    .toList();
            salesAll = bound.size();
            List<SnCode> boundRange = bound.stream().filter(s -> inRange(bindTime(s), from, to)).toList();
            salesRange = boundRange.size();
            bound.forEach(s -> addDay(salesByDay, bindTime(s), 1));
            boundRange.forEach(s -> addProduct(productMap, productNames.getOrDefault(s.getProductId(), s.getProductId()), 1));
            // 二级面向 C 端的销量属于激活/终端销售，不属于一级“直售”渠道。
            directAll = 0;
            directRange = 0;
            List<SalesOrder> inbound = sos.stream()
                    .filter(s -> "distribute".equals(s.getChannel()) && l2Id.equals(s.getL2Id()))
                    .toList();
            distAll = sumSoQty(inbound);
            distRange = sumSoQty(inbound.stream().filter(s -> inRange(s.getCreatedAt(), from, to)).toList());
        } else {
            List<SalesOrder> scoped = sos.stream()
                    .filter(s -> !StringUtils.hasText(l1Id) || l1Id.equals(s.getL1Id()))
                    .toList();
            salesAll = sumSoQty(scoped);
            List<SalesOrder> soRange = scoped.stream().filter(s -> inRange(s.getCreatedAt(), from, to)).toList();
            salesRange = sumSoQty(soRange);
            scoped.forEach(s -> addDay(salesByDay, s.getCreatedAt(), soQty(s)));
            distAll = sumSoQty(scoped.stream().filter(s -> "distribute".equals(s.getChannel())).toList());
            distRange = sumSoQty(soRange.stream().filter(s -> "distribute".equals(s.getChannel())).toList());
            directAll = sumSoQty(scoped.stream().filter(s -> "direct".equals(s.getChannel())).toList());
            directRange = sumSoQty(soRange.stream().filter(s -> "direct".equals(s.getChannel())).toList());
            soRange.forEach(s -> addProduct(productMap, productNames.getOrDefault(s.getProductId(),
                    s.getProductId() == null ? "销售" : s.getProductId()), soQty(s)));
        }

        List<SnCode> snsScope = sns.stream().filter(s -> {
            if (StringUtils.hasText(l2Id)) return l2Id.equals(s.getL2Id());
            if (StringUtils.hasText(l1Id)) return l1Id.equals(s.getL1Id());
            return true;
        }).toList();
        int stock = (int) snsScope.stream().filter(this::inStock).count();
        List<SnCode> actSrc = snsScope.stream().filter(s -> "bound".equals(s.getStatus())).toList();
        actAll = actSrc.size();
        actRange = (int) actSrc.stream().filter(s -> inRange(bindTime(s), from, to)).count();

        List<ReturnOrder> rtScope = rts.stream().filter(r -> {
            if (StringUtils.hasText(l2Id)) {
                boolean snOk = r.getSns() != null && r.getSns().stream()
                        .anyMatch(sn -> sns.stream().anyMatch(s -> sn.equals(s.getSn()) && l2Id.equals(s.getL2Id())));
                return l2Id.equals(r.getFromId()) || snOk;
            }
            if (StringUtils.hasText(l1Id)) {
                boolean snOk = r.getSns() != null && r.getSns().stream()
                        .anyMatch(sn -> sns.stream().anyMatch(s -> sn.equals(s.getSn()) && l1Id.equals(s.getL1Id())));
                return l1Id.equals(r.getFromId()) || l1Id.equals(r.getApproverId()) || snOk;
            }
            return true;
        }).toList();
        int returnAll = rtQty(rtScope);
        int returnRange = rtQty(rtScope.stream().filter(r -> inRange(r.getCreatedAt(), from, to)).toList());

        Map<String, Object> trend = bucketTrend(from, to, purchaseByDay, salesByDay);
        List<Map<String, Object>> channelPie = StringUtils.hasText(l2Id)
                ? List.of(pie("到货", purchaseRange, "#0EA5C8"), pie("C端", salesRange, "#F5A623"))
                : List.of(pie("分销", distRange, "#1A68D7"), pie("直售", directRange, "#F5A623"));
        List<Map<String, Object>> snStatus = List.of(
                pie("原厂在库", snsScope.stream().filter(s -> "warehouse".equals(s.getStatus())).count(), "#9AA4B2"),
                pie("一级在库", snsScope.stream().filter(s -> "l1".equals(s.getStatus())).count(), "#1A68D7"),
                pie("二级在库", snsScope.stream().filter(s -> "l2".equals(s.getStatus())).count(), "#F5A623"),
                pie("已销售", snsScope.stream().filter(s -> "bound".equals(s.getStatus())).count(), "#1B9E5A")
        );
        List<Map<String, Object>> productBars = productMap.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(6)
                .map(e -> Map.<String, Object>of("label", e.getKey(), "value", e.getValue()))
                .toList();

        List<Map<String, Object>> l1Rank = new ArrayList<>();
        List<Map<String, Object>> l2Rank = new ArrayList<>();
        if (!StringUtils.hasText(l1Id) && !StringUtils.hasText(l2Id)) {
            for (AgentL1 a : l1Mapper.selectList(Wrappers.<AgentL1>lambdaQuery().eq(AgentL1::getStatus, "启用"))) {
                int q = sumSoQty(sos.stream().filter(s -> a.getId().equals(s.getL1Id()) && inRange(s.getCreatedAt(), from, to)).toList());
                String label = a.getName() == null ? a.getId() : a.getName().replaceAll("锐涞|总代|代理", "");
                if (label.length() > 8) label = label.substring(0, 8);
                l1Rank.add(Map.of("label", label.isBlank() ? a.getName() : label, "value", q));
            }
            l1Rank.sort(Comparator.comparingInt((Map<String, Object> m) -> ((Number) m.get("value")).intValue()).reversed());
        } else if (StringUtils.hasText(l1Id) && !StringUtils.hasText(l2Id)) {
            for (AgentL2 a : l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery()
                    .eq(AgentL2::getParentId, l1Id).eq(AgentL2::getAuditStatus, "approved").eq(AgentL2::getPending, 0))) {
                long q = sns.stream().filter(s -> a.getId().equals(s.getL2Id()) && "bound".equals(s.getStatus())
                        && inRange(bindTime(s), from, to)).count();
                String label = a.getName() == null ? a.getId() : a.getName();
                if (label.length() > 8) label = label.substring(0, 8);
                l2Rank.add(Map.of("label", label, "value", q));
            }
            l2Rank.sort(Comparator.comparingInt((Map<String, Object> m) -> ((Number) m.get("value")).intValue()).reversed());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("purchaseRange", purchaseRange);
        out.put("purchaseAll", purchaseAll);
        out.put("salesRange", salesRange);
        out.put("salesAll", salesAll);
        out.put("stock", stock);
        out.put("distRange", distRange);
        out.put("distAll", distAll);
        out.put("directRange", directRange);
        out.put("directAll", directAll);
        out.put("returnRange", returnRange);
        out.put("returnAll", returnAll);
        out.put("actRange", actRange);
        out.put("actAll", actAll);
        out.put("dayLabels", trend.get("labels"));
        out.put("trendPurchase", trend.get("purchase"));
        out.put("trendSales", trend.get("sales"));
        out.put("trendGrain", trend.get("grain"));
        out.put("channelPie", channelPie);
        out.put("snStatus", snStatus);
        out.put("productBars", productBars);
        out.put("l1Rank", l1Rank);
        out.put("l2Rank", l2Rank);
        out.put("from", from.toString());
        out.put("to", to.toString());
        out.put("l1Id", l1Id == null ? "" : l1Id);
        out.put("l2Id", l2Id == null ? "" : l2Id);
        return out;
    }

    private LocalDate parseDate(String s, LocalDate fallback) {
        if (!StringUtils.hasText(s)) return fallback;
        try {
            return LocalDate.parse(s.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private boolean inRange(LocalDateTime t, LocalDate from, LocalDate to) {
        if (t == null) return false;
        LocalDate d = t.toLocalDate();
        return !d.isBefore(from) && !d.isAfter(to);
    }

    private LocalDateTime poTime(PurchaseOrder p) {
        return p.getApprovedAt() != null ? p.getApprovedAt() : p.getCreatedAt();
    }

    private LocalDateTime bindTime(SnCode s) {
        return com.ruilai.module.sn.BindTimes.of(s);
    }

    private boolean inStock(SnCode s) {
        if (s.getFrozen() != null && s.getFrozen() == 1) return false;
        return "l1".equals(s.getStatus()) || "l2".equals(s.getStatus());
    }

    private int soQty(SalesOrder s) {
        return s.getScanned() == null ? 0 : s.getScanned().size();
    }

    private int poQty(PurchaseOrder p) {
        return lineQty(p.getLines()) + lineQty(p.getCustomLines()) + lineQty(p.getParts());
    }

    private int sumSoQty(List<SalesOrder> list) {
        return list.stream().mapToInt(this::soQty).sum();
    }

    private int sumPoQty(List<PurchaseOrder> list) {
        return list.stream().mapToInt(this::poQty).sum();
    }

    private int lineQty(List<Map<String, Object>> lines) {
        if (lines == null) return 0;
        int n = 0;
        for (Map<String, Object> line : lines) {
            Object q = line.get("qty");
            if (q instanceof Number num) n += num.intValue();
            else if (q != null) {
                try { n += Integer.parseInt(String.valueOf(q)); } catch (Exception ignored) { }
            }
        }
        return n;
    }

    private int rtQty(List<ReturnOrder> list) {
        int n = 0;
        for (ReturnOrder r : list) {
            n += r.getSns() == null ? 0 : r.getSns().size();
        }
        return n;
    }

    private void addDay(Map<String, Integer> map, LocalDateTime t, int n) {
        if (t == null || n == 0) return;
        String key = t.toLocalDate().toString();
        map.merge(key, n, Integer::sum);
    }

    private void addProduct(Map<String, Integer> map, String name, int n) {
        if (!StringUtils.hasText(name) || n == 0) return;
        map.merge(name, n, Integer::sum);
    }

    private Map<String, Object> pie(String label, long value, String color) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("label", label);
        m.put("value", value);
        m.put("color", color);
        return m;
    }

    private Map<String, Object> bucketTrend(LocalDate from, LocalDate to,
                                            Map<String, Integer> purchase, Map<String, Integer> sales) {
        List<String> labels = new ArrayList<>();
        List<Integer> pVals = new ArrayList<>();
        List<Integer> sVals = new ArrayList<>();
        long span = ChronoUnit.DAYS.between(from, to) + 1;
        if (span <= 45) {
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                String key = d.toString();
                labels.add(key.length() >= 10 ? key.substring(5) : key);
                pVals.add(purchase.getOrDefault(key, 0));
                sVals.add(sales.getOrDefault(key, 0));
            }
        } else {
            YearMonth end = YearMonth.from(to);
            YearMonth start = YearMonth.from(from);
            if (start.plusMonths(35).isBefore(end)) {
                start = end.minusMonths(35);
            }
            for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
                String key = ym.toString();
                labels.add(key.length() >= 7 ? key.substring(2) : key);
                pVals.add(sumPrefix(purchase, key));
                sVals.add(sumPrefix(sales, key));
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("labels", labels);
        out.put("purchase", pVals);
        out.put("sales", sVals);
        out.put("grain", span <= 45 ? "按日" : "按月");
        return out;
    }

    private static int sumPrefix(Map<String, Integer> map, String prefix) {
        int n = 0;
        for (Map.Entry<String, Integer> e : map.entrySet()) {
            if (e.getKey() != null && e.getKey().startsWith(prefix)) {
                n += e.getValue();
            }
        }
        return n;
    }
}
