package com.ruilai.common.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginUser {

    private Long accountId;
    /** ADMIN / L1 / L2 / SUB */
    private String roleCode;
    private String username;
    private String name;
    private String agentId;
    private Set<String> permissions;
    private String client;
    private String loginAt;

    @JsonIgnore
    public boolean isAdmin() {
        return "ADMIN".equals(roleCode);
    }

    @JsonIgnore
    public boolean hasPerm(String perm) {
        if (perm == null || perm.isBlank()) {
            return true;
        }
        if (permissions == null || permissions.isEmpty()) {
            return false;
        }
        return permissions.contains("all") || permissions.contains(perm);
    }
}
