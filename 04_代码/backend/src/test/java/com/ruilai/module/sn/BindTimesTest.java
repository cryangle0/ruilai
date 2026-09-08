package com.ruilai.module.sn;

import com.ruilai.module.sn.entity.SnCode;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BindTimesTest {

    @Test
    void prefersBindAtForActivationWindow() {
        SnCode row = new SnCode();
        row.setBindAt(LocalDateTime.of(2026, 9, 1, 10, 0));
        row.setSoldAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        assertThat(BindTimes.of(row)).isEqualTo(row.getBindAt());
    }

    @Test
    void fallsBackToSoldAtWhenNotBoundYet() {
        SnCode row = new SnCode();
        row.setSoldAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        assertThat(BindTimes.of(row)).isEqualTo(row.getSoldAt());
    }

    @Test
    void nullSafe() {
        assertThat(BindTimes.of(null)).isNull();
        assertThat(BindTimes.of(new SnCode())).isNull();
    }
}
