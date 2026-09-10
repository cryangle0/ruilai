package com.ruilai.module.sn;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SnTagsTest {

    @Test
    void acceptsKnownTags() {
        assertThat(SnTags.sanitize("已冻结")).isEqualTo("已冻结");
        assertThat(SnTags.sanitize("已退货")).isEqualTo("已退货");
        assertThat(SnTags.sanitize("再入库")).isEqualTo("再入库");
        assertThat(SnTags.sanitize("个性化")).isEmpty();
        assertThat(SnTags.sanitize("修理过")).isEmpty();
        assertThat(SnTags.visible(java.util.List.of("已退货", "个性化", "修理过", "再入库")))
                .containsExactly("已退货", "再入库");
    }

    @Test
    void rejectsInjectionLikeInput() {
        assertThat(SnTags.sanitize("已冻结' OR 1=1 --")).isEmpty();
        assertThat(SnTags.sanitize("%")).isEmpty();
        assertThat(SnTags.sanitize("")).isEmpty();
        assertThat(SnTags.sanitize(null)).isEmpty();
    }

    @Test
    void jsonContainsUsesQuotedPlaceholder() {
        assertThat(SnTags.jsonContainsSql()).contains("JSON_CONTAINS");
        assertThat(SnTags.jsonContainsSql()).contains("JSON_QUOTE({0})");
    }
}
