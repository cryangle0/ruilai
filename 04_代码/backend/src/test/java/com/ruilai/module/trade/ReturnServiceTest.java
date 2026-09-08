package com.ruilai.module.trade;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.thirdparty.ThirdPartyGateway;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.SnWriter;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.StockLogMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReturnServiceTest {
    @Mock ReturnOrderMapper rtMapper;
    @Mock SnCodeMapper snMapper;
    @Mock ProductMapper productMapper;
    @Mock AgentL2Mapper l2Mapper;
    @Mock StockLogMapper stockLogMapper;
    @Mock OrderNoGenerator orderNos;
    @Mock LogService logService;
    @Mock SnEventWriter eventWriter;
    @Mock SnWriter snWriter;
    @InjectMocks ReturnService service;

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getRejectsReturnOutsideL1Domain() {
        login("L1", "L1B");
        ReturnOrder row = new ReturnOrder();
        row.setId("RT1");
        row.setFromId("L1A");
        row.setApproverId("L1A");
        row.setSns(List.of());
        when(rtMapper.selectById("RT1")).thenReturn(row);

        assertThatThrownBy(() -> service.get("RT1"))
                .isInstanceOf(com.ruilai.common.web.BizException.class)
                .hasMessageContaining("无权");
    }

    private void login(String role, String agent) {
        LoginUser user = new LoginUser();
        user.setRoleCode(role);
        user.setAgentId(agent);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }
}
