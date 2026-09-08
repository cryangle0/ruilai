package com.ruilai.module.sn;

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

        SnService service = new SnService(
                mapper,
                mock(ProductMapper.class),
                mock(SnEventWriter.class),
                mock(SnWriter.class),
                mock(LogService.class),
                mock(ExceptionTicketMapper.class),
                returnMapper);

        SnCode result = service.get(row.getSn());

        assertThat(result.getEvents()).hasSize(1);
        assertThat(result.getEvents().get(0))
                .containsEntry("title", "销售到C端")
                .containsEntry("type", "bind");
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

        SnService service = new SnService(
                mapper,
                mock(ProductMapper.class),
                mock(SnEventWriter.class),
                mock(SnWriter.class),
                mock(LogService.class),
                mock(ExceptionTicketMapper.class),
                returnMapper);

        SnCode result = service.get(row.getSn());

        assertThat(result.getEvents()).anySatisfy(e -> assertThat(e)
                .containsEntry("title", "退货申请已驳回")
                .containsEntry("type", "return"));
        assertThat(result.getExtra().get("processNotes")).asList().hasSize(1);
    }
}
