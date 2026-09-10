package com.ruilai.module.trade;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.module.risk.StockWarnService;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.SnWriter;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.PurchaseOrder;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.StockLogMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceTest {
    @Mock PurchaseOrderMapper poMapper;
    @Mock SnCodeMapper snMapper;
    @Mock StockLogMapper stockLogMapper;
    @Mock OrderNoGenerator orderNos;
    @Mock LogService logService;
    @Mock SnEventWriter eventWriter;
    @Mock SnWriter snWriter;
    @Mock StockWarnService stockWarnService;
    @Mock com.ruilai.module.agent.mapper.AgentL1Mapper l1Mapper;
    @Mock com.ruilai.module.product.mapper.ProductMapper productMapper;
    @InjectMocks PurchaseService service;

    @BeforeEach
    void loginAdmin() {
        LoginUser user = new LoginUser();
        user.setRoleCode("ADMIN");
        user.setUsername("admin");
        user.setPermissions(Set.of("all"));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void purePartsPurchaseCompletesCosignWithoutSnInbound() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO1");
        po.setNo("PO-1");
        po.setL1Id("L1A");
        po.setStatus("cosigning");
        po.setLines(List.of());
        po.setCustomLines(List.of());
        po.setParts(List.of(new HashMap<>(Map.of("productId", "PART", "qty", 2))));
        po.setSegments(Map.of());
        po.setCosign(new HashMap<>(Map.of("admin2", true)));
        when(poMapper.selectById("PO1")).thenReturn(po);

        PurchaseOrder result = service.cosign("PO1", null);

        assertThat(result.getStatus()).isEqualTo("approved");
        verify(snMapper, never()).insert(any(com.ruilai.module.sn.entity.SnCode.class));
    }

    @Test
    void getRejectsCrossL1Access() {
        LoginUser user = new LoginUser();
        user.setRoleCode("L1");
        user.setAgentId("L1B");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO1");
        po.setL1Id("L1A");
        when(poMapper.selectById("PO1")).thenReturn(po);

        assertThatThrownBy(() -> service.get("PO1"))
                .isInstanceOf(com.ruilai.common.web.BizException.class)
                .hasMessageContaining("无权");
    }

    @Test
    void getFillsL1DisplayName() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO1");
        po.setL1Id("L1A");
        when(poMapper.selectById("PO1")).thenReturn(po);
        com.ruilai.module.agent.entity.AgentL1 agent = new com.ruilai.module.agent.entity.AgentL1();
        agent.setName("华东锐涞总代");
        when(l1Mapper.selectById("L1A")).thenReturn(agent);
        when(stockWarnService.warnMeta("L1A", null)).thenReturn(Map.of());

        assertThat(service.get("PO1").getL1Name()).isEqualTo("华东锐涞总代");
    }

    @Test
    void getMarksBundledSinglesForAccessoryPresentation() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO-SINGLE");
        po.setL1Id("L1A");
        po.setLines(List.of(line("SINGLE", "M", "", 2)));
        when(poMapper.selectById("PO-SINGLE")).thenReturn(po);
        com.ruilai.module.product.entity.Product single = new com.ruilai.module.product.entity.Product();
        single.setId("SINGLE");
        single.setName("护膝单品");
        single.setType("single");
        when(productMapper.selectById("SINGLE")).thenReturn(single);

        PurchaseOrder detail = service.get("PO-SINGLE");

        assertThat(detail.getLines().get(0))
                .containsEntry("productName", "护膝单品")
                .containsEntry("category", "single");
    }

    @Test
    void cosignPersistsAuditedCustomSpecs() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO2");
        po.setNo("PO-2");
        po.setL1Id("L1A");
        po.setStatus("cosigning");
        po.setLines(List.of());
        po.setCustomLines(List.of());
        po.setParts(List.of());
        po.setCosign(new HashMap<>(Map.of("admin2", true)));
        when(poMapper.selectById("PO2")).thenReturn(po);

        List<Map<String, Object>> custom = List.of(new HashMap<>(Map.of(
                "productId", "P1", "size", "M", "belt", "腰带S", "qty", 1)));
        service.cosign("PO2", Map.of("P1_M_腰带S", List.of("RL202609080001")), custom);

        assertThat(po.getCustomLines()).isEqualTo(custom);
        assertThat(po.getStatus()).isEqualTo("approved");
        verify(poMapper).updateById(po);
    }

    @Test
    void rejectStoresReason() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO3");
        po.setNo("PO-3");
        po.setL1Id("L1A");
        po.setStatus("pending");
        when(poMapper.selectById("PO3")).thenReturn(po);

        service.reject("PO3", "号段有误");

        assertThat(po.getStatus()).isEqualTo("rejected");
        assertThat(po.getRejectReason()).isEqualTo("号段有误");
        verify(poMapper).updateById(po);
    }

    @Test
    void firstCosignDoesNotRequireSegmentQtyMatch() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO4");
        po.setNo("PO-4");
        po.setL1Id("L1A");
        po.setStatus("pending");
        po.setLines(List.of(new HashMap<>(Map.of("productId", "P1", "size", "M", "belt", "腰带M", "qty", 10))));
        po.setCustomLines(List.of());
        po.setParts(List.of());
        po.setSegments(Map.of());
        po.setCosign(new HashMap<>());
        when(poMapper.selectById("PO4")).thenReturn(po);

        PurchaseOrder result = service.cosign("PO4", Map.of());

        assertThat(result.getStatus()).isEqualTo("cosigning");
        verify(poMapper).updateById(po);
    }

    @Test
    void finalCosignRejectsDescendingRangeBeforeWritingInventory() {
        PurchaseOrder po = finalCosignOrder(List.of(line("P1", "M", "腰带M", 2)));
        when(poMapper.selectById("PO-RANGE")).thenReturn(po);

        assertThatThrownBy(() -> service.cosign("PO-RANGE",
                Map.of("P1_M_腰带M", List.of("RL202609080002-RL202609080001"))))
                .isInstanceOf(com.ruilai.common.web.BizException.class)
                .hasMessageContaining("倒序")
                .hasMessageContaining("RL202609080002-RL202609080001");

        verify(snMapper, never()).insert(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
        verify(poMapper, never()).updateById(po);
    }

    @Test
    void finalCosignRejectsRepeatedNumberAcrossSegmentsBeforeWritingInventory() {
        PurchaseOrder po = finalCosignOrder(List.of(line("P1", "M", "腰带M", 3)));
        when(poMapper.selectById("PO-RANGE")).thenReturn(po);

        assertThatThrownBy(() -> service.cosign("PO-RANGE", Map.of(
                "P1_M_腰带M", List.of(
                        "RL202609080001-RL202609080002",
                        "RL202609080002"))))
                .isInstanceOf(com.ruilai.common.web.BizException.class)
                .hasMessageContaining("重复")
                .hasMessageContaining("RL202609080002");

        verify(snMapper, never()).insert(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
    }

    @Test
    void finalCosignRejectsSnAlreadyOutsideFactoryWarehouse() {
        PurchaseOrder po = finalCosignOrder(List.of(line("P1", "M", "腰带M", 1)));
        when(poMapper.selectById("PO-RANGE")).thenReturn(po);
        SnCode occupied = new SnCode();
        occupied.setSn("RL202609080001");
        occupied.setStatus("l2");
        when(snMapper.selectById("RL202609080001")).thenReturn(occupied);

        assertThatThrownBy(() -> service.cosign("PO-RANGE",
                Map.of("P1_M_腰带M", List.of("RL202609080001"))))
                .isInstanceOf(com.ruilai.common.web.BizException.class)
                .hasMessageContaining("RL202609080001")
                .hasMessageContaining("重复");

        verify(snMapper, never()).insert(any(SnCode.class));
        verify(snWriter, never()).update(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
    }

    @Test
    void finalCosignAcceptsSnCurrentlyInFactoryWarehouse() {
        PurchaseOrder po = finalCosignOrder(List.of(line("P1", "M", "腰带M", 1)));
        when(poMapper.selectById("PO-RANGE")).thenReturn(po);
        SnCode warehouse = new SnCode();
        warehouse.setSn("RL202609080001");
        warehouse.setStatus("warehouse");
        warehouse.setFrozen(1);
        when(snMapper.selectById("RL202609080001")).thenReturn(warehouse);

        PurchaseOrder result = service.cosign("PO-RANGE",
                Map.of("P1_M_腰带M", List.of("RL202609080001")));

        assertThat(result.getStatus()).isEqualTo("approved");
        assertThat(warehouse.getStatus()).isEqualTo("l1");
        assertThat(warehouse.getL1Id()).isEqualTo("L1A");
        verify(snWriter).update(warehouse);
        verify(poMapper).updateById(po);
    }

    @Test
    void finalCosignRejectsPerLineMismatchEvenWhenOverallTotalMatches() {
        PurchaseOrder po = finalCosignOrder(List.of(
                line("P1", "M", "腰带M", 2),
                line("P1", "L", "腰带L", 1)));
        when(poMapper.selectById("PO-RANGE")).thenReturn(po);

        assertThatThrownBy(() -> service.cosign("PO-RANGE", Map.of(
                "P1_M_腰带M", List.of("RL202609080001"),
                "P1_L_腰带L", List.of("RL202609080002-RL202609080003"))))
                .isInstanceOf(com.ruilai.common.web.BizException.class)
                .hasMessageContaining("P1")
                .hasMessageContaining("M")
                .hasMessageContaining("需要 2")
                .hasMessageContaining("已填 1");

        verify(snMapper, never()).insert(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
        verify(poMapper, never()).updateById(po);
    }

    private PurchaseOrder finalCosignOrder(List<Map<String, Object>> lines) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId("PO-RANGE");
        po.setNo("PO-RANGE-1");
        po.setL1Id("L1A");
        po.setStatus("cosigning");
        po.setLines(lines);
        po.setCustomLines(List.of());
        po.setParts(List.of());
        po.setSegments(Map.of());
        po.setCosign(new HashMap<>(Map.of("admin2", true)));
        return po;
    }

    private Map<String, Object> line(String productId, String size, String belt, int qty) {
        return new HashMap<>(Map.of(
                "productId", productId,
                "size", size,
                "belt", belt,
                "qty", qty));
    }
}
