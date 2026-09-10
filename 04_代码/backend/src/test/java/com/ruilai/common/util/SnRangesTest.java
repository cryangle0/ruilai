package com.ruilai.common.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SnRangesTest {

    @Test
    void expandsCanonicalSnRangeAndRejectsBareCounters() {
        assertThat(SnRanges.expand("RL202608010001-RL202608010010")).hasSize(10);
        assertThat(SnRanges.expand("1-10")).isEmpty();
    }
}
