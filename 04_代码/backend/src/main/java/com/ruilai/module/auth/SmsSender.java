package com.ruilai.module.auth;

public interface SmsSender {
    void send(String phone, String code);
}
