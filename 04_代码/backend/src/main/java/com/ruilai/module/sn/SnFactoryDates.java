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
        LocalDateTime fromSn = fromSnPrefix(sn);
        return fromSn != null ? fromSn : ChinaTime.now();
    }

    /** 合法 RLyyyyMMdd 前缀才返回日期，否则 null（展示层用来补历史空值，不写库）。 */
    public static LocalDateTime fromSnPrefix(String sn) {
        if (sn != null && sn.matches("(?i)^RL\\d{8}.*$")) {
            try {
                return LocalDate.parse(sn.substring(2, 10), BASIC).atStartOfDay();
            } catch (DateTimeException ignored) {
                return null;
            }
        }
        return null;
    }

    /** 与列表筛选一致：优先 SN 前缀日期，没有合法前缀再看入库时间。 */
    public static LocalDate displayDate(String sn, LocalDateTime factoryAt, LocalDateTime createdAt) {
        LocalDateTime fromSn = fromSnPrefix(sn);
        if (fromSn != null) {
            return fromSn.toLocalDate();
        }
        if (factoryAt != null) {
            return factoryAt.toLocalDate();
        }
        if (createdAt != null) {
            return createdAt.toLocalDate();
        }
        return null;
    }

    /**
     * 列表出厂日期筛选表达式。优先 RLyyyyMMdd，非法前缀才用 factory_at / created_at。
     */
    public static final String SQL_FACTORY_DAY =
            "CASE WHEN sn REGEXP '^[Rr][Ll][0-9]{8}' AND STR_TO_DATE(SUBSTRING(sn, 3, 8), '%Y%m%d') IS NOT NULL "
                    + "THEN STR_TO_DATE(SUBSTRING(sn, 3, 8), '%Y%m%d') "
                    + "ELSE DATE(COALESCE(factory_at, created_at)) END";
}
