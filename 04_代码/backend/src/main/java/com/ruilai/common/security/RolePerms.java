package com.ruilai.common.security;

import java.util.Set;

public final class RolePerms {

    public static final String ALL = "all";
    public static final String R1 = "R1";
    public static final String R2 = "R2";
    public static final String R3 = "R3";
    public static final String R4 = "R4";
    public static final String R5 = "R5";

    public static final Set<String> AGENT_ROLE_IDS = Set.of(R2, R3, R4);

    private RolePerms() {
    }

    public static String defaultRoleId(String roleCode) {
        if (roleCode == null) {
            return null;
        }
        return switch (roleCode) {
            case "ADMIN" -> R1;
            case "L1" -> R2;
            case "SUB" -> R3;
            case "L2" -> R4;
            default -> null;
        };
    }

    public static boolean isAgentRole(String roleId) {
        return roleId != null && AGENT_ROLE_IDS.contains(roleId);
    }
}
