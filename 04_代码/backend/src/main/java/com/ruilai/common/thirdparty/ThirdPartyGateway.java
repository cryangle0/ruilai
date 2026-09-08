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
    private final AliyunPhoneClient aliyunPhone;
    private final OfflinePhoneLocator offlinePhone;
    private final StringRedisTemplate redis;

    public Map<String, Object> capabilities() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("geoProvider", props.getGeo().getProvider());
        m.put("geoConfigured", props.geoConfigured());
        m.put("phoneProvider", props.phoneConfigured() ? props.getPhone().getProvider() : "offline");
        m.put("phoneConfigured", props.phoneConfigured());
        m.put("allowClientHint", props.allowClientHint());
        return m;
    }

    public Region locateIp(String ip) {
        if (!StringUtils.hasText(ip) || AmapGeoClient.isPrivate(ip)) {
            return Region.empty("skip-private-ip");
        }
        String cacheKey = RedisKeys.geoIp(ip);
        Region cached = readCache(cacheKey);
        if (cached != null) {
            return cached;
        }
        Region r = useTencent() ? tencent.locateIp(ip) : amap.locateIp(ip);
        if (!r.ok() && useTencent()) {
            r = amap.locateIp(ip);
        } else if (!r.ok() && !useTencent()) {
            r = tencent.locateIp(ip);
        }
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
        Region cached = readCache(cacheKey);
        if (cached != null) {
            return cached;
        }
        Region r = Region.empty("phone");
        if (props.phoneConfigured()) {
            r = aliyunPhone.locate(digits);
        }
        if (!r.ok()) {
            r = offlinePhone.locate(digits);
        }
        writeCache(cacheKey, r);
        return r;
    }

    /**
     * 激活定位：优先 GPS 精确围栏，其次真实 IP，再次客户端提示（仅无 Key 或显式允许）。
     */
    public Region resolveActivateLocation(String clientIp, String hintRegion, Double lng, Double lat) {
        Region gps = locateGps(lng, lat);
        if (gps.ok()) {
            return gps;
        }
        Region ip = locateIp(clientIp);
        if (ip.ok()) {
            return ip;
        }
        if (props.allowClientHint() && StringUtils.hasText(hintRegion) && !"null".equals(hintRegion)) {
            Region fromHint = RegionNames.fromAddressText(hintRegion);
            if (!fromHint.ok()) {
                fromHint = Region.of(hintRegion, "", "", "client-hint");
            } else {
                fromHint = Region.of(fromHint.province(), fromHint.city(), fromHint.adcode(), "client-hint");
            }
            return fromHint;
        }
        return Region.empty("activate");
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

    private boolean useTencent() {
        return "tencent".equalsIgnoreCase(props.getGeo().getProvider()) && tencent.enabled();
    }

    private Region readCache(String key) {
        try {
            String raw = redis.opsForValue().get(key);
            if (!StringUtils.hasText(raw)) {
                return null;
            }
            String[] p = raw.split("\\|", -1);
            if (p.length < 4) {
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
