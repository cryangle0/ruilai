package com.ruilai.common.thirdparty;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class CloudMarketLocatorTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void signerMatchesCloudMarketV2Formula() {
        Instant now = Instant.parse("2018-03-19T12:08:40Z");
        String date = CloudMarketSigner.gmt(now);
        assertThat(date).isEqualTo("Mon, 19 Mar 2018 12:08:40 GMT");
        String sig = CloudMarketSigner.hmacSha1Base64("test-secret", "x-date: " + date);
        String auth = CloudMarketSigner.authorization("AKIDTEST", "test-secret", now);
        assertThat(auth).isEqualTo(
                "{\"id\": \"AKIDTEST\", \"x-date\": \"Mon, 19 Mar 2018 12:08:40 GMT\" , \"signature\": \"" + sig + "\"}");
        assertThat(sig).isEqualTo("nJYbWWhIpVSdXuQFmh1JZREBVmU=");
    }

    @Test
    void parsesIpv4CityPayload() throws Exception {
        var root = MAPPER.readTree("""
                {"code":200,"msg":"success","data":{"province":"天津","city":"天津","area_code":"120100"}}
                """);
        Region r = CloudMarketLocator.parseIp(root);
        assertThat(r.ok()).isTrue();
        assertThat(r.province()).isEqualTo("天津");
        assertThat(r.city()).isEqualTo("天津");
        assertThat(r.adcode()).isEqualTo("120100");
        assertThat(r.source()).isEqualTo("cloud-market-ip");
    }

    @Test
    void parsesPhonePayloadUsingProv() throws Exception {
        var root = MAPPER.readTree("""
                {"code":200,"message":"处理成功","data":{"prov":"北京","city":"北京","area_code":"110100"}}
                """);
        Region r = CloudMarketLocator.parsePhone(root);
        assertThat(r.ok()).isTrue();
        assertThat(r.display()).isEqualTo("北京");
        assertThat(r.adcode()).isEqualTo("110100");
        assertThat(r.source()).isEqualTo("cloud-market-phone");
    }

    @Test
    void rejectsBusinessErrorCode() throws Exception {
        var root = MAPPER.readTree("""
                {"code":40003,"message":"查询号段不存在","data":null}
                """);
        assertThat(CloudMarketLocator.parsePhone(root).ok()).isFalse();
        assertThat(CloudMarketLocator.parseIp(root).ok()).isFalse();
    }

    @Test
    void marketFlagsNeedBothSecretsAndEndpoint() {
        ThirdPartyProperties props = new ThirdPartyProperties();
        assertThat(props.ipMarketConfigured()).isFalse();
        assertThat(props.phoneMarketConfigured()).isFalse();
        props.getGeo().getIp().setSecretId("id");
        props.getGeo().getIp().setSecretKey("key");
        props.getGeo().getIp().setEndpoint("https://example.test/ip");
        props.getPhone().getMarket().setSecretId("id");
        props.getPhone().getMarket().setSecretKey("key");
        props.getPhone().getMarket().setEndpoint("https://example.test/mobile");
        assertThat(props.ipMarketConfigured()).isTrue();
        assertThat(props.phoneMarketConfigured()).isTrue();
        assertThat(props.phoneConfigured()).isTrue();
        assertThat(props.allowClientHint()).isFalse();
    }
}
