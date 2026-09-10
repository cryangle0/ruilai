package com.ruilai.common.web;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public final class QueryValues {
    private QueryValues() {}

    public static String decode(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        String out = raw.trim();
        for (int i = 0; i < 2; i++) {
            int pct = out.indexOf('%');
            if (pct < 0 || pct + 2 >= out.length()) {
                break;
            }
            try {
                String next = URLDecoder.decode(out, StandardCharsets.UTF_8);
                if (next.equals(out)) {
                    break;
                }
                out = next;
            } catch (IllegalArgumentException ignored) {
                break;
            }
        }
        return out;
    }
}
