package com.ruilai.module.sn;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.util.SnRanges;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.QueryValues;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SnService {

    private static final DateTimeFormatter EVENT_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SnCodeMapper snMapper;
    private final ProductMapper productMapper;
    private final SnEventWriter eventWriter;
    private final SnWriter snWriter;
    private final LogService logService;
    private final ExceptionTicketMapper exMapper;
    private final ReturnOrderMapper returnMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;

    public PageResult<SnCode> page(long page, long size, String sn, String status, String l1Id, String l2Id,
                                   String productName, String productId, String sizeCode, String belt,
                                   String channel, String tag,
                                   String factoryFrom, String factoryTo,
                                   String soldFrom, String soldTo,
                                   String returnFrom, String returnTo) {
        productId = QueryValues.decode(productId);
        sizeCode = QueryValues.decode(sizeCode);
        belt = QueryValues.decode(belt);
        var q = Wrappers.<SnCode>lambdaQuery();
        if (StringUtils.hasText(sn)) {
            q.like(SnCode::getSn, sn);
        }
        if (StringUtils.hasText(status)) {
            if (status.contains(",")) {
                q.in(SnCode::getStatus, java.util.Arrays.stream(status.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList());
            } else {
                q.eq(SnCode::getStatus, status);
            }
        }
        if (StringUtils.hasText(sizeCode)) {
            q.eq(SnCode::getSizeCode, sizeCode);
        }
        if (StringUtils.hasText(belt)) {
            q.eq(SnCode::getBelt, belt);
        }
        if (StringUtils.hasText(productId) || StringUtils.hasText(productName)) {
            List<String> ids = resolveProductIds(productId, productName);
            if (ids.isEmpty()) {
                return PageResult.of(new Page<>(page, size));
            }
            q.in(SnCode::getProductId, ids);
        }
        if (StringUtils.hasText(channel)) {
            q.eq(SnCode::getStatus, "bound");
            if ("direct".equals(channel)) {
                q.and(w -> w.isNull(SnCode::getL2Id).or().eq(SnCode::getL2Id, ""));
            } else if ("distribute".equals(channel)) {
                q.isNotNull(SnCode::getL2Id).ne(SnCode::getL2Id, "");
            }
        }
        if (StringUtils.hasText(tag)) {
            String safe = SnTags.sanitize(tag);
            if (StringUtils.hasText(safe)) {
                q.apply(SnTags.jsonContainsSql(), safe);
            }
        }
        applyFactoryDay(q, factoryFrom, factoryTo);
        applyDate(q, SnCode::getSoldAt, soldFrom, soldTo);
        applyDate(q, SnCode::getReturnAt, returnFrom, returnTo);
        if (!com.ruilai.common.security.DataScope.isAdmin()) {
            String role = com.ruilai.common.security.DataScope.user().getRoleCode();
            String agent = com.ruilai.common.security.DataScope.user().getAgentId();
            if ("L2".equals(role)) {
                q.eq(SnCode::getL2Id, agent);
            } else {
                q.eq(SnCode::getL1Id, agent);
                if (StringUtils.hasText(l2Id)) {
                    q.eq(SnCode::getL2Id, l2Id);
                }
            }
        } else {
            if (StringUtils.hasText(l1Id)) {
                q.eq(SnCode::getL1Id, l1Id);
            }
            if (StringUtils.hasText(l2Id)) {
                q.eq(SnCode::getL2Id, l2Id);
            }
        }
        Map<String, ExceptionTicket> open = openActivateBySn();
        if (!open.isEmpty()) {
            String in = open.keySet().stream().map(s -> "'" + s.replace("'", "") + "'").reduce((a, b) -> a + "," + b).orElse("''");
            q.last("ORDER BY CASE WHEN sn IN (" + in + ") THEN 0 ELSE 1 END, updated_at DESC");
        } else {
            q.orderByDesc(SnCode::getUpdatedAt);
        }
        PageResult<SnCode> result = PageResult.of(snMapper.selectPage(Page.of(page, size), q));
        result.list().forEach(row -> {
            enrichForDisplay(row);
            applyOpenException(row, open);
        });
        return result;
    }

    public SnCode get(String sn) {
        SnCode row = snMapper.selectById(sn);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "SN 不存在");
        }
        enrichForDisplay(row);
        applyOpenException(row, openActivateBySn());
        fillAgentNames(row);
        return row;
    }

    public SnCode freeze(String sn, boolean frozen) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        SnCode row = get(sn);
        row.setFrozen(frozen ? 1 : 0);
        List<String> tags = row.getTags() == null ? new ArrayList<>() : new ArrayList<>(row.getTags());
        tags.remove("已冻结");
        if (frozen) {
            tags.add("已冻结");
            eventWriter.append(row, "冻结", "平台冻结，不可再出货/激活", "factory");
        } else {
            eventWriter.append(row, "解冻", "平台解除冻结", "factory");
        }
        row.setTags(tags);
        snMapper.updateById(row);
        logService.record((frozen ? "冻结" : "解冻") + " SN " + sn, "op", true);
        fillProductName(row);
        return row;
    }

    public List<SnCode> generate(String l1Id, String productId, String size, String belt, int qty) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        if (qty < 1 || qty > 200) {
            throw new BizException(ErrCode.BAD_REQUEST, "生成数量须在 1–200");
        }
        if (!StringUtils.hasText(productId)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择商品");
        }
        String prefix = "RL" + ChinaTime.today().format(DateTimeFormatter.BASIC_ISO_DATE);
        List<SnCode> existing = snMapper.selectList(Wrappers.<SnCode>lambdaQuery().likeRight(SnCode::getSn, prefix));
        int max = 0;
        for (SnCode s : existing) {
            String sn = s.getSn();
            if (sn != null && sn.length() > prefix.length()) {
                try {
                    max = Math.max(max, Integer.parseInt(sn.substring(prefix.length())));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        List<SnCode> created = new ArrayList<>();
        for (int i = 1; i <= qty; i++) {
            SnCode row = newSn(prefix + String.format("%04d", max + i), productId, size, belt, l1Id);
            eventWriter.append(row, "系统生成", "原厂在库", "factory");
            snMapper.insert(row);
            fillProductName(row);
            created.add(row);
        }
        logService.record("系统生成 SN " + created.size() + " 条", "op", true);
        return created;
    }

    public List<SnCode> importSegments(String l1Id, String productId, String size, String belt, String text) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        List<String> sns = SnRanges.expand(text);
        if (sns.isEmpty()) {
            throw new BizException(ErrCode.BAD_REQUEST, "未解析到有效号段");
        }
        if (sns.size() > 5000) {
            throw new BizException(ErrCode.BAD_REQUEST, "单次导入不超过 5000");
        }
        List<SnCode> created = new ArrayList<>();
        for (String sn : sns) {
            if (snMapper.selectById(sn) != null) {
                continue;
            }
            SnCode row = newSn(sn, productId, size, belt, l1Id);
            eventWriter.append(row, "Excel 导入段号", "原厂在库待入库", "factory");
            snMapper.insert(row);
            fillProductName(row);
            created.add(row);
        }
        logService.record("导入 SN 段号 " + created.size() + " 条", "op", true);
        return created;
    }

    public SnCode update(String sn, Map<String, Object> body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        SnCode row = get(sn);
        StringBuilder desc = new StringBuilder();
        if (body.get("sizeCode") != null || body.get("size") != null) {
            String v = str(body.get("sizeCode") != null ? body.get("sizeCode") : body.get("size"));
            if (StringUtils.hasText(v) && !v.equals(row.getSizeCode())) {
                desc.append("弹力带 ").append(row.getSizeCode()).append("→").append(v).append("；");
                row.setSizeCode(v);
            }
        }
        if (body.get("belt") != null) {
            String v = str(body.get("belt"));
            if (!v.equals(nz(row.getBelt()))) {
                desc.append("腰带 ").append(nz(row.getBelt())).append("→").append(v).append("；");
                row.setBelt(v);
            }
        }
        if (body.containsKey("l1Id")) {
            String v = str(body.get("l1Id"));
            if (!v.equals(nz(row.getL1Id()))) {
                desc.append("一级 ").append(nz(row.getL1Id())).append("→").append(v).append("；");
                row.setL1Id(v.isBlank() ? null : v);
            }
        }
        if (body.containsKey("l2Id")) {
            String v = str(body.get("l2Id"));
            if (!v.equals(nz(row.getL2Id()))) {
                desc.append("二级 ").append(nz(row.getL2Id())).append("→").append(v).append("；");
                row.setL2Id(v.isBlank() ? null : v);
                if (StringUtils.hasText(v) && "l1".equals(row.getStatus())) {
                    row.setStatus("l2");
                }
                if (!StringUtils.hasText(v) && "l2".equals(row.getStatus())) {
                    row.setStatus("l1");
                }
            }
        }
        Map<String, Object> extra = row.getExtra() == null ? new HashMap<>() : new HashMap<>(row.getExtra());
        if (body.get("situationNotes") != null) {
            extra.put("situationNotes", body.get("situationNotes"));
        }
        if (body.get("processNotes") != null) {
            extra.put("processNotes", body.get("processNotes"));
        }
        row.setExtra(extra);
        if (!desc.isEmpty()) {
            eventWriter.append(row, "修改 SN", AuthUtil.current().getUsername() + " " + desc, "edit");
        }
        snWriter.update(row);
        logService.record("修改 SN " + sn, "edit", true);
        return get(sn);
    }

    public SnCode reassignFrozen(String sn, String l1Id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        SnCode row = get(sn);
        boolean frozen = row.getFrozen() != null && row.getFrozen() == 1;
        boolean tagged = row.getTags() != null && row.getTags().contains("已冻结");
        if (!frozen && !tagged) {
            throw new BizException(ErrCode.BAD_REQUEST, "仅已冻结 SN 可重分配");
        }
        if (!StringUtils.hasText(l1Id)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择一级");
        }
        row.setFrozen(0);
        List<String> tags = row.getTags() == null ? new ArrayList<>() : new ArrayList<>(row.getTags());
        tags.remove("已冻结");
        row.setTags(tags);
        row.setL1Id(l1Id);
        row.setL2Id(null);
        row.setStatus("l1");
        eventWriter.append(row, "原厂在库重分配", "解冻并分配给一级 " + l1Id, "factory");
        snWriter.update(row);
        logService.record("重分配冻结 SN " + sn + " → " + l1Id, "op", true);
        return get(sn);
    }

    private SnCode newSn(String sn, String productId, String size, String belt, String l1Id) {
        SnCode row = new SnCode();
        row.setSn(sn);
        row.setProductId(productId);
        row.setSizeCode(size);
        row.setBelt(belt);
        row.setStatus("warehouse");
        row.setFrozen(0);
        row.setFactoryAt(SnFactoryDates.resolve(sn));
        if (StringUtils.hasText(l1Id)) {
            row.setL1Id(l1Id);
        }
        return row;
    }

    private Map<String, ExceptionTicket> openActivateBySn() {
        List<ExceptionTicket> list = exMapper.selectList(Wrappers.<ExceptionTicket>lambdaQuery()
                .in(ExceptionTicket::getStatus, "待处理", "会签中")
                .in(ExceptionTicket::getDim, "activate", "scan"));
        Map<String, ExceptionTicket> out = new java.util.LinkedHashMap<>();
        if (list == null) {
            return out;
        }
        for (ExceptionTicket e : list) {
            if (e.getTarget() != null && e.getTarget().toUpperCase().startsWith("RL")) {
                out.putIfAbsent(e.getTarget().toUpperCase(), e);
            }
        }
        return out;
    }

    private void applyOpenException(SnCode row, Map<String, ExceptionTicket> open) {
        if (row == null || !StringUtils.hasText(row.getSn()) || open == null) {
            return;
        }
        ExceptionTicket ticket = open.get(row.getSn().toUpperCase());
        row.setOpenException(ticket != null);
        if (ticket != null) {
            row.setOpenExceptionType(ticket.getType());
            row.setOpenExceptionDetail(ticket.getDetail());
        }
    }

    private void applyDate(com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SnCode> q,
                           com.baomidou.mybatisplus.core.toolkit.support.SFunction<SnCode, LocalDateTime> col,
                           String from, String to) {
        if (StringUtils.hasText(from)) {
            try {
                q.ge(col, LocalDate.parse(from.trim()).atStartOfDay());
            } catch (Exception ignored) {
            }
        }
        if (StringUtils.hasText(to)) {
            try {
                q.le(col, LocalDate.parse(to.trim()).atTime(23, 59, 59));
            } catch (Exception ignored) {
            }
        }
    }

    private void fillProductName(SnCode row) {
        if (row == null || !StringUtils.hasText(row.getProductId())) {
            return;
        }
        Product p = productMapper.selectById(row.getProductId());
        row.setProductName(p == null ? row.getProductId() : p.getName());
        if (row.getTags() == null) {
            row.setTags(List.of());
        }
    }

    private void enrichForDisplay(SnCode row) {
        fillProductName(row);
        LocalDateTime fromSn = SnFactoryDates.fromSnPrefix(row.getSn());
        if (fromSn != null) {
            row.setFactoryAt(fromSn);
        } else if (row.getFactoryAt() == null && row.getCreatedAt() != null) {
            row.setFactoryAt(row.getCreatedAt());
        }
        ensureLifecycleForDisplay(row);
    }

    private void fillAgentNames(SnCode row) {
        if (row == null) {
            return;
        }
        if (StringUtils.hasText(row.getL1Id())) {
            AgentL1 agent = l1Mapper.selectById(row.getL1Id());
            row.setL1Name(agent == null ? row.getL1Id() : agent.getName());
        }
        if (StringUtils.hasText(row.getL2Id())) {
            AgentL2 agent = l2Mapper.selectById(row.getL2Id());
            row.setL2Name(agent == null ? row.getL2Id() : agent.getName());
        }
    }

    private List<String> resolveProductIds(String productId, String productName) {
        String code = productId == null ? "" : productId.trim();
        String name = productName == null ? "" : productName.trim();
        var w = Wrappers.<Product>lambdaQuery();
        w.and(q -> {
            boolean any = false;
            if (StringUtils.hasText(code)) {
                q.eq(Product::getId, code).or().eq(Product::getCode, code).or().like(Product::getCode, code);
                any = true;
            }
            if (StringUtils.hasText(name)) {
                if (any) {
                    q.or();
                }
                q.like(Product::getName, name);
            }
        });
        return productMapper.selectList(w).stream().map(Product::getId).distinct().toList();
    }

    private void applyFactoryDay(com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SnCode> q,
                                 String from, String to) {
        if (StringUtils.hasText(from)) {
            try {
                q.apply(SnFactoryDates.SQL_FACTORY_DAY + " >= {0}", LocalDate.parse(from.trim()));
            } catch (Exception ignored) {
            }
        }
        if (StringUtils.hasText(to)) {
            try {
                q.apply(SnFactoryDates.SQL_FACTORY_DAY + " <= {0}", LocalDate.parse(to.trim()));
            } catch (Exception ignored) {
            }
        }
    }

    /**
     * 兼容旧数据：历史记录可能已经销售但没有 events。只补接口响应，不在读取时写库。
     */
    private void ensureLifecycleForDisplay(SnCode row) {
        if (row == null) {
            return;
        }
        List<Map<String, Object>> events = row.getEvents() == null
                ? new ArrayList<>()
                : new ArrayList<>(row.getEvents());
        boolean hasFactoryOrigin = events.stream().anyMatch(e -> "import".equals(e.get("type"))
                || String.valueOf(e.getOrDefault("title", "")).contains("生成")
                || String.valueOf(e.getOrDefault("title", "")).contains("导入码库"));
        if (!hasFactoryOrigin && row.getFactoryAt() != null) {
            events.add(event(row.getFactoryAt(), "生成并导入码库",
                    nz(row.getProductName()) + " / " + nz(row.getSizeCode()) + "+" + nz(row.getBelt()), "import"));
        }
        boolean hasSale = events.stream().anyMatch(e -> "bind".equals(e.get("type"))
                || String.valueOf(e.getOrDefault("title", "")).contains("销售到C端"));
        if ("bound".equals(row.getStatus()) && !hasSale) {
            LocalDateTime soldAt = row.getBindAt() != null ? row.getBindAt() : row.getSoldAt();
            if (soldAt == null) {
                soldAt = row.getUpdatedAt() != null ? row.getUpdatedAt() : row.getFactoryAt();
            }
            if (soldAt != null) {
                Map<String, Object> customer = row.getUserJson() != null ? row.getUserJson() : row.getPrevUserJson();
                String phone = customer == null ? "—" : String.valueOf(customer.getOrDefault("phone", "—"));
                String addr = customer == null ? "" : String.valueOf(customer.getOrDefault("addr", ""));
                events.add(0, event(soldAt, "销售到C端", phone + (addr.isBlank() ? "" : " · " + addr), "bind"));
            }
        }
        List<ReturnOrder> returns = returnMapper.selectList(Wrappers.<ReturnOrder>lambdaQuery()
                .apply("JSON_SEARCH(sns, 'one', {0}) IS NOT NULL", row.getSn())
                .orderByAsc(ReturnOrder::getCreatedAt));
        Map<String, Object> extra = row.getExtra() == null ? new HashMap<>() : new HashMap<>(row.getExtra());
        List<Object> processNotes = extra.get("processNotes") instanceof List<?> list
                ? new ArrayList<>(list) : new ArrayList<>();
        for (ReturnOrder rt : returns) {
            String no = nz(rt.getNo());
            boolean exists = events.stream().anyMatch(e -> String.valueOf(e.getOrDefault("desc", "")).contains(no));
            if (!exists && rt.getCreatedAt() != null) {
                String title = switch (String.valueOf(rt.getStatus())) {
                    case "rejected" -> "退货申请已驳回";
                    case "done", "approved" -> "退货申请已通过";
                    default -> "提交退货申请";
                };
                String desc = no + (StringUtils.hasText(rt.getProcessNote()) ? " · " + rt.getProcessNote() : "");
                events.add(0, event(rt.getUpdatedAt() != null ? rt.getUpdatedAt() : rt.getCreatedAt(), title, desc, "return"));
            }
            if (StringUtils.hasText(rt.getProcessNote())
                    && processNotes.stream().noneMatch(note -> String.valueOf(note).contains(rt.getProcessNote()))) {
                processNotes.add(Map.of(
                        "date", (rt.getUpdatedAt() != null ? rt.getUpdatedAt() : rt.getCreatedAt()).toLocalDate().toString(),
                        "text", rt.getProcessNote()));
            }
        }
        extra.put("processNotes", processNotes);
        row.setExtra(extra);
        row.setEvents(events);
    }

    private static Map<String, Object> event(LocalDateTime time, String title, String desc, String type) {
        Map<String, Object> item = new java.util.LinkedHashMap<>();
        item.put("time", time.format(EVENT_TIME));
        item.put("title", title);
        item.put("desc", desc);
        item.put("type", type);
        return item;
    }

    private static String str(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    private static String nz(String v) {
        return v == null ? "" : v;
    }
}
