package com.ruilai.module.sn;

import com.ruilai.common.time.ChinaTime;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** SN 的 RLyyyyMMdd 前缀是原型中唯一明确的出厂日期来源。 */
public final class SnFactoryDates {

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;

    private SnFactoryDates() {
    }

    public static LocalDateTime resolve(String sn) {
        if (sn != null && sn.matches("(?i)^RL\\d{8}.*$")) {
            try {
                return LocalDate.parse(sn.substring(2, 10), BASIC).atStartOfDay();
            } catch (DateTimeException ignored) {
                // 非法日期回退到首次入码库时间。
            }
        }
        return ChinaTime.now();
    }
}
