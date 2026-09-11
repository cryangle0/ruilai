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
        /** amap | tencent — GPS / 地址正逆地理；IP 走 geo.ip 云市场 */
        private String provider = "amap";
        private String amapKey = "";
        private String tencentKey = "";
        /**
         * 无 Key 时允许客户端提示 IP 地区（小程序演示开关）。
         * 配了真实 Key 或云市场 IP 后默认忽略客户端提示。
         */
        private Boolean allowClientHint;
        private final MarketEndpoint ip = new MarketEndpoint();
    }

    @Data
    public static class Phone {
        /** cloud-market | aliyun-market | offline */
        private String provider = "auto";
        private String appCode = "";
        private String appKey = "";
        private String appSecret = "";
        private String endpoint = "https://jisushouji.market.alicloudapi.com/shouji/query";
        private String param = "shouji";
        private final MarketEndpoint market = new MarketEndpoint();
    }

    @Data
    public static class MarketEndpoint {
        private String secretId = "";
        private String secretKey = "";
        private String endpoint = "";
        private String param = "";
    }

    public boolean geoConfigured() {
        if ("tencent".equalsIgnoreCase(geo.provider)) {
            return hasText(geo.tencentKey);
        }
        return hasText(geo.amapKey);
    }

    public boolean ipMarketConfigured() {
        return configured(geo.ip);
    }

    public boolean phoneMarketConfigured() {
        return configured(phone.market);
    }

    public boolean phoneAliyunConfigured() {
        return hasText(phone.appCode) || hasText(phone.appKey);
    }

    public boolean phoneConfigured() {
        return phoneMarketConfigured() || phoneAliyunConfigured();
    }

    public boolean allowClientHint() {
        if (geo.allowClientHint != null) {
            return geo.allowClientHint;
        }
        return !geoConfigured() && !ipMarketConfigured();
    }

    private static boolean configured(MarketEndpoint endpoint) {
        return endpoint != null && hasText(endpoint.secretId) && hasText(endpoint.secretKey)
                && hasText(endpoint.endpoint);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
