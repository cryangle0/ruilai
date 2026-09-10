package com.ruilai.common.security;

import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import org.springframework.util.StringUtils;

public final class PasswordPolicy {
    public static final int MIN_LENGTH = 6;
    public static final String CREATE_MESSAGE = "登录密码至少 6 位";
    public static final String CHANGE_MESSAGE = "新密码至少 6 位";

    private PasswordPolicy() {
    }

    public static void requireNewAccountPassword(String password) {
        require(password, CREATE_MESSAGE);
    }

    public static void requireChangedPassword(String password) {
        require(password, CHANGE_MESSAGE);
    }

    private static void require(String password, String message) {
        if (!StringUtils.hasText(password) || password.length() < MIN_LENGTH) {
            throw new BizException(ErrCode.BAD_REQUEST, message);
        }
    }
}
