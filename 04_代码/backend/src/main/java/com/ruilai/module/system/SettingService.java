package com.ruilai.module.system;

import com.ruilai.module.system.entity.SysSetting;
import com.ruilai.module.system.mapper.SysSettingMapper;
import com.ruilai.common.time.ChinaTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingService {

    public static final String EXCEPTION_RULES = "exception_rules";

    private final SysSettingMapper mapper;

    public Map<String, Object> exceptionRules() {
        SysSetting row = mapper.selectById(EXCEPTION_RULES);
        Map<String, Object> defaults = defaults();
        if (row == null || row.getV() == null) {
            return defaults;
        }
        Map<String, Object> v = new HashMap<>(defaults);
        v.putAll(row.getV());
        return v;
    }

    public Map<String, Object> saveExceptionRules(Map<String, Object> body) {
        Map<String, Object> merged = exceptionRules();
        if (body != null) {
            merged.putAll(body);
        }
        SysSetting row = mapper.selectById(EXCEPTION_RULES);
        if (row == null) {
            row = new SysSetting();
            row.setK(EXCEPTION_RULES);
        }
        row.setV(merged);
        row.setUpdatedAt(ChinaTime.now());
        if (mapper.selectById(EXCEPTION_RULES) == null) {
            mapper.insert(row);
        } else {
            mapper.updateById(row);
        }
        return exceptionRules();
    }

    public double multiplier() {
        return toDouble(exceptionRules().get("multiplier"), 1.5);
    }

    public double overOrderRatio() {
        return toDouble(exceptionRules().get("overOrderRatio"), 1.0);
    }

    public double stockTurnover() {
        return toDouble(exceptionRules().get("stockTurnover"), 1.5);
    }

    private static Map<String, Object> defaults() {
        Map<String, Object> m = new HashMap<>();
        m.put("multiplier", 1.5);
        m.put("overOrderRatio", 1.0);
        m.put("stockTurnover", 1.5);
        m.put("softAutoClose", false);
        return m;
    }

    public static double toDouble(Object v, double dft) {
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(v));
        } catch (Exception e) {
            return dft;
        }
    }
}
