package com.ruilai.common.geo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AddressMatchTest {

    @Test
    void differentStreetNumbersAreNotTheSamePlace() {
        assertThat(AddressMatch.likelySame(
                "北京市北京市东城区人民路88号101",
                "北京市北京市东城区人民路2号101室")).isFalse();
    }

    @Test
    void sameStreetAddressWithNoiseStillMatches() {
        assertThat(AddressMatch.likelySame(
                "北京市东城区人民路88号101",
                "北京 市 东城 区 人民路88号 101室")).isTrue();
    }

    @Test
    void adminOnlyTextIsNotADuplicate() {
        assertThat(AddressMatch.likelySame("北京市东城区", "北京市西城区")).isFalse();
    }
}
