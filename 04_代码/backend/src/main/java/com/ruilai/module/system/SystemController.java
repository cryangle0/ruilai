package com.ruilai.module.system;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.PasswordPolicy;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.storage.StorageService;
import com.ruilai.common.util.Ids;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.R;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.entity.SysRole;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.account.mapper.SysRoleMapper;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.system.entity.Notification;
import com.ruilai.module.system.entity.OpLog;
import com.ruilai.module.system.mapper.NotificationMapper;
import com.ruilai.module.system.mapper.OpLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SystemController {

    private final SysRoleMapper roleMapper;
    private final SysAccountMapper accountMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final OpLogMapper logMapper;
    private final NotificationMapper notificationMapper;
    private final StorageService storageService;
    private final SettingService settingService;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;

    @GetMapping("/roles")
    public R<List<SysRole>> roles() {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        return R.ok(roleMapper.selectList(Wrappers.<SysRole>lambdaQuery().orderByAsc(SysRole::getId)));
    }

    @PostMapping("/roles")
    public R<SysRole> saveRole(@RequestBody SysRole body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        if (RolePerms.R1.equals(body.getId()) && (body.getPerms() == null || !body.getPerms().contains(RolePerms.ALL))) {
            throw new BizException(ErrCode.BAD_REQUEST, "平台管理员须保留全部权限");
        }
        if (!StringUtils.hasText(body.getId())) {
            body.setId(Ids.next("R"));
            roleMapper.insert(body);
            logService.record("新建角色 " + body.getName(), "op", true);
        } else {
            roleMapper.updateById(body);
            logService.record("更新角色 " + body.getName(), "op", true);
        }
        return R.ok(roleMapper.selectById(body.getId()));
    }

    @PostMapping("/roles/{id}/delete")
    public R<Void> deleteRole(@PathVariable String id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        SysRole role = roleMapper.selectById(id);
        if (role == null) {
            throw new BizException(ErrCode.NOT_FOUND, "角色不存在");
        }
        if (Set.of("R1", "R2", "R3", "R4").contains(id)) {
            throw new BizException(ErrCode.BAD_REQUEST, "系统角色不可删除");
        }
        Long bound = accountMapper.selectCount(
                Wrappers.<SysAccount>lambdaQuery().eq(SysAccount::getRoleId, id));
        if (bound != null && bound > 0) {
            throw new BizException(ErrCode.BAD_REQUEST, "该角色已绑定账号，不可删除");
        }
        roleMapper.deleteById(id);
        logService.record("删除角色 " + role.getName(), "op", true);
        return R.ok();
    }

    @GetMapping("/accounts")
    public R<List<Map<String, Object>>> accounts(@RequestParam(required = false) String status) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        Map<String, String> roleNames = new LinkedHashMap<>();
        for (SysRole r : roleMapper.selectList(Wrappers.<SysRole>lambdaQuery().orderByAsc(SysRole::getId))) {
            roleNames.put(r.getId(), r.getName());
        }
        var q = Wrappers.<SysAccount>lambdaQuery().orderByAsc(SysAccount::getId);
        if (StringUtils.hasText(status)) {
            q.eq(SysAccount::getStatus, status);
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (SysAccount a : accountMapper.selectList(q)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", a.getId());
            row.put("username", a.getUsername());
            row.put("name", a.getName());
            row.put("roleCode", a.getRoleCode());
            row.put("roleId", a.getRoleId());
            row.put("roleName", roleNameOf(a, roleNames));
            row.put("agentId", a.getAgentId());
            row.put("agentName", agentName(a.getAgentId()));
            row.put("status", a.getStatus());
            out.add(row);
        }
        return R.ok(out);
    }

    @PostMapping("/accounts")
    public R<Map<String, Object>> createAccount(@RequestBody Map<String, Object> body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        String username = String.valueOf(body.getOrDefault("username", "")).trim();
        String name = String.valueOf(body.getOrDefault("name", "")).trim();
        String password = String.valueOf(body.getOrDefault("password", "demo"));
        String roleId = String.valueOf(body.getOrDefault("roleId", RolePerms.R1)).trim();
        if (!StringUtils.hasText(username) || !StringUtils.hasText(name)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写用户名和姓名");
        }
        PasswordPolicy.requireNewAccountPassword(password);
        SysRole role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择有效角色");
        }
        if (RolePerms.isAgentRole(role.getId())) {
            throw new BizException(ErrCode.BAD_REQUEST, "一级/二级/子账号不在此创建");
        }
        Long exist = accountMapper.selectCount(Wrappers.<SysAccount>lambdaQuery().eq(SysAccount::getUsername, username));
        if (exist != null && exist > 0) {
            throw new BizException(ErrCode.BAD_REQUEST, "用户名已存在");
        }
        SysAccount a = new SysAccount();
        a.setUsername(username);
        a.setName(name);
        a.setPasswordHash(passwordEncoder.encode(StringUtils.hasText(password) ? password : "demo"));
        a.setRoleCode("ADMIN");
        a.setRoleId(role.getId());
        a.setStatus("启用");
        accountMapper.insert(a);
        logService.record("新建平台账号 " + username + " · " + role.getName(), "op", true);
        return R.ok(Map.of("id", a.getId(), "username", username, "name", name, "status", "启用", "roleId", role.getId()));
    }

    @PostMapping("/accounts/{id}/status")
    public R<Void> toggleAccount(@PathVariable Long id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        SysAccount a = accountMapper.selectById(id);
        if (a == null) {
            throw new BizException(ErrCode.NOT_FOUND, "账号不存在");
        }
        if ("admin".equals(a.getUsername())) {
            throw new BizException(ErrCode.BAD_REQUEST, "演示主账号 admin 不可停用");
        }
        if (a.getId() != null && a.getId().equals(AuthUtil.current().getAccountId())) {
            throw new BizException(ErrCode.BAD_REQUEST, "不可停用当前登录账号");
        }
        a.setStatus("启用".equals(a.getStatus()) ? "停用" : "启用");
        accountMapper.updateById(a);
        logService.record(a.getStatus() + "账号 " + a.getUsername(), "op", true);
        return R.ok();
    }

    @PostMapping("/accounts/{id}/password")
    public R<Void> changeAccountPassword(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        SysAccount account = accountMapper.selectById(id);
        if (account == null) {
            throw new BizException(ErrCode.NOT_FOUND, "账号不存在");
        }
        String password = String.valueOf(body.getOrDefault("password", "")).trim();
        PasswordPolicy.requireChangedPassword(password);
        account.setPasswordHash(passwordEncoder.encode(password));
        accountMapper.updateById(account);
        logService.record("修改账号密码 " + account.getUsername(), "op", true);
        return R.ok();
    }

    @GetMapping("/logs")
    public R<PageResult<OpLog>> logs(@RequestParam(defaultValue = "1") long page,
                                     @RequestParam(defaultValue = "20") long pageSize,
                                     @RequestParam(required = false) String type,
                                     @RequestParam(required = false) String q,
                                     @RequestParam(required = false) String from,
                                     @RequestParam(required = false) String to) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        var w = Wrappers.<OpLog>lambdaQuery().orderByDesc(OpLog::getOccurredAt);
        if (type != null && !type.isBlank()) {
            w.eq(OpLog::getType, type);
        }
        if (StringUtils.hasText(q)) {
            w.and(x -> x.like(OpLog::getAction, q).or().like(OpLog::getAccount, q).or().like(OpLog::getRoleName, q));
        }
        if (StringUtils.hasText(from)) {
            w.ge(OpLog::getOccurredAt, java.time.LocalDate.parse(from).atStartOfDay());
        }
        if (StringUtils.hasText(to)) {
            w.le(OpLog::getOccurredAt, java.time.LocalDate.parse(to).atTime(23, 59, 59));
        }
        return R.ok(PageResult.of(logMapper.selectPage(Page.of(page, pageSize), w)));
    }

    @GetMapping("/notifications")
    public R<List<Notification>> notifications() {
        return R.ok(notificationMapper.selectList(notificationScope()
                .orderByDesc(Notification::getOccurredAt).last("limit 50")));
    }

    @GetMapping("/notifications/unread-count")
    public R<Long> unreadNotificationCount() {
        return R.ok(notificationMapper.selectCount(notificationScope()
                .eq(Notification::getReadFlag, 0)));
    }

    @PostMapping("/notifications/{id}/read")
    public R<Void> read(@PathVariable String id) {
        Notification n = notificationMapper.selectById(id);
        if (n != null && canReceiveNotification(n)) {
            n.setReadFlag(1);
            notificationMapper.updateById(n);
        }
        return R.ok();
    }

    @PostMapping("/notifications/read-all")
    public R<Void> readAll() {
        List<Notification> list = notificationMapper.selectList(notificationScope()
                .eq(Notification::getReadFlag, 0));
        for (Notification n : list) {
            n.setReadFlag(1);
            notificationMapper.updateById(n);
        }
        return R.ok();
    }

    private LambdaQueryWrapper<Notification> notificationScope() {
        String audience = notificationAudience();
        return Wrappers.<Notification>lambdaQuery()
                .and(w -> w.isNull(Notification::getToRole).or().like(Notification::getToRole, audience));
    }

    private boolean canReceiveNotification(Notification n) {
        return n.getToRole() == null || n.getToRole().contains(notificationAudience());
    }

    private String notificationAudience() {
        return switch (AuthUtil.current().getRoleCode()) {
            case "ADMIN" -> "原厂";
            case "L1", "SUB" -> "一级";
            case "L2" -> "二级";
            default -> "__NO_NOTIFICATION_AUDIENCE__";
        };
    }

    @GetMapping("/settings/exception")
    public R<Map<String, Object>> exceptionRules() {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        return R.ok(settingService.exceptionRules());
    }

    @PostMapping("/settings/exception")
    public R<Map<String, Object>> saveExceptionRules(@RequestBody Map<String, Object> body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        return R.ok(settingService.saveExceptionRules(body));
    }

    @PostMapping("/upload")
    public R<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        String url = storageService.store(file);
        return R.ok(Map.of("url", url));
    }

    private String roleNameOf(SysAccount a, Map<String, String> roleNames) {
        if (a.getRoleId() != null && roleNames.containsKey(a.getRoleId())) {
            return roleNames.get(a.getRoleId());
        }
        if (a.getRoleCode() == null) return "—";
        return switch (a.getRoleCode()) {
            case "ADMIN" -> "平台管理员";
            case "L1" -> "一级代理主账号";
            case "L2" -> "二级代理";
            case "SUB" -> "一级子账号";
            default -> a.getRoleCode();
        };
    }

    private String agentName(String agentId) {
        if (!StringUtils.hasText(agentId)) {
            return "—";
        }
        AgentL1 l1 = l1Mapper.selectById(agentId);
        if (l1 != null) {
            return l1.getName();
        }
        AgentL2 l2 = l2Mapper.selectById(agentId);
        return l2 == null ? agentId : l2.getName();
    }
}
