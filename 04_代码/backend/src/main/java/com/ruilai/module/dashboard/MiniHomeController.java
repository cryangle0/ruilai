package com.ruilai.module.dashboard;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.R;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.trade.entity.PurchaseOrder;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mini")
@RequiredArgsConstructor
public class MiniHomeController {

    private final SnCodeMapper snMapper;
    private final SalesOrderMapper soMapper;
    private final PurchaseOrderMapper poMapper;
    private final ReturnOrderMapper rtMapper;
    private final AgentL2Mapper l2Mapper;
    private final DashboardService dashboardService;

    @GetMapping("/home")
    public R<Map<String, Object>> home(@RequestParam(required = false) String from,
                                       @RequestParam(required = false) String to,
                                       @RequestParam(required = false) String l2Id) {
        LoginUser u = AuthUtil.current();
        boolean unbounded = !StringUtils.hasText(from) && !StringUtils.hasText(to);
        LocalDate fromD = unbounded ? LocalDate.of(1990, 1, 1) : parseDate(from, ChinaTime.today().withDayOfMonth(1));
        LocalDate toD = unbounded ? ChinaTime.today() : parseDate(to, ChinaTime.today());
        LocalDateTime fromDt = fromD.atStartOfDay();
        LocalDateTime toDt = toD.atTime(23, 59, 59);

        String childId = resolveChild(u, l2Id);
        boolean l2View = "L2".equals(u.getRoleCode()) || StringUtils.hasText(childId);
        String scopedL2 = "L2".equals(u.getRoleCode()) ? u.getAgentId() : childId;
        String l1Id = "L2".equals(u.getRoleCode()) ? null : u.getAgentId();

        Map<String, Object> out = new HashMap<>();
        out.put("roleCode", u.getRoleCode());
        out.put("name", u.getName());
        out.put("agentId", u.getAgentId());
        out.put("from", unbounded ? "" : fromD.toString());
        out.put("to", unbounded ? "" : toD.toString());

        var snQ = Wrappers.<SnCode>lambdaQuery();
        if (l2View) {
            snQ.eq(SnCode::getL2Id, scopedL2).eq(SnCode::getStatus, "l2");
        } else {
            snQ.eq(SnCode::getL1Id, l1Id).eq(SnCode::getStatus, "l1");
        }
        long stockQty = snMapper.selectCount(snQ);
        out.put("stockQty", stockQty);
        if (l2View) {
            List<SnCode> scopedSns = snMapper.selectList(Wrappers.<SnCode>lambdaQuery()
                    .eq(SnCode::getL2Id, scopedL2));
            Map<String, Long> byStatus = new LinkedHashMap<>();
            for (SnCode row : scopedSns) {
                String label = switch (String.valueOf(row.getStatus())) {
                    case "l2" -> "当前在库";
                    case "bound" -> "已激活";
                    default -> "其他";
                };
                byStatus.merge(label, 1L, Long::sum);
            }
            out.put("snStatus", byStatus.entrySet().stream()
                    .map(e -> Map.<String, Object>of("label", e.getKey(), "value", e.getValue()))
                    .toList());
        } else {
            out.put("snStatus", List.of());
        }

        int purchaseAll;
        int purchaseRange;
        if (l2View) {
            List<SalesOrder> inbound = soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                    .eq(SalesOrder::getL2Id, scopedL2)
                    .eq(SalesOrder::getChannel, "distribute")
                    .eq(SalesOrder::getStatus, "done"));
            purchaseAll = scannedQty(inbound);
            purchaseRange = scannedQty(inbound.stream().filter(s -> inRange(s.getCreatedAt(), fromDt, toDt)).toList());
        } else {
            List<PurchaseOrder> pos = poMapper.selectList(Wrappers.<PurchaseOrder>lambdaQuery()
                    .eq(!u.isAdmin(), PurchaseOrder::getL1Id, l1Id)
                    .eq(PurchaseOrder::getStatus, "approved"));
            purchaseAll = poQty(pos);
            purchaseRange = poQty(pos.stream().filter(p -> inRange(
                    p.getApprovedAt() != null ? p.getApprovedAt() : p.getCreatedAt(), fromDt, toDt)).toList());
        }
        out.put("purchaseAll", purchaseAll);
        out.put("purchaseRange", purchaseRange);

