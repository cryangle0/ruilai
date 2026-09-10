package com.ruilai.module.trade;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.DataScope;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.util.Ids;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.util.SnRanges;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.SnFactoryDates;
import com.ruilai.module.sn.SnWriter;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.risk.StockWarnService;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.PurchaseOrder;
import com.ruilai.module.trade.entity.StockLog;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.StockLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseOrderMapper poMapper;
    private final SnCodeMapper snMapper;
    private final StockLogMapper stockLogMapper;
    private final OrderNoGenerator orderNos;
    private final LogService logService;
    private final SnEventWriter eventWriter;
    private final SnWriter snWriter;
    private final StockWarnService stockWarnService;
    private final AgentL1Mapper l1Mapper;
    private final ProductMapper productMapper;

    public PageResult<PurchaseOrder> page(long page, long size, String status, String l1Id, String from, String to,
                                          String sn) {
        var q = Wrappers.<PurchaseOrder>lambdaQuery();
        if (!DataScope.isAdmin()) {
            q.eq(PurchaseOrder::getL1Id, DataScope.agentIdOrNull());
        } else if (StringUtils.hasText(l1Id)) {
            q.eq(PurchaseOrder::getL1Id, l1Id);
        }
        if (StringUtils.hasText(status)) {
            q.eq(PurchaseOrder::getStatus, status);
        }
        if (StringUtils.hasText(from)) {
            q.ge(PurchaseOrder::getCreatedAt, LocalDate.parse(from).atStartOfDay());
        }
        if (StringUtils.hasText(to)) {
            q.le(PurchaseOrder::getCreatedAt, LocalDate.parse(to).plusDays(1).atStartOfDay());
        }
        if (StringUtils.hasText(sn)) {
            q.apply("JSON_SEARCH(segments, 'one', {0}) IS NOT NULL", sn.trim());
        }
        q.orderByDesc(PurchaseOrder::getCreatedAt);
        PageResult<PurchaseOrder> result = PageResult.of(poMapper.selectPage(Page.of(page, size), q));
        result.list().forEach(this::enrich);
        return result;
    }

    public PurchaseOrder get(String id) {
        PurchaseOrder row = poMapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "采购单不存在");
        }
        LoginUser user = AuthUtil.current();
        if (!user.isAdmin() && !java.util.Objects.equals(user.getAgentId(), row.getL1Id())) {
            throw new BizException(ErrCode.FORBIDDEN, "无权查看该采购单");
        }
        enrich(row);
        return row;
    }

    private void enrich(PurchaseOrder row) {
        row.setWarnEx(stockWarnService.warnMeta(row.getL1Id(), null));
        if (StringUtils.hasText(row.getL1Id())) {
            AgentL1 agent = l1Mapper.selectById(row.getL1Id());
            row.setL1Name(agent == null ? row.getL1Id() : agent.getName());
        }
        nameProductLines(row.getLines(), "standard");
        nameProductLines(row.getCustomLines(), "nonstandard");
        if (row.getParts() != null) {
            for (Map<String, Object> part : row.getParts()) {
                String id = str(part.get("partId"), str(part.get("productId"), ""));
                if (!StringUtils.hasText(id)) {
                    continue;
                }
                Product product = productMapper.selectById(id);
                if (product != null) {
                    part.put("productName", product.getName());
                }
            }
        }
    }

    private void nameProductLines(List<Map<String, Object>> lines, String kitCategory) {
        if (lines == null) {
            return;
        }
        for (Map<String, Object> line : lines) {
            String id = str(line.get("productId"), "");
            if (!StringUtils.hasText(id)) {
                continue;
            }
            Product product = productMapper.selectById(id);
            if (product != null) {
                line.put("productName", product.getName());
                line.put("category", "single".equals(product.getType()) ? "single" : kitCategory);
            }
        }
    }

    public PurchaseOrder create(PurchaseOrder body) {
        LoginUser u = AuthUtil.current();
        if (!u.isAdmin() && !"L1".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "仅一级可发起采购");
        }
        if (!u.isAdmin()) {
            body.setL1Id(u.getAgentId());
        }
        if (!StringUtils.hasText(body.getL1Id())) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择一级代理");
        }
        body.setId(Ids.next("PO"));
        body.setNo(orderNos.next("PO"));
        body.setStatus("pending");
        if (body.getCosign() == null) {
            body.setCosign(new HashMap<>(Map.of("admin1", false, "admin2", false)));
        }
        poMapper.insert(body);
        logService.record("创建采购单 " + body.getNo(), "op", true);
        return body;
    }

    @Transactional
    public PurchaseOrder cosign(String id, Map<String, Object> segments) {
        return cosign(id, segments, null);
    }

    @Transactional
    public PurchaseOrder cosign(String id, Map<String, Object> segments, List<Map<String, Object>> customLines) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        PurchaseOrder po = get(id);
        if ("approved".equals(po.getStatus()) || "rejected".equals(po.getStatus())) {
            throw BizException.state("当前状态不可会签");
        }
        Map<String, Object> cosign = po.getCosign() == null ? new HashMap<>() : new HashMap<>(po.getCosign());
        String key = "admin".equals(AuthUtil.current().getUsername()) ? "admin1" : "admin2";
        if (Boolean.TRUE.equals(cosign.get(key))) {
            throw new BizException(ErrCode.BAD_REQUEST, "你已会签，等待另一管理员确认");
        }
        cosign.put(key, true);
        cosign.put(key + "At", ChinaTime.now().toString());
        cosign.put(key + "By", AuthUtil.current().getUsername());
        po.setCosign(cosign);
        if (customLines != null) {
            for (Map<String, Object> line : customLines) {
                if (!StringUtils.hasText(str(line.get("productId"), ""))
                        || !StringUtils.hasText(str(line.get("size"), ""))
                        || !StringUtils.hasText(str(line.get("belt"), ""))
                        || lineQty(List.of(line)) <= 0) {
                    throw new BizException(ErrCode.BAD_REQUEST, "非标品须选择商品、弹力带、腰带并填写正数数量");
                }
            }
            po.setCustomLines(customLines);
        }
        if (segments != null && !segments.isEmpty()) {
            po.setSegments(segments);
        }
        boolean both = Boolean.TRUE.equals(cosign.get("admin1")) && Boolean.TRUE.equals(cosign.get("admin2"));
        if (both) {
            int inbound = inbound(po);
            int need = lineQty(po.getLines()) + lineQty(po.getCustomLines());
            if (need > 0 && inbound <= 0) {
                throw new BizException(ErrCode.BAD_REQUEST, "双人会签完成前请填写有效 SN 号段");
            }
            po.setStatus("approved");
            po.setApprovedAt(ChinaTime.now());
        } else {
            po.setStatus("cosigning");
        }
        poMapper.updateById(po);
        logService.record("会签采购 " + po.getNo() + " by " + AuthUtil.current().getUsername(), "op", true);
        return po;
    }

    public void reject(String id, String reason) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        PurchaseOrder po = get(id);
        if ("approved".equals(po.getStatus()) || "rejected".equals(po.getStatus())) {
            throw BizException.state("当前状态不可驳回");
        }
        po.setStatus("rejected");
        po.setRejectReason(StringUtils.hasText(reason) ? reason.trim() : null);
        poMapper.updateById(po);
        logService.record("驳回采购 " + po.getNo() + " " + (reason == null ? "" : reason), "op", true);
    }

    public void delete(String id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        PurchaseOrder po = get(id);
        if ("approved".equals(po.getStatus())) {
            throw new BizException(ErrCode.BAD_REQUEST, "已完成采购单不可删除");
        }
        poMapper.deleteById(id);
        logService.record("删除采购单 " + po.getNo(), "op", true);
    }

    private int inbound(PurchaseOrder po) {
        if (po.getSegments() == null || po.getSegments().isEmpty()) {
            return 0;
        }
        Map<String, List<String>> validated = validateInbound(po);
        int total = 0;
        Map<String, Integer> byProduct = new HashMap<>();
        for (Map.Entry<String, List<String>> e : validated.entrySet()) {
            LineHint hint = hintOf(e.getKey(), po);
            for (String sn : e.getValue()) {
                applySn(sn, po, hint);
                total++;
                String pk = hint.productId + "|" + hint.size;
                byProduct.merge(pk, 1, Integer::sum);
            }
        }
        byProduct.forEach((pk, qty) -> {
            String[] parts = pk.split("\\|", 2);
            StockLog log = new StockLog();
            log.setId(Ids.next("H"));
            log.setAgentType("l1");
            log.setAgentId(po.getL1Id());
            log.setProductId(parts[0]);
            log.setSizeCode(parts.length > 1 ? parts[1] : null);
            log.setDelta(qty);
            log.setReason("采购入库");
            log.setRefNo(po.getNo());
            log.setOccurredAt(ChinaTime.now());
            stockLogMapper.insert(log);
        });
        return total;
    }

    private Map<String, List<String>> validateInbound(PurchaseOrder po) {
        Map<String, Integer> expected = new LinkedHashMap<>();
        mergeExpected(expected, po.getLines());
        mergeExpected(expected, po.getCustomLines());

        Map<String, List<String>> validated = new LinkedHashMap<>();
        Set<String> seen = new HashSet<>();
        int actualTotal = 0;
        for (Map.Entry<String, Object> entry : po.getSegments().entrySet()) {
            String key = entry.getKey();
            if (!expected.containsKey(key)) {
                throw new BizException(ErrCode.BAD_REQUEST, "号段对应的商品行不存在：" + key);
            }
            List<String> lineSns = new ArrayList<>();
            List<?> ranges = entry.getValue() instanceof List<?> list
                    ? list
                    : java.util.Collections.singletonList(entry.getValue());
            for (Object raw : ranges) {
                String range = String.valueOf(raw == null ? "" : raw).trim();
                List<String> expanded;
                try {
                    expanded = SnRanges.expandOneStrict(range);
                } catch (IllegalArgumentException ex) {
                    throw new BizException(ErrCode.BAD_REQUEST,
                            "商品行 " + key + " 的号段 " + range + "：" + ex.getMessage());
                }
                for (String sn : expanded) {
                    if (!seen.add(sn)) {
                        throw new BizException(ErrCode.BAD_REQUEST,
                                "商品行 " + key + " 的号段包含重复 SN：" + sn);
                    }
                    SnCode existing = snMapper.selectById(sn);
                    if (existing != null && !"warehouse".equals(existing.getStatus())) {
                        throw new BizException(ErrCode.BAD_REQUEST,
                                "商品行 " + key + " 的 SN " + sn + " 已在其他订单或库存中重复使用");
                    }
                    lineSns.add(sn);
                }
            }
            validated.put(key, lineSns);
            actualTotal += lineSns.size();
        }

        for (Map.Entry<String, Integer> line : expected.entrySet()) {
            int actual = validated.getOrDefault(line.getKey(), List.of()).size();
            if (actual != line.getValue()) {
                throw new BizException(ErrCode.BAD_REQUEST,
                        "商品行 " + line.getKey() + " 号段数量不一致：需要 "
                                + line.getValue() + "，已填 " + actual);
            }
        }
        int expectedTotal = expected.values().stream().mapToInt(Integer::intValue).sum();
        if (actualTotal != expectedTotal) {
            throw new BizException(ErrCode.BAD_REQUEST,
                    "采购商品总数量与号段总数量不一致：需要 " + expectedTotal + "，已填 " + actualTotal);
        }
        return validated;
    }

    private void mergeExpected(Map<String, Integer> expected, List<Map<String, Object>> lines) {
        if (lines == null) {
            return;
        }
        for (Map<String, Object> line : lines) {
            expected.merge(lineKey(line), lineQty(List.of(line)), Integer::sum);
        }
    }

    private String lineKey(Map<String, Object> line) {
        return str(line.get("productId"), "") + "_"
                + str(line.get("size"), "") + "_"
                + str(line.get("belt"), "");
    }

    private void applySn(String sn, PurchaseOrder po, LineHint hint) {
        SnCode row = snMapper.selectById(sn);
        if (row == null) {
            row = new SnCode();
            row.setSn(sn);
            row.setProductId(hint.productId);
            row.setSizeCode(hint.size);
            row.setBelt(hint.belt);
            row.setStatus("l1");
            row.setL1Id(po.getL1Id());
            row.setFrozen(0);
            row.setFactoryAt(SnFactoryDates.resolve(sn));
            eventWriter.append(row, "生成并审核入库", po.getNo() + " · 进入一级库存", "purchase");
            snMapper.insert(row);
            return;
        }
        if (row.getFrozen() != null && row.getFrozen() == 1 && "warehouse".equals(row.getStatus())) {
            row.setFrozen(0);
            List<String> tags = row.getTags() == null ? new ArrayList<>() : new ArrayList<>(row.getTags());
            tags.remove("已冻结");
            row.setTags(tags);
        } else if ("bound".equals(row.getStatus())) {
            throw new BizException(ErrCode.BAD_REQUEST, sn + " 已售出，不可再入库");
        } else if (("l1".equals(row.getStatus()) || "l2".equals(row.getStatus()))
                && StringUtils.hasText(row.getL1Id()) && !row.getL1Id().equals(po.getL1Id())) {
            throw new BizException(ErrCode.BAD_REQUEST, sn + " 已发给其他一级");
        } else if ("l1".equals(row.getStatus()) && po.getL1Id().equals(row.getL1Id())) {
            throw new BizException(ErrCode.BAD_REQUEST, sn + " 已在该代理库存");
        }
        row.setL1Id(po.getL1Id());
        row.setL2Id(null);
        row.setStatus("l1");
        if (row.getFactoryAt() == null) {
            row.setFactoryAt(SnFactoryDates.resolve(sn));
        }
        eventWriter.append(row, "采购审核入库", po.getNo() + " · 进入一级库存", "purchase");
        snWriter.update(row);
    }

    private LineHint hintOf(String key, PurchaseOrder po) {
        LineHint fallback = firstLine(po);
        if (!StringUtils.hasText(key) || "auto".equals(key)) {
            return fallback;
        }
        String[] p = key.split("_", 3);
        LineHint h = new LineHint();
        h.productId = p.length > 0 && StringUtils.hasText(p[0]) ? p[0] : fallback.productId;
        h.size = p.length > 1 ? p[1] : fallback.size;
        h.belt = p.length > 2 ? p[2] : fallback.belt;
        return h;
    }

    private LineHint firstLine(PurchaseOrder po) {
        LineHint h = new LineHint();
        h.productId = "P1";
        h.size = "M";
        h.belt = "腰带M";
        List<Map<String, Object>> lines = po.getLines();
        if (lines != null && !lines.isEmpty()) {
            Map<String, Object> l = lines.get(0);
            h.productId = str(l.get("productId"), h.productId);
            h.size = str(l.get("size"), h.size);
            h.belt = str(l.get("belt"), h.belt);
        } else if (po.getCustomLines() != null && !po.getCustomLines().isEmpty()) {
            Map<String, Object> l = po.getCustomLines().get(0);
            h.productId = str(l.get("productId"), h.productId);
            h.size = str(l.get("size"), h.size);
            h.belt = str(l.get("belt"), h.belt);
        }
        return h;
    }

    private static String str(Object v, String dft) {
        return v == null || String.valueOf(v).isBlank() ? dft : String.valueOf(v);
    }

    private int lineQty(List<Map<String, Object>> lines) {
        if (lines == null) {
            return 0;
        }
        int n = 0;
        for (Map<String, Object> l : lines) {
            Object q = l.get("qty");
            if (q instanceof Number num) {
                n += num.intValue();
            } else if (q != null) {
                try {
                    n += Integer.parseInt(String.valueOf(q));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return n;
    }

    private static final class LineHint {
        private String productId;
        private String size;
        private String belt;
    }
}
