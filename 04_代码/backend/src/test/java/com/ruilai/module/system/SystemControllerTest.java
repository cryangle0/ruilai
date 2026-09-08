package com.ruilai.module.system;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.storage.StorageService;
import com.ruilai.common.web.BizException;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.entity.SysRole;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.account.mapper.SysRoleMapper;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.system.mapper.NotificationMapper;
import com.ruilai.module.system.mapper.OpLogMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemControllerTest {
    @Mock SysRoleMapper roleMapper;
    @Mock SysAccountMapper accountMapper;
    @Mock AgentL1Mapper l1Mapper;
    @Mock AgentL2Mapper l2Mapper;
    @Mock OpLogMapper logMapper;
    @Mock NotificationMapper notificationMapper;
    @Mock StorageService storageService;
    @Mock SettingService settingService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock LogService logService;
    @InjectMocks SystemController controller;

    @BeforeEach
    void loginAdmin() {
        LoginUser user = new LoginUser();
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
    void deletesOnlyUnboundRole() {
        SysRole role = new SysRole();
        role.setId("R9");
        role.setName("临时角色");
        when(roleMapper.selectById("R9")).thenReturn(role);
        when(accountMapper.selectCount(any())).thenReturn(1L);

        assertThatThrownBy(() -> controller.deleteRole("R9"))
                .isInstanceOf(BizException.class).hasMessageContaining("已绑定账号");

        when(accountMapper.selectCount(any())).thenReturn(0L);
        controller.deleteRole("R9");
        verify(roleMapper).deleteById("R9");
    }

    @Test
    void changesAccountPasswordWithHash() {
        SysAccount account = new SysAccount();
        account.setId(2L);
        account.setUsername("operator");
        when(accountMapper.selectById(2L)).thenReturn(account);
        when(passwordEncoder.encode("newpass")).thenReturn("HASH");

        controller.changeAccountPassword(2L, Map.of("password", "newpass"));

        assertThat(account.getPasswordHash()).isEqualTo("HASH");
        verify(accountMapper).updateById(account);
    }
}
