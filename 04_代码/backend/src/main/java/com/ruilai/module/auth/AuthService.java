package com.ruilai.module.auth;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.common.config.RedisKeys;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.JwtService;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.entity.SysRole;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.account.mapper.SysRoleMapper;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.entity.SubAccount;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.agent.mapper.SubAccountMapper;
import com.ruilai.module.auth.dto.AuthDtos.LoginResp;
import com.ruilai.module.auth.dto.AuthDtos.LoginUserView;
import com.ruilai.module.auth.dto.AuthDtos.ProfileReq;
import com.ruilai.module.system.LogService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class AuthService {

    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration SEND_INTERVAL = Duration.ofSeconds(60);
    private static final String BEARER = "Bearer ";

    private final SysAccountMapper accountMapper;
    private final SysRoleMapper roleMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final SubAccountMapper subMapper;
    private final JwtService jwtService;
    private final RedisTemplate<String, Object> redis;
    private final PasswordEncoder passwordEncoder;
    private final SmsSender smsSender;
    private final LogService logService;
    private final boolean smsMock;
    private final String masterCode;
    private final SecureRandom random = new SecureRandom();

    public AuthService(SysAccountMapper accountMapper,
                       SysRoleMapper roleMapper,
                       AgentL1Mapper l1Mapper,
                       AgentL2Mapper l2Mapper,
                       SubAccountMapper subMapper,
                       JwtService jwtService,
                       RedisTemplate<String, Object> redis,
                       PasswordEncoder passwordEncoder,
                       SmsSender smsSender,
                       LogService logService,
                       @Value("${ruilai.sms.mock:true}") boolean smsMock,
                       @Value("${ruilai.sms.master-code:}") String masterCode) {
        this.accountMapper = accountMapper;
        this.roleMapper = roleMapper;
        this.l1Mapper = l1Mapper;
        this.l2Mapper = l2Mapper;
        this.subMapper = subMapper;
        this.jwtService = jwtService;
        this.redis = redis;
        this.passwordEncoder = passwordEncoder;
        this.smsSender = smsSender;
        this.logService = logService;
        this.smsMock = smsMock;
        this.masterCode = masterCode == null ? "" : masterCode.trim();
    }

    public String sendSmsCode(String phone) {
        Boolean acquired = redis.opsForValue().setIfAbsent(RedisKeys.smsLimit(phone), 1, SEND_INTERVAL);
        if (!Boolean.TRUE.equals(acquired)) {
            throw new BizException(ErrCode.TOO_MANY_REQUESTS, "发送太频繁,请稍后再试");
        }
        String code = smsMock ? "123456" : randomCode();
        redis.opsForValue().set(RedisKeys.smsCode(phone), code, CODE_TTL);
        if (smsMock) {
            smsSender.send(phone, code);
            return code;
        }
        CompletableFuture.runAsync(() -> smsSender.send(phone, code));
        return null;
    }

    public LoginResp loginByPassword(String username, String password, String client) {
        SysAccount account = accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getUsername, username.trim()));
        if (account == null) {
            throw new BizException(ErrCode.BAD_PASSWORD);
        }
        if (!passwordEncoder.matches(password, account.getPasswordHash())) {
            throw new BizException(ErrCode.BAD_PASSWORD);
        }
        return issue(account, client, "登录");
    }

    public LoginResp loginBySms(String phone, String code, String client) {
        if (!verifySms(phone, code)) {
            throw new BizException(ErrCode.SMS_CODE_INVALID);
        }
        SysAccount account = accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                .eq(SysAccount::getPhone, phone));
        if (account == null) {
            throw new BizException(ErrCode.ACCOUNT_NOT_FOUND, "该手机号未绑定账号");
        }
        return issue(account, client, "短信登录");
    }

    public void logout(String authorization) {
        if (authorization == null || !authorization.startsWith(BEARER)) {
            return;
        }
        jwtService.parse(authorization.substring(BEARER.length())).ifPresent(claims -> {
            String jti = claims.getId();
            if (jti != null) {
                redis.delete(RedisKeys.token(jti));
            }
        });
    }

    public LoginUserView me() {
        LoginUser user = AuthUtil.current();
        return toView(user);
    }

    public LoginUserView updateProfile(ProfileReq req, String authorization) {
        LoginUser session = AuthUtil.current();
        SysAccount account = accountMapper.selectById(session.getAccountId());
        if (account == null) {
            throw new BizException(ErrCode.ACCOUNT_NOT_FOUND);
        }
        String name = req == null ? null : req.name();
        if (!StringUtils.hasText(name)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写显示名称");
        }
        name = name.trim();
        String phone = req.phone() == null ? "" : req.phone().trim();
        if (StringUtils.hasText(phone) && !phone.matches("^1[3-9]\\d{9}$")) {
            throw new BizException(ErrCode.BAD_REQUEST, "请输入正确手机号");
        }
        if (StringUtils.hasText(phone)) {
            SysAccount occupied = accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery()
                    .eq(SysAccount::getPhone, phone)
                    .ne(SysAccount::getId, account.getId())
                    .last("limit 1"));
            if (occupied != null) {
                throw new BizException(ErrCode.DUPLICATE, "该手机号已绑定其他账号");
            }
        }
        String password = req.password();
        if (StringUtils.hasText(password) && password.length() < 4) {
            throw new BizException(ErrCode.BAD_REQUEST, "新密码至少 4 位");
        }
        account.setName(name);
        account.setPhone(StringUtils.hasText(phone) ? phone : null);
        if (StringUtils.hasText(password)) {
            account.setPasswordHash(passwordEncoder.encode(password));
        }
        accountMapper.updateById(account);
        session.setName(name);
        syncLinkedName(session, name, phone);
        refreshSession(authorization, session);
        logService.record("更新个人资料", "op", true);
        return toView(session);
    }

    private void syncLinkedName(LoginUser session, String name, String phone) {
        String role = session.getRoleCode();
        String agentId = session.getAgentId();
        if ("L1".equals(role) && StringUtils.hasText(agentId)) {
            AgentL1 l1 = l1Mapper.selectById(agentId);
            if (l1 != null) {
                l1.setName(name);
                if (StringUtils.hasText(phone)) {
                    l1.setPhone(phone);
                }
                l1Mapper.updateById(l1);
            }
        } else if ("L2".equals(role) && StringUtils.hasText(agentId)) {
            AgentL2 l2 = l2Mapper.selectById(agentId);
            if (l2 != null) {
                l2.setName(name);
                l2Mapper.updateById(l2);
            }
        } else if ("SUB".equals(role)) {
            SubAccount sub = subMapper.selectOne(Wrappers.<SubAccount>lambdaQuery()
                    .eq(SubAccount::getUsername, session.getUsername()).last("limit 1"));
            if (sub != null) {
                sub.setName(name);
                subMapper.updateById(sub);
            }
        }
    }

    private void refreshSession(String authorization, LoginUser session) {
        if (authorization == null || !authorization.startsWith(BEARER)) {
            return;
        }
        jwtService.parse(authorization.substring(BEARER.length())).ifPresent(claims -> {
            String jti = claims.getId();
            if (jti != null) {
                redis.opsForValue().set(RedisKeys.token(jti), session, jwtService.ttl());
            }
        });
    }

    private LoginResp issue(SysAccount account, String client, String action) {
        if (!"启用".equals(account.getStatus())) {
            throw new BizException(ErrCode.ACCOUNT_DISABLED);
        }
        LoginUser session = buildSession(account, client);
        String jti = UUID.randomUUID().toString().replace("-", "");
        String token = jwtService.generate(account.getId(), account.getRoleCode(), jti);
        redis.opsForValue().set(RedisKeys.token(jti), session, jwtService.ttl());
        logService.record(account.getUsername(), account.getName(),
                action + ("mini".equals(client) ? "小程序" : "后台"), "login", true);
        return new LoginResp(token, toView(session));
    }

    private LoginUser buildSession(SysAccount account, String client) {
        Set<String> perms = new HashSet<>();
        SysRole bound = null;
        if (StringUtils.hasText(account.getRoleId())) {
            bound = roleMapper.selectById(account.getRoleId());
        }
        if (bound == null) {
            List<SysRole> roles = roleMapper.selectList(null);
            bound = roles.stream()
                    .filter(r -> matchRole(r, account.getRoleCode()))
                    .findFirst()
                    .orElse(null);
        }
        if (bound != null && bound.getPerms() != null) {
            perms.addAll(bound.getPerms());
        }
        if (perms.isEmpty() && "ADMIN".equals(account.getRoleCode())
                && (!StringUtils.hasText(account.getRoleId()) || RolePerms.R1.equals(account.getRoleId()))) {
            perms.add(RolePerms.ALL);
        }
        LoginUser user = new LoginUser();
        user.setAccountId(account.getId());
        user.setRoleCode(account.getRoleCode());
        user.setUsername(account.getUsername());
        user.setName(account.getName());
        user.setAgentId(account.getAgentId());
        user.setPermissions(perms);
        user.setClient(client == null ? "web" : client);
        user.setLoginAt(Instant.now().toString());
        return user;
    }

    private boolean matchRole(SysRole role, String roleCode) {
        return switch (roleCode) {
            case "ADMIN" -> "R1".equals(role.getId()) || "平台管理员".equals(role.getName());
            case "L1" -> "R2".equals(role.getId());
            case "SUB" -> "R3".equals(role.getId());
            case "L2" -> "R4".equals(role.getId());
            default -> false;
        };
    }

    private boolean verifySms(String phone, String code) {
        if (!masterCode.isBlank() && masterCode.equals(code)) {
            return true;
        }
        Object cached = redis.opsForValue().get(RedisKeys.smsCode(phone));
        if (cached == null) {
            return false;
        }
        boolean ok = code.equals(String.valueOf(cached));
        if (ok) {
            redis.delete(RedisKeys.smsCode(phone));
        }
        return ok;
    }

    private LoginUserView toView(LoginUser user) {
        SysAccount account = accountMapper.selectById(user.getAccountId());
        return new LoginUserView(
                user.getAccountId(),
                user.getUsername(),
                user.getName(),
                user.getRoleCode(),
                user.getAgentId(),
                account == null ? null : account.getPhone(),
                user.getPermissions()
        );
    }

    private String randomCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
