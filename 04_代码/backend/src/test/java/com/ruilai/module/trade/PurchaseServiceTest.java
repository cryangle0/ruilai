package com.ruilai.module.trade;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.module.risk.StockWarnService;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.SnWriter;
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
}