        int salesAll;
        int salesRange;
        int distAll;
        int distRange;
        int directAll;
        int directRange;
        if (l2View) {
            var boundQ = Wrappers.<SnCode>lambdaQuery().eq(SnCode::getL2Id, scopedL2).eq(SnCode::getStatus, "bound");
            List<SnCode> bound = snMapper.selectList(boundQ);
            salesAll = bound.size();
            salesRange = (int) bound.stream().filter(s -> inRange(bindTime(s), fromDt, toDt)).count();
            directAll = salesAll;
            directRange = salesRange;
            List<SalesOrder> inboundAll = soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                    .eq(SalesOrder::getL2Id, scopedL2)
                    .eq(SalesOrder::getChannel, "distribute")
                    .eq(SalesOrder::getStatus, "done"));
            distAll = scannedQty(inboundAll);
            distRange = scannedQty(inboundAll.stream().filter(s -> inRange(s.getCreatedAt(), fromDt, toDt)).toList());
        } else {
            List<SalesOrder> so = soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                    .eq(SalesOrder::getStatus, "done")
                    .eq(!u.isAdmin(), SalesOrder::getL1Id, l1Id));
            salesAll = scannedQty(so);
            List<SalesOrder> soRange = so.stream().filter(s -> inRange(s.getCreatedAt(), fromDt, toDt)).toList();
            salesRange = scannedQty(soRange);
            distAll = scannedQty(so.stream().filter(s -> "distribute".equals(s.getChannel())).toList());
            distRange = scannedQty(soRange.stream().filter(s -> "distribute".equals(s.getChannel())).toList());
            directAll = scannedQty(so.stream().filter(s -> "direct".equals(s.getChannel())).toList());
            directRange = scannedQty(soRange.stream().filter(s -> "direct".equals(s.getChannel())).toList());
        }
        out.put("salesAll", salesAll);
        out.put("salesRange", salesRange);
        out.put("distAll", distAll);
        out.put("distRange", distRange);
        out.put("directAll", directAll);
        out.put("directRange", directRange);
        out.put("monthSales", salesRange);

        List<ReturnOrder> rts = rtMapper.selectList(Wrappers.<ReturnOrder>lambdaQuery()
                .and(w -> {
                    if (l2View) {
                        w.eq(ReturnOrder::getFromId, scopedL2);
                    } else {
                        w.eq(ReturnOrder::getFromId, u.getAgentId()).or().eq(ReturnOrder::getApproverId, u.getAgentId());
                    }
                }));
        int returnAll = rtQty(rts);
        int returnRange = rtQty(rts.stream().filter(r -> inRange(r.getCreatedAt(), fromDt, toDt)).toList());
        out.put("returnAll", returnAll);
        out.put("returnRange", returnRange);

        var actQ = Wrappers.<SnCode>lambdaQuery().eq(SnCode::getStatus, "bound");
        if (l2View) actQ.eq(SnCode::getL2Id, scopedL2);
        else if (!u.isAdmin()) actQ.eq(SnCode::getL1Id, l1Id);
        List<SnCode> acts = snMapper.selectList(actQ);
        out.put("actAll", acts.size());
        out.put("actRange", acts.stream().filter(s -> inRange(bindTime(s), fromDt, toDt)).count());

        if ("L1".equals(u.getRoleCode()) || u.isAdmin()) {
            out.put("pendingPo", poMapper.selectCount(Wrappers.<PurchaseOrder>lambdaQuery()
                    .eq(!u.isAdmin(), PurchaseOrder::getL1Id, u.getAgentId())
                    .in(PurchaseOrder::getStatus, "pending", "cosigning")));
        } else {
            out.put("pendingPo", 0);
        }
        out.put("pendingReturn", rtMapper.selectCount(Wrappers.<ReturnOrder>lambdaQuery()
                .eq(ReturnOrder::getStatus, "pending")
                .and(w -> w.eq(ReturnOrder::getFromId, u.getAgentId()).or().eq(ReturnOrder::getApproverId, u.getAgentId()))));
        out.put("scanningSo", soMapper.selectCount(Wrappers.<SalesOrder>lambdaQuery()
                .eq(SalesOrder::getStatus, "scanning")
                .eq("L2".equals(u.getRoleCode()), SalesOrder::getL2Id, u.getAgentId())
                .eq(!"L2".equals(u.getRoleCode()) && !u.isAdmin(), SalesOrder::getL1Id, u.getAgentId())));

        String statsL1 = l2View ? null : l1Id;
        String statsL2 = l2View ? scopedL2 : null;
        Map<String, Object> charts = dashboardService.stats(statsL1, statsL2, fromD.toString(), toD.toString());
        out.put("dayLabels", charts.get("dayLabels"));
        out.put("trendPurchase", charts.get("trendPurchase"));
        out.put("trendSales", charts.get("trendSales"));
        out.put("trendGrain", charts.get("trendGrain"));
        out.put("channelPie", charts.get("channelPie"));
        out.put("productBars", charts.get("productBars"));
        out.put("l2Rank", charts.get("l2Rank"));
        return R.ok(out);
    }

    private String resolveChild(LoginUser u, String l2Id) {
        if (!StringUtils.hasText(l2Id) || !"L1".equals(u.getRoleCode())) {
            return null;
        }
        AgentL2 child = l2Mapper.selectById(l2Id);
        if (child == null || !u.getAgentId().equals(child.getParentId())) {
            throw new BizException(ErrCode.FORBIDDEN, "只能查看当前一级的下属二级");
        }
        return l2Id;
    }

    private static LocalDate parseDate(String raw, LocalDate fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private static boolean inRange(LocalDateTime t, LocalDateTime from, LocalDateTime to) {
        if (t == null) {
            return false;
        }
        return !t.isBefore(from) && !t.isAfter(to);
    }

    private static LocalDateTime bindTime(SnCode s) {
        return com.ruilai.module.sn.BindTimes.of(s);
    }

    private static int scannedQty(List<SalesOrder> list) {
        int n = 0;
        for (SalesOrder s : list) {
            n += s.getScanned() == null ? 0 : s.getScanned().size();
        }
        return n;
    }

    private static int poQty(List<PurchaseOrder> list) {
        int n = 0;
        for (PurchaseOrder p : list) {
            n += lineQty(p.getLines()) + lineQty(p.getCustomLines()) + lineQty(p.getParts());
        }
        return n;
    }

    private static int lineQty(List<Map<String, Object>> lines) {
        if (lines == null) {
            return 0;
        }
        int n = 0;
        for (Map<String, Object> line : lines) {
            Object q = line.get("qty");
            if (q instanceof Number num) {
                n += num.intValue();
            } else if (q != null) {
                try {
                    n += Integer.parseInt(String.valueOf(q).trim());
                } catch (Exception ignored) {
                }
            }
        }
        return n;
    }

    private static int rtQty(List<ReturnOrder> list) {
        int n = 0;
        for (ReturnOrder r : list) {
            n += r.getSns() == null ? 0 : r.getSns().size();
        }
        return n;
    }
}
