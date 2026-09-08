package com.ruilai.module.auth;

import com.ruilai.common.web.R;
import com.ruilai.module.auth.dto.AuthDtos.LoginReq;
import com.ruilai.module.auth.dto.AuthDtos.LoginResp;
import com.ruilai.module.auth.dto.AuthDtos.LoginUserView;
import com.ruilai.module.auth.dto.AuthDtos.ProfileReq;
import com.ruilai.module.auth.dto.AuthDtos.SmsCodeReq;
import com.ruilai.module.auth.dto.AuthDtos.SmsLoginReq;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public R<LoginResp> login(@Valid @RequestBody LoginReq req) {
        return R.ok(authService.loginByPassword(req.username(), req.password(), req.client()));
    }

    @PostMapping("/sms-code")
    public R<Map<String, String>> smsCode(@Valid @RequestBody SmsCodeReq req) {
        String echo = authService.sendSmsCode(req.phone());
        return R.ok(echo == null ? Map.of() : Map.of("devCode", echo));
    }

    @PostMapping("/sms-login")
    public R<LoginResp> smsLogin(@Valid @RequestBody SmsLoginReq req) {
        return R.ok(authService.loginBySms(req.phone(), req.code(), req.client()));
    }

    @PostMapping("/logout")
    public R<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(authorization);
        return R.ok();
    }

    @GetMapping("/me")
    public R<LoginUserView> me() {
        return R.ok(authService.me());
    }

    @PostMapping("/profile")
    public R<LoginUserView> profile(@RequestBody ProfileReq req,
                                    @RequestHeader(value = "Authorization", required = false) String authorization) {
        return R.ok(authService.updateProfile(req, authorization));
    }
}
