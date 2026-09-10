package com.ruilai.module.auth;

import com.ruilai.common.security.JwtService;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.web.BizException;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.account.mapper.SysRoleMapper;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.agent.mapper.SubAccountMapper;
import com.ruilai.module.auth.dto.AuthDtos;
import com.ruilai.module.system.LogService;
import jakarta.validation.Validation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthCompatibilityTest {
    @Mock SysAccountMapper accountMapper;
    @Mock SysRoleMapper roleMapper;
    @Mock AgentL1Mapper l1Mapper;
    @Mock AgentL2Mapper l2Mapper;
    @Mock SubAccountMapper subMapper;
    @Mock JwtService jwtService;
    @Mock RedisTemplate<String, Object> redis;
    @Mock PasswordEncoder passwordEncoder;
    @Mock SmsSender smsSender;
    @Mock LogService logService;
    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(accountMapper, roleMapper, l1Mapper, l2Mapper, subMapper,
                jwtService, redis, passwordEncoder, smsSender, logService, true, "");
        LoginUser user = new LoginUser();
        user.setAccountId(7L);
        user.setRoleCode("ADMIN");
        user.setPermissions(Set.of("all"));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginRequestAcceptsHistoricalThreeCharacterPassword() {
        try (var validatorFactory = Validation.buildDefaultValidatorFactory()) {
            var violations = validatorFactory.getValidator()
                    .validate(new AuthDtos.LoginReq("legacy", "123", "mini"));
            assertThat(violations).isEmpty();
        }
    }

    @Test
    void profilePasswordChangeRejectsFewerThanSixCharacters() {
        SysAccount account = new SysAccount();
        account.setId(7L);
        account.setUsername("operator");
        when(accountMapper.selectById(7L)).thenReturn(account);

        assertThatThrownBy(() -> service.updateProfile(
                new AuthDtos.ProfileReq("操作员", "", "12345"), null))
                .isInstanceOf(BizException.class)
                .hasMessage("新密码至少 6 位");
    }
}
