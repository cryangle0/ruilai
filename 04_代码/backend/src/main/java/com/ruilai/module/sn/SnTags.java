package com.ruilai.module.sn;

import java.util.List;
import java.util.Set;

public final class SnTags {

    private static final Set<String> BUSINESS_TAGS = Set.of("已冻结", "已退货", "再入库", "再销售");

    private SnTags() {
    }

    public static String sanitize(String tag) {
        if (tag == null) {
            return "";
        }
        String t = tag.trim();
        if (t.isEmpty() || t.length() > 32) {
            return "";
        }
        if (!t.matches("[\\u4e00-\\u9fa5A-Za-z0-9_\\-]+")) {
            return "";
        }
        return BUSINESS_TAGS.contains(t) ? t : "";
    }

    public static List<String> visible(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        return tags.stream().filter(BUSINESS_TAGS::contains).distinct().toList();
    }

    public static String jsonContainsSql() {
        return "JSON_CONTAINS(tags, JSON_QUOTE({0}))";
    }
}
