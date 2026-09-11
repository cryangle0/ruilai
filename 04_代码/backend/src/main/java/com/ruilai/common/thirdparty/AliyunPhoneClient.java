package com.ruilai.common.thirdparty;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class AliyunPhoneClient {

    private final RestClient thirdPartyRestClient;
    private final ThirdPartyProperties props;
    private final ObjectMapper objectMapper;

    public boolean enabled() {
        return props.phoneAliyunConfigured();
    }

    public Region locate(String phone) {
        if (!enabled() || !StringUtils.hasText(phone) || phone.length() < 7) {
            return Region.empty("aliyun");
        }
        try {
            String endpoint = props.getPhone().getEndpoint();
            String param = props.getPhone().getParam();
            String url = UriComponentsBuilder.fromUriString(endpoint)
                    .queryParam(param, phone)
                    .build(true)
                    .toUriString();
            var spec = thirdPartyRestClient.get().uri(url);
            if (StringUtils.hasText(props.getPhone().getAppCode())) {
                spec = spec.header("Authorization", "APPCODE " + props.getPhone().getAppCode());
            }
            if (StringUtils.hasText(props.getPhone().getAppKey())) {
                spec = spec.header("X-Ca-Key", props.getPhone().getAppKey());
            }
            String body = spec.retrieve().body(String.class);
            JsonNode n = objectMapper.readTree(body == null ? "{}" : body);
            JsonNode data = firstObject(n, "result", "data", "showapi_res_body");
            String province = firstText(data, "province", "prov", "provinceName", "isp_province");
            String city = firstText(data, "city", "cityName", "isp_city");
            if (!StringUtils.hasText(province)) {
                province = firstText(n, "province", "prov");
                city = firstText(n, "city");
            }
            Region r = Region.of(province, city, "", "aliyun-phone");
            if (!r.ok()) {
                log.warn("aliyun phone empty phone={} body={}", phone, abbreviate(body));
            }
            return r;
        } catch (Exception e) {
            log.warn("aliyun phone error phone={}", phone, e);
            return Region.empty("aliyun");
        }
    }

    private static JsonNode firstObject(JsonNode n, String... fields) {
        for (String f : fields) {
            JsonNode c = n.path(f);
            if (c.isObject() && c.size() > 0) {
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

    private static String abbreviate(String s) {
        if (s == null) {
            return "";
        }
        return s.length() > 240 ? s.substring(0, 240) : s;
    }
}
