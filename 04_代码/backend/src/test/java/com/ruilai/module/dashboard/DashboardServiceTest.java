package com.ruilai.module.dashboard;

import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private AgentL1Mapper l1Mapper;
    @Mock private AgentL2Mapper l2Mapper;
    @Mock private SalesOrderMapper soMapper;
    @Mock private SnCodeMapper snMapper;
    @Mock private PurchaseOrderMapper poMapper;
    @Mock private ExceptionTicketMapper exMapper;
    @Mock private ReturnOrderMapper rtMapper;
    @Mock private ProductMapper productMapper;

    @InjectMocks private DashboardService service;

    @Test
    void productSalesUseCatalogNameFromOrderLinesWhenLegacyOrderProductIdIsMissing() {
        Product product = new Product();
        product.setId("P1");
        product.setName("康复弹力套件");

        SalesOrder sale = new SalesOrder();
        sale.setStatus("done");
        sale.setCreatedAt(LocalDateTime.of(2026, 9, 10, 12, 0));
        sale.setScanned(List.of("SN1", "SN2"));
        sale.setLines(List.of(Map.of(
                "productId", "P1",
                "productName", "销售",
                "qty", 2
        )));

        when(productMapper.selectList(null)).thenReturn(List.of(product));
        when(poMapper.selectList(any())).thenReturn(List.of());
        when(soMapper.selectList(any())).thenReturn(List.of(sale));
        when(snMapper.selectList(null)).thenReturn(List.of());
        when(rtMapper.selectList(null)).thenReturn(List.of());
        when(l1Mapper.selectList(any())).thenReturn(List.of());

        Map<String, Object> result = service.stats(null, null, "2026-09-10", "2026-09-10");

        assertThat((List<Map<String, Object>>) result.get("productBars"))
                .containsExactly(Map.of("label", "康复弹力套件", "value", 2))
                .noneMatch(row -> "销售".equals(row.get("label")));
    }
}
