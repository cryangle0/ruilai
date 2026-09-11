package com.ruilai.common.thirdparty;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ThirdPartyGatewayStrictMarketTest {

    @Mock AmapGeoClient amap;
    @Mock TencentGeoClient tencent;
    @Mock CloudMarketLocator cloudMarket;
    @Mock AliyunPhoneClient aliyunPhone;
    @Mock OfflinePhoneLocator offlinePhone;
    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> values;

    private ThirdPartyGateway gateway;
    private ThirdPartyProperties props;

    @BeforeEach
    void setUp() {
        props = new ThirdPartyProperties();
        when(redis.opsForValue()).thenReturn(values);
        gateway = new ThirdPartyGateway(props, amap, tencent, cloudMarket, redis);
    }

    @Test
    void ipFailureDoesNotFallBackToMapProviders() {
        when(values.get("rl:geo:ip:117.8.161.46")).thenReturn(null);
        when(cloudMarket.locateIp("117.8.161.46")).thenReturn(Region.empty("cloud-market-ip"));

        Region result = gateway.locateIp("117.8.161.46");

        assertThat(result.ok()).isFalse();
        assertThat(result.source()).isEqualTo("cloud-market-ip");
        verify(amap, never()).locateIp("117.8.161.46");
        verify(tencent, never()).locateIp("117.8.161.46");
    }

    @Test
    void phoneFailureDoesNotFallBackToAliyunOrOfflineTable() {
        when(values.get("rl:geo:phone:13800138000")).thenReturn(null);
        when(cloudMarket.locatePhone("13800138000")).thenReturn(Region.empty("cloud-market-phone"));

        Region result = gateway.locatePhone("13800138000");

        assertThat(result.ok()).isFalse();
        assertThat(result.source()).isEqualTo("cloud-market-phone");
        verify(aliyunPhone, never()).locate("13800138000");
        verify(offlinePhone, never()).locate("13800138000");
    }

    @Test
    void activationUsesIpEvenWhenGpsAndClientHintArePresent() {
        when(values.get("rl:geo:ip:117.8.161.46")).thenReturn(null);
        Region ip = Region.of("天津", "天津", "120100", "cloud-market-ip");
        when(cloudMarket.locateIp("117.8.161.46")).thenReturn(ip);

        Region result = gateway.resolveActivateLocation(
                "117.8.161.46", "浙江杭州", 120.1, 30.2);

        assertThat(result).isEqualTo(ip);
        verify(amap, never()).regeo(120.1, 30.2);
        verify(tencent, never()).regeo(120.1, 30.2);
    }

    @Test
    void staleMapCacheDoesNotBypassCloudMarketIp() {
        when(values.get("rl:geo:ip:117.8.161.46"))
                .thenReturn("浙江|杭州|330100|amap-ip");
        Region ip = Region.of("天津", "天津", "120100", "cloud-market-ip");
        when(cloudMarket.locateIp("117.8.161.46")).thenReturn(ip);

        assertThat(gateway.locateIp("117.8.161.46")).isEqualTo(ip);
    }

    @Test
    void staleOfflineCacheDoesNotBypassCloudMarketPhone() {
        when(values.get("rl:geo:phone:13800138000"))
                .thenReturn("浙江|杭州||offline-7");
        Region phone = Region.of("北京", "北京", "110100", "cloud-market-phone");
        when(cloudMarket.locatePhone("13800138000")).thenReturn(phone);

        assertThat(gateway.locatePhone("13800138000")).isEqualTo(phone);
    }
}
