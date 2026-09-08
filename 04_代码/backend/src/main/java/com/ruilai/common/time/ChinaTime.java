package com.ruilai.common.time;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.TimeZone;

/** 业务墙钟统一中国时区，避免 JVM 默认 UTC 把「今天/本月」算成前一天。 */
public final class ChinaTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private ChinaTime() {
    }

    public static void applyJvmDefault() {
        TimeZone.setDefault(TimeZone.getTimeZone(ZONE));
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }
}
