package com.ruilai.module.sn;

import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SnServiceLifecycleTest {

    @Test
    void soldLegacySnGetsAReadOnlyLifecycleForDisplay() {
        SnCodeMapper mapper = mock(SnCodeMapper.class);
        SnCode row = new SnCode();
        row.setSn("RL202608030001");
        row.setStatus("bound");
        row.setSoldAt(LocalDateTime.of(2026, 8, 3, 16, 0));
        row.setUserJson(Map.of("phone", "13800138000", "addr", "杭州市"));
        when(mapper.selectById(row.getSn())).thenReturn(row);
        ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
        when(returnMapper.selectList(any())).thenReturn(List.of());

        SnService service = serviceOf(mapper, returnMapper);

        SnCode result = service.get(row.getSn());

        assertThat(result.getFactoryAt().toLocalDate()).isEqualTo(java.time.LocalDate.of(2026, 8, 3));
        assertThat(result.getEvents()).anySatisfy(e -> assertThat(e)
                .containsEntry("title", "销售到C端")
                .containsEntry("type", "bind"));
        assertThat(result.getEvents()).anySatisfy(e -> assertThat(e)
                .containsEntry("title", "生成并导入码库"));
    }

    @Test
    void existingLifecycleStillIncludesFactoryOriginForDisplay() {
        SnCodeMapper mapper = mock(SnCodeMapper.class);
        SnCode row = new SnCode();
        row.setSn("RL202608030001");
        row.setProductName("锐涞经典款套件");
        row.setSizeCode("M");
        row.setBelt("腰带M");
        row.setEvents(List.of(Map.of(
                "time", "2026-08-03 16:00:00",
                "title", "销售到C端",
                "desc", "13800138000",
                "type", "bind")));
        when(mapper.selectById(row.getSn())).thenReturn(row);
        ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
        when(returnMapper.selectList(any())).thenReturn(List.of());

        SnCode result = serviceOf(mapper, returnMapper).get(row.getSn());

        assertThat(result.getEvents()).anySatisfy(event -> assertThat(event)
                .containsEntry("title", "生成并导入码库")
                .containsEntry("type", "import"));
    }

    @Test
    void factoryDateIsFilledFromSnPrefixWhenStoredValueIsMissing() {
        SnCodeMapper mapper = mock(SnCodeMapper.class);
        SnCode row = new SnCode();
        row.setSn("RL202608010041");
        when(mapper.selectById(row.getSn())).thenReturn(row);
        ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
        when(returnMapper.selectList(any())).thenReturn(List.of());

        SnService service = serviceOf(mapper, returnMapper);

        SnCode result = service.get(row.getSn());
        assertThat(result.getFactoryAt().toLocalDate()).isEqualTo(java.time.LocalDate.of(2026, 8, 1));
    }

    @Test
    void storedFactoryAtYieldsToSnPrefixOnRead() {
        SnCodeMapper mapper = mock(SnCodeMapper.class);
        SnCode row = new SnCode();
        row.setSn("RL202608010041");
        row.setFactoryAt(LocalDateTime.of(2026, 9, 4, 18, 9, 9));
        when(mapper.selectById(row.getSn())).thenReturn(row);
        ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
        when(returnMapper.selectList(any())).thenReturn(List.of());

        SnService service = serviceOf(mapper, returnMapper);

        SnCode result = service.get(row.getSn());
        assertThat(result.getFactoryAt().toLocalDate()).isEqualTo(java.time.LocalDate.of(2026, 8, 1));
    }

    @Test
    void legacyReturnAddsEventAndProcessNoteForDisplay() {
        SnCodeMapper mapper = mock(SnCodeMapper.class);
        SnCode row = new SnCode();
        row.setSn("RL202608010041");
        row.setExtra(Map.of("situationNotes", List.of("包装划痕")));
        when(mapper.selectById(row.getSn())).thenReturn(row);

        ReturnOrder returned = new ReturnOrder();
        returned.setNo("RT2026080403");
        returned.setStatus("rejected");
        returned.setProcessNote("测试一下0908");
        returned.setCreatedAt(LocalDateTime.of(2026, 9, 8, 10, 0));
        ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
        when(returnMapper.selectList(any())).thenReturn(List.of(returned));

        SnService service = serviceOf(mapper, returnMapper);

        SnCode result = service.get(row.getSn());

        assertThat(result.getEvents()).anySatisfy(e -> assertThat(e)
                .containsEntry("title", "退货申请已驳回")
                .containsEntry("type", "return"));
        assertThat(result.getExtra().get("processNotes")).asList().hasSize(1);
    }

    @Test
    void getFillsAgentDisplayNames() {
        SnCodeMapper mapper = mock(SnCodeMapper.class);
        SnCode row = new SnCode();
        row.setSn("RL202608010001");
        row.setL1Id("L1A");
        row.setL2Id("L2A");
        when(mapper.selectById(row.getSn())).thenReturn(row);
        ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
        when(returnMapper.selectList(any())).thenReturn(List.of());
        AgentL1Mapper l1Mapper = mock(AgentL1Mapper.class);
        AgentL2Mapper l2Mapper = mock(AgentL2Mapper.class);
        com.ruilai.module.agent.entity.AgentL1 l1 = new com.ruilai.module.agent.entity.AgentL1();
        l1.setName("华东锐涞总代");
        com.ruilai.module.agent.entity.AgentL2 l2 = new com.ruilai.module.agent.entity.AgentL2();
        l2.setName("杭州城西专营");
        when(l1Mapper.selectById("L1A")).thenReturn(l1);
        when(l2Mapper.selectById("L2A")).thenReturn(l2);

        SnService service = new SnService(
                mapper,
                mock(ProductMapper.class),
                mock(SnEventWriter.class),
                mock(SnWriter.class),
                mock(LogService.class),
                mock(ExceptionTicketMapper.class),
                returnMapper,
                l1Mapper,
                l2Mapper);

        SnCode result = service.get(row.getSn());
        assertThat(result.getL1Name()).isEqualTo("华东锐涞总代");
        assertThat(result.getL2Name()).isEqualTo("杭州城西专营");
    }

    @Test
  void openExceptionComesFromActivateTicketsNotFrozenFlag() {
      SnCodeMapper mapper = mock(SnCodeMapper.class);
      SnCode row = new SnCode();
      row.setSn("RL202608010051");
      row.setFrozen(1);
      when(mapper.selectById(row.getSn())).thenReturn(row);
      ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
      when(returnMapper.selectList(any())).thenReturn(List.of());
      ExceptionTicketMapper exMapper = mock(ExceptionTicketMapper.class);
      when(exMapper.selectList(any())).thenReturn(List.of());

      SnService service = new SnService(
              mapper,
              mock(ProductMapper.class),
              mock(SnEventWriter.class),
              mock(SnWriter.class),
              mock(LogService.class),
              exMapper,
              returnMapper,
              mock(AgentL1Mapper.class),
              mock(AgentL2Mapper.class));

      assertThat(service.get(row.getSn()).getOpenException()).isFalse();
  }

  @Test
  void openActivateTicketMarksSnAsUnhandledException() {
      SnCodeMapper mapper = mock(SnCodeMapper.class);
      SnCode row = new SnCode();
      row.setSn("RL202608010001");
      when(mapper.selectById(row.getSn())).thenReturn(row);
      ReturnOrderMapper returnMapper = mock(ReturnOrderMapper.class);
      when(returnMapper.selectList(any())).thenReturn(List.of());
      ExceptionTicketMapper exMapper = mock(ExceptionTicketMapper.class);
      com.ruilai.module.risk.entity.ExceptionTicket ticket = new com.ruilai.module.risk.entity.ExceptionTicket();
      ticket.setTarget("RL202608010001");
      ticket.setType("归属地异常");
      ticket.setDetail("手机归属广东广州 · IP地区浙江杭州不一致");
      when(exMapper.selectList(any())).thenReturn(List.of(ticket));

      SnService service = new SnService(
              mapper,
              mock(ProductMapper.class),
              mock(SnEventWriter.class),
              mock(SnWriter.class),
              mock(LogService.class),
              exMapper,
              returnMapper,
              mock(AgentL1Mapper.class),
              mock(AgentL2Mapper.class));

      SnCode result = service.get(row.getSn());
      assertThat(result.getOpenException()).isTrue();
      assertThat(result.getOpenExceptionType()).isEqualTo("归属地异常");
  }

  private static SnService serviceOf(SnCodeMapper mapper, ReturnOrderMapper returnMapper) {
        return new SnService(
                mapper,
                mock(ProductMapper.class),
                mock(SnEventWriter.class),
                mock(SnWriter.class),
                mock(LogService.class),
                mock(ExceptionTicketMapper.class),
                returnMapper,
                mock(AgentL1Mapper.class),
                mock(AgentL2Mapper.class));
    }
}
