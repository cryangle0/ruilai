package com.ruilai.module.sn;

import com.ruilai.module.sn.entity.SnCode;

import java.time.LocalDateTime;

public final class BindTimes {

    private BindTimes() {
    }

    /** 激活区间统一：先 bindAt，没有再用 soldAt。 */
    public static LocalDateTime of(SnCode row) {
        if (row == null) {
            return null;
        }
        if (row.getBindAt() != null) {
            return row.getBindAt();
        }
        return row.getSoldAt();
    }
}
