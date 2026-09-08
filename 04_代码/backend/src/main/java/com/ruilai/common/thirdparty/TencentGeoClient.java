package com.ruilai.common.thirdparty;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class TencentGeoClient {

    private final RestClient thirdPartyRestClient;
    private final ThirdPartyProperties props;
    private final ObjectMapper objectMapper;

    public boolean enabled() {
        return StringUtils.hasText(props.getGeo().getTencentKey());
    }

    public Region locateIp(String ip) {
        if (!enabled() || !StringUtils.hasText(ip) || AmapGeoClient.isPrivate(ip)) {
            return Region.empty("tencent");
        }
        try {
            String body = thirdPartyRestClient.get()
                    .uri("https://apis.map.qq.com/ws/location/v1/ip?ip={ip}&key={key}", ip, props.getGeo().getTencentKey())
                    .retrieve()
                    .body(String.class);
            JsonNode n = objectMapper.readTree(body == null ? "{}" : body);
            if (n.path("status").asInt(-1) != 0) {
                log.warn("tencent ip fail {}", n.path("message").asText());
                return Region.empty("tencent");
            }
            JsonNode ad = n.path("result").path("ad_info");
            return Region.of(text(ad, "province"), text(ad, "city"), text(ad, "adcode"), "tencent-ip");
        } catch (Exception e) {
            log.warn("tencent ip error ip={}", ip, e);
            return Region.empty("tencent");
        }
    }

    public Region geocode(String address) {
        if (!enabled() || !StringUtils.hasText(address)) {
            return Region.empty("tencent");
        }
        try {
            String body = thirdPartyRestClient.get()
                    .uri("https://apis.map.qq.com/ws/geocoder/v1/?address={addr}&key={key}", address, props.getGeo().getTencentKey())
                    .retrieve()
                    .body(String.class);
            JsonNode ad = objectMapper.readTree(body == null ? "{}" : body).path("result").path("address_components");
            return Region.of(text(ad, "province"), text(ad, "city"), "", "tencent-geo");
        } catch (Exception e) {
            log.warn("tencent geocode error", e);
            return Region.empty("tencent");
        }
    }

    public Region regeo(double lng, double lat) {
        if (!enabled()) {
            return Region.empty("tencent");
        }
        try {
            String loc = lat + "," + lng;
            String body = thirdPartyRestClient.get()
                    .uri("https://apis.map.qq.com/ws/geocoder/v1/?location={loc}&key={key}", loc, props.getGeo().getTencentKey())
                    .retrieve()
                    .body(String.class);
            JsonNode ad = objectMapper.readTree(body == null ? "{}" : body).path("result").path("address_component");
            return Region.of(text(ad, "province"), text(ad, "city"), "", "tencent-regeo");
        } catch (Exception e) {
            log.warn("tencent regeo error", e);
            return Region.empty("tencent");
        }
    }

    private static String text(JsonNode n, String field) {
        String s = n.path(field).asText("");
        return s == null || "[]".equals(s) ? "" : s;
    }
}
