package com.ruilai.module.trade;

import org.springframework.util.StringUtils;

public final class ReturnApprovers {

    private ReturnApprovers() {
    }

    public static String resolveUser(String current, String role, String agentId, String l2ParentId, String snL1Id) {
        if (StringUtils.hasText(current)) {
            return current;
        }
        if ("L2".equals(role) && StringUtils.hasText(l2ParentId)) {
            return l2ParentId;
        }
        if ("L1".equals(role) && StringUtils.hasText(agentId)) {
            return agentId;
        }
        return StringUtils.hasText(snL1Id) ? snL1Id : current;
    }
}
