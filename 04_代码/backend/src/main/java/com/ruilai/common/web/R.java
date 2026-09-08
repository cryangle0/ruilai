package com.ruilai.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record R<T>(int code, String message, T data) {

    public static <T> R<T> ok(T data) {
        return new R<>(ErrCode.OK.getCode(), "ok", data);
    }

    public static R<Void> ok() {
        return ok(null);
    }

    public static <T> R<T> fail(ErrCode errCode, String message) {
        return new R<>(errCode.getCode(), message, null);
    }
}
