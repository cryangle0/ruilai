package com.ruilai.bootstrap;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.common.security.RolePerms;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.entity.SysRole;
import com.ruilai.module.account.mapper.SysAccountMapper;
import com.ruilai.module.account.mapper.SysRoleMapper;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.entity.SubAccount;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.agent.mapper.SubAccountMapper;
import com.ruilai.module.customer.entity.Customer;
import com.ruilai.module.customer.mapper.CustomerMapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.entity.ProductLine;
import com.ruilai.module.product.mapper.ProductLineMapper;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.SnWriter;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.entity.Notification;
import com.ruilai.module.system.entity.OpLog;
import com.ruilai.module.system.mapper.NotificationMapper;
import com.ruilai.module.system.mapper.OpLogMapper;
import com.ruilai.module.trade.ReturnApprovers;
import com.ruilai.module.trade.entity.PurchaseOrder;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.mapper.PurchaseOrderMapper;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoSeeder implements ApplicationRunner {

    private final SysAccountMapper accountMapper;
    private final SysRoleMapper roleMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final SubAccountMapper subMapper;
    private final ProductMapper productMapper;
    private final ProductLineMapper lineMapper;
    private final SnCodeMapper snMapper;
    private final PurchaseOrderMapper poMapper;
    private final SalesOrderMapper soMapper;
    private final ReturnOrderMapper rtMapper;
    private final ExceptionTicketMapper exMapper;
    private final CustomerMapper customerMapper;
    private final NotificationMapper notificationMapper;
    private final OpLogMapper opLogMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        Long n = accountMapper.selectCount(Wrappers.emptyWrapper());
        if (n == null || n == 0) {
            log.info("seeding ruilai demo data");
            seedRoles();
            seedAgents();
            seedProducts();
            seedAccounts();
            seedSns();
            seedOrders();
            seedMisc();
            log.info("ruilai demo seed done, login admin / demo ; ops / demo ; mini agent_hd / demo");
            return;
        }
        ensureRbac();
        ensureDemoAnchors();
    }

    private void seedRoles() {
        role("R1", "平台管理员", "全量后台权限", List.of("all"));
        role("R2", "一级代理主账号", "采购/销售/库存/下级/异常", List.of("purchase", "sales", "stock", "l2", "aftersale", "sub", "exception"));
        role("R3", "一级子账号", "仅销售扫码", List.of("sales_scan"));
        role("R4", "二级代理", "库存/销售/售后/异常", List.of("sales_view", "stock_self", "aftersale", "exception"));
        seedOpsRole();
    }

    private void role(String id, String name, String remark, List<String> perms) {
        SysRole r = new SysRole();
        r.setId(id);
        r.setName(name);
        r.setRemark(remark);
        r.setPerms(perms);
        roleMapper.insert(r);
    }

    private void seedAgents() {
        l1("L1A", "AG-L1-001", "华东锐涞总代", "张伟", "13800001111",
                List.of("浙江", "上海"), List.of("浙江", "上海", "江苏"),
                List.of("杭州市", "宁波市", "上海市", "苏州市"), "soft",
                Map.of("company", "杭州华东锐涞贸易有限公司", "creditCode", "91330100MA27XQ001A", "legal", "张伟"));
        l1("L1B", "AG-L1-002", "华南渠道中心", "李娜", "13900002222",
                List.of("广东"), List.of("广东", "福建"),
                List.of("广州市", "深圳市", "厦门市"), "strict",
                Map.of("company", "广州华南渠道管理有限公司", "legal", "李娜"));
        l1("L1C", "AG-L1-003", "华北联合代理", "王强", "13600003333",
                List.of("北京"), List.of("北京", "河北", "天津"),
                List.of("北京市", "天津市", "石家庄市"), "strict",
                Map.of("company", "北京华北联合商贸有限公司", "legal", "王强"));

        l2("L2A", "AG-L2-101", "杭州城西专营", "法人", "L1A", List.of("杭州市"), "approved", 0);
        l2("L2B", "AG-L2-102", "宁波海曙店", "个人", "L1A", List.of("宁波市"), "approved", 0);
        l2("L2C", "AG-L2-201", "广州天河渠道", "法人", "L1B", List.of("广州市"), "approved", 0);
        AgentL2 pending = l2("L2D", "AG-L2-088", "金华法人渠道", "法人", null, List.of(), "approved", 1);
        pending.setPrevParentId("L1A");
        pending.setPrevAreas(List.of("金华市"));
        l2Mapper.updateById(pending);
        l2("L2E", "AG-L2-103", "温州鹿城专营", "法人", "L1A", List.of("温州市"), "pending", 0);

        sub("SUB1", "L1A", "hd_scan_01", "仓管小陈");
        sub("SUB2", "L1A", "hd_scan_02", "仓管小周");
        sub("SUB3", "L1B", "hn_scan_01", "华南仓管阿强");
    }

    private void l1(String id, String code, String name, String contact, String phone,
                    List<String> main, List<String> sale, List<String> direct, String mode, Map<String, Object> ent) {
        AgentL1 a = new AgentL1();
        a.setId(id);
        a.setCode(code);
        a.setName(name);
        a.setContact(contact);
        a.setPhone(phone);
        a.setMainAreas(main);
        a.setSaleAreas(sale);
        a.setDirectAreas(direct);
        a.setWarnMultiplier(new BigDecimal("1.50"));
        a.setWarnMode(mode);
        a.setStatus("启用");
        a.setEnt(ent);
        l1Mapper.insert(a);
    }

    private AgentL2 l2(String id, String code, String name, String type, String parent, List<String> areas, String audit, int pending) {
        AgentL2 a = new AgentL2();
        a.setId(id);
        a.setCode(code);
        a.setName(name);
        a.setType(type);
        a.setParentId(parent);
        a.setAreas(areas);
        a.setStatus("启用");
        a.setPending(pending);
        a.setAuditStatus(audit);
        a.setProtocolOk(1);
        a.setWarnMultiplier(new BigDecimal("1.50"));
        a.setWarnMode("strict");
        l2Mapper.insert(a);
        return a;
    }

    private void sub(String id, String l1, String username, String name) {
        SubAccount s = new SubAccount();
        s.setId(id);
        s.setL1Id(l1);
        s.setUsername(username);
        s.setName(name);
        s.setStatus("启用");
        subMapper.insert(s);
    }

    private void seedProducts() {
        ProductLine med = new ProductLine();
        med.setId("PL-MED");
        med.setCode("MED");
        med.setName("医疗版");
        med.setActive(1);
        med.setNote("当前主产品线");
        lineMapper.insert(med);
        ProductLine youth = new ProductLine();
        youth.setId("PL-YOUTH");
        youth.setCode("YOUTH");
        youth.setName("青春版");
        youth.setActive(0);
        lineMapper.insert(youth);

        product("P1", "P-1001", "锐涞经典款套件", "kit", Map.of("compAName", "腰带", "compBName", "弹力带", "sizes", List.of("SS", "S", "M", "L", "LL")));
        product("P2", "P-1002", "锐涞运动款套件", "kit", Map.of("compAName", "腰带", "compBName", "弹力带"));
        product("P-SOCK", "P-SOCK-01", "袜子+鞋套套件", "kit", Map.of());
        product("P-SINGLE", "P-SINGLE-01", "锐涞护膝单品", "single", Map.of(
                "sizePool", List.of("S", "M", "L"),
                "sizes", List.of("S", "M", "L")));
        product("PART-BELT", "PART-BELT", "腰带规格", "part", Map.of());
        product("PART-SIL", "PART-SIL", "主体硅胶带", "part", Map.of());
    }

    private void product(String id, String code, String name, String type, Map<String, Object> extra) {
        Product p = new Product();
        p.setId(id);
        p.setCode(code);
        p.setName(name);
        p.setType(type);
        p.setStatus("上架");
        p.setLineId("PL-MED");
        p.setExtra(extra);
        productMapper.insert(p);
    }

    private void seedAccounts() {
        String hash = passwordEncoder.encode("demo");
        acc("admin", "平台管理员", "ADMIN", RolePerms.R1, null, "13800000001", hash);
        acc("admin2", "平台管理员B", "ADMIN", RolePerms.R1, null, "13800000002", hash);
        acc("ops", "运营专员", "ADMIN", RolePerms.R5, null, "13800000009", hash);
        acc("agent_hd", "华东锐涞总代", "L1", RolePerms.R2, "L1A", "13800001111", hash);
        acc("agent_hn", "华南渠道中心", "L1", RolePerms.R2, "L1B", "13900002222", hash);
        acc("agent_hb", "华北联合代理", "L1", RolePerms.R2, "L1C", "13600003333", hash);
        acc("agent_hz", "杭州城西专营", "L2", RolePerms.R4, "L2A", "13700001111", hash);
        acc("agent_nb", "宁波海曙店", "L2", RolePerms.R4, "L2B", "13700002222", hash);
        acc("agent_gz", "广州天河渠道", "L2", RolePerms.R4, "L2C", "13700003333", hash);
        acc("hd_scan_01", "仓管小陈", "SUB", RolePerms.R3, "L1A", "13600001111", hash);
        acc("hd_scan_02", "仓管小周", "SUB", RolePerms.R3, "L1A", "13600002222", hash);
    }

    private void acc(String username, String name, String role, String roleId, String agentId, String phone, String hash) {
        SysAccount a = new SysAccount();
        a.setUsername(username);
        a.setName(name);
        a.setRoleCode(role);
        a.setRoleId(roleId);
        a.setAgentId(agentId);
        a.setPhone(phone);
        a.setStatus("启用");
        a.setPasswordHash(hash);
        accountMapper.insert(a);
    }

    private void seedOpsRole() {
        if (roleMapper.selectById(RolePerms.R5) != null) {
            return;
        }
        role(RolePerms.R5, "运营专员", "采购/销售/库存/二级/售后/异常，不含一级管理/商品库/系统",
                List.of("purchase", "sales", "stock", "l2", "aftersale", "exception"));
    }

    private void ensureRbac() {
        seedOpsRole();
        List<SysAccount> accounts = accountMapper.selectList(Wrappers.emptyWrapper());
        for (SysAccount a : accounts) {
            if (a.getRoleId() == null || a.getRoleId().isBlank()) {
                a.setRoleId(RolePerms.defaultRoleId(a.getRoleCode()));
                accountMapper.updateById(a);
            }
        }
        if (accountMapper.selectOne(Wrappers.<SysAccount>lambdaQuery().eq(SysAccount::getUsername, "ops")) == null) {
            acc("ops", "运营专员", "ADMIN", RolePerms.R5, null, "13800000009", passwordEncoder.encode("demo"));
            log.info("seeded ops / demo (运营专员)");
        }
    }

    /** 重启时恢复长期演示锚点（测试误操作后可自愈） */
    private void ensureDemoAnchors() {
        AgentL2 wenzhou = l2Mapper.selectById("L2E");
        if (wenzhou != null && !"pending".equals(wenzhou.getAuditStatus())) {
            wenzhou.setAuditStatus("pending");
            l2Mapper.updateById(wenzhou);
            log.info("demo anchor: L2E 温州 auditStatus -> pending");
        }
        AgentL2 jinhua = l2Mapper.selectById("L2D");
        if (jinhua != null && (jinhua.getPending() == null || jinhua.getPending() != 1)) {
            jinhua.setPending(1);
            jinhua.setParentId(null);
            jinhua.setPrevParentId("L1A");
            if (jinhua.getPrevAreas() == null || jinhua.getPrevAreas().isEmpty()) {
                jinhua.setPrevAreas(List.of("金华市"));
            }
            jinhua.setAreas(List.of());
            jinhua.setAuditStatus("approved");
            l2Mapper.updateById(jinhua);
            log.info("demo anchor: L2D 金华 pending assign restored");
        }
        healLeftoverL2();
        healUserReturnApprover();
        healSingleProductSizes();
        healUnknownSaleProducts();
    }

    /** 退货/重分配曾因 updateById 跳过 null，留下 status=l1 仍挂 l2Id 的幽灵归属 */
    private void healLeftoverL2() {
        List<SnCode> rows = snMapper.selectList(Wrappers.<SnCode>lambdaQuery()
                .isNotNull(SnCode::getL2Id)
                .ne(SnCode::getL2Id, "")
                .in(SnCode::getStatus, List.of("l1", "warehouse")));
        int n = 0;
        for (SnCode row : rows) {
            if (!SnWriter.leftoverL2(row)) {
                continue;
            }
            String old = row.getL2Id();
            snMapper.clearL2Id(row.getSn());
            n++;
            log.info("demo heal: {} status={} cleared leftover l2Id {}", row.getSn(), row.getStatus(), old);
        }
        if (n > 0) {
            log.info("demo heal: cleared leftover l2Id on {} SN", n);
        }
    }

    private void healUserReturnApprover() {
        List<ReturnOrder> rows = rtMapper.selectList(Wrappers.<ReturnOrder>lambdaQuery()
                .eq(ReturnOrder::getType, "user")
                .and(w -> w.isNull(ReturnOrder::getApproverId).or().eq(ReturnOrder::getApproverId, "")));
        int n = 0;
        for (ReturnOrder row : rows) {
            String parent = null;
            if (StringUtils.hasText(row.getFromId())) {
                AgentL2 from = l2Mapper.selectById(row.getFromId());
                parent = from == null ? null : from.getParentId();
            }
            String snL1 = null;
            if (row.getSns() != null) {
                for (String sn : row.getSns()) {
                    SnCode code = snMapper.selectById(sn);
                    if (code != null && StringUtils.hasText(code.getL1Id())) {
                        snL1 = code.getL1Id();
                        break;
                    }
                }
            }
            String approver = ReturnApprovers.resolveUser(row.getApproverId(), null, null, parent, snL1);
            if (!StringUtils.hasText(approver)) {
                continue;
            }
            row.setApproverId(approver);
            rtMapper.updateById(row);
            n++;
            log.info("demo heal: {} set approverId {}", row.getNo(), approver);
        }
        if (n > 0) {
            log.info("demo heal: filled approverId on {} user returns", n);
        }
    }

    private void healSingleProductSizes() {
        List<Product> rows = productMapper.selectList(Wrappers.<Product>lambdaQuery().eq(Product::getType, "single"));
        int n = 0;
        for (Product row : rows) {
            Map<String, Object> extra = row.getExtra() == null ? new HashMap<>() : new HashMap<>(row.getExtra());
            Object sizes = extra.get("sizes");
            Object pool = extra.get("sizePool");
            boolean sizesEmpty = sizes == null || (sizes instanceof List<?> list && list.isEmpty());
            if (!sizesEmpty || !(pool instanceof List<?> pl) || pl.isEmpty()) {
                continue;
            }
            extra.put("sizes", new ArrayList<>(pl));
            row.setExtra(extra);
            productMapper.updateById(row);
            n++;
            log.info("demo heal: {} copied sizePool -> sizes", row.getId());
        }
        if (n > 0) {
            log.info("demo heal: filled sizes on {} singles", n);
        }
    }

    private void healUnknownSaleProducts() {
        List<SalesOrder> rows = soMapper.selectList(Wrappers.emptyWrapper());
        int n = 0;
        for (SalesOrder row : rows) {
            if (!StringUtils.hasText(row.getProductId()) || productMapper.selectById(row.getProductId()) != null) {
                continue;
            }
            String old = row.getProductId();
            row.setProductId("P1");
            soMapper.updateById(row);
            n++;
            log.info("demo heal: {} productId {} -> P1", row.getNo(), old);
        }
        if (n > 0) {
            log.info("demo heal: remapped {} sales to P1", n);
        }
    }

    private void seedSns() {
        for (int i = 1; i <= 30; i++) {
            sn(pad("RL20260801", i), "P1", "M", "腰带M", "L1A", null, i <= 25 ? "l1" : "warehouse", null);
        }
        for (int i = 31; i <= 50; i++) {
            sn(pad("RL20260801", i), "P1", "L", "腰带L", "L1A", null, "l1", null);
        }
        for (int i = 51; i <= 60; i++) {
            sn(pad("RL20260801", i), "P1", "S", "腰带M", "L1A", null, "l1", List.of("个性化"));
        }
        Map<Integer, Map<String, Object>> hz = Map.of(
                1, user("陈敏", "女", "28", "13800001001", "杭州市西湖区文一路1号", "浙江"),
                2, user("王芳", "女", "32", "13800001002", "杭州市西湖区文一路1号", "浙江"),
                3, user("李强", "男", "41", "13800001003", "杭州市西湖区文一路1号", "浙江"),
                4, user("赵磊", "男", "36", "13800001004", "杭州市西湖区文一路1号", "广东"),
                5, user("周婷", "女", "29", "13800001005", "杭州市西湖区文一路1号", "浙江"),
                6, user("吴杰", "男", "45", "13800001006", "杭州市西湖区文一路1号", "浙江")
        );
        for (int i = 1; i <= 12; i++) {
            String code = pad("RL20260720", i);
            if (i == 7) {
                SnCode row = sn(code, "P1", "M", "腰带M", "L1A", "L2A", "l2", List.of("已退货", "修理过"));
                row.setReIn(1);
                row.setPrevUserJson(user("孙悦", "女", "33", "13800001007", "杭州市余杭区", "浙江"));
                snMapper.updateById(row);
                continue;
            }
            boolean bound = i <= 6;
            SnCode row = sn(code, "P1", "M", "腰带M", "L1A", "L2A", bound ? "bound" : "l2", null);
            if (bound) {
                row.setUserJson(hz.get(i));
                row.setBindIpRegion(i == 4 ? "广东" : "浙江");
                row.setSoldAt(LocalDateTime.of(2026, 7, 25, 12, 0));
                row.setBindAt(row.getSoldAt());
                snMapper.updateById(row);
                upsertCustomer(hz.get(i), "L1A", "L2A", code);
            }
        }
        for (int i = 1; i <= 6; i++) {
            boolean bound = i <= 2;
            String code = pad("RL20260721", i);
            SnCode row = sn(code, "P1", "L", "腰带L", "L1A", "L2B", bound ? "bound" : "l2", null);
            if (bound) {
                Map<String, Object> u = i == 1
                        ? user("郑浩", "男", "38", "13500004001", "宁波市海曙区中山东路88号", "江苏")
                        : user("钱丽", "女", "27", "13500004002", "宁波市海曙区中山东路88号", "江苏");
                row.setUserJson(u);
                row.setBindIpRegion("浙江");
                snMapper.updateById(row);
                upsertCustomer(u, "L1A", "L2B", code);
            }
        }
        for (int i = 1; i <= 25; i++) {
            boolean toL2 = i <= 5;
            sn(pad("RL20260802", i), "P2", "LL", "腰带LL", "L1B", toL2 ? "L2C" : null, toL2 ? "l2" : "l1", null);
        }
        SnCode f1 = sn("RL202606150001", "P1", "M", "腰带M", null, null, "warehouse", List.of("已冻结"));
        f1.setFrozen(1);
        snMapper.updateById(f1);
        SnCode f2 = sn("RL202606150002", "P1", "S", "腰带S", null, null, "warehouse", List.of("已冻结"));
        f2.setFrozen(1);
        snMapper.updateById(f2);

        bindDirect("RL202608050001", "P2", "M", "L1B", user("刘洋", "男", "34", "13900002201", "广州市天河区体育西路8号", "广东"));
        bindDirect("RL202608030001", "P1", "L", "L1A", user("王芳", "女", "31", "13700001108", "杭州市西湖区文三路100号", "浙江"));
        bindDirect("RL202608060001", "P1", "S", "L1C", user("赵磊", "男", "42", "13600003321", "北京市朝阳区建国路88号", "北京"));
        bindDirect("RL202608060002", "P1", "S", "L1C", user("赵磊", "男", "42", "13600003321", "北京市朝阳区建国路88号", "北京"));
    }

    private SnCode sn(String sn, String product, String size, String belt, String l1, String l2, String status, List<String> tags) {
        SnCode row = new SnCode();
        row.setSn(sn);
        row.setProductId(product);
        row.setSizeCode(size);
        row.setBelt(belt);
        row.setL1Id(l1);
        row.setL2Id(l2);
        row.setStatus(status);
        row.setTags(tags);
        row.setFrozen(0);
        row.setReIn(0);
        row.setResale(0);
        snMapper.insert(row);
        return row;
    }

    private void bindDirect(String sn, String product, String size, String l1, Map<String, Object> user) {
        SnCode row = sn(sn, product, size, "腰带" + size, l1, null, "bound", null);
        row.setUserJson(user);
        row.setBindIpRegion(String.valueOf(user.get("phoneLoc")));
        row.setSoldAt(LocalDateTime.of(2026, 8, 5, 11, 20));
        row.setBindAt(row.getSoldAt());
        snMapper.updateById(row);
        upsertCustomer(user, l1, null, sn);
    }

    private void upsertCustomer(Map<String, Object> u, String l1, String l2, String sn) {
        String phone = String.valueOf(u.get("phone"));
        Customer c = customerMapper.selectOne(Wrappers.<Customer>lambdaQuery().eq(Customer::getPhone, phone).last("limit 1"));
        if (c == null) {
            c = new Customer();
            c.setId("CU" + phone.substring(phone.length() - 4));
            c.setName(String.valueOf(u.get("name")));
            c.setGender(String.valueOf(u.get("gender")));
            c.setAge(String.valueOf(u.get("age")));
            c.setPhone(phone);
            c.setPhoneLoc(String.valueOf(u.get("phoneLoc")));
            c.setAddr(String.valueOf(u.get("addr")));
            c.setSns(new ArrayList<>(List.of(sn)));
            c.setL1Id(l1);
            c.setL2Id(l2);
            try {
                customerMapper.insert(c);
            } catch (Exception ignored) {
                c.setId("CU" + System.nanoTime());
                customerMapper.insert(c);
            }
        } else {
            List<String> sns = c.getSns() == null ? new ArrayList<>() : new ArrayList<>(c.getSns());
            if (!sns.contains(sn)) {
                sns.add(sn);
            }
            c.setSns(sns);
            customerMapper.updateById(c);
        }
    }

    private Map<String, Object> user(String name, String gender, String age, String phone, String addr, String loc) {
        Map<String, Object> m = new HashMap<>();
        m.put("name", name);
        m.put("gender", gender);
        m.put("age", age);
        m.put("phone", phone);
        m.put("addr", addr);
        m.put("phoneLoc", loc);
        return m;
    }

    private void seedOrders() {
        po("PO0", "PO20260801003", "L1A", "approved",
                List.of(line("P1", "M", 30, "腰带M"), line("P1", "L", 20, "腰带L")),
                Map.of("P1_M_腰带M", List.of("RL202608010001-RL202608010030")),
                Map.of("admin1", true, "admin2", true));
        po("PO1", "PO20260807021", "L1A", "pending",
                List.of(line("P1", "M", 10, "腰带M")), Map.of(), Map.of("admin1", false, "admin2", false));
        po("PO3", "PO20260802008", "L1B", "approved",
                List.of(line("P2", "LL", 25, "腰带LL")),
                Map.of("P2_LL_腰带LL", List.of("RL202608020001-RL202608020025")),
                Map.of("admin1", true, "admin2", true));
        po("PO4", "PO20260806030", "L1A", "cosigning",
                List.of(line("P1", "SS", 8, "腰带SS")),
                Map.of("P1_SS_腰带SS", List.of("RL202608060001-RL202608060008")),
                Map.of("admin1", true, "admin2", false));

        so("SO1", "SO20260720088", "distribute", "L1A", "L2A", "P1", "done",
                List.of("RL202607200009", "RL202607200010", "RL202607200011", "RL202607200012"), null);
        so("SO3", "SO20260807095", "distribute", "L1A", "L2A", "P1", "scanning",
                List.of("RL202608010001", "RL202608010002"), null);
        so("SO5", "SO20260725100", "direct", "L1A", null, "P1", "done",
                List.of("RL202607200001", "RL202607200002"),
                user("陈敏", "女", "28", "13800001001", "杭州市西湖区文一路1号", "浙江"));

        rt("RT1", "RTU2026080101", "user", "终端用户退货", "L2A", "杭州城西专营", "L1A",
                List.of("RL202607200007"), "done", "尺码不合适", "尺码");
        rt("RT2", "RT2026080402", "l2_to_l1", "二级退一级", "L2A", "杭州城西专营", "L1A",
                List.of("RL202607200011"), "done", "质量问题：面料起球", "质量");
        rt("RT3", "RT2026080403", "l1_to_factory", "一级退原厂", "L1A", "华东锐涞总代", null,
                List.of("RL202608010041"), "pending", "批次瑕疵，申请退回原厂", "批次");
        rt("RT7", "RT2026080707", "l1_to_factory", "一级退原厂", "L1A", "华东锐涞总代", null,
                List.of("RL202608010042", "RL202608010043"), "pending", "包装破损，申请退原厂", "批次");
    }

    private Map<String, Object> line(String productId, String size, int qty, String belt) {
        return Map.of("productId", productId, "size", size, "qty", qty, "belt", belt);
    }

    private void po(String id, String no, String l1, String status, List<Map<String, Object>> lines,
                    Map<String, Object> segments, Map<String, Object> cosign) {
        PurchaseOrder p = new PurchaseOrder();
        p.setId(id);
        p.setNo(no);
        p.setL1Id(l1);
        p.setStatus(status);
        p.setLines(lines);
        p.setCustomLines(List.of());
        p.setParts(List.of());
        p.setSegments(segments);
        p.setCosign(new HashMap<>(cosign));
        if ("approved".equals(status)) {
            p.setApprovedAt(LocalDateTime.of(2026, 8, 1, 10, 8));
        }
        poMapper.insert(p);
    }

    private void so(String id, String no, String channel, String l1, String l2, String product, String status,
                    List<String> scanned, Map<String, Object> customer) {
        SalesOrder s = new SalesOrder();
        s.setId(id);
        s.setNo(no);
        s.setChannel(channel);
        s.setL1Id(l1);
        s.setL2Id(l2);
        s.setProductId(product);
        s.setPlanTotal(scanned.size());
        s.setScanned(scanned);
        s.setStatus(status);
        s.setCustomer(customer);
        soMapper.insert(s);
    }

    private void rt(String id, String no, String type, String label, String fromId, String fromName, String approver,
                    List<String> sns, String status, String reason, String reasonType) {
        ReturnOrder r = new ReturnOrder();
        r.setId(id);
        r.setNo(no);
        r.setType(type);
        r.setTypeLabel(label);
        r.setFromId(fromId);
        r.setFromName(fromName);
        r.setApproverId(approver);
        r.setSns(sns);
        r.setStatus(status);
        r.setReason(reason);
        r.setReasonType(reasonType);
        rtMapper.insert(r);
    }

    private void seedMisc() {
        ex("EX1", "归属地异常", "RL202607200004", "手机归属广东 · IP地区浙江不一致", "activate", "待处理");
        ex("EX2", "SN激活异常", "RL202607210001", "跨区激活：IP 浙江 不在直销围栏", "activate", "待处理");
        ex("EX3", "销售库存异常", "广州天河渠道 · 锐涞运动款LL", "本次新增 5 > 预警线", "stock", "待处理");
        ex("EX6", "扫码尺码不匹配", "RL202608010001", "出货计划 M，实扫 SN 为 L", "scan", "待处理");
        notify("N1", "预警：归属地异常", "RL202607200004 · 手机归属不匹配");
        notify("N2", "退货待审", "杭州城西专营提交二级退一级");
        notify("N3", "二级待分配", "金华法人渠道待重新绑定一级");
        OpLog log = new OpLog();
        log.setOccurredAt(LocalDateTime.of(2026, 8, 7, 14, 20));
        log.setAccount("admin");
        log.setRoleName("平台管理员");
        log.setAction("登录后台");
        log.setIp("10.0.1.8");
        log.setOk(1);
        log.setType("login");
        opLogMapper.insert(log);
    }

    private void ex(String id, String type, String target, String detail, String dim, String status) {
        ExceptionTicket t = new ExceptionTicket();
        t.setId(id);
        t.setOccurredAt(LocalDateTime.of(2026, 8, 7, 10, 0));
        t.setType(type);
        t.setTarget(target);
        t.setDetail(detail);
        t.setNotifyTo("一级+原厂");
        t.setStatus(status);
        t.setDim(dim);
        exMapper.insert(t);
    }

    private void notify(String id, String title, String body) {
        Notification n = new Notification();
        n.setId(id);
        n.setOccurredAt(LocalDateTime.of(2026, 8, 7, 11, 0));
        n.setTitle(title);
        n.setBody(body);
        n.setToRole("原厂");
        n.setReadFlag(0);
        notificationMapper.insert(n);
    }

    private static String pad(String prefix, int i) {
        return prefix + String.format("%04d", i);
    }
}
