package com.ruilai.common.geo;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 激活地址去重：对齐原型 addressesLikelySame，并在路号不同时直接判否。 */
public final class AddressMatch {

    private static final Map<Character, Character> CN_NUM = Map.ofEntries(
            Map.entry('零', '0'), Map.entry('〇', '0'), Map.entry('一', '1'),
            Map.entry('二', '2'), Map.entry('两', '2'), Map.entry('三', '3'),
            Map.entry('四', '4'), Map.entry('五', '5'), Map.entry('六', '6'),
            Map.entry('七', '7'), Map.entry('八', '8'), Map.entry('九', '9'));
    private static final Pattern ROAD_NO = Pattern.compile("([\\u4e00-\\u9fa5]{1,12}[路街巷弄里])(\\d+)号");
    private static final Pattern STREET_MARK = Pattern.compile("[路街巷弄里号栋幢楼室]");

    private AddressMatch() {
    }

    public static String foldCnDigits(String raw) {
        String s = raw == null ? "" : raw;
        Matcher tens = Pattern.compile("([一二两三四五六七八九])十([一二三四五六七八九])").matcher(s);
        StringBuffer buf = new StringBuffer();
        while (tens.find()) {
            char a = CN_NUM.getOrDefault(tens.group(1).charAt(0), '1');
            char b = CN_NUM.getOrDefault(tens.group(2).charAt(0), '0');
            tens.appendReplacement(buf, Matcher.quoteReplacement("" + a + b));
        }
        tens.appendTail(buf);
        s = buf.toString();
        s = replaceMapped(s, "([一二两三四五六七八九])十", 1, "0");
        s = replaceMapped(s, "十([一二三四五六七八九])", 1, "1", true);
        s = s.replace("十", "10");
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            out.append(CN_NUM.getOrDefault(ch, ch));
        }
        return out.toString();
    }

    public static String stripAddrNoise(String raw) {
        return foldCnDigits(raw)
                .replaceAll("[\\s\\u3000,，.。、;；#＃\\-—_/\\\\()（）\\[\\]【】]+", "")
                .replace("中国", "");
    }

    public static String stripAdminUnits(String raw) {
        return String.valueOf(raw == null ? "" : raw)
                .replaceAll("维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区|地区|自治州", "")
                .replaceAll("省|市|区|县|旗|盟|镇|乡|村|街道", "");
    }

    public static boolean hasStreet(String raw) {
        return STREET_MARK.matcher(raw == null ? "" : raw).find();
    }

    public static String normalizeCore(String raw) {
        return stripAdminUnits(stripAddrNoise(raw));
    }

    public static boolean likelySame(String a, String b) {
        String na = normalizeCore(a);
        String nb = normalizeCore(b);
        if (na.length() < 4 || nb.length() < 4) {
            return false;
        }
        if (na.equals(nb)) {
            return hasStreet(na);
        }
        if (!hasStreet(na) || !hasStreet(nb)) {
            return false;
        }
        String ra = roadNumber(na);
        String rb = roadNumber(nb);
        if (ra != null && rb != null && !ra.equals(rb)) {
            return false;
        }
        String shorter = na.length() <= nb.length() ? na : nb;
        String longer = na.length() <= nb.length() ? nb : na;
        if (longer.contains(shorter) && shorter.length() >= 8) {
            return true;
        }
        List<String> ga = charGrams(na);
        List<String> gb = charGrams(nb);
        if (ga.isEmpty() || gb.isEmpty()) {
            return false;
        }
        Set<String> setB = new HashSet<>(gb);
        int inter = 0;
        for (String g : ga) {
            if (setB.contains(g)) {
                inter++;
            }
        }
        Set<String> union = new HashSet<>(ga);
        union.addAll(gb);
        return !union.isEmpty() && (double) inter / union.size() >= 0.72;
    }

    static String roadNumber(String core) {
        Matcher m = ROAD_NO.matcher(core == null ? "" : core);
        if (!m.find()) {
            return null;
        }
        return m.group(1) + "|" + m.group(2);
    }

    private static List<String> charGrams(String s) {
        List<String> g = new ArrayList<>();
        for (int i = 0; i < s.length() - 1; i++) {
            g.add(s.substring(i, i + 2));
        }
        return g;
    }

    private static String replaceMapped(String s, String regex, int group, String pad) {
        return replaceMapped(s, regex, group, pad, false);
    }

    private static String replaceMapped(String s, String regex, int group, String pad, boolean padFirst) {
        Matcher m = Pattern.compile(regex).matcher(s);
        StringBuffer buf = new StringBuffer();
        while (m.find()) {
            char mapped = CN_NUM.getOrDefault(m.group(group).charAt(0), '1');
            String repl = padFirst ? pad + mapped : mapped + pad;
            m.appendReplacement(buf, Matcher.quoteReplacement(repl));
        }
        m.appendTail(buf);
        return buf.toString();
    }
}
