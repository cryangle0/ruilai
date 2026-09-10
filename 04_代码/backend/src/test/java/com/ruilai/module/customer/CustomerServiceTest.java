package com.ruilai.module.customer;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.module.customer.entity.Customer;
import com.ruilai.module.customer.mapper.CustomerMapper;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {
    @Mock CustomerMapper mapper;
    @Mock SnCodeMapper snMapper;
    @Mock ProductMapper productMapper;
    @InjectMocks CustomerService service;

    @BeforeEach
    void login() {
        LoginUser user = new LoginUser();
        user.setRoleCode("L1");
        user.setAgentId("L1A");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getReturnsEnrichedCustomerInsideCurrentScope() {
        Customer row = customer("C1", "L1A", null);
        when(mapper.selectById("C1")).thenReturn(row);
        when(mapper.selectList(any())).thenReturn(List.of(row));

        Customer result = service.get("C1");

        assertThat(result.getProducts()).isEmpty();
        assertThat(result.getSnRows()).isEmpty();
        assertThat(result.getHistQty()).isZero();
        assertThat(result.getRangeQty()).isZero();
        assertThat(result.getDupPhone()).isFalse();
        assertThat(result.getDupAddr()).isFalse();
    }

    @Test
    void getRejectsCustomerOutsideCurrentScope() {
        when(mapper.selectById("C2")).thenReturn(customer("C2", "L1B", null));

        assertThatThrownBy(() -> service.get("C2"))
                .isInstanceOfSatisfying(BizException.class,
                        ex -> assertThat(ex.getErrCode()).isEqualTo(ErrCode.FORBIDDEN));
    }

    @Test
    void getReportsMissingCustomer() {
        when(mapper.selectById("missing")).thenReturn(null);

        assertThatThrownBy(() -> service.get("missing"))
                .isInstanceOfSatisfying(BizException.class,
                        ex -> assertThat(ex.getErrCode()).isEqualTo(ErrCode.NOT_FOUND));
    }

    @Test
    void pageAppliesSaleDateAndKeepsPhoneAndAddressFlagsTogether() {
        Customer september = customer("C1", "L1A", null);
        september.setPhone("13800000000");
        september.setAddr("杭州市文一路1号");
        september.setSns(List.of("S1"));
        Customer august = customer("C2", "L1A", null);
        august.setPhone("13800000000");
        august.setAddr("杭州市文一路1号");
        august.setSns(List.of("S2"));
        when(mapper.selectList(any())).thenReturn(List.of(september, august));
        when(mapper.selectList(isNull())).thenReturn(List.of(september, august));

        SnCode s1 = soldSn("S1", LocalDateTime.of(2026, 9, 3, 10, 0));
        SnCode s2 = soldSn("S2", LocalDateTime.of(2026, 8, 20, 10, 0));
        when(snMapper.selectBatchIds(any())).thenReturn(List.of(s1, s2));

        CustomerPageResult result = service.page(
                1, 20, "", "", "", "", "", "", "",
                "2026-09-01", "2026-09-30", "");

        assertThat(result.total()).isEqualTo(1);
        assertThat(result.list()).extracting(Customer::getId).containsExactly("C1");
        assertThat(result.list().get(0).getDupPhone()).isTrue();
        assertThat(result.list().get(0).getDupAddr()).isTrue();
    }

    @Test
    void pageMarksLikelySameAddressButNotDifferentRoadNumbers() {
        Customer eightyEight = customer("C1", "L1A", null);
        eightyEight.setPhone("13900000123");
        eightyEight.setAddr("北京市东城区人民路88号101");
        eightyEight.setSns(List.of("S1"));
        Customer eightyEightNoise = customer("C2", "L1A", null);
        eightyEightNoise.setPhone("13900000124");
        eightyEightNoise.setAddr("北京 市 东城 区 人民路88号 101室");
        eightyEightNoise.setSns(List.of("S2"));
        Customer roadTwo = customer("C3", "L1A", null);
        roadTwo.setPhone("13000000002");
        roadTwo.setAddr("北京市北京市东城区人民路2号101室");
        roadTwo.setSns(List.of("S3"));
        when(mapper.selectList(any())).thenReturn(List.of(eightyEight, eightyEightNoise, roadTwo));
        when(mapper.selectList(isNull())).thenReturn(List.of(eightyEight, eightyEightNoise, roadTwo));
        when(snMapper.selectBatchIds(any())).thenReturn(List.of());

        CustomerPageResult result = service.page(
                1, 20, "", "", "", "", "", "", "", "", "", "");

        Customer c1 = result.list().stream().filter(c -> "C1".equals(c.getId())).findFirst().orElseThrow();
        Customer c2 = result.list().stream().filter(c -> "C2".equals(c.getId())).findFirst().orElseThrow();
        Customer c3 = result.list().stream().filter(c -> "C3".equals(c.getId())).findFirst().orElseThrow();
        assertThat(c1.getDupAddr()).isTrue();
        assertThat(c2.getDupAddr()).isTrue();
        assertThat(c3.getDupAddr()).isFalse();
        assertThat(c1.getDupPhone()).isFalse();
    }

    @Test
    void pageShowsPhoneAndAddressMarksTogetherWhenBothMatch() {
        Customer first = customer("C1", "L1A", null);
        first.setPhone("13800001001");
        first.setAddr("杭州市西湖区文一路1号");
        first.setSns(List.of("S1"));
        Customer second = customer("C2", "L1A", null);
        second.setPhone("13800001001");
        second.setAddr("杭州 西湖区 文一路1号");
        second.setSns(List.of("S2"));
        when(mapper.selectList(any())).thenReturn(List.of(first, second));
        when(mapper.selectList(isNull())).thenReturn(List.of(first, second));
        when(snMapper.selectBatchIds(any())).thenReturn(List.of());

        CustomerPageResult result = service.page(
                1, 20, "", "", "", "", "", "", "", "", "", "");

        assertThat(result.list()).allSatisfy(row -> {
            assertThat(row.getDupPhone()).isTrue();
            assertThat(row.getDupAddr()).isTrue();
        });
    }

    @Test
    void pageExcludesRowsWhoseSaleTimeIsOutsideFilter() {
        Customer august31 = customer("C1", "L1A", null);
        august31.setSns(List.of("S31"));
        august31.setCreatedAt(LocalDateTime.of(2026, 8, 31, 12, 0));
        Customer missingSn = customer("C2", "L1A", null);
        missingSn.setSns(List.of("GONE"));
        missingSn.setCreatedAt(LocalDateTime.of(2026, 8, 31, 12, 0));
        when(mapper.selectList(any())).thenReturn(List.of(august31, missingSn));
        when(mapper.selectList(isNull())).thenReturn(List.of(august31, missingSn));
        when(snMapper.selectBatchIds(any())).thenReturn(List.of(
                soldSn("S31", LocalDateTime.of(2026, 8, 31, 10, 0))));

        CustomerPageResult result = service.page(
                1, 20, "", "", "", "", "", "", "",
                "2026-08-01", "2026-08-26", "");

        assertThat(result.total()).isZero();
        assertThat(result.list()).isEmpty();
    }

    private SnCode soldSn(String sn, LocalDateTime soldAt) {
        SnCode row = new SnCode();
        row.setSn(sn);
        row.setProductId("P1");
        row.setStatus("bound");
        row.setSoldAt(soldAt);
        return row;
    }

    private Customer customer(String id, String l1Id, String l2Id) {
        Customer c = new Customer();
        c.setId(id);
        c.setL1Id(l1Id);
        c.setL2Id(l2Id);
        c.setPhone("13800000000");
        c.setAddr("测试地址");
        c.setSns(List.of());
        return c;
    }
}
