package com.ruilai.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    public record LoginReq(
            @NotBlank String username,
            @NotBlank @Size(min = 4, max = 64) String password,
            String client
    ) {}

    public record SmsCodeReq(@NotBlank String phone) {}

    public record SmsLoginReq(
            @NotBlank String phone,
            @NotBlank String code,
            String client
    ) {}

    public record LoginUserView(
            Long accountId,
            String username,
            String name,
            String roleCode,
            String agentId,
            String phone,
            java.util.Set<String> permissions
    ) {}

    public record LoginResp(String token, LoginUserView user) {}

    public record ProfileReq(String name, String phone, String password) {}
}
