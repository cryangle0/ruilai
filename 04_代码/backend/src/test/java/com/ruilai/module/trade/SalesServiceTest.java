package com.ruilai.module.trade;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.web.BizException;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.customer.entity.Customer;
import com.ruilai.module.customer.mapper.CustomerMapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.ExceptionService;
import com.ruilai.module.risk.StockWarnService;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import com.ruilai.module.trade.mapper.StockLogMapper;
import com.ruilai.common.thirdparty.Region;
import com.ruilai.common.thirdparty.ThirdPartyGateway;
import com.ruilai.common.util.OrderNoGenerator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesServiceTest {
    @Mock SalesOrderMapper soMapper;
    @Mock SnCodeMapper snMapper;
    @Mock StockLogMapper stockLogMapper;
    @Mock ExceptionTicketMapper exMapper;
    @Mock CustomerMapper customerMapper;
    @Mock AgentL1Mapper l1Mapper;
    @Mock AgentL2Mapper l2Mapper;
    @Mock ProductMapper productMapper;
    @Mock OrderNoGenerator orderNos;
    @Mock LogService logService;
    @Mock SnEventWriter eventWriter;
    @Mock ThirdPartyGateway gateway;
    @Mock ExceptionService exceptionService;
    @Mock StockWarnService stockWarnService;
    @InjectMocks SalesService service;

    @BeforeEach
    void loginL1() {
        LoginUser user = new LoginUser();
        user.setRoleCode("L1");
        user.setAgentId("L1A");
        user.setUsername("l1");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
        lenient().when(exMapper.selectList(any())).thenReturn(List.of());
    }

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createAcceptsValidatedMultipleLinesAndChecksEachProduct() {
        Product p1 = product("P1", "产品一", List.of("M"), List.of("腰带M"));
        Product p2 = product("P2", "产品二", List.of("L"), List.of("腰带L"));
        when(productMapper.selectById("P1")).thenReturn(p1);
        when(productMapper.selectById("P2")).thenReturn(p2);
        AgentL2 l2 = approvedL2();
        when(l2Mapper.selectById("L2A")).thenReturn(l2);
        when(orderNos.next("SO")).thenReturn("SO-1");
        when(soMapper.insert(any(SalesOrder.class))).thenAnswer(inv -> {
            inserted = inv.getArgument(0);
            return 1;
        });
        when(soMapper.selectById(any())).thenAnswer(inv -> inserted);

        SalesOrder body = new SalesOrder();
        body.setChannel("distribute");
        body.setL2Id("L2A");
        body.setLines(new ArrayList<>(List.of(
                line("P1", "M", "腰带M", 2),
                line("P2", "L", "腰带L", 3))));

        SalesOrder created = service.create(body);

        assertThat(created.getPlanTotal()).isEqualTo(5);
        assertThat(created.getLines()).extracting(l -> l.get("productName"))
                .containsExactly("产品一", "产品二");
        verify(stockWarnService).checkOverOrder("L1A", "L2A", "P1", 2, "二级A");
        verify(stockWarnService).checkOverOrder("L1A", "L2A", "P2", 3, "二级A");
    }

    private SalesOrder inserted;

    @Test
    void createRejectsLineOutsideMaintainedSpecification() {
        when(productMapper.selectById("P1")).thenReturn(product("P1", "产品一", List.of("M"), List.of("腰带M")));
        when(l2Mapper.selectById("L2A")).thenReturn(approvedL2());

        SalesOrder body = new SalesOrder();
        body.setChannel("distribute");
        body.setL2Id("L2A");
        body.setLines(List.of(line("P1", "XL", "腰带M", 1)));

        assertThatThrownBy(() -> service.create(body))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("规格");
        verify(soMapper, never()).insert(any(SalesOrder.class));
    }

    @Test
    void createAcceptsNonstandardComboWhenSizeAndBeltAreMaintained() {
        Product p1 = product("P1", "产品一", List.of("M", "L"), List.of("腰带M", "腰带S"));
        p1.setExtra(Map.of(
                "sizes", List.of("M", "L"),
                "belts", List.of("腰带M", "腰带S"),
                "stdCombos", List.of(Map.of("size", "M", "belt", "腰带M"))));
        when(productMapper.selectById("P1")).thenReturn(p1);
        when(l2Mapper.selectById("L2A")).thenReturn(approvedL2());
        when(orderNos.next("SO")).thenReturn("SO-1");
        when(soMapper.insert(any(SalesOrder.class))).thenAnswer(inv -> {
            inserted = inv.getArgument(0);
            return 1;
        });
        when(soMapper.selectById(any())).thenAnswer(inv -> inserted);

        SalesOrder body = new SalesOrder();
        body.setChannel("distribute");
        body.setL2Id("L2A");
        body.setLines(List.of(line("P1", "L", "腰带S", 1)));

        assertThat(service.create(body).getPlanTotal()).isEqualTo(1);
    }

    @Test
    void distributeRequiresApprovedChildOfCurrentL1() {
        AgentL2 foreign = approvedL2();
        foreign.setParentId("L1B");
        when(l2Mapper.selectById("L2A")).thenReturn(foreign);

        SalesOrder body = new SalesOrder();
        body.setChannel("distribute");
        body.setL2Id("L2A");
        body.setLines(List.of(line("P1", "M", "腰带M", 1)));

        assertThatThrownBy(() -> service.create(body))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("下属");
        verify(soMapper, never()).insert(any(SalesOrder.class));
    }

    @Test
    void scanMatchesProductSizeAndBeltLineQuota() {
        SalesOrder so = new SalesOrder();
        so.setId("SO1");
        so.setNo("SO-1");
        so.setL1Id("L1A");
        so.setL2Id("L2A");
        so.setStatus("scanning");
        so.setPlanTotal(2);
        so.setLines(List.of(
                line("P1", "M", "腰带M", 1),
                line("P1", "M", "腰带L", 1)));
        so.setScanned(List.of("OLD"));
        when(soMapper.selectById("SO1")).thenReturn(so);
        when(snMapper.selectById("OLD")).thenReturn(sn("OLD", "P1", "M", "腰带M"));
        when(snMapper.selectById("NEW")).thenReturn(sn("NEW", "P1", "M", "腰带M"));

        assertThatThrownBy(() -> service.scan("SO1", "NEW"))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("规格计划已满");
        verify(soMapper, never()).updateById(any(SalesOrder.class));
    }

    @Test
    void confirmRejectsL2AndCompletedOrder() {
        login("L2", "L2A");
        SalesOrder so = order("scanning", List.of("S1"));
        when(soMapper.selectById("SO1")).thenReturn(so);
        assertThatThrownBy(() -> service.confirm("SO1"))
                .isInstanceOf(BizException.class).hasMessageContaining("仅平台或一级");

        login("L1", "L1A");
        so.setStatus("done");
        assertThatThrownBy(() -> service.confirm("SO1"))
                .isInstanceOf(BizException.class).hasMessageContaining("不可确认");
        verify(snMapper, never()).updateById(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
    }

    @Test
    void confirmValidatesEverySnBeforeWriting() {
        SalesOrder so = order("scanning", List.of("S1", "MISSING"));
        so.setPlanTotal(2);
        when(soMapper.selectById("SO1")).thenReturn(so);
        when(snMapper.selectById("S1")).thenReturn(sn("S1", "P1", "M", "腰带M"));
        when(snMapper.selectById("MISSING")).thenReturn(null);

        assertThatThrownBy(() -> service.confirm("SO1"))
                .isInstanceOf(BizException.class).hasMessageContaining("不存在");
        verify(snMapper, never()).updateById(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
        verify(soMapper, never()).updateById(any(SalesOrder.class));
    }

    @Test
    void confirmRejectsDuplicateScannedSnBeforeWriting() {
        SalesOrder so = order("scanning", List.of("S1", "S1"));
        so.setPlanTotal(2);
        when(soMapper.selectById("SO1")).thenReturn(so);

        assertThatThrownBy(() -> service.confirm("SO1"))
                .isInstanceOf(BizException.class).hasMessageContaining("重复");
        verify(snMapper, never()).updateById(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
    }

    @Test
    void confirmDistributionRecordsL1OutflowAndL2Inflow() {
        SalesOrder so = order("scanning", List.of("S1"));
        when(soMapper.selectById("SO1")).thenReturn(so);
        when(snMapper.selectById("S1")).thenReturn(sn("S1", "P1", "M", "腰带M"));

        service.confirm("SO1");

        ArgumentCaptor<com.ruilai.module.trade.entity.StockLog> logs =
                ArgumentCaptor.forClass(com.ruilai.module.trade.entity.StockLog.class);
        verify(stockLogMapper, times(2)).insert(logs.capture());
        assertThat(logs.getAllValues()).extracting(
                com.ruilai.module.trade.entity.StockLog::getAgentType,
                com.ruilai.module.trade.entity.StockLog::getAgentId,
                com.ruilai.module.trade.entity.StockLog::getDelta,
                com.ruilai.module.trade.entity.StockLog::getReason)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("l1", "L1A", -1, "销售出库"),
                        org.assertj.core.groups.Tuple.tuple("l2", "L2A", 1, "销售转入"));
    }

    @Test
    void singleProductAllowsEmptyBeltButPartIsRejected() {
        Product single = product("SINGLE", "单品", List.of("M"), List.of());
        single.setType("single");
        when(productMapper.selectById("SINGLE")).thenReturn(single);
        when(l2Mapper.selectById("L2A")).thenReturn(approvedL2());
        when(orderNos.next("SO")).thenReturn("SO-1");
        when(soMapper.insert(any(SalesOrder.class))).thenAnswer(inv -> {
            inserted = inv.getArgument(0);
            return 1;
        });
        when(soMapper.selectById(any())).thenAnswer(inv -> inserted);

        SalesOrder accepted = new SalesOrder();
        accepted.setL2Id("L2A");
        accepted.setLines(List.of(line("SINGLE", "M", "", 1)));
        assertThat(service.create(accepted).getPlanTotal()).isEqualTo(1);

        Product part = product("PART", "配件", List.of("M"), List.of());
        part.setType("part");
        when(productMapper.selectById("PART")).thenReturn(part);
        SalesOrder rejected = new SalesOrder();
        rejected.setL2Id("L2A");
        rejected.setLines(List.of(line("PART", "M", "", 1)));
        assertThatThrownBy(() -> service.create(rejected))
                .isInstanceOf(BizException.class).hasMessageContaining("配件");
    }

    @Test
    void saleDetailClassifiesStandardNonstandardAndSingleLines() {
        Product kit = product("KIT", "康复弹力套件",
                List.of("M", "L"), List.of("腰带M", "腰带S"));
        kit.setExtra(Map.of(
                "sizes", List.of("M", "L"),
                "belts", List.of("腰带M", "腰带S"),
                "stdCombos", List.of(Map.of("size", "M", "belt", "腰带M"))));
        Product single = product("SINGLE", "护膝单品", List.of("M"), List.of());
        single.setType("single");
        when(productMapper.selectById("KIT")).thenReturn(kit);
        when(productMapper.selectById("SINGLE")).thenReturn(single);

        SalesOrder order = new SalesOrder();
        order.setId("SO-CATEGORIES");
        order.setL1Id("L1A");
        order.setChannel("direct");
        order.setLines(new ArrayList<>(List.of(
                line("KIT", "M", "腰带M", 1),
                line("KIT", "L", "腰带S", 2),
                line("SINGLE", "M", "", 3))));
        order.setScanned(List.of());
        when(soMapper.selectById("SO-CATEGORIES")).thenReturn(order);

        SalesOrder detail = service.get("SO-CATEGORIES");

        assertThat(detail.getLines()).extracting(row -> row.get("category"))
                .containsExactly("standard", "nonstandard", "single");
        assertThat(detail.getLines()).extracting(row -> row.get("productName"))
                .containsExactly("康复弹力套件", "康复弹力套件", "护膝单品");
    }

    @Test
    void directBindRejectsNullCustomerAsBusinessError() {
        assertThatThrownBy(() -> service.directBind("S1", null, "", "", null, null, false))
                .isInstanceOf(BizException.class).hasMessageContaining("客户");
    }

    @Test
    void directBindReportsBothChecksWhenCloudMarketCannotResolve() {
        when(snMapper.selectById("S1")).thenReturn(sn("S1", "P1", "M", "腰带M"));
        when(customerMapper.selectList(any())).thenReturn(List.of());
        when(gateway.resolveActivateLocation("117.8.161.46", "浙江杭州", 120.1, 30.2))
                .thenReturn(Region.empty("cloud-market-ip"));
        when(gateway.locatePhone("13800138000"))
                .thenReturn(Region.empty("cloud-market-phone"));
        when(gateway.geocodeAddress("杭州市文一路1号"))
                .thenReturn(Region.of("浙江省", "杭州市", "330100", "test"));
        when(stockWarnService.resolve("L1A", null))
                .thenReturn(new StockWarnService.WarnMode(1.5, "strict", 1, 1.5));

        Map<String, Object> result = service.directBindBatch(
                List.of("S1"),
                Map.of("phone", "13800138000", "addr", "杭州市文一路1号"),
                "浙江杭州", "117.8.161.46", 120.1, 30.2, true);

        assertThat((List<String>) result.get("issues")).contains(
                "腾讯云市场未能解析扫码 IP，无法完成 IP 授权区域校验",
                "腾讯云市场未能解析手机号归属地，无法完成手机号授权区域校验");
    }

    @Test
    void directBindBatchCreatesOneOrderAndOneCustomerForEverySubmittedSn() {
        when(snMapper.selectById("S1")).thenReturn(sn("S1", "P1", "M", "腰带M"));
        when(snMapper.selectById("S2")).thenReturn(sn("S2", "P1", "L", "腰带L"));
        when(customerMapper.selectList(any())).thenReturn(List.of());
        when(gateway.resolveActivateLocation("", "", null, null))
                .thenReturn(Region.of("浙江省", "杭州市", "330100", "test"));
        when(gateway.locatePhone("13800000000"))
                .thenReturn(Region.of("浙江省", "杭州市", "330100", "test"));
        when(gateway.geocodeAddress("杭州市文一路1号"))
                .thenReturn(Region.of("浙江省", "杭州市", "330100", "test"));
        when(stockWarnService.resolve("L1A", null))
                .thenReturn(new StockWarnService.WarnMode(1.5, "strict", 1, 1.5));
        when(orderNos.next("SO")).thenReturn("SO-BATCH-1");

        Map<String, Object> result = service.directBindBatch(
                List.of("S1", "S2"),
                Map.of("phone", "13800000000", "addr", "杭州市文一路1号", "name", "张三"),
                "", "", null, null, false);

        ArgumentCaptor<SalesOrder> order = ArgumentCaptor.forClass(SalesOrder.class);
        verify(soMapper).insert(order.capture());
        assertThat(order.getValue().getScanned()).containsExactly("S1", "S2");
        assertThat(order.getValue().getPlanTotal()).isEqualTo(2);
        assertThat(order.getValue().getNo()).isEqualTo("SO-BATCH-1");

        ArgumentCaptor<Customer> customer = ArgumentCaptor.forClass(Customer.class);
        verify(customerMapper).insert(customer.capture());
        assertThat(customer.getValue().getSns()).containsExactly("S1", "S2");
        assertThat(customer.getValue().getOrderNo()).isEqualTo("SO-BATCH-1");
        assertThat(result.get("order")).isSameAs(order.getValue());
        verify(snMapper, times(2)).updateById(any(SnCode.class));
    }

    @Test
    void directBindBatchPrevalidatesEverySnBeforeAnyWrite() {
        when(snMapper.selectById("S1")).thenReturn(sn("S1", "P1", "M", "腰带M"));
        when(snMapper.selectById("MISSING")).thenReturn(null);

        assertThatThrownBy(() -> service.directBindBatch(
                List.of("S1", "MISSING"),
                Map.of("phone", "13800000000", "addr", "杭州市文一路1号"),
                "", "", null, null, false))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("MISSING");

        verify(soMapper, never()).insert(any(SalesOrder.class));
        verify(customerMapper, never()).insert(any(Customer.class));
        verify(snMapper, never()).updateById(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
        verify(eventWriter, never()).append(any(), any(), any(), any());
        verify(exceptionService, never()).raise(any(), any(), any(), any(), any(), any());
    }

    @Test
    void directBindBatchRejectsBlankOrNullMembersBeforeAnyLookupOrWrite() {
        Map<String, Object> customer = Map.of(
                "phone", "13800000000", "addr", "杭州市文一路1号");

        assertThatThrownBy(() -> service.directBindBatch(
                List.of("S1", ""), customer, "", "", null, null, false))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("不能为空");
        assertThatThrownBy(() -> service.directBindBatch(
                Arrays.asList("S1", null), customer, "", "", null, null, false))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("不能为空");

        verify(snMapper, never()).selectById(any());
        verify(soMapper, never()).insert(any(SalesOrder.class));
        verify(customerMapper, never()).insert(any(Customer.class));
        verify(snMapper, never()).updateById(any(SnCode.class));
        verify(stockLogMapper, never()).insert(any(com.ruilai.module.trade.entity.StockLog.class));
        verify(eventWriter, never()).append(any(), any(), any(), any());
        verify(exceptionService, never()).raise(any(), any(), any(), any(), any(), any());
    }

    @Test
    void sameCustomerAcrossMultipleProductsIsNotDuplicateIdentity() {
        Customer existing = new Customer();
        existing.setPhone("13800000000");
        existing.setName("张三");
        existing.setAddr("杭州市文一路1号");

        assertThat(SalesService.sameCustomerIdentity(existing, Map.of(
                "phone", "13800000000", "name", "张三", "addr", "杭州市文一路1号"))).isTrue();
        assertThat(SalesService.sameCustomerIdentity(existing, Map.of(
                "phone", "13800000000", "name", "李四", "addr", "杭州市文一路2号"))).isFalse();
    }

    private void login(String role, String agentId) {
        LoginUser user = new LoginUser();
        user.setRoleCode(role);
        user.setAgentId(agentId);
        user.setUsername(role.toLowerCase());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    private SalesOrder order(String status, List<String> scanned) {
        SalesOrder so = new SalesOrder();
        so.setId("SO1");
        so.setNo("SO-1");
        so.setChannel("distribute");
        so.setL1Id("L1A");
        so.setL2Id("L2A");
        so.setStatus(status);
        so.setPlanTotal(scanned.size());
        so.setLines(List.of(line("P1", "M", "腰带M", scanned.size())));
        so.setScanned(scanned);
        return so;
    }

    private Product product(String id, String name, List<String> sizes, List<String> belts) {
        Product p = new Product();
        p.setId(id);
        p.setName(name);
        p.setType("kit");
        p.setStatus("上架");
        p.setExtra(Map.of("sizes", sizes, "belts", belts));
        return p;
    }

    private AgentL2 approvedL2() {
        AgentL2 l2 = new AgentL2();
        l2.setId("L2A");
        l2.setName("二级A");
        l2.setParentId("L1A");
        l2.setAuditStatus("approved");
        l2.setPending(0);
        return l2;
    }

    private Map<String, Object> line(String productId, String size, String belt, int qty) {
        return new java.util.LinkedHashMap<>(Map.of(
                "productId", productId, "size", size, "belt", belt, "qty", qty));
    }

    private SnCode sn(String value, String productId, String size, String belt) {
        SnCode sn = new SnCode();
        sn.setSn(value);
        sn.setProductId(productId);
        sn.setSizeCode(size);
        sn.setBelt(belt);
        sn.setL1Id("L1A");
        sn.setStatus("l1");
        sn.setFrozen(0);
        return sn;
    }
}
