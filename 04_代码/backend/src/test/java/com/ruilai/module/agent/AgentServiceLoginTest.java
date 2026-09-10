package com.ruilai.module.agent;

import com.ruilai.common.web.BizException;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.agent.entity.SubAccount;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.agent.mapper.SubAccountMapper;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.system.mapper.NotificationMapper;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentServiceLoginTest {
    @Mock AgentL1Mapper l1Mapper;
    @Mock AgentL2Mapper l2Mapper;
    @Mock SubAccountMapper subMapper;
    @Mock SysAccountMapper accountMapper;
    @Mock PasswordEncoder passwordEncoder;
    @Mock LogService logService;
    @Mock NotificationMapper notificationMapper;
    @Mock SnCodeMapper snMapper;
    @Mock PurchaseOrderMapper poMapper;
    @Mock SalesOrderMapper soMapper;
    @Mock ExceptionTicketMapper exMapper;
    @Mock ReturnOrderMapper rtMapper;
    @InjectMocks AgentService service;

    @Test
    void rejectsUsernameOwnedByAnotherAgent() {
        when(accountMapper.selectOne(any())).thenReturn(account("agent_hd", "L1A", "L1"));

        assertThatThrownBy(() -> service.assertUsernameAvailable("agent_hd", "L1NEW", "L1", null))
                .isInstanceOf(BizException.class)
                .hasMessage("用户名已存在");
    }

    @Test
    void allowsCurrentAgentToKeepItsUsername() {
        when(accountMapper.selectOne(any())).thenReturn(account("agent_hd", "L1A", "L1"));

        assertThatCode(() -> service.assertUsernameAvailable("agent_hd", "L1A", "L1", null))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsSubUsernameTakenByAnotherSub() {
        when(accountMapper.selectOne(any())).thenReturn(null);
        SubAccount other = new SubAccount();
        other.setId("SUB1");
        other.setUsername("agent_hd");
        when(subMapper.selectOne(any())).thenReturn(other);

        assertThatThrownBy(() -> service.assertUsernameAvailable("agent_hd", "L1A", "SUB", "SUB2"))
                .isInstanceOf(BizException.class)
                .hasMessage("用户名已存在");
    }

    private SysAccount account(String username, String agentId, String role) {
        SysAccount row = new SysAccount();
        row.setUsername(username);
        row.setAgentId(agentId);
        row.setRoleCode(role);
        return row;
    }
}
