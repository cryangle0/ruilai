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
public class AmapGeoClient {

    private final RestClient thirdPartyRestClient;
    private final ThirdPartyProperties props;
    private final ObjectMapper objectMapper;

    public boolean enabled() {
        return StringUtils.hasText(props.getGeo().getAmapKey());
    }

    public Region locateIp(String ip) {
        if (!enabled() || !StringUtils.hasText(ip) || isPrivate(ip)) {
            return Region.empty("amap");
        }
        try {
            String body = thirdPartyRestClient.get()
                    .uri("https://restapi.amap.com/v3/ip?ip={ip}&key={key}", ip, props.getGeo().getAmapKey())
                    .retrieve()
                    .body(String.class);
            JsonNode n = objectMapper.readTree(body == null ? "{}" : body);
            if (!"1".equals(text(n, "status"))) {
                log.warn("amap ip fail info={}", text(n, "info"));
                return Region.empty("amap");
            }
            return Region.of(text(n, "province"), text(n, "city"), text(n, "adcode"), "amap-ip");
        } catch (Exception e) {
            log.warn("amap ip error ip={}", ip, e);
            return Region.empty("amap");
        }
    }

    public Region geocode(String address) {
        if (!enabled() || !StringUtils.hasText(address)) {
            return Region.empty("amap");
        }
        try {
            String body = thirdPartyRestClient.get()
                    .uri("https://restapi.amap.com/v3/geocode/geo?address={addr}&key={key}", address, props.getGeo().getAmapKey())
                    .retrieve()
                    .body(String.class);
            JsonNode n = objectMapper.readTree(body == null ? "{}" : body);
            JsonNode first = n.path("geocodes").path(0);
            if (first.isMissingNode()) {
                return Region.empty("amap");
            }
            return Region.of(text(first, "province"), text(first, "city"), text(first, "adcode"), "amap-geo");
        } catch (Exception e) {
            log.warn("amap geocode error", e);
            return Region.empty("amap");
        }
    }

    public Region regeo(double lng, double lat) {
        if (!enabled()) {
            return Region.empty("amap");
        }
        try {
            String loc = lng + "," + lat;
            String body = thirdPartyRestClient.get()
                    .uri("https://restapi.amap.com/v3/geocode/regeo?location={loc}&key={key}", loc, props.getGeo().getAmapKey())
                    .retrieve()
                    .body(String.class);
            JsonNode comp = objectMapper.readTree(body == null ? "{}" : body).path("regeocode").path("addressComponent");
            return Region.of(text(comp, "province"), text(comp, "city"), text(comp, "adcode"), "amap-regeo");
        } catch (Exception e) {
            log.warn("amap regeo error", e);
            return Region.empty("amap");
        }
    }

    static boolean isPrivate(String ip) {
        return ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")
                || ip.startsWith("172.") || "https://example.net/id/garnet".equals(ip) || "unknown".equalsIgnoreCase(ip);
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.path(field);
        if (v.isMissingNode() || v.isNull() || v.isArray() && v.isEmpty()) {
            return "";
        }
        String s = v.isArray() ? v.path(0).asText("") : v.asText("");
        return "[]".equals(s) ? "" : s;
    }
}
