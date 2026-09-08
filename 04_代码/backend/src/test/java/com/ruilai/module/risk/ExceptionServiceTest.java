package com.ruilai.module.risk;

import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.system.mapper.NotificationMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExceptionServiceTest {
    @Mock ExceptionTicketMapper mapper;
    @Mock LogService logService;
    @Mock NotificationMapper notificationMapper;
    @Mock AgentL1Mapper l1Mapper;
    @Mock AgentL2Mapper l2Mapper;
    @Mock SnCodeMapper snMapper;
    @InjectMocks ExceptionService service;

    @Test
    void getDerivesL1FromRelatedL2() {
        ExceptionTicket ticket = new ExceptionTicket();
        ticket.setId("EX1");
        ticket.setType("销售库存异常");
        ticket.setTarget("二级库存");
        ticket.setExtra(Map.of("l2Id", "L2A"));
        when(mapper.selectById("EX1")).thenReturn(ticket);

        AgentL2 l2 = new AgentL2();
        l2.setId("L2A");
        l2.setName("二级A");
        l2.setParentId("L1A");
        when(l2Mapper.selectById("L2A")).thenReturn(l2);
        AgentL1 l1 = new AgentL1();
        l1.setId("L1A");
        l1.setName("一级A");
        when(l1Mapper.selectById("L1A")).thenReturn(l1);

        ExceptionTicket result = service.get("EX1");

        assertThat(result.getExtra())
                .containsEntry("l1Id", "L1A")
                .containsEntry("l1Name", "一级A")
                .containsEntry("l2Name", "二级A");
    }
}
