package com.ruilai.common.thirdparty;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

/**
 * 腾讯云云市场 API 网关 V2 签名。
 * 签名串为 {@code x-date: <GMT>}，Authorization 为 JSON（与商品页 curl 一致）。
 */
public final class CloudMarketSigner {

    static final DateTimeFormatter GMT = DateTimeFormatter
            .ofPattern("EEE, dd MMM yyyy HH:mm:ss 'GMT'", Locale.US)
            .withZone(ZoneOffset.UTC);

    private CloudMarketSigner() {
    }

    public static String gmt(Instant now) {
        return GMT.format(now);
    }

    public static String hmacSha1Base64(String secretKey, String signStr) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(signStr.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("cloud market hmac", e);
        }
    }

    public static String authorization(String secretId, String secretKey, Instant now) {
        String dateTime = gmt(now);
        String signature = hmacSha1Base64(secretKey, "x-date: " + dateTime);
        return "{\"id\": \"" + secretId + "\", \"x-date\": \"" + dateTime + "\" , \"signature\": \"" + signature + "\"}";
    }

    public static String requestId() {
        return UUID.randomUUID().toString();
    }
}
