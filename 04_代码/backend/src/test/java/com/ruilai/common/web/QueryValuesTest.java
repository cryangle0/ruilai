package com.ruilai.common.web;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QueryValuesTest {

    @Test
    void decodesBeltOnceOrTwiceWithoutTouchingPlainText() {
        assertThat(QueryValues.decode("腰带M")).isEqualTo("腰带M");
        assertThat(QueryValues.decode("%E8%85%B0%E5%B8%A6M")).isEqualTo("腰带M");
        assertThat(QueryValues.decode("%25E8%2585%25B0%25E5%25B8%25A6M")).isEqualTo("腰带M");
        assertThat(QueryValues.decode(null)).isNull();
        assertThat(QueryValues.decode("")).isEqualTo("");
    }
}
