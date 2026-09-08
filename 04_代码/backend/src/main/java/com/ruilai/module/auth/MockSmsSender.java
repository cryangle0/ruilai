package com.ruilai.module.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "ruilai.sms.mock", havingValue = "true", matchIfMissing = true)
public class MockSmsSender implements SmsSender {

    @Override
    public void send(String phone, String code) {
        log.info("[SMS mock] phone={} code={}", phone, code);
    }
}
