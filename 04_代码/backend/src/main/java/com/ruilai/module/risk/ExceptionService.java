package com.ruilai.module.risk;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.util.Ids;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.system.entity.Notification;
import com.ruilai.module.system.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExceptionService {

    private final ExceptionTicketMapper mapper;
    private final LogService logService;
    private final NotificationMapper notificationMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final SnCodeMapper snMapper;

    public PageResult<ExceptionTicket> page(long page, long size, String status, String dim, String type,
                                            String l1Id, String l2Id, String from, String to, String sn) {
        var q = Wrappers.<ExceptionTicket>lambdaQuery();
        applyCurrentScope(q);
        if (StringUtils.hasText(status)) {
            if ("open".equals(status)) {
                q.in(ExceptionTicket::getStatus, "待处理", "会签中");
            } else {
                q.eq(ExceptionTicket::getStatus, status);
            }
        }
        String dimKey = dim;
        if ("activate-direct".equals(dimKey)) dimKey = "activate";
        if ("activate-dist".equals(dimKey)) dimKey = "scan";
        if (StringUtils.hasText(dimKey)) {
            q.eq(ExceptionTicket::getDim, dimKey);
        }
        if (StringUtils.hasText(type)) {
            q.like(ExceptionTicket::getType, type);
        }
        if (StringUtils.hasText(from)) {
            try { q.ge(ExceptionTicket::getOccurredAt, LocalDate.parse(from.trim()).atStartOfDay()); } catch (Exception ignored) { }
        }
        if (StringUtils.hasText(to)) {
            try { q.le(ExceptionTicket::getOccurredAt, LocalDate.parse(to.trim()).atTime(23, 59, 59)); } catch (Exception ignored) { }
        }
        if (StringUtils.hasText(sn)) {
            q.eq(ExceptionTicket::getTarget, sn.trim());
        }
        applyAgentScope(q, l1Id, l2Id);
        q.orderByDesc(ExceptionTicket::getOccurredAt);
        PageResult<ExceptionTicket> result = PageResult.of(mapper.selectPage(Page.of(page, size), q));
        if (result.list() != null) {
            result.list().forEach(this::enrich);
        }
        return result;
    }

    /** 按 SN 归属 / extra.l1Id·l2Id 筛代理，不用名称 LIKE（详情文案通常不含代理名）。 */
    public static void applyAgentScope(com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExceptionTicket> q,
                                       String l1Id, String l2Id) {
        if (StringUtils.hasText(l1Id)) {
            q.and(w -> w.apply(
                    "(JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l1Id')) = {0}"
                            + " OR target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l1_id = {0})"
                            + " OR JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')) IN (SELECT id FROM agent_l2 WHERE deleted = 0 AND parent_id = {0}))",
                    l1Id));
        }
        if (StringUtils.hasText(l2Id)) {
            q.and(w -> w.apply(
                    "(JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')) = {0}"
                            + " OR target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l2_id = {0}))",
                    l2Id));
        }
    }

    public Map<String, Long> counts(String l1Id, String l2Id, String from, String to) {
        Map<String, Long> out = new LinkedHashMap<>();
        out.put("activate-direct", openCount("activate", false, l1Id, l2Id, from, to));
        out.put("activate-dist", openCount("activate", true, l1Id, l2Id, from, to));
        out.put("activate", out.get("activate-direct") + out.get("activate-dist"));
        out.put("scan", openCount("scan", null, l1Id, l2Id, from, to));
        out.put("stock", openCount("stock", null, l1Id, l2Id, from, to));
        out.put("open", openCount(null, null, l1Id, l2Id, from, to));
        return out;
    }

    private long openCount(String dim, Boolean distributed, String l1Id, String l2Id, String from, String to) {
        var q = Wrappers.<ExceptionTicket>lambdaQuery()
                .eq(StringUtils.hasText(dim), ExceptionTicket::getDim, dim)
                .in(ExceptionTicket::getStatus, "待处理", "会签中");
        applyCurrentScope(q);
        applyAgentScope(q, l1Id, l2Id);
        if (StringUtils.hasText(from)) {
            try { q.ge(ExceptionTicket::getOccurredAt, LocalDate.parse(from.trim()).atStartOfDay()); } catch (Exception ignored) { }
        }
        if (StringUtils.hasText(to)) {
            try { q.le(ExceptionTicket::getOccurredAt, LocalDate.parse(to.trim()).atTime(23, 59, 59)); } catch (Exception ignored) { }
        }
        if (Boolean.TRUE.equals(distributed)) {
            q.and(w -> w.apply("NULLIF(JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')), '') IS NOT NULL")
                    .or().apply("target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l2_id IS NOT NULL AND l2_id <> '')"));
        } else if (Boolean.FALSE.equals(distributed)) {
            q.apply("(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')), '') IS NULL "
                    + "AND target NOT IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l2_id IS NOT NULL AND l2_id <> ''))");
        }
        return mapper.selectCount(q);
    }

    private void applyCurrentScope(com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExceptionTicket> q) {
        LoginUser u = AuthUtil.current();
        if (!u.isAdmin()) {
            if ("L2".equals(u.getRoleCode())) {
                q.apply("(target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l2_id = {0})"
                                + " OR JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')) = {0} OR detail LIKE {1})",
                        u.getAgentId(), "%" + u.getName() + "%");
            } else {
                q.apply("(target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l1_id = {0})"
                                + " OR JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l1Id')) = {0}"
                                + " OR JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')) IN "
                                + "(SELECT id FROM agent_l2 WHERE deleted = 0 AND parent_id = {0})"
                                + " OR detail LIKE {1})",
                        u.getAgentId(), "%" + u.getName() + "%");
            }
        }
    }

    public ExceptionTicket get(String id) {
        ExceptionTicket row = mapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "异常不存在");
        }
        enrich(row);
        fillRelated(row);
        return row;
    }

    private void enrich(ExceptionTicket e) {
        Map<String, Object> extra = e.getExtra() == null ? new HashMap<>() : new HashMap<>(e.getExtra());
        String target = e.getTarget();
        SnCode sn = StringUtils.hasText(target) ? snMapper.selectById(target) : null;
        if (sn != null) {
            extra.put("l1Id", sn.getL1Id());
            extra.put("l2Id", sn.getL2Id());
            extra.put("customer", sn.getUserJson() != null ? sn.getUserJson() : sn.getPrevUserJson());
        }
        Object l1Id = extra.get("l1Id");
        Object l2Id = extra.get("l2Id");
        if ((l1Id == null || !StringUtils.hasText(String.valueOf(l1Id)))
                && l2Id != null && StringUtils.hasText(String.valueOf(l2Id))) {
            AgentL2 l2 = l2Mapper.selectById(String.valueOf(l2Id));
            if (l2 != null && StringUtils.hasText(l2.getParentId())) {
                l1Id = l2.getParentId();
                extra.put("l1Id", l1Id);
            }
        }
        if (l1Id != null && StringUtils.hasText(String.valueOf(l1Id))) {
            AgentL1 a = l1Mapper.selectById(String.valueOf(l1Id));
            extra.put("l1Name", a == null ? l1Id : a.getName());
        }
        if (l2Id != null && StringUtils.hasText(String.valueOf(l2Id))) {
            AgentL2 a = l2Mapper.selectById(String.valueOf(l2Id));
            extra.put("l2Name", a == null ? l2Id : a.getName());
        }
        e.setExtra(extra);
    }

    private void fillRelated(ExceptionTicket e) {
        if (e.getType() == null || !e.getType().contains("客户信息重复")) {
            return;
        }
        Map<String, Object> extra = e.getExtra() == null ? new HashMap<>() : new HashMap<>(e.getExtra());
        @SuppressWarnings("unchecked")
        Map<String, Object> cust = extra.get("customer") instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
        String phone = e.getDupPhone();
        if (!StringUtils.hasText(phone) && cust != null) {
            phone = cust.get("phone") == null ? "" : String.valueOf(cust.get("phone"));
        }
        List<Map<String, Object>> related = new ArrayList<>();
        if (StringUtils.hasText(phone)) {
            List<SnCode> sns = snMapper.selectList(Wrappers.<SnCode>lambdaQuery()
                    .apply("CAST(user_json AS CHAR) LIKE {0}", "%" + phone + "%")
                    .last("limit 20"));
            for (SnCode s : sns) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("sn", s.getSn());
                Map<String, Object> u = s.getUserJson() == null ? Map.of() : s.getUserJson();
                row.put("name", u.getOrDefault("name", "—"));
                row.put("gender", u.getOrDefault("gender", "—"));
                row.put("phone", u.getOrDefault("phone", "—"));
                row.put("addr", u.getOrDefault("addr", "—"));
                related.add(row);
            }
        }
        extra.put("relatedSns", related);
        e.setExtra(extra);
    }

    public ExceptionTicket explain(String id, String text, boolean asL2) {
        ExceptionTicket row = get(id);
        if (asL2) {
            row.setExplainL2(text);
        } else {
            row.setExplainTxt(text);
        }
        mapper.updateById(row);
        logService.record("异常说明 " + row.getId(), "exception", true);
        return row;
    }

    public ExceptionTicket handle(String id) {
        AuthUtil.requireAdminPerm("exception");
        ExceptionTicket row = get(id);
        row.setStatus("已处理");
        mapper.updateById(row);
        logService.record("处理异常 " + row.getType() + " " + row.getTarget(), "exception", true);
        return row;
    }

    public void delete(String id) {
        AuthUtil.requireAdminPerm("exception");
        ExceptionTicket row = get(id);
        mapper.deleteById(id);
        logService.record("删除异常 " + row.getType() + " " + row.getTarget(), "exception", true);
    }

    /**
     * @param mode strict=待处理并通知；soft/off=仅记录为已处理
     */
    public ExceptionTicket raise(String type, String target, String detail, String dim, String mode, String l2Id) {
        String m = mode == null ? "strict" : mode;
        ExceptionTicket t = new ExceptionTicket();
        t.setId(Ids.next("EX"));
        t.setOccurredAt(ChinaTime.now());
        t.setType(type);
        t.setTarget(target);
        t.setDetail(detail);
        t.setDim(dim);
        boolean recordOnly = "soft".equals(m) || "off".equals(m);
        t.setStatus(recordOnly ? "已处理" : "待处理");
        t.setNotifyTo(recordOnly ? "仅记录" : "一级+原厂");
        Map<String, Object> extra = new HashMap<>();
        extra.put("warnMode", m);
        if (StringUtils.hasText(l2Id)) {
            extra.put("l2Id", l2Id);
            AgentL2 l2 = l2Mapper.selectById(l2Id);
            if (l2 != null && StringUtils.hasText(l2.getParentId())) {
                extra.put("l1Id", l2.getParentId());
            }
        }
        if (StringUtils.hasText(target)) {
            SnCode sn = snMapper.selectById(target);
            if (sn != null) {
                extra.put("l1Id", sn.getL1Id());
                if (!StringUtils.hasText(l2Id) && StringUtils.hasText(sn.getL2Id())) {
                    extra.put("l2Id", sn.getL2Id());
                }
            }
        }
        t.setExtra(extra);
        mapper.insert(t);
        if (!recordOnly) {
            Notification n = new Notification();
            n.setId(Ids.next("N"));
            n.setOccurredAt(ChinaTime.now());
            n.setTitle("预警：" + type);
            n.setBody(target + " · " + detail);
            n.setToRole("一级+原厂");
            n.setReadFlag(0);
            notificationMapper.insert(n);
            logService.record("触发异常 " + type + " · " + target, "exception", true);
        } else {
            logService.record(("off".equals(m) ? "异常不报警记录 " : "软报警记录 ") + type + " · " + target, "warn", true);
        }
        return t;
    }
}
