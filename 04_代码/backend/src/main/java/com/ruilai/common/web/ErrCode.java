package com.ruilai.common.web;

public enum ErrCode {
    OK(0, "成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "登录已过期,请重新登录"),
    FORBIDDEN(403, "没有权限访问"),
    NOT_FOUND(404, "资源不存在"),
    TOO_MANY_REQUESTS(429, "操作过于频繁,请稍后再试"),
    INTERNAL_ERROR(500, "服务器内部错误"),
    SMS_CODE_INVALID(1001, "验证码错误或已过期"),
    ACCOUNT_DISABLED(1002, "账号已停用,请联系平台"),
    ACCOUNT_NOT_FOUND(1003, "账号不存在"),
    BAD_PASSWORD(1004, "账号或密码错误"),
    STATE_CONFLICT(1101, "当前状态不允许该操作"),
    DUPLICATE(1102, "数据已存在");

    private final int code;
    private final String defaultMessage;

    ErrCode(int code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public int getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
