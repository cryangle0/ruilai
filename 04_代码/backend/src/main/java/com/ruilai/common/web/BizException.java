package com.ruilai.common.web;

import lombok.Getter;

@Getter
public class BizException extends RuntimeException {

    private final ErrCode errCode;

    public BizException(ErrCode errCode, String message) {
        super(message);
        this.errCode = errCode;
    }

    public BizException(ErrCode errCode) {
        this(errCode, errCode.getDefaultMessage());
    }

    public static BizException state(String message) {
        return new BizException(ErrCode.STATE_CONFLICT, message);
    }
}
