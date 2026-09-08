package com.ruilai.module.sn;

public final class SnTags {

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
        return t;
    }

    public static String jsonContainsSql() {
        return "JSON_CONTAINS(tags, JSON_QUOTE({0}))";
    }
}
