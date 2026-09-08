package com.ruilai.common.thirdparty;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 统一地区结果：省/市/区划码 + 数据来源（高德/腾讯/阿里云/离线）。
 */
public record Region(String province, String city, String adcode, String source, boolean ok) {

    public static Region empty(String source) {
        return new Region("", "", "", source, false);
    }

    public static Region of(String province, String city, String adcode, String source) {
        String p = RegionNames.strip(province);
        String c = RegionNames.strip(city);
        boolean ok = !p.isBlank() || !c.isBlank();
        return new Region(p, c, adcode == null ? "" : adcode, source == null ? "" : source, ok);
    }

    public String display() {
        if (!ok) {
            return "未知";
        }
        if (!city.isBlank() && !city.equals(province)) {
            return province.isBlank() ? city : province + city;
        }
        return province.isBlank() ? city : province;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("province", province);
        m.put("city", city);
        m.put("adcode", adcode);
        m.put("source", source);
        m.put("ok", ok);
        m.put("display", display());
        return m;
    }
}
