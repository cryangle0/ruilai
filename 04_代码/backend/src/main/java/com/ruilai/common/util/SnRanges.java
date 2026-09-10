package com.ruilai.common.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 解析原型同款 SN 号段：RL202608010001-RL202608010010 */
public final class SnRanges {

    private static final Pattern ONE = Pattern.compile("^(RL\\d+)(?:\\s*[-~—]\\s*(RL\\d+))?$", Pattern.CASE_INSENSITIVE);

    private SnRanges() {
    }

    public static List<String> expand(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        Set<String> out = new LinkedHashSet<>();
        for (String part : text.split("[,;，；\\n]+")) {
            out.addAll(expandOne(part.trim()));
        }
        return new ArrayList<>(out);
    }

    public static List<String> expandOne(String seg) {
        try {
            return expandOneStrict(seg);
        } catch (IllegalArgumentException ignored) {
            return List.of();
        }
    }

    public static List<String> expandOneStrict(String seg) {
        if (seg == null || seg.isBlank()) {
            throw new IllegalArgumentException("号段不能为空");
        }
        Matcher m = ONE.matcher(seg.trim());
        if (!m.matches()) {
            throw new IllegalArgumentException("号段格式无效");
        }
        String start = m.group(1).toUpperCase(Locale.ROOT);
        String end = (m.group(2) == null ? m.group(1) : m.group(2)).toUpperCase(Locale.ROOT);
        if (start.length() < 5 || end.length() < 5) {
            throw new IllegalArgumentException("号段格式无效");
        }
        String pref = start.substring(0, start.length() - 4);
        if (!end.startsWith(pref) || end.length() != start.length()) {
            throw new IllegalArgumentException("号段起止前缀不一致");
        }
        int sNum;
        int eNum;
        try {
            sNum = Integer.parseInt(start.substring(start.length() - 4));
            eNum = Integer.parseInt(end.substring(end.length() - 4));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("号段格式无效", e);
        }
        if (eNum < sNum) {
            throw new IllegalArgumentException("号段不能倒序");
        }
        if (eNum - sNum > 5000) {
            throw new IllegalArgumentException("单个号段不能超过 5001 个 SN");
        }
        List<String> list = new ArrayList<>(eNum - sNum + 1);
        for (int i = sNum; i <= eNum; i++) {
            list.add(pref + String.format("%04d", i));
        }
        return list;
    }
}
