package com.ruilai.module.product;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.util.Ids;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.entity.ProductLine;
import com.ruilai.module.product.mapper.ProductLineMapper;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.system.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;
    private final ProductLineMapper lineMapper;
    private final LogService logService;

    public PageResult<Product> page(long page, long size, String keyword, String type, String status) {
        var q = Wrappers.<Product>lambdaQuery();
        if (StringUtils.hasText(keyword)) {
            q.and(w -> w.like(Product::getName, keyword).or().like(Product::getCode, keyword));
        }
        if (StringUtils.hasText(type)) {
            q.eq(Product::getType, type);
        }
        if (StringUtils.hasText(status)) {
            q.eq(Product::getStatus, status);
        }
        q.orderByAsc(Product::getCode);
        return PageResult.of(productMapper.selectPage(Page.of(page, size), q));
    }

    public List<Product> listOnShelf() {
        return productMapper.selectList(Wrappers.<Product>lambdaQuery().eq(Product::getStatus, "上架"));
    }

    public Product get(String id) {
        Product p = productMapper.selectById(id);
        if (p == null) {
            throw new BizException(ErrCode.NOT_FOUND, "商品不存在");
        }
        return p;
    }

    public Product save(Product body) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        if (!StringUtils.hasText(body.getId())) {
            body.setId(Ids.next("P"));
            productMapper.insert(body);
        } else {
            productMapper.updateById(body);
        }
        logService.record("保存商品 " + body.getName(), "op", true);
        return get(body.getId());
    }

    public void delete(String id) {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        Product p = get(id);
        productMapper.deleteById(id);
        logService.record("删除商品 " + p.getName(), "op", true);
    }

    public List<ProductLine> lines() {
        return lineMapper.selectList(Wrappers.<ProductLine>lambdaQuery().orderByAsc(ProductLine::getCode));
    }
}
