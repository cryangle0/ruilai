package com.ruilai.common.thirdparty;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "ruilai")
public class ThirdPartyProperties {

    private final Geo geo = new Geo();
    private final Phone phone = new Phone();

    @Data
    public static class Geo {
        /** amap | tencent */
        private String provider = "amap";
        private String amapKey = "";
        private String tencentKey = "";
        /**
         * 无 Key 时允许客户端提示 IP 地区（小程序演示开关）。
         * 配了真实 Key 后默认忽略客户端提示。
         */
        private Boolean allowClientHint;
    }

    @Data
    public static class Phone {
        /** aliyun-market | offline */
        private String provider = "aliyun-market";
        private String appCode = "";
        private String appKey = "";
        private String appSecret = "";
        private String endpoint = "https://jisushouji.market.alicloudapi.com/shouji/query";
        private String param = "shouji";
    }

    public boolean geoConfigured() {
        if ("tencent".equalsIgnoreCase(geo.provider)) {
            return geo.tencentKey != null && !geo.tencentKey.isBlank();
        }
        return geo.amapKey != null && !geo.amapKey.isBlank();
    }

    public boolean phoneConfigured() {
        return (phone.appCode != null && !phone.appCode.isBlank())
                || (phone.appKey != null && !phone.appKey.isBlank());
    }

    public boolean allowClientHint() {
        if (geo.allowClientHint != null) {
            return geo.allowClientHint;
        }
        return !geoConfigured();
    }
}
