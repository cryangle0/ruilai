package com.ruilai.common.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;

public final class DataScope {

    private DataScope() {
    }

    public static LoginUser user() {
        return AuthUtil.current();
    }

    public static boolean isAdmin() {
        return user().isAdmin();
    }

    public static String requireL1Id() {
        LoginUser u = user();
        if (u.isAdmin()) {
            return null;
        }
        if ("L1".equals(u.getRoleCode()) || "SUB".equals(u.getRoleCode())) {
            return u.getAgentId();
        }
        throw new BizException(ErrCode.FORBIDDEN);
    }

    public static String agentIdOrNull() {
        LoginUser u = user();
        return u.isAdmin() ? null : u.getAgentId();
    }

    public static <T> void applyL1(LambdaQueryWrapper<T> q, com.baomidou.mybatisplus.core.toolkit.support.SFunction<T, ?> getter) {
        LoginUser u = user();
        if (!u.isAdmin() && u.getAgentId() != null && ("L1".equals(u.getRoleCode()) || "SUB".equals(u.getRoleCode()))) {
            q.eq(getter, u.getAgentId());
        }
        if ("L2".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "二级账号无此列表权限");
        }
    }
}
