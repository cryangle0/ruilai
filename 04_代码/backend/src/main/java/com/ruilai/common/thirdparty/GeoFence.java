package com.ruilai.common.thirdparty;

import java.util.List;

/**
 * 电子围栏：授权城市/省份 vs IP 或定位结果。
 * 有市级定位时按市精确匹配；只有省级时按「该省城市 ∩ 围栏」兼容原型。
 */
public final class GeoFence {

    private GeoFence() {
    }

    public static boolean contains(Region loc, List<String> fence) {
        if (loc == null || !loc.ok() || fence == null || fence.isEmpty()) {
            return false;
        }
        for (String f : fence) {
            if (RegionNames.same(loc.city(), f) || RegionNames.same(loc.province(), f)) {
                return true;
            }
        }
        if (loc.city() != null && !loc.city().isBlank()) {
            return false;
        }
        List<String> cities = RegionNames.CITY_MAP.get(loc.province());
        if (cities == null) {
            return false;
        }
        for (String city : cities) {
            for (String f : fence) {
                if (RegionNames.same(city, f)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static boolean provinceInSaleAreas(Region loc, List<String> saleAreas) {
        if (loc == null || !loc.ok() || saleAreas == null || saleAreas.isEmpty()) {
            return false;
        }
        for (String a : saleAreas) {
            if (RegionNames.same(loc.province(), a) || RegionNames.same(loc.city(), a)) {
                return true;
            }
            if (RegionNames.same(RegionNames.provinceOfCity(a), loc.province())) {
                return true;
            }
        }
        return false;
    }
}
