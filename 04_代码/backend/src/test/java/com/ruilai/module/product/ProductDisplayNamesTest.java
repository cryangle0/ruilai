package com.ruilai.module.product;

import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductDisplayNamesTest {

    @Test
    void usesSoftDeletedCatalogNameInsteadOfRawId() {
        ProductMapper mapper = mock(ProductMapper.class);
        when(mapper.selectById("P2")).thenReturn(null);
        Product deleted = new Product();
        deleted.setId("P2");
        deleted.setCode("P-1002");
        deleted.setName("锐涞运动款套件");
        when(mapper.findDisplayByKey("P2")).thenReturn(deleted);

        assertThat(ProductDisplayNames.of(mapper, "P2")).isEqualTo("锐涞运动款套件");
    }

    @Test
    void liveRowWinsOverDeletedLookup() {
        ProductMapper mapper = mock(ProductMapper.class);
        Product live = new Product();
        live.setId("P1");
        live.setName("锐涞经典款套件");
        when(mapper.selectById("P1")).thenReturn(live);

        assertThat(ProductDisplayNames.of(mapper, "P1")).isEqualTo("锐涞经典款套件");
    }

    @Test
    void blankIdShowsDash() {
        ProductMapper mapper = mock(ProductMapper.class);
        assertThat(ProductDisplayNames.of(mapper, "  ")).isEqualTo("—");
    }
}
