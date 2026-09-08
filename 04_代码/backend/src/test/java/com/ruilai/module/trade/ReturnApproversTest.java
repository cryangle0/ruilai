package com.ruilai.module.trade;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReturnApproversTest {

    @Test
    void keepsExisting() {
        assertThat(ReturnApprovers.resolveUser("L1A", "L2", "L2A", "L1A", "L1B")).isEqualTo("L1A");
    }

    @Test
    void l2UsesParent() {
        assertThat(ReturnApprovers.resolveUser(null, "L2", "L2A", "L1A", "L1B")).isEqualTo("L1A");
    }

    @Test
    void l1UsesSelf() {
        assertThat(ReturnApprovers.resolveUser("", "L1", "L1A", null, "L1B")).isEqualTo("L1A");
    }

    @Test
    void adminFallsBackToSnL1() {
        assertThat(ReturnApprovers.resolveUser(null, "ADMIN", "admin", null, "L1A")).isEqualTo("L1A");
    }
}
