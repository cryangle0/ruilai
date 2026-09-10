package com.ruilai.module.agent;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.DataScope;
import com.ruilai.common.security.PasswordPolicy;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.thirdparty.RegionNames;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.util.Ids;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.entity.SubAccount;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.agent.mapper.SubAccountMapper;
import com.ruilai.module.risk.ExceptionService;
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
import com.ruilai.module.system.LogService;
import com.ruilai.module.system.entity.Notification;
import com.ruilai.module.system.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final SubAccountMapper subMapper;
    private final SysAccountMapper accountMapper;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;
    private final NotificationMapper notificationMapper;
    private final SnCodeMapper snMapper;
    private final PurchaseOrderMapper poMapper;
    private final SalesOrderMapper soMapper;
    private final ExceptionTicketMapper exMapper;
    private final ReturnOrderMapper rtMapper;

    public PageResult<AgentL1> pageL1(long page, long size, String name, String status, String region) {
        AuthUtil.requireAdmin();
        LambdaQueryWrapper<AgentL1> q = Wrappers.lambdaQuery();
        if (StringUtils.hasText(name)) {
            q.and(w -> w.like(AgentL1::getName, name).or().like(AgentL1::getCode, name).or().like(AgentL1::getContact, name));
        }
        if (StringUtils.hasText(status)) {
            q.eq(AgentL1::getStatus, status);
        }
        if (StringUtils.hasText(region)) {
            q.and(w -> w.apply("CAST(main_areas AS CHAR) LIKE {0}", "%" + region + "%")
                    .or().apply("CAST(sale_areas AS CHAR) LIKE {0}", "%" + region + "%")
                    .or().apply("CAST(direct_areas AS CHAR) LIKE {0}", "%" + region + "%"));
        }
        q.orderByAsc(AgentL1::getCode);
        PageResult<AgentL1> result = PageResult.of(l1Mapper.selectPage(Page.of(page, size), q));
        if (result.list() != null) {
            result.list().forEach(this::enrichL1);
        }
        return result;
    }

    public AgentL1 getL1(String id) {
        AgentL1 row = l1Mapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "一级代理不存在");
        }
        enrichL1(row);
        fillLogin(row);
        return row;
    }

    public AgentL1 saveL1(AgentL1 body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        boolean creating = !StringUtils.hasText(body.getId());
        String loginUser = trimToNull(body.getLoginUsername());
        String loginPwd = body.getLoginPassword();
        validateAgentBasics(body.getName(), loginUser, loginPwd, creating);
        if (creating && (body.getMainAreas() == null || body.getMainAreas().isEmpty())) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择主授权区域");
        }
        body.setExtra(persistDemoPassword(body.getExtra(), loginPwd));
        if (StringUtils.hasText(loginUser)) {
            assertUsernameAvailable(loginUser, body.getId(), "L1", null);
        }
        if (creating) {
            body.setId(Ids.next("L1"));
            if (!StringUtils.hasText(body.getCode())) {
                body.setCode("AG-L1-" + body.getId().substring(2));
            }
            l1Mapper.insert(body);
            logService.record("新建一级 " + body.getName(), "op", true);
        } else {
            l1Mapper.updateById(body);
            logService.record("更新一级 " + body.getName(), "op", true);
            unbindLegalL2OutsideSale(getL1(body.getId()));
        }
        if (StringUtils.hasText(loginUser)) {
            upsertLogin(loginUser, loginPwd, body.getName(), "L1", body.getId());
        }
        return getL1(body.getId());
    }

    public AgentL1 setL1Status(String id, String status) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        if ("停用".equals(status)) {
            return signDisableL1(id);
        }
        AgentL1 row = getL1(id);
        row.setStatus("启用");
        row.setDisableCosign(new HashMap<>(Map.of("admin1", false, "admin2", false)));
        l1Mapper.updateById(row);
        syncAccountStatus(row.getId(), "启用");
        logService.record("启用一级 " + row.getName(), "op", true);
        return getL1(id);
    }

    public AgentL1 signDisableL1(String id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        AgentL1 a = getL1(id);
        if ("停用".equals(a.getStatus())) {
            return a;
        }
        String slot = "admin".equals(AuthUtil.current().getUsername()) ? "admin1" : "admin2";
        Map<String, Object> c = a.getDisableCosign() == null ? new HashMap<>() : new HashMap<>(a.getDisableCosign());
        if (Boolean.TRUE.equals(c.get(slot))) {
            throw new BizException(ErrCode.BAD_REQUEST, "你已签字，等待另一管理员确认；一级仍可正常使用");
        }
        c.put(slot, true);
        c.put(slot + "At", ChinaTime.now().toString());
        c.put(slot + "By", AuthUtil.current().getUsername());
        a.setDisableCosign(c);
        if (Boolean.TRUE.equals(c.get("admin1")) && Boolean.TRUE.equals(c.get("admin2"))) {
            applyL1Disable(a);
            return getL1(id);
        }
        l1Mapper.updateById(a);
        pushNotify("一级停用待会签", a.getName() + " 待另一管理员确认停用（当前仍可正常使用）");
        logService.record("一级停用会签 " + a.getName() + " by " + AuthUtil.current().getUsername(), "op", true);
        return getL1(id);
    }

    private void applyL1Disable(AgentL1 a) {
        a.setStatus("停用");
        a.setDisableCosign(new HashMap<>(Map.of("admin1", false, "admin2", false)));
        l1Mapper.updateById(a);
        syncAccountStatus(a.getId(), "停用");
        List<AgentL2> kids = l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery()
                .eq(AgentL2::getParentId, a.getId())
                .eq(AgentL2::getType, "法人"));
        for (AgentL2 l : kids) {
            l.setPending(1);
            l.setPrevParentId(a.getId());
            l.setPrevAreas(l.getAreas());
            l.setParentId(null);
            l.setAreas(List.of());
            l2Mapper.updateById(l);
        }
        pushNotify("二级待分配", a.getName() + " 停用，下属法人进入待分配");
        logService.record("停用一级 " + a.getName() + "（双人会签完成）", "op", true);
    }

    private void pushNotify(String title, String body) {
        Notification n = new Notification();
        n.setId(Ids.next("N"));
        n.setOccurredAt(ChinaTime.now());
        n.setTitle(title);
        n.setBody(body);
        n.setRoute(title.contains("待分配") ? "/agent/pending"
                : (title.contains("一级") ? "/agent/l1" : "/agent/l2"));
        n.setToRole("原厂");
        n.setReadFlag(0);
        notificationMapper.insert(n);
    }

    public PageResult<AgentL2> pageL2(long page, long size, String name, String parentId, String auditStatus, Boolean pending,
                                      String type, String status, String region) {
        LambdaQueryWrapper<AgentL2> q = Wrappers.lambdaQuery();
        if (!DataScope.isAdmin()) {
            String l1 = DataScope.agentIdOrNull();
            q.eq(AgentL2::getParentId, l1);
        } else if (StringUtils.hasText(parentId)) {
            q.eq(AgentL2::getParentId, parentId);
        }
        if (StringUtils.hasText(name)) {
            q.and(w -> w.like(AgentL2::getName, name).or().like(AgentL2::getCode, name));
        }
        if (StringUtils.hasText(auditStatus)) {
            q.eq(AgentL2::getAuditStatus, auditStatus);
        }
        if (pending != null) {
            q.eq(AgentL2::getPending, pending ? 1 : 0);
        }
        if (StringUtils.hasText(type)) {
            q.eq(AgentL2::getType, type);
        }
        if (StringUtils.hasText(status)) {
            q.eq(AgentL2::getStatus, status);
        }
        if (StringUtils.hasText(region)) {
            q.apply("CAST(areas AS CHAR) LIKE {0}", "%" + region + "%");
        }
        q.orderByDesc(AgentL2::getCreatedAt);
        PageResult<AgentL2> result = PageResult.of(l2Mapper.selectPage(Page.of(page, size), q));
        if (result.list() != null) {
            result.list().forEach(row -> {
                enrichL2(row);
                fillLogin(row);
            });
        }
        return result;
    }

    public AgentL2 getL2(String id) {
        AgentL2 row = l2Mapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "二级代理不存在");
        }
        enrichL2(row);
        fillLogin(row);
        return row;
    }

    public AgentL2 saveL2(AgentL2 body) {
        var u = AuthUtil.current();
        if (!u.isAdmin() && !"L1".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "仅一级可维护二级代理");
        }
        boolean creating = !StringUtils.hasText(body.getId());
        String loginUser = trimToNull(firstNonBlank(body.getLoginUsername(), takeExtra(body, "loginUsername")));
        String loginPwd = firstNonBlank(body.getLoginPassword(), takeExtra(body, "loginPassword"));
        validateAgentBasics(body.getName(), loginUser, loginPwd, creating);
        body.setExtra(persistDemoPassword(body.getExtra(), loginPwd));
        if (!DataScope.isAdmin()) {
            body.setParentId(DataScope.agentIdOrNull());
            if (!StringUtils.hasText(body.getId())) {
                body.setAuditStatus("pending");
                body.setPending(0);
            }
        }
        if (!StringUtils.hasText(body.getStatus())) {
            body.setStatus("启用");
        }
        assertL2AreasInsideParent(body);
        syncL2AlarmFlags(body);
        if (protocolUrlOf(body) != null) {
            body.setProtocolOk(1);
        }
        if (StringUtils.hasText(loginUser)) {
            assertUsernameAvailable(loginUser, body.getId(), "L2", null);
        }
        if (creating) {
            body.setId(Ids.next("L2"));
            if (!StringUtils.hasText(body.getCode())) {
                body.setCode("AG-L2-" + body.getId().substring(2));
            }
            if (body.getAuditStatus() == null) {
                body.setAuditStatus("pending");
            }
            l2Mapper.insert(body);
            logService.record("新建二级 " + body.getName(), "op", true);
        } else {
            assertCanManageL2(getL2(body.getId()));
            l2Mapper.updateById(body);
            logService.record("更新二级 " + body.getName(), "op", true);
        }
        if (StringUtils.hasText(loginUser)) {
            upsertLogin(loginUser, loginPwd, body.getName(), "L2", body.getId());
        }
        return getL2(body.getId());
    }

    public AgentL2 setL2Status(String id, String status) {
        AgentL2 row = getL2(id);
        assertCanManageL2(row);
        if ("停用".equals(status) && DataScope.isAdmin()) {
            return signDisableL2(id);
        }
        row.setStatus("启用".equals(status) ? "启用" : status);
        if ("启用".equals(row.getStatus())) {
            row.setDisableCosign(new HashMap<>(Map.of("admin1", false, "admin2", false)));
        }
        l2Mapper.updateById(row);
        syncAccountStatus(row.getId(), row.getStatus());
        logService.record(row.getStatus() + "二级 " + row.getName(), "op", true);
        return getL2(id);
    }

    public AgentL2 signDisableL2(String id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        AgentL2 a = getL2(id);
        if ("停用".equals(a.getStatus())) {
            return a;
        }
        String slot = "admin".equals(AuthUtil.current().getUsername()) ? "admin1" : "admin2";
        Map<String, Object> c = a.getDisableCosign() == null ? new HashMap<>() : new HashMap<>(a.getDisableCosign());
        if (Boolean.TRUE.equals(c.get(slot))) {
            throw new BizException(ErrCode.BAD_REQUEST, "你已签字，等待另一管理员确认；二级仍可正常使用");
        }
        c.put(slot, true);
        c.put(slot + "At", ChinaTime.now().toString());
        c.put(slot + "By", AuthUtil.current().getUsername());
        a.setDisableCosign(c);
        if (Boolean.TRUE.equals(c.get("admin1")) && Boolean.TRUE.equals(c.get("admin2"))) {
            a.setStatus("停用");
            a.setDisableCosign(new HashMap<>(Map.of("admin1", false, "admin2", false)));
            l2Mapper.updateById(a);
            syncAccountStatus(a.getId(), "停用");
            if ("法人".equals(a.getType()) && StringUtils.hasText(a.getParentId())) {
                a.setPending(1);
                a.setPrevParentId(a.getParentId());
                a.setPrevAreas(a.getAreas());
                a.setParentId(null);
                a.setAreas(List.of());
                l2Mapper.updateById(a);
            }
            logService.record("停用二级 " + a.getName() + "（双人会签完成）", "op", true);
            return getL2(id);
        }
        l2Mapper.updateById(a);
        pushNotify("二级停用待会签", a.getName() + " 待另一管理员确认停用（当前仍可正常使用）");
        logService.record("二级停用会签 " + a.getName() + " by " + AuthUtil.current().getUsername(), "op", true);
        return getL2(id);
    }

    public AgentL2 unbindL2(String id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        AgentL2 row = getL2(id);
        if (!"法人".equals(row.getType())) {
            throw new BizException(ErrCode.BAD_REQUEST, "仅法人二级可解绑进入待分配");
        }
        if (!StringUtils.hasText(row.getParentId())) {
            return row;
        }
        row.setPending(1);
        row.setPrevParentId(row.getParentId());
        row.setPrevAreas(row.getAreas());
        row.setParentId(null);
        row.setAreas(List.of());
        l2Mapper.updateById(row);
        logService.record("解绑法人二级 " + row.getName(), "op", true);
        return getL2(id);
    }

    public Map<String, Object> disablePending() {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        List<AgentL1> l1 = l1Mapper.selectList(null).stream()
                .filter(this::l1DisablePending).toList();
        l1.forEach(this::enrichL1);
        List<AgentL2> l2 = l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getPending, 0)).stream()
                .filter(this::l2DisablePending).toList();
        l2.forEach(this::enrichL2);
        return Map.of("l1", l1, "l2", l2);
    }

    public void deleteL2(String id) {
        AgentL2 row = getL2(id);
        assertCanManageL2(row);
        l2Mapper.deleteById(id);
        logService.record("删除二级 " + row.getName(), "op", true);
    }

    public void auditL2(String id, boolean pass) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        AgentL2 row = getL2(id);
        row.setAuditStatus(pass ? "approved" : "rejected");
        if (pass) {
            row.setPending(0);
        }
        l2Mapper.updateById(row);
        logService.record((pass ? "通过" : "驳回") + "二级审核 " + row.getName(), "op", true);
    }

    public void assignL2(String id, String parentId, List<String> areas) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        AgentL2 row = getL2(id);
        row.setParentId(parentId);
        row.setAreas(areas);
        assertL2AreasInsideParent(row);
        row.setPending(0);
        if (!"approved".equals(row.getAuditStatus())) {
            row.setAuditStatus("approved");
        }
        l2Mapper.updateById(row);
        logService.record("分配二级 " + row.getName() + " → " + parentId, "op", true);
    }

    public List<SubAccount> listSubs(String l1Id) {
        if (!DataScope.isAdmin()) {
            return subMapper.selectList(Wrappers.<SubAccount>lambdaQuery()
                    .eq(SubAccount::getL1Id, DataScope.agentIdOrNull()));
        }
        if (StringUtils.hasText(l1Id)) {
            return subMapper.selectList(Wrappers.<SubAccount>lambdaQuery().eq(SubAccount::getL1Id, l1Id));
        }
        return subMapper.selectList(Wrappers.<SubAccount>lambdaQuery().orderByDesc(SubAccount::getCreatedAt));
    }

    public SubAccount saveSub(SubAccount body, String rawPassword) {
        var u = AuthUtil.current();
        if (!u.isAdmin() && !"L1".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "仅一级可管理子账号");
        }
        if (!DataScope.isAdmin()) {
            body.setL1Id(DataScope.agentIdOrNull());
        }
        if (!StringUtils.hasText(body.getStatus())) {
            body.setStatus("启用");
        }
        boolean creating = !StringUtils.hasText(body.getId());
        if (creating) {
            body.setId(Ids.next("SUB"));
        }
        if (!StringUtils.hasText(body.getUsername())) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写登录用户名");
        }
        if (!StringUtils.hasText(body.getName())) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写姓名");
        }
        if (creating) {
            PasswordPolicy.requireNewAccountPassword(rawPassword);
        }
        body.setUsername(body.getUsername().trim());
        assertUsernameAvailable(body.getUsername(), body.getL1Id(), "SUB", body.getId());
        SubAccount existing = subMapper.selectById(body.getId());
        if (existing == null) {
            subMapper.insert(body);
        } else {
            subMapper.updateById(body);
        }
        upsertLogin(body.getUsername(), rawPassword, body.getName(), "SUB", body.getL1Id());
        logService.record("保存子账号 " + body.getUsername(), "op", true);
        return body;
    }

    public void setSubStatus(String id, String status) {
        SubAccount row = subMapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "子账号不存在");
        }
        if (!DataScope.isAdmin() && !DataScope.agentIdOrNull().equals(row.getL1Id())) {
            throw new BizException(ErrCode.FORBIDDEN, "只能管理本一级子账号");
        }
        row.setStatus(status);
        subMapper.updateById(row);
        SysAccount acc = accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getUsername, row.getUsername()).last("limit 1"));
        if (acc != null) {
            acc.setStatus(status);
            accountMapper.updateById(acc);
        }
        logService.record(status + "子账号 " + row.getUsername(), "op", true);
    }

    private void assertCanManageL2(AgentL2 row) {
        if (!DataScope.isAdmin() && !DataScope.agentIdOrNull().equals(row.getParentId())
                && !DataScope.agentIdOrNull().equals(row.getPrevParentId())) {
            throw new BizException(ErrCode.FORBIDDEN, "只能管理本一级下属二级");
        }
    }

    private void fillLogin(AgentL1 row) {
        SysAccount acc = accountOf(row.getId());
        if (acc != null) {
            row.setLoginUsername(acc.getUsername());
        }
        row.setLoginPassword(demoPassword(row.getExtra()));
    }

    private void fillLogin(AgentL2 row) {
        SysAccount acc = accountOf(row.getId());
        if (acc != null) {
            row.setLoginUsername(acc.getUsername());
        }
        row.setLoginPassword(demoPassword(row.getExtra()));
    }

    private SysAccount accountOf(String agentId) {
        if (!StringUtils.hasText(agentId)) {
            return null;
        }
        return accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getAgentId, agentId).last("limit 1"));
    }

    private String demoPassword(Map<String, Object> extra) {
        if (extra != null && extra.get("loginPassword") != null) {
            String v = String.valueOf(extra.get("loginPassword"));
            if (StringUtils.hasText(v)) {
                return v;
            }
        }
        return "demo";
    }

    public int muteExAlarm(List<String> ids, boolean mute) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        int n = 0;
        for (String id : ids) {
            if (!StringUtils.hasText(id)) {
                continue;
            }
            AgentL2 row = getL2(id);
            assertCanManageL2(row);
            Map<String, Object> extra = row.getExtra() == null ? new HashMap<>() : new HashMap<>(row.getExtra());
            extra.put("exNoAlarm", mute);
            row.setExtra(extra);
            row.setWarnMode(mute ? "off" : (StringUtils.hasText(row.getWarnMode()) && !"off".equals(row.getWarnMode())
                    ? row.getWarnMode() : "strict"));
            if (!mute && "off".equals(row.getWarnMode())) {
                row.setWarnMode("strict");
            }
            l2Mapper.updateById(row);
            n++;
        }
        logService.record((mute ? "二级异常不报警 " : "恢复二级报警 ") + n + " 个", "op", true);
        return n;
    }

    private void unbindLegalL2OutsideSale(AgentL1 a) {
        List<String> allowed = RegionNames.citiesOf(a.getSaleAreas());
        List<AgentL2> kids = l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery()
                .eq(AgentL2::getParentId, a.getId())
                .eq(AgentL2::getType, "法人"));
        int n = 0;
        for (AgentL2 l : kids) {
            if (l.getAreas() == null || l.getAreas().isEmpty()) {
                continue;
            }
            boolean inside = l.getAreas().stream().allMatch(city ->
                    allowed.stream().anyMatch(c -> RegionNames.same(c, city)));
            if (inside) {
                continue;
            }
            l.setPending(1);
            l.setPrevParentId(a.getId());
            l.setPrevAreas(l.getAreas());
            l.setParentId(null);
            l.setAreas(List.of());
            l2Mapper.updateById(l);
            n++;
        }
        if (n > 0) {
            pushNotify("二级待分配", a.getName() + " 销售区域缩小，" + n + " 个法人二级进入待分配");
            logService.record("一级区域缩小解绑法人二级 " + n + " 个", "op", true);
        }
    }

    private void assertL2AreasInsideParent(AgentL2 body) {
        if (body.getAreas() == null || body.getAreas().isEmpty() || !StringUtils.hasText(body.getParentId())) {
            return;
        }
        AgentL1 parent = l1Mapper.selectById(body.getParentId());
        if (parent == null) {
            return;
        }
        List<String> allowed = RegionNames.citiesOf(parent.getSaleAreas());
        if (allowed.isEmpty()) {
            allowed = parent.getDirectAreas() == null ? List.of() : parent.getDirectAreas();
        }
        for (String city : body.getAreas()) {
            boolean ok = allowed.stream().anyMatch(c -> RegionNames.same(c, city));
            if (!ok) {
                throw new BizException(ErrCode.BAD_REQUEST, "城市「" + city + "」不在一级可销售范围内");
            }
        }
    }

    private void syncL2AlarmFlags(AgentL2 body) {
        Map<String, Object> extra = body.getExtra() == null ? new HashMap<>() : new HashMap<>(body.getExtra());
        if ("off".equals(body.getWarnMode())) {
            extra.put("exNoAlarm", true);
        } else if (Boolean.TRUE.equals(extra.get("exNoAlarm")) && !"off".equals(body.getWarnMode())) {
            body.setWarnMode("off");
        }
        body.setExtra(extra);
    }

    private static String protocolUrlOf(AgentL2 body) {
        if (body.getExtra() == null) {
            return null;
        }
        Object v = body.getExtra().get("protocolUrl");
        return v == null || String.valueOf(v).isBlank() ? null : String.valueOf(v);
    }

    private Map<String, Object> persistDemoPassword(Map<String, Object> extra, String raw) {
        if (!StringUtils.hasText(raw)) {
            return extra;
        }
        Map<String, Object> m = extra == null ? new HashMap<>() : new HashMap<>(extra);
        m.put("loginPassword", raw);
        return m;
    }

    private boolean l1DisablePending(AgentL1 a) {
        if (a == null || "停用".equals(a.getStatus())) {
            return false;
        }
        Map<String, Object> c = a.getDisableCosign();
        if (c == null) {
            return false;
        }
        boolean a1 = Boolean.TRUE.equals(c.get("admin1"));
        boolean a2 = Boolean.TRUE.equals(c.get("admin2"));
        return (a1 || a2) && !(a1 && a2);
    }

    private boolean l2DisablePending(AgentL2 a) {
        if (a == null || "停用".equals(a.getStatus()) || (a.getPending() != null && a.getPending() == 1)) {
            return false;
        }
        Map<String, Object> c = a.getDisableCosign();
        if (c == null) {
            return false;
        }
        boolean a1 = Boolean.TRUE.equals(c.get("admin1"));
        boolean a2 = Boolean.TRUE.equals(c.get("admin2"));
        return (a1 || a2) && !(a1 && a2);
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a;
        }
        return StringUtils.hasText(b) ? b : null;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static void validateAgentBasics(String name, String loginUser, String loginPassword, boolean creating) {
        if (!StringUtils.hasText(name)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写代理名称");
        }
        if (creating && !StringUtils.hasText(loginUser)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写登录用户名");
        }
        if (creating) {
            PasswordPolicy.requireNewAccountPassword(loginPassword);
        }
    }

    private String takeExtra(AgentL2 body, String key) {
        Map<String, Object> extra = body.getExtra();
        if (extra == null || extra.get(key) == null) {
            return null;
        }
        String v = String.valueOf(extra.get(key));
        extra = new HashMap<>(extra);
        extra.remove(key);
        body.setExtra(extra.isEmpty() ? null : extra);
        return v;
    }

    void assertUsernameAvailable(String username, String ownerAgentId, String role, String subId) {
        if (!StringUtils.hasText(username)) {
            return;
        }
        SysAccount exist = accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getUsername, username.trim()).last("limit 1"));
        if ("SUB".equals(role)) {
            var subQ = Wrappers.<SubAccount>lambdaQuery().eq(SubAccount::getUsername, username.trim());
            if (StringUtils.hasText(subId)) {
                subQ.ne(SubAccount::getId, subId);
            }
            SubAccount otherSub = subMapper.selectOne(subQ.last("limit 1"));
            if (otherSub != null) {
                throw new BizException(ErrCode.BAD_REQUEST, "用户名已存在");
            }
        }
        if (exist == null) {
            return;
        }
        boolean sameAgent = StringUtils.hasText(ownerAgentId) && ownerAgentId.equals(exist.getAgentId());
        boolean sameRole = role.equals(exist.getRoleCode());
        if (!(sameAgent && sameRole)) {
            throw new BizException(ErrCode.BAD_REQUEST, "用户名已存在");
        }
    }

    private void upsertLogin(String username, String rawPassword, String name, String role, String agentId) {
        username = username.trim();
        SysAccount exist = accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getUsername, username).last("limit 1"));
        if (exist == null) {
            PasswordPolicy.requireNewAccountPassword(rawPassword);
            SysAccount a = new SysAccount();
            a.setUsername(username);
            a.setPasswordHash(passwordEncoder.encode(rawPassword));
            a.setName(name);
            a.setRoleCode(role);
            a.setRoleId(RolePerms.defaultRoleId(role));
            a.setAgentId(agentId);
            a.setStatus("启用");
            accountMapper.insert(a);
            return;
        }
        if (!agentId.equals(exist.getAgentId()) || !role.equals(exist.getRoleCode())) {
            throw new BizException(ErrCode.BAD_REQUEST, "用户名已存在");
        }
        exist.setName(name);
        exist.setAgentId(agentId);
        exist.setRoleCode(role);
        exist.setRoleId(RolePerms.defaultRoleId(role));
        if (StringUtils.hasText(rawPassword)) {
            boolean unchangedHistoricalPassword = StringUtils.hasText(exist.getPasswordHash())
                    && passwordEncoder.matches(rawPassword, exist.getPasswordHash());
            if (!unchangedHistoricalPassword) {
                PasswordPolicy.requireChangedPassword(rawPassword);
                exist.setPasswordHash(passwordEncoder.encode(rawPassword));
            }
        }
        accountMapper.updateById(exist);
    }

    private void syncAccountStatus(String agentId, String status) {
        List<SysAccount> list = accountMapper.selectList(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getAgentId, agentId));
        for (SysAccount a : list) {
            a.setStatus(status);
            accountMapper.updateById(a);
        }
    }

    public Map<String, Long> badges() {
        long pendingAssign = l2Mapper.selectCount(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getPending, 1));
        long pendingAudit = l2Mapper.selectCount(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getAuditStatus, "pending"));
        long pendingDisable = l1Mapper.selectList(null).stream().filter(this::l1DisablePending).count()
                + l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getPending, 0)).stream().filter(this::l2DisablePending).count();
        return Map.of("pendingAssign", pendingAssign, "pendingAudit", pendingAudit, "pendingDisable", pendingDisable);
    }

    private void enrichL1(AgentL1 a) {
        String id = a.getId();
        a.setSaleCities(RegionNames.citiesOf(a.getSaleAreas()));
        java.time.LocalDateTime monthStart = ChinaTime.today().withDayOfMonth(1).atStartOfDay();
        a.setMonthPurchaseQty(sumPoQty(poMapper.selectList(Wrappers.<PurchaseOrder>lambdaQuery()
                .eq(PurchaseOrder::getL1Id, id).ge(PurchaseOrder::getCreatedAt, monthStart)
                .ne(PurchaseOrder::getStatus, "rejected"))));
        a.setMonthSalesQty(sumSoQty(soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                .eq(SalesOrder::getL1Id, id).eq(SalesOrder::getStatus, "done")
                .ge(SalesOrder::getCreatedAt, monthStart))));
        a.setStockQty(snMapper.selectCount(Wrappers.<SnCode>lambdaQuery()
                .eq(SnCode::getL1Id, id).eq(SnCode::getStatus, "l1")).intValue());
        a.setPendingPoCount(poMapper.selectCount(Wrappers.<PurchaseOrder>lambdaQuery()
                .eq(PurchaseOrder::getL1Id, id).in(PurchaseOrder::getStatus, "pending", "cosigning")).intValue());
        a.setPendingReturnCount(rtMapper.selectCount(Wrappers.<ReturnOrder>lambdaQuery()
                .eq(ReturnOrder::getFromId, id).eq(ReturnOrder::getStatus, "pending")).intValue());
        var exQ = Wrappers.<ExceptionTicket>lambdaQuery()
                .in(ExceptionTicket::getStatus, "待处理", "会签中");
        ExceptionService.applyAgentScope(exQ, id, null);
        a.setExCount(exMapper.selectCount(exQ).intValue());
    }

    private void enrichL2(AgentL2 a) {
        String id = a.getId();
        if (StringUtils.hasText(a.getParentId())) {
            AgentL1 p = l1Mapper.selectById(a.getParentId());
            a.setParentName(p == null ? a.getParentId() : p.getName());
        }
        java.time.LocalDateTime monthStart = ChinaTime.today().withDayOfMonth(1).atStartOfDay();
        a.setMonthPurchaseQty(sumSoQty(soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                .eq(SalesOrder::getL2Id, id).eq(SalesOrder::getChannel, "distribute")
                .ge(SalesOrder::getCreatedAt, monthStart))));
        a.setMonthSalesQty(sumSoQty(soMapper.selectList(Wrappers.<SalesOrder>lambdaQuery()
                .eq(SalesOrder::getL2Id, id).eq(SalesOrder::getStatus, "done")
                .ge(SalesOrder::getCreatedAt, monthStart))));
        a.setStockQty(snMapper.selectCount(Wrappers.<SnCode>lambdaQuery()
                .eq(SnCode::getL2Id, id).eq(SnCode::getStatus, "l2")).intValue());
        a.setPendingPoCount(0);
        a.setPendingReturnCount(rtMapper.selectCount(Wrappers.<ReturnOrder>lambdaQuery()
                .eq(ReturnOrder::getFromId, id).eq(ReturnOrder::getStatus, "pending")).intValue());
        var exQ = Wrappers.<ExceptionTicket>lambdaQuery()
                .in(ExceptionTicket::getStatus, "待处理", "会签中");
        ExceptionService.applyAgentScope(exQ, null, id);
        a.setExCount(exMapper.selectCount(exQ).intValue());
    }

    private int sumPoQty(java.util.List<PurchaseOrder> list) {
        int n = 0;
        for (PurchaseOrder p : list) {
            n += lineQty(p.getLines()) + lineQty(p.getCustomLines());
            if (p.getParts() != null) {
                for (java.util.Map<String, Object> part : p.getParts()) {
                    n += asInt(part.get("qty"));
                }
            }
        }
        return n;
    }

    private int sumSoQty(java.util.List<SalesOrder> list) {
        int n = 0;
        for (SalesOrder s : list) {
            n += s.getScanned() == null ? 0 : s.getScanned().size();
        }
        return n;
    }

    private int lineQty(java.util.List<java.util.Map<String, Object>> lines) {
        if (lines == null) {
            return 0;
        }
        int n = 0;
        for (java.util.Map<String, Object> line : lines) {
            n += asInt(line.get("qty"));
        }
        return n;
    }

    private int asInt(Object v) {
        if (v instanceof Number num) {
            return num.intValue();
        }
        try {
            return v == null ? 0 : Integer.parseInt(String.valueOf(v));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
