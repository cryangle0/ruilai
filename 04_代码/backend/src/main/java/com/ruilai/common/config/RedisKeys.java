package com.ruilai.common.config;

public final class RedisKeys {

    private RedisKeys() {
    }

    public static String token(String jti) {
        return "rl:token:" + jti;
    }

    public static String accountSessions(long accountId) {
        return "rl:acct:" + accountId + ":sessions";
    }

    public static String smsCode(String phone) {
        return "rl:sms:code:" + phone;
    }

    public static String smsLimit(String phone) {
        return "rl:sms:limit:" + phone;
    }

    public static String smsIpLimit(String ip) {
        return "rl:smsiplimit:" + ip;
    }

    public static String orderNo(String prefix, String yyyyMMdd) {
        return "rl:no:" + prefix + ":" + yyyyMMdd;
    }

    public static String geoIp(String ip) {
        return "rl:geo:ip:" + ip;
    }

    public static String geoPhone(String phone) {
        return "rl:geo:phone:" + phone;
    }

    public static String geoAddr(String hash) {
        return "rl:geo:addr:" + hash;
    }
}
