package com.ruilai.common.security;

import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthUtil {

    private AuthUtil() {
    }

    public static LoginUser current() {
        LoginUser user = currentOrNull();
        if (user == null) {
            throw new BizException(ErrCode.UNAUTHORIZED);
        }
        return user;
    }

    public static LoginUser currentOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof LoginUser user) {
            return user;
        }
        return null;
    }

    public static void requireAdmin() {
        if (!current().isAdmin()) {
            throw new BizException(ErrCode.FORBIDDEN, "仅平台管理员可操作");
        }
    }

    public static void requirePerm(String perm) {
        if (!current().hasPerm(perm)) {
            throw new BizException(ErrCode.FORBIDDEN, "没有权限执行该操作");
        }
    }

    /** 平台账号 + 指定模块权限（含 all） */
    public static void requireAdminPerm(String perm) {
        requireAdmin();
        requirePerm(perm);
    }
}
