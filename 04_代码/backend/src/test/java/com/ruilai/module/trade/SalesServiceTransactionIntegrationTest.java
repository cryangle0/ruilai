package com.ruilai.module.trade;

import com.ruilai.common.security.LoginUser;
import com.ruilai.common.thirdparty.Region;
import com.ruilai.common.thirdparty.ThirdPartyGateway;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.module.risk.ExceptionService;
import com.ruilai.module.risk.StockWarnService;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.system.LogService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(
        classes = SalesServiceTransactionIntegrationTest.TestApplication.class,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:activation;MODE=MySQL;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.hikari.connection-init-sql=SELECT 1",
                "spring.flyway.enabled=false",
                "spring.task.scheduling.enabled=false"
        })
class SalesServiceTransactionIntegrationTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EnableTransactionManagement
    @MapperScan({
            "com.ruilai.module.agent.mapper",
            "com.ruilai.module.customer.mapper",
            "com.ruilai.module.product.mapper",
            "com.ruilai.module.risk.mapper",
            "com.ruilai.module.sn.mapper",
            "com.ruilai.module.system.mapper",
            "com.ruilai.module.trade.mapper"
    })
    @Import({SalesService.class, ExceptionService.class, SnEventWriter.class})
    static class TestApplication { }

    @MockBean
    OrderNoGenerator orderNos;
    @MockBean
    LogService logService;
    @MockBean
    ThirdPartyGateway gateway;
    @MockBean
    StockWarnService stockWarnService;

    private final SalesService service;
    private final JdbcTemplate jdbc;

    @Autowired
    SalesServiceTransactionIntegrationTest(SalesService service, JdbcTemplate jdbc) {
        this.service = service;
        this.jdbc = jdbc;
    }

    @BeforeEach
    void setUp() {
        for (String table : List.of("notification", "exception_ticket", "stock_log", "customer",
                "sales_order", "sn_code", "agent_l1")) {
            jdbc.execute("DROP TABLE IF EXISTS " + table);
        }
        jdbc.execute("""
                CREATE TABLE agent_l1 (
                  id VARCHAR(32) PRIMARY KEY, code VARCHAR(64), name VARCHAR(128), contact VARCHAR(64),
                  phone VARCHAR(20), main_areas VARCHAR(1000), sale_areas VARCHAR(1000),
                  direct_areas VARCHAR(1000), warn_multiplier DECIMAL(6,2), warn_mode VARCHAR(16),
                  status VARCHAR(16), ent VARCHAR(1000), extra VARCHAR(1000), disable_cosign VARCHAR(1000),
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.execute("""
                CREATE TABLE sn_code (
                  sn VARCHAR(64) PRIMARY KEY, product_id VARCHAR(32), size_code VARCHAR(32), belt VARCHAR(32),
                  l1_id VARCHAR(32), l2_id VARCHAR(32), status VARCHAR(16), tags VARCHAR(1000),
                  frozen TINYINT DEFAULT 0, factory_at TIMESTAMP, sold_at TIMESTAMP, return_at TIMESTAMP,
                  bind_at TIMESTAMP, bind_ip_region VARCHAR(64), user_json VARCHAR(4000),
                  prev_user_json VARCHAR(4000), events VARCHAR(4000), extra VARCHAR(4000),
                  re_in TINYINT DEFAULT 0, resale TINYINT DEFAULT 0,
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.execute("""
                CREATE TABLE sales_order (
                  id VARCHAR(32) PRIMARY KEY, no VARCHAR(32), channel VARCHAR(16), l1_id VARCHAR(32),
                  l2_id VARCHAR(32), product_id VARCHAR(32), plan_total INT, plan_by_size VARCHAR(4000),
                  `lines` VARCHAR(4000), scanned VARCHAR(4000), status VARCHAR(16), customer VARCHAR(4000),
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.execute("""
                CREATE TABLE customer (
                  id VARCHAR(32) PRIMARY KEY, name VARCHAR(64), gender VARCHAR(8), age VARCHAR(8),
                  phone VARCHAR(20), phone_loc VARCHAR(32), addr VARCHAR(255), note VARCHAR(255),
                  sns VARCHAR(4000), order_no VARCHAR(4), l1_id VARCHAR(32), l2_id VARCHAR(32),
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.execute("""
                CREATE TABLE stock_log (
                  id VARCHAR(32) PRIMARY KEY, agent_type VARCHAR(8), agent_id VARCHAR(32),
                  product_id VARCHAR(32), size_code VARCHAR(32), delta INT, reason VARCHAR(64),
                  ref_no VARCHAR(64), occurred_at TIMESTAMP,
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.execute("""
                CREATE TABLE exception_ticket (
                  id VARCHAR(32) PRIMARY KEY, occurred_at TIMESTAMP, type VARCHAR(64), target VARCHAR(128),
                  detail VARCHAR(512), notify_to VARCHAR(64), status VARCHAR(16), dim VARCHAR(16),
                  explain_txt VARCHAR(512), explain_l2 VARCHAR(512), dup_phone VARCHAR(20), extra VARCHAR(4000),
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.execute("""
                CREATE TABLE notification (
                  id VARCHAR(32) PRIMARY KEY, occurred_at TIMESTAMP, title VARCHAR(255), body VARCHAR(1000),
                  route VARCHAR(255), to_role VARCHAR(64), read_flag TINYINT,
                  created_at TIMESTAMP, updated_at TIMESTAMP, deleted TINYINT DEFAULT 0
                )
                """);
        jdbc.update("""
                INSERT INTO agent_l1
                  (id, code, name, direct_areas, sale_areas, warn_multiplier, warn_mode, status, deleted)
                VALUES ('L1A', 'L1A', '一级A', '["北京市"]', '[]', 1.5, 'strict', '启用', 0)
                """);
        jdbc.update("""
                INSERT INTO sn_code
                  (sn, product_id, size_code, belt, l1_id, status, frozen, events, deleted)
                VALUES ('S1', 'P1', 'M', 'B1', 'L1A', 'l1', 0, '[]', 0)
                """);

        LoginUser user = new LoginUser();
        user.setRoleCode("L1");
        user.setAgentId("L1A");
        user.setUsername("l1");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));

        when(orderNos.next("SO")).thenReturn("SO-FAIL");
        when(stockWarnService.resolve("L1A", null))
                .thenReturn(new StockWarnService.WarnMode(1.5, "strict", 2, 2));
        when(gateway.resolveActivateLocation(anyString(), any(), any(), any()))
                .thenReturn(Region.of("上海市", "上海市", "310000", "test"));
        when(gateway.locatePhone(anyString())).thenReturn(Region.empty("test"));
        when(gateway.geocodeAddress(anyString())).thenReturn(Region.empty("test"));
        when(gateway.inFence(any(), any())).thenReturn(false);
    }

    @AfterEach
    void clearLogin() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void lateCustomerConstraintFailureRollsBackEveryActivationWrite() {
        assertThatThrownBy(() -> service.directBindBatch(
                List.of("S1"),
                Map.of("phone", "13800000000", "addr", "北京市朝阳区测试路1号"),
                "", "127.0.0.1", 121.0, 31.0, false))
                .isInstanceOf(RuntimeException.class);

        assertThat(jdbc.queryForObject("SELECT status FROM sn_code WHERE sn='S1'", String.class)).isEqualTo("l1");
        assertThat(jdbc.queryForObject("SELECT events FROM sn_code WHERE sn='S1'", String.class)).isEqualTo("[]");
        assertThat(count("stock_log")).isZero();
        assertThat(count("exception_ticket")).isZero();
        assertThat(count("notification")).isZero();
        assertThat(count("sales_order")).isZero();
        assertThat(count("customer")).isZero();
    }

    private long count(String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
    }
}
