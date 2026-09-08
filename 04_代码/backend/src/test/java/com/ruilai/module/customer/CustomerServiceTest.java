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
