package com.ruilai.bootstrap;

import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.system.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 已有库补齐套件标品组合与异常规则，不覆盖业务数据。 */
@Slf4j
@Component
@Order(20)
@RequiredArgsConstructor
public class KitBackfill implements ApplicationRunner {

    private final ProductMapper productMapper;
    private final SettingService settingService;

    @Override
    public void run(ApplicationArguments args) {
        settingService.exceptionRules();
        patchKit("P1", "腰带", "弹力带");
        patchKit("P2", "腰带", "弹力带");
    }

    private void patchKit(String id, String aName, String bName) {
        Product p = productMapper.selectById(id);
        if (p == null || !"kit".equals(p.getType())) {
            return;
        }
        Map<String, Object> extra = p.getExtra() == null ? new HashMap<>() : new HashMap<>(p.getExtra());
        if (extra.get("stdCombos") instanceof List<?> list && !list.isEmpty()) {
            return;
        }
        extra.put("compAName", aName);
        extra.put("compBName", bName);
        extra.put("belts", List.of("腰带S", "腰带M", "腰带L"));
        extra.put("sizes", List.of("SS", "S", "M", "L", "LL"));
        extra.put("components", List.of(
                comp("c0", aName, List.of("腰带S", "腰带M", "腰带L")),
                comp("c1", bName, List.of("SS", "S", "M", "L", "LL"))
        ));
        extra.put("stdCombos", List.of(
                combo("小", "腰带S", "SS"),
                combo("小", "腰带S", "S"),
                combo("中", "腰带M", "M"),
                combo("大", "腰带L", "L"),
                combo("大", "腰带L", "LL")
        ));
        p.setExtra(extra);
        productMapper.updateById(p);
        log.info("backfilled kit combos for {}", id);
    }

    private static Map<String, Object> comp(String id, String name, List<String> sizes) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("pool", new ArrayList<>(sizes));
        m.put("sizes", new ArrayList<>(sizes));
        return m;
    }

    private static Map<String, Object> combo(String grade, String belt, String size) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", belt.replace("腰带", "") + "-" + size);
        m.put("grade", grade);
        m.put("belt", belt);
        m.put("size", size);
        m.put("label", grade + "（" + belt + "+弹力带" + size + "）");
        return m;
    }
}
