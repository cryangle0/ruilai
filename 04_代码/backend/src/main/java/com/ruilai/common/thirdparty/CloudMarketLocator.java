package com.ruilai.common.thirdparty;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class CloudMarketLocator {

    private final RestClient thirdPartyRestClient;
    private final ThirdPartyProperties props;
    private final ObjectMapper objectMapper;

    public boolean ipEnabled() {
        return props.ipMarketConfigured();
    }

    public boolean phoneEnabled() {
        return props.phoneMarketConfigured();
    }

    public Region locateIp(String ip) {
        ThirdPartyProperties.MarketEndpoint cfg = props.getGeo().getIp();
        if (!ipEnabled() || !StringUtils.hasText(ip) || AmapGeoClient.isPrivate(ip)) {
            return Region.empty("cloud-market-ip");
        }
        JsonNode root = get(cfg.getSecretId(), cfg.getSecretKey(), cfg.getEndpoint(),
                blankTo(cfg.getParam(), "ip"), ip);
        return parseIp(root);
    }

    public Region locatePhone(String phone) {
        ThirdPartyProperties.MarketEndpoint cfg = props.getPhone().getMarket();
        if (!phoneEnabled() || !StringUtils.hasText(phone) || phone.length() < 7) {
            return Region.empty("cloud-market-phone");
        }
        JsonNode root = get(cfg.getSecretId(), cfg.getSecretKey(), cfg.getEndpoint(),
                blankTo(cfg.getParam(), "mobile"), phone);
        return parsePhone(root);
    }

    static Region parseIp(JsonNode root) {
        if (root == null || root.path("code").asInt(-1) != 200) {
            return Region.empty("cloud-market-ip");
        }
        JsonNode data = object(root, "data", "result");
        return Region.of(firstText(data, "province", "prov"), firstText(data, "city"),
                firstText(data, "area_code", "adcode"), "cloud-market-ip");
    }

    static Region parsePhone(JsonNode root) {
        if (root == null || root.path("code").asInt(-1) != 200) {
            return Region.empty("cloud-market-phone");
        }
        JsonNode data = object(root, "data", "result");
        return Region.of(firstText(data, "prov", "province"), firstText(data, "city"),
                firstText(data, "area_code", "adcode"), "cloud-market-phone");
    }

    private JsonNode get(String secretId, String secretKey, String endpoint, String param, String value) {
        try {
            String url = UriComponentsBuilder.fromUriString(endpoint)
                    .queryParam(param, value)
                    .build(true)
                    .toUriString();
            String body = thirdPartyRestClient.get()
                    .uri(url)
                    .header("Authorization", CloudMarketSigner.authorization(secretId, secretKey, Instant.now()))
                    .header("request-id", CloudMarketSigner.requestId())
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .retrieve()
                    .body(String.class);
            JsonNode n = objectMapper.readTree(body == null ? "{}" : body);
            if (n.path("code").asInt(-1) != 200) {
                log.warn("cloud market fail url={} code={} msg={}", endpoint,
                        n.path("code").asText(), firstText(n, "msg", "message"));
            }
            return n;
        } catch (Exception e) {
            log.warn("cloud market error endpoint={} param={}", endpoint, param, e);
            return objectMapper.createObjectNode();
        }
    }

    private static JsonNode object(JsonNode n, String... fields) {
        for (String f : fields) {
            JsonNode c = n.path(f);
            if (c.isObject() && !c.isEmpty()) {
                return c;
            }
        }
        return n;
    }

    private static String firstText(JsonNode n, String... fields) {
        for (String f : fields) {
            String s = n.path(f).asText("");
            if (StringUtils.hasText(s) && !"[]".equals(s)) {
                return s;
            }
        }
        return "";
    }

    private static String blankTo(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
