package com.ruilai.module.sn;

import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
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

        SnService service = new SnService(
                mapper,
                mock(ProductMapper.class),
                mock(SnEventWriter.class),
                mock(SnWriter.class),
                mock(LogService.class),
                mock(ExceptionTicketMapper.class));

        SnCode result = service.get(row.getSn());

        assertThat(result.getEvents()).hasSize(1);
        assertThat(result.getEvents().get(0))
                .containsEntry("title", "销售到C端")
                .containsEntry("type", "bind");
    }
}
