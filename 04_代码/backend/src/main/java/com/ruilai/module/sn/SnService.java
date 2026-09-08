package com.ruilai.module.sn;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.util.SnRanges;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SnService {

    private final SnCodeMapper snMapper;
    private final ProductMapper productMapper;
    private final SnEventWriter eventWriter;
    private final SnWriter snWriter;
    private final LogService logService;
    private final ExceptionTicketMapper exMapper;

    public PageResult<SnCode> page(long page, long size, String sn, String status, String l1Id, String l2Id,
                                   String productName, String productId, String sizeCode, String belt,
                                   String channel, String tag,
                                   String factoryFrom, String factoryTo,
                                   String soldFrom, String soldTo,
                                   String returnFrom, String returnTo) {
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
        if (StringUtils.hasText(productId)) {
            q.eq(SnCode::getProductId, productId);
        } else if (StringUtils.hasText(productName)) {
            List<String> ids = productMapper.selectList(Wrappers.<Product>lambdaQuery().like(Product::getName, productName))
                    .stream().map(Product::getId).toList();
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
        applyDate(q, SnCode::getFactoryAt, factoryFrom, factoryTo);
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
        Set<String> pin = openActivateSns();
        if (!pin.isEmpty()) {
            String in = pin.stream().map(s -> "'" + s.replace("'", "") + "'").reduce((a, b) -> a + "," + b).orElse("''");
            q.last("ORDER BY CASE WHEN sn IN (" + in + ") THEN 0 ELSE 1 END, updated_at DESC");
        } else {
            q.orderByDesc(SnCode::getUpdatedAt);
        }
        PageResult<SnCode> result = PageResult.of(snMapper.selectPage(Page.of(page, size), q));
        result.list().forEach(this::fillProductName);
        return result;
    }

    public SnCode get(String sn) {
        SnCode row = snMapper.selectById(sn);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "SN 不存在");
        }
        fillProductName(row);
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
        row.setFactoryAt(ChinaTime.now());
        if (StringUtils.hasText(l1Id)) {
            row.setL1Id(l1Id);
        }
        return row;
    }

    private Set<String> openActivateSns() {
        List<ExceptionTicket> list = exMapper.selectList(Wrappers.<ExceptionTicket>lambdaQuery()
                .in(ExceptionTicket::getStatus, "待处理", "会签中")
                .in(ExceptionTicket::getDim, "activate", "scan"));
        Set<String> out = new HashSet<>();
        for (ExceptionTicket e : list) {
            if (e.getTarget() != null && e.getTarget().toUpperCase().startsWith("RL")) {
                out.add(e.getTarget().toUpperCase());
            }
        }
        return out;
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

    private static String str(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    private static String nz(String v) {
        return v == null ? "" : v;
    }
}
