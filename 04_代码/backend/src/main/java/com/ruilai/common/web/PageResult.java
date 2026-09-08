package com.ruilai.common.web;

import com.baomidou.mybatisplus.core.metadata.IPage;

import java.util.List;

public record PageResult<T>(long total, List<T> list) {

    public static <T> PageResult<T> of(IPage<T> page) {
        return new PageResult<>(page.getTotal(), page.getRecords());
    }

    public static <T> PageResult<T> of(long total, List<T> list) {
        return new PageResult<>(total, list);
    }
}
