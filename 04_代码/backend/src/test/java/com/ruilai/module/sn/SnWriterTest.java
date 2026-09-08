package com.ruilai.module.sn;

import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SnWriterTest {

    @Mock
    private SnCodeMapper snMapper;

    @InjectMocks
    private SnWriter snWriter;

    @Test
    void updateClearsL2IdWhenNullAfterL2Return() {
        SnCode row = new SnCode();
        row.setSn("RL202608010002");
        row.setL1Id("L1A");
        row.setL2Id(null);
        row.setStatus("l1");

        snWriter.update(row);

        verify(snMapper).updateById(row);
        verify(snMapper).clearL2Id("RL202608010002");
        verify(snMapper, never()).clearL1Id(anyString());
    }

    @Test
    void updateClearsL1IdWhenReturnedToFactory() {
        SnCode row = new SnCode();
        row.setSn("RL1");
        row.setL1Id(null);
        row.setL2Id(null);
        row.setStatus("warehouse");

        snWriter.update(row);

        verify(snMapper).clearL2Id("RL1");
        verify(snMapper).clearL1Id("RL1");
    }

    @Test
    void updateKeepsL2WhenStillAtL2() {
        SnCode row = new SnCode();
        row.setSn("RL1");
        row.setL1Id("L1A");
        row.setL2Id("L2A");
        row.setStatus("l2");

        snWriter.update(row);

        verify(snMapper).updateById(row);
        verify(snMapper, never()).clearL2Id(anyString());
        verify(snMapper, never()).clearL1Id(anyString());
    }

    @Test
    void leftoverL2OnL1StockIsGhost() {
        SnCode row = new SnCode();
        row.setSn("RL1");
        row.setStatus("l1");
        row.setL2Id("L2A");
        assertThat(SnWriter.leftoverL2(row)).isTrue();
    }

    @Test
    void leftoverL2NotGhostWhenStatusL2() {
        SnCode row = new SnCode();
        row.setStatus("l2");
        row.setL2Id("L2A");
        assertThat(SnWriter.leftoverL2(row)).isFalse();
    }
}
