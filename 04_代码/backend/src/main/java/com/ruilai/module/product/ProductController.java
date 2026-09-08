package com.ruilai.module.product;

import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.R;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.entity.ProductLine;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public R<PageResult<Product>> page(@RequestParam(defaultValue = "1") long page,
                                       @RequestParam(defaultValue = "20") long pageSize,
                                       @RequestParam(required = false) String keyword,
                                       @RequestParam(required = false) String type,
                                       @RequestParam(required = false) String status) {
        return R.ok(productService.page(page, pageSize, keyword, type, status));
    }

    @GetMapping("/on-shelf")
    public R<List<Product>> onShelf() {
        return R.ok(productService.listOnShelf());
    }

    @GetMapping("/{id}")
    public R<Product> one(@PathVariable String id) {
        return R.ok(productService.get(id));
    }

    @PostMapping
    public R<Product> save(@RequestBody Product body) {
        return R.ok(productService.save(body));
    }

    @PostMapping("/{id}/delete")
    public R<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return R.ok();
    }

    @GetMapping("/lines")
    public R<List<ProductLine>> lines() {
        return R.ok(productService.lines());
    }
}
