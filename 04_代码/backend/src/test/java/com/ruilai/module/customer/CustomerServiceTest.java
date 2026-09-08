package com.ruilai.module.customer;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.module.customer.entity.Customer;
import com.ruilai.module.customer.mapper.CustomerMapper;
import com.ruilai.module.product.mapper.ProductMapper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
