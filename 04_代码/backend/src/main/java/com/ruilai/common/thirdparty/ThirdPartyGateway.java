package com.ruilai.common.thirdparty;

import com.ruilai.common.config.RedisKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 通用支撑：第三方 IP 定位 / 电子围栏 / 号码归属地 /（文件走 StorageService）统一入口。
 * 激活异常、直销激活只调这里，不直接打高德/腾讯/阿里云。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThirdPartyGateway {

    private static final Duration CACHE_TTL = Duration.ofDays(7);

    private final ThirdPartyProperties props;
    private final AmapGeoClient amap;
    private final TencentGeoClient tencent;
    private final CloudMarketLocator cloudMarket;
    private final StringRedisTemplate redis;

    public Map<String, Object> capabilities() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("geoProvider", props.getGeo().getProvider());
        m.put("geoConfigured", props.geoConfigured());
        m.put("ipProvider", props.ipMarketConfigured() ? "cloud-market" : "unconfigured");
        m.put("ipConfigured", props.ipMarketConfigured());
        m.put("phoneProvider", phoneProviderName());
        m.put("phoneConfigured", props.phoneMarketConfigured());
        m.put("allowClientHint", props.allowClientHint());
        return m;
    }

    public Region locateIp(String ip) {
        if (!StringUtils.hasText(ip) || AmapGeoClient.isPrivate(ip)) {
            return Region.empty("skip-private-ip");
        }
        String cacheKey = RedisKeys.geoIp(ip);
        Region cached = readCache(cacheKey, "cloud-market-ip");
        if (cached != null) {
            return cached;
        }
        Region r = cloudMarket.locateIp(ip);
        writeCache(cacheKey, r);
        return r;
    }

    public Region locateGps(Double lng, Double lat) {
        if (lng == null || lat == null || (lng == 0 && lat == 0)) {
            return Region.empty("gps");
        }
        Region r = useTencent() ? tencent.regeo(lng, lat) : amap.regeo(lng, lat);
        if (!r.ok()) {
            r = useTencent() ? amap.regeo(lng, lat) : tencent.regeo(lng, lat);
        }
        return r;
    }

    public Region geocodeAddress(String address) {
        if (!StringUtils.hasText(address)) {
            return Region.empty("addr");
        }
        String cacheKey = RedisKeys.geoAddr(Integer.toHexString(address.trim().hashCode()));
        Region cached = readCache(cacheKey);
        if (cached != null) {
            return cached;
        }
        Region r = useTencent() ? tencent.geocode(address) : amap.geocode(address);
        if (!r.ok()) {
            r = useTencent() ? amap.geocode(address) : tencent.geocode(address);
        }
        if (!r.ok()) {
            r = RegionNames.fromAddressText(address);
        }
        writeCache(cacheKey, r);
        return r;
    }

    public Region locatePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return Region.empty("phone");
        }
        String digits = phone.replaceAll("\\D", "");
        String cacheKey = RedisKeys.geoPhone(digits);
        Region cached = readCache(cacheKey, "cloud-market-phone");
        if (cached != null) {
            return cached;
        }
        Region r = cloudMarket.locatePhone(digits);
        writeCache(cacheKey, r);
        return r;
    }

    /**
     * 直售第一重校验必须使用扫码请求的真实 IP，不能被 GPS 或客户端提示替代。
     */
    public Region resolveActivateLocation(String clientIp, String hintRegion, Double lng, Double lat) {
        return locateIp(clientIp);
    }

    public boolean inFence(Region loc, List<String> fence) {
        return GeoFence.contains(loc, fence);
    }

    public boolean phoneMatchesAddress(Region phone, Region addr) {
        if (phone == null || addr == null || !phone.ok() || !addr.ok()) {
            return true;
        }
        if (StringUtils.hasText(phone.city()) && StringUtils.hasText(addr.city())) {
            return RegionNames.same(phone.city(), addr.city()) || RegionNames.same(phone.province(), addr.province());
        }
        return RegionNames.same(phone.province(), addr.province())
                || RegionNames.same(phone.province(), addr.city())
                || RegionNames.same(phone.city(), addr.province());
    }

    private String phoneProviderName() {
        return props.phoneMarketConfigured() ? "cloud-market" : "unconfigured";
    }

    private boolean useTencent() {
        return "tencent".equalsIgnoreCase(props.getGeo().getProvider()) && tencent.enabled();
    }

    private Region readCache(String key) {
        return readCache(key, null);
    }

    private Region readCache(String key, String requiredSource) {
        try {
            String raw = redis.opsForValue().get(key);
            if (!StringUtils.hasText(raw)) {
                return null;
            }
            String[] p = raw.split("\\|", -1);
            if (p.length < 4) {
                return null;
            }
            if (StringUtils.hasText(requiredSource) && !requiredSource.equals(p[3])) {
                return null;
            }
            return Region.of(p[0], p[1], p[2], p[3]);
        } catch (Exception e) {
            return null;
        }
    }

    private void writeCache(String key, Region r) {
        if (r == null || !r.ok()) {
            return;
        }
        try {
            redis.opsForValue().set(key, r.province() + "|" + r.city() + "|" + r.adcode() + "|" + r.source(), CACHE_TTL);
        } catch (Exception e) {
            log.debug("geo cache skip {}", e.toString());
        }
    }
}
