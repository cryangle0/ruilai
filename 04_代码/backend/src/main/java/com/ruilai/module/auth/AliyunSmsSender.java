package com.ruilai.module.auth;

import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.dysmsapi20170525.models.SendSmsResponse;
import com.aliyun.teaopenapi.models.Config;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "ruilai.sms.mock", havingValue = "false")
public class AliyunSmsSender implements SmsSender {

    private final String accessKeyId;
    private final String accessKeySecret;
    private final String signName;
    private final String templateCode;
    private final String endpoint;
    private volatile Client client;

    public AliyunSmsSender(@Value("${ruilai.sms.access-key-id:}") String accessKeyId,
                           @Value("${ruilai.sms.access-key-secret:}") String accessKeySecret,
                           @Value("${ruilai.sms.sign-name:}") String signName,
                           @Value("${ruilai.sms.template-code:}") String templateCode,
                           @Value("${ruilai.sms.endpoint:dysmsapi.aliyuncs.com}") String endpoint) {
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.signName = signName;
        this.templateCode = templateCode;
        this.endpoint = endpoint;
    }

    @Override
    public void send(String phone, String code) {
        try {
            SendSmsResponse resp = client().sendSms(new SendSmsRequest()
                    .setPhoneNumbers(phone)
                    .setSignName(signName)
                    .setTemplateCode(templateCode)
                    .setTemplateParam("{\"code\":\"" + code + "\"}"));
            String bizCode = resp.getBody() == null ? null : resp.getBody().getCode();
            if (!"OK".equals(bizCode)) {
                String reason = resp.getBody() == null ? "空响应" : resp.getBody().getMessage();
                log.error("短信发送失败 phone={} code={} reason={}", phone, bizCode, reason);
                throw new BizException(ErrCode.INTERNAL_ERROR, "短信发送失败:" + reason);
            }
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            log.error("短信发送异常 phone={}", phone, e);
            throw new BizException(ErrCode.INTERNAL_ERROR, "短信服务暂不可用");
        }
    }

    private Client client() {
        if (client != null) {
            return client;
        }
        synchronized (this) {
            if (client == null) {
                if (isBlank(accessKeyId) || isBlank(accessKeySecret)) {
                    throw new BizException(ErrCode.INTERNAL_ERROR, "短信未配置访问密钥");
                }
                try {
                    Config config = new Config()
                            .setAccessKeyId(accessKeyId)
                            .setAccessKeySecret(accessKeySecret);
                    config.endpoint = endpoint;
                    client = new Client(config);
                } catch (Exception e) {
                    throw new IllegalStateException("短信客户端初始化失败", e);
                }
            }
            return client;
        }
    }

    private static boolean isBlank(String v) {
        return v == null || v.isBlank();
    }
}
