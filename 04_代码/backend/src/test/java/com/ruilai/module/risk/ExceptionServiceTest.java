package com.ruilai.module.risk;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.ruilai.common.security.LoginUser;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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

    @BeforeAll
    static void initializeLambdaMetadata() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), ""),
                ExceptionTicket.class);
    }

    @BeforeEach
    void loginAdmin() {
        LoginUser user = new LoginUser();
        user.setRoleCode("ADMIN");
        user.setUsername("admin");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

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

    @Test
    void activationChannelUsesL2OwnershipInsteadOfDifferentDimensions() {
        var direct = Wrappers.<ExceptionTicket>lambdaQuery();
        var distributed = Wrappers.<ExceptionTicket>lambdaQuery();

        ExceptionService.applyActivationChannel(direct, false);
        ExceptionService.applyActivationChannel(distributed, true);

        assertThat(direct.getSqlSegment()).contains("IS NULL");
        assertThat(distributed.getSqlSegment()).contains("IS NOT NULL");
    }

    @Test
    void countsUseSnWithActiveTypeAndDimensionButIgnoreDatesExactlyLikeSnLists() {
        when(mapper.selectCount(any())).thenReturn(0L);

        service.counts("", "", "2026-09-01", "2026-09-30",
                "待处理", "activate-direct", "客户信息重复", "RL-SN-1");

        ArgumentCaptor<com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExceptionTicket>> queries =
                ArgumentCaptor.forClass(com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper.class);
        verify(mapper, times(5)).selectCount(queries.capture());
        assertThat(queries.getAllValues()).allSatisfy(query -> {
            assertThat(query.getSqlSegment()).contains("target", "type", "dim");
            assertThat(query.getSqlSegment()).doesNotContain("occurred_at");
        });
    }

    @Test
    void countsApplyDateTypeStatusAndRequestedDimensionWhenSnIsAbsent() {
        when(mapper.selectCount(any())).thenReturn(0L);

        service.counts("", "", "2026-09-01", "2026-09-30",
                "待处理", "activate-direct", "客户信息重复", "");

        ArgumentCaptor<com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExceptionTicket>> queries =
                ArgumentCaptor.forClass(com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper.class);
        verify(mapper, times(5)).selectCount(queries.capture());
        String activeScope = queries.getAllValues().get(4).getSqlSegment();
        assertThat(activeScope)
                .contains("occurred_at", "type", "status", "dim")
                .contains("JSON_EXTRACT");
    }
}
