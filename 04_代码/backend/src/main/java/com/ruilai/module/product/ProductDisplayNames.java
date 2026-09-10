package com.ruilai.module.product;

import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import org.springframework.util.StringUtils;

/**
 * SN / 库存 / 售后展示用商品名。已下架或软删的目录行仍要显示历史名称，不能回落到裸 id。
 */
public final class ProductDisplayNames {

    private ProductDisplayNames() {
    }

    public static String of(ProductMapper mapper, String productId) {
        if (!StringUtils.hasText(productId)) {
            return "—";
        }
        String key = productId.trim();
        Product live = mapper.selectById(key);
        if (live != null && StringUtils.hasText(live.getName())) {
            return live.getName();
        }
        Product any = mapper.findDisplayByKey(key);
        if (any != null && StringUtils.hasText(any.getName())) {
            return any.getName();
        }
        return key;
    }
}
