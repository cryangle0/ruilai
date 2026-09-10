package com.ruilai.module.sn;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class SnFactoryDatesTest {

    @Test
    void readsFactoryDateFromCanonicalSnPrefix() {
        assertThat(SnFactoryDates.resolve("RL202609040001").toLocalDate())
                .isEqualTo(LocalDate.of(2026, 9, 4));
    }

    @Test
    void invalidSnFallsBackToCurrentDate() {
        assertThat(SnFactoryDates.resolve("RL202613990001").toLocalDate())
                .isEqualTo(LocalDate.now(com.ruilai.common.time.ChinaTime.ZONE));
    }

    @Test
    void prefixParserReturnsNullForInvalidDates() {
        assertThat(SnFactoryDates.fromSnPrefix("RL202613990001")).isNull();
        assertThat(SnFactoryDates.fromSnPrefix("BADCODE")).isNull();
        assertThat(SnFactoryDates.fromSnPrefix("RL202608010041").toLocalDate())
                .isEqualTo(LocalDate.of(2026, 8, 1));
    }

    @Test
    void displayDatePrefersSnPrefixOverStoredFactoryAt() {
        assertThat(SnFactoryDates.displayDate(
                "RL202608010041",
                java.time.LocalDateTime.of(2026, 9, 4, 18, 9, 9),
                null))
                .isEqualTo(LocalDate.of(2026, 8, 1));
    }
}
