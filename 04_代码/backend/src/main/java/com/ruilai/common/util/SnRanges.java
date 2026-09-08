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
            List<String> one = expandOne(part.trim());
            if (one != null) {
                out.addAll(one);
            }
        }
        return new ArrayList<>(out);
    }

    public static List<String> expandOne(String seg) {
        if (seg == null || seg.isBlank()) {
            return null;
        }
        Matcher m = ONE.matcher(seg.trim());
        if (!m.matches()) {
            return null;
        }
        String start = m.group(1).toUpperCase(Locale.ROOT);
        String end = (m.group(2) == null ? m.group(1) : m.group(2)).toUpperCase(Locale.ROOT);
        if (start.length() < 5 || end.length() < 5) {
            return null;
        }
        String pref = start.substring(0, start.length() - 4);
        if (!end.startsWith(pref)) {
            return null;
        }
        int sNum;
        int eNum;
        try {
            sNum = Integer.parseInt(start.substring(start.length() - 4));
            eNum = Integer.parseInt(end.substring(end.length() - 4));
        } catch (NumberFormatException e) {
            return null;
        }
        if (eNum < sNum || eNum - sNum > 5000) {
            return null;
        }
        List<String> list = new ArrayList<>(eNum - sNum + 1);
        for (int i = sNum; i <= eNum; i++) {
            list.add(pref + String.format("%04d", i));
        }
        return list;
    }
}
