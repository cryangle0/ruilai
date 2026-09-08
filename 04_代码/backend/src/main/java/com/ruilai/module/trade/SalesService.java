package com.ruilai.module.trade;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.thirdparty.GeoFence;
import com.ruilai.common.thirdparty.Region;
import com.ruilai.common.thirdparty.ThirdPartyGateway;
import com.ruilai.common.util.Ids;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.customer.entity.Customer;
import com.ruilai.module.customer.mapper.CustomerMapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.ExceptionService;
import com.ruilai.module.risk.StockWarnService;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.entity.StockLog;
import com.ruilai.module.trade.mapper.SalesOrderMapper;
import com.ruilai.module.trade.mapper.StockLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SalesOrderMapper soMapper;
    private final SnCodeMapper snMapper;
    private final StockLogMapper stockLogMapper;
    private final CustomerMapper customerMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final ProductMapper productMapper;
    private final OrderNoGenerator orderNos;
    private final LogService logService;
    private final SnEventWriter eventWriter;
    private final ThirdPartyGateway gateway;
    private final ExceptionService exceptionService;
    private final StockWarnService stockWarnService;

    public PageResult<SalesOrder> page(long page, long size, String channel, String status, String l1Id, String l2Id,
                                       String from, String to, String sn) {
        var q = Wrappers.<SalesOrder>lambdaQuery();
        LoginUser u = AuthUtil.current();
        if ("L2".equals(u.getRoleCode())) {
            q.eq(SalesOrder::getL2Id, u.getAgentId());
        } else if (!u.isAdmin()) {
            q.eq(SalesOrder::getL1Id, u.getAgentId());
            if (StringUtils.hasText(l2Id)) {
                requireChild(l2Id, u.getAgentId());
                q.eq(SalesOrder::getL2Id, l2Id);
            }
        } else {
            if (StringUtils.hasText(l1Id)) {
                q.eq(SalesOrder::getL1Id, l1Id);
            }
            if (StringUtils.hasText(l2Id)) {
                q.eq(SalesOrder::getL2Id, l2Id);
            }
        }
        if (StringUtils.hasText(channel)) {
            q.eq(SalesOrder::getChannel, channel);
        }
        if (StringUtils.hasText(status)) {
            q.eq(SalesOrder::getStatus, status);
        }
        if (StringUtils.hasText(from)) {
            q.ge(SalesOrder::getCreatedAt, java.time.LocalDate.parse(from).atStartOfDay());
        }
        if (StringUtils.hasText(to)) {
            q.le(SalesOrder::getCreatedAt, java.time.LocalDate.parse(to).plusDays(1).atStartOfDay());
        }
        if (StringUtils.hasText(sn)) {
            q.apply("JSON_SEARCH(scanned, 'one', {0}) IS NOT NULL", sn.trim());
        }
        q.orderByDesc(SalesOrder::getCreatedAt);
        PageResult<SalesOrder> result = PageResult.of(soMapper.selectPage(Page.of(page, size), q));
        result.list().forEach(this::enrich);
        return result;
    }

    public Map<String, Object> summary(String channel, String l1Id, String l2Id, String from, String to) {
        PageResult<SalesOrder> hist = page(1, 5000, channel, null, l1Id, l2Id, null, null, null);
        PageResult<SalesOrder> range = page(1, 5000, channel, null, l1Id, l2Id, from, to, null);
        int histQty = hist.list().stream().mapToInt(this::saleQty).sum();
        int rangeQty = range.list().stream().mapToInt(this::saleQty).sum();
        long distN = range.list().stream().filter(s -> "distribute".equals(s.getChannel())).count();
        long dirN = range.list().stream().filter(s -> "direct".equals(s.getChannel())).count();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rangeQty", rangeQty);
        out.put("histQty", histQty);
        out.put("distN", distN);
        out.put("dirN", dirN);
        out.put("allN", range.total());
        return out;
    }

    public SalesOrder get(String id) {
        SalesOrder row = soMapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "销售单不存在");
        }
        assertCanAccess(row);
        enrich(row);
        return row;
    }

    private void assertCanAccess(SalesOrder so) {
        LoginUser u = AuthUtil.current();
        if (u.isAdmin()) {
            return;
        }
        if ("L2".equals(u.getRoleCode())) {
            if (!u.getAgentId().equals(so.getL2Id())) {
                throw new BizException(ErrCode.FORBIDDEN, "无权查看该销售单");
            }
            return;
        }
        if (!u.getAgentId().equals(so.getL1Id())) {
            throw new BizException(ErrCode.FORBIDDEN, "无权操作该销售单");
        }
    }

    public SalesOrder create(SalesOrder body) {
        LoginUser u = AuthUtil.current();
        if ("SUB".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "子账号不可改单");
        }
        if (!u.isAdmin()) {
            if ("L2".equals(u.getRoleCode())) {
                throw new BizException(ErrCode.FORBIDDEN, "二级不可创建分销单");
            }
            body.setL1Id(u.getAgentId());
        } else if (!StringUtils.hasText(body.getL1Id())) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择一级代理");
        }
        if (!StringUtils.hasText(body.getChannel())) {
            body.setChannel("distribute");
        }
        AgentL2 l2 = null;
        if ("distribute".equals(body.getChannel())) {
            if (!StringUtils.hasText(body.getL2Id())) {
                throw new BizException(ErrCode.BAD_REQUEST, "请选择二级代理");
            }
            l2 = requireChild(body.getL2Id(), body.getL1Id());
        }
        validateAndEnrichLines(body);
        body.setId(Ids.next("SO"));
        body.setNo(orderNos.next("SO"));
        body.setStatus("scanning");
        if (body.getScanned() == null) {
            body.setScanned(new ArrayList<>());
        }
        body.setPlanTotal(sumLines(body));
        soMapper.insert(body);
        if ("distribute".equals(body.getChannel())) {
            Map<String, Integer> byProduct = plannedByProduct(body);
            AgentL2 target = l2;
            byProduct.forEach((productId, qty) ->
                    stockWarnService.checkOverOrder(body.getL1Id(), body.getL2Id(), productId, qty, target.getName()));
        }
        logService.record("创建销售单 " + body.getNo(), "op", true);
        return get(body.getId());
    }

    @Transactional
    public SalesOrder scan(String soId, String sn) {
        LoginUser scanner = AuthUtil.current();
        if ("L2".equals(scanner.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "二级不向更下级出货，请用直销激活");
        }
        SalesOrder so = soMapper.selectById(soId);
        if (so == null) {
            throw new BizException(ErrCode.NOT_FOUND, "销售单不存在");
        }
        assertCanAccess(so);
        if (!"scanning".equals(so.getStatus()) && !"pending".equals(so.getStatus())) {
            throw BizException.state("当前销售单不可扫码");
        }
        SnCode row = snMapper.selectById(sn);
        if (row == null) {
            exceptionService.raise("扫码不在库", sn, "扫出的 SN 不存在", "scan", "strict", so.getL2Id());
            throw new BizException(ErrCode.BAD_REQUEST, "SN 不存在");
        }
        if (row.getFrozen() != null && row.getFrozen() == 1) {
            throw new BizException(ErrCode.BAD_REQUEST, "SN 已冻结，不可出货");
        }
        LoginUser u = AuthUtil.current();
        String l1 = u.isAdmin() ? so.getL1Id() : ("SUB".equals(u.getRoleCode()) ? so.getL1Id() : u.getAgentId());
        if (l1 == null) {
            l1 = so.getL1Id();
        }
        if (!"l1".equals(row.getStatus()) || (l1 != null && !l1.equals(row.getL1Id()))) {
            exceptionService.raise("扫码不在库", sn, "SN 不在本一级仓库（当前 " + row.getStatus() + "）", "scan", "strict", so.getL2Id());
            throw new BizException(ErrCode.BAD_REQUEST, "SN 不在本仓");
        }
        if (so.getScanned() != null && so.getScanned().contains(sn)) {
            throw new BizException(ErrCode.BAD_REQUEST, "该 SN 已扫入本单");
        }
        Map<String, Object> matchedLine = matchingLine(so, row);
        if (so.getLines() != null && !so.getLines().isEmpty() && matchedLine == null) {
            exceptionService.raise("扫码商品不匹配", sn, "SN 商品 " + row.getProductId() + " 非本单 " + so.getProductId(),
                    "scan", "strict", so.getL2Id());
            throw new BizException(ErrCode.BAD_REQUEST, "SN 商品规格不在本单计划中");
        }
        if ((so.getLines() == null || so.getLines().isEmpty())
                && StringUtils.hasText(so.getProductId()) && StringUtils.hasText(row.getProductId())
                && !so.getProductId().equals(row.getProductId())) {
            exceptionService.raise("扫码商品不匹配", sn, "SN 商品 " + row.getProductId() + " 非本单 " + so.getProductId(),
                    "scan", "strict", so.getL2Id());
            throw new BizException(ErrCode.BAD_REQUEST, "非本单商品，不可扫入");
        }
        int plan = so.getPlanTotal() == null ? 0 : so.getPlanTotal();
        int alreadyTotal = so.getScanned() == null ? 0 : so.getScanned().size();
        if (plan > 0 && alreadyTotal >= plan) {
            exceptionService.raise("扫码超量", sn, "出货计划 " + plan + " 已满，实扫超量", "scan", "strict", so.getL2Id());
            throw new BizException(ErrCode.BAD_REQUEST, "已达计划数量，不可再扫");
        }
        if (matchedLine != null) {
            long already = so.getScanned() == null ? 0 : so.getScanned().stream()
                    .map(snMapper::selectById)
                    .filter(x -> x != null && sameSpec(x, matchedLine))
                    .count();
            if (already >= toLong(matchedLine.get("qty"))) {
                exceptionService.raise("扫码规格不匹配", sn, "出货规格计划已满，实扫超量",
                        "scan", "strict", so.getL2Id());
                throw new BizException(ErrCode.BAD_REQUEST, "该商品规格计划已满，不可再扫");
            }
        } else if (so.getPlanBySize() != null && row.getSizeCode() != null) {
            Object need = so.getPlanBySize().get(row.getSizeCode());
            if (need != null) {
                long already = so.getScanned() == null ? 0 : so.getScanned().stream()
                        .map(snMapper::selectById)
                        .filter(x -> x != null && row.getSizeCode().equals(x.getSizeCode()))
                        .count();
                if (already >= toLong(need)) {
                    exceptionService.raise("扫码尺码不匹配", sn, "出货计划 " + row.getSizeCode() + " 已满，实扫超量",
                            "scan", "strict", so.getL2Id());
                    throw new BizException(ErrCode.BAD_REQUEST, "该尺码计划已满，不可再扫");
                }
            }
        }
        List<String> scanned = so.getScanned() == null ? new ArrayList<>() : new ArrayList<>(so.getScanned());
        scanned.add(sn);
        so.setScanned(scanned);
        so.setStatus("scanning");
        soMapper.updateById(so);
        logService.record("扫码出货 " + sn + " → " + so.getNo(), "op", true);
        return get(so.getId());
    }

    @Transactional
    public SalesOrder confirm(String soId) {
        if ("SUB".equals(AuthUtil.current().getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "子账号不可确认出货单");
        }
        SalesOrder so = soMapper.selectById(soId);
        if (so == null) {
            throw new BizException(ErrCode.NOT_FOUND, "销售单不存在");
        }
        assertCanAccess(so);
        List<String> scanned = so.getScanned() == null ? List.of() : so.getScanned();
        if (scanned.isEmpty()) {
            throw new BizException(ErrCode.BAD_REQUEST, "尚未扫入任何 SN");
        }
        int plan = so.getPlanTotal() == null ? 0 : so.getPlanTotal();
        if (plan > 0 && scanned.size() < plan) {
            throw new BizException(ErrCode.BAD_REQUEST, "已扫数量不足计划（" + scanned.size() + "/" + plan + "）");
        }
        Map<String, Integer> inboundBySpec = new HashMap<>();
        for (String sn : scanned) {
            SnCode row = snMapper.selectById(sn);
            if (row == null) {
                continue;
            }
            if ("distribute".equals(so.getChannel())) {
                row.setL2Id(so.getL2Id());
                row.setStatus("l2");
                row.setSoldAt(ChinaTime.now());
                eventWriter.append(row, "销售转入二级", so.getNo(), "sales");
            }
            snMapper.updateById(row);
            String key = str(row.getProductId()) + "|" + (row.getSizeCode() == null ? "" : row.getSizeCode());
            inboundBySpec.merge(key, 1, Integer::sum);
            StockLog log = new StockLog();
            log.setId(Ids.next("H"));
            log.setAgentType("l2");
            log.setAgentId(so.getL2Id());
            log.setProductId(row.getProductId());
            log.setSizeCode(row.getSizeCode());
            log.setDelta(1);
            log.setReason("销售转入");
            log.setRefNo(so.getNo());
            log.setOccurredAt(ChinaTime.now());
            stockLogMapper.insert(log);
        }
        so.setStatus("done");
        soMapper.updateById(so);
        if ("distribute".equals(so.getChannel()) && StringUtils.hasText(so.getL2Id())) {
            AgentL2 l2 = l2Mapper.selectById(so.getL2Id());
            String label = l2 == null ? so.getL2Id() : l2.getName();
            inboundBySpec.forEach((key, qty) -> {
                String[] parts = key.split("\\|", -1);
                stockWarnService.checkInbound(so.getL1Id(), so.getL2Id(), parts[0],
                        parts[1].isEmpty() ? null : parts[1], qty, label);
            });
        }
        logService.record("确认销售单 " + so.getNo(), "op", true);
        return get(so.getId());
    }

    @Transactional
    public Map<String, Object> directBind(String sn, Map<String, Object> customer, String hintRegion,
                                          String clientIp, Double lng, Double lat, boolean dryRun) {
        LoginUser u = AuthUtil.current();
        if ("SUB".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "子账号不可直销激活");
        }
        String l1Id = u.isAdmin() ? str(customer == null ? null : customer.get("l1Id")) : u.getAgentId();
        if ("null".equalsIgnoreCase(l1Id)) {
            l1Id = null;
        }
        SnCode row = snMapper.selectById(sn);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "SN 不存在");
        }
        if (row.getFrozen() != null && row.getFrozen() == 1) {
            throw new BizException(ErrCode.BAD_REQUEST, "已冻结 SN 不可激活");
        }
        boolean l2Stock = "L2".equals(u.getRoleCode());
        if (l2Stock) {
            if (!"l2".equals(row.getStatus()) || !u.getAgentId().equals(row.getL2Id())) {
                throw new BizException(ErrCode.BAD_REQUEST, "SN 不在本二级仓库");
            }
        } else if (!"l1".equals(row.getStatus())
                || (StringUtils.hasText(l1Id) && !l1Id.equals(row.getL1Id()))) {
            throw new BizException(ErrCode.BAD_REQUEST, "SN 不在本一级仓库");
        }
        AgentL1 agent = l1Mapper.selectById(row.getL1Id());
        AgentL2 l2 = row.getL2Id() == null ? null : l2Mapper.selectById(row.getL2Id());
        String warnMode = stockWarnService.resolve(row.getL1Id(), row.getL2Id()).mode();
        List<String> fence = l2Stock && l2 != null && l2.getAreas() != null && !l2.getAreas().isEmpty()
                ? l2.getAreas()
                : (agent == null ? List.of() : agent.getDirectAreas());
        List<String> saleAreas = agent == null ? List.of() : (agent.getSaleAreas() == null ? List.of() : agent.getSaleAreas());

        Region loc = gateway.resolveActivateLocation(clientIp, hintRegion, lng, lat);
        String phone = str(customer.get("phone"));
        if (!StringUtils.hasText(phone)) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写手机号");
        }
        Region phoneReg = gateway.locatePhone(phone);
        String addr = str(customer.get("addr"));
        Region addrReg = gateway.geocodeAddress(addr);

        List<String> issues = new ArrayList<>();
        Map<String, Object> locMap = loc.toMap();
        locMap.put("ip", clientIp);
        if (!loc.ok()) {
            issues.add("未能解析激活位置（请配置高德/腾讯 Key 或授权定位）");
        } else if (fence != null && !fence.isEmpty() && !gateway.inFence(loc, fence)) {
            String msg = "直售跨区激活：定位 " + loc.display() + " 不在授权围栏 " + String.join("、", fence);
            issues.add(msg);
            if (!dryRun) {
                exceptionService.raise("SN激活异常", sn, msg, "activate", warnMode, row.getL2Id());
            }
        }
        if (phoneReg.ok() && fence != null && !fence.isEmpty() && !gateway.inFence(phoneReg, fence)
                && !GeoFence.provinceInSaleAreas(phoneReg, saleAreas)) {
            String msg = "手机归属 " + phoneReg.display() + " 不在授权区域";
            issues.add(msg);
            if (!dryRun) {
                exceptionService.raise("归属地异常", sn, msg, "activate", warnMode, row.getL2Id());
            }
        }
        if (phoneReg.ok() && loc.ok() && !gateway.phoneMatchesAddress(phoneReg, loc)) {
            String msg = "手机归属" + phoneReg.display() + " · IP地区" + loc.display() + "不一致";
            issues.add(msg);
            if (!dryRun) {
                exceptionService.raise("归属地异常", sn, msg, "activate", warnMode, row.getL2Id());
            }
        }
        if (phoneReg.ok() && addrReg.ok() && !gateway.phoneMatchesAddress(phoneReg, addrReg)) {
            String msg = "异常销售预警：手机归属" + phoneReg.display() + " 与填写地址" + addrReg.display() + "不一致";
            issues.add(msg);
            if (!dryRun) {
                exceptionService.raise("归属地异常", sn, msg, "activate", warnMode, row.getL2Id());
            }
        }
        if (StringUtils.hasText(phone)) {
            long dup = snMapper.selectCount(Wrappers.<SnCode>lambdaQuery()
                    .eq(SnCode::getStatus, "bound")
                    .ne(SnCode::getSn, sn)
                    .apply("JSON_UNQUOTE(JSON_EXTRACT(user_json,'$.phone')) = {0}", phone));
            if (dup > 0) {
                String msg = "手机号 " + phone + " 已激活过";
                issues.add("手机号重复激活");
                if (!dryRun) {
                    exceptionService.raise("客户信息重复", sn, msg, "activate", warnMode, row.getL2Id());
                }
            }
        }
        if (StringUtils.hasText(addr)) {
            String core = addr.replaceAll("\\s+", "");
            if (core.length() >= 6) {
                List<Customer> sameAddr = customerMapper.selectList(Wrappers.<Customer>lambdaQuery()
                        .ne(Customer::getPhone, phone)
                        .like(Customer::getAddr, core.substring(0, Math.min(12, core.length()))));
                if (!sameAddr.isEmpty()) {
                    String msg = "地址疑似同一地点：已有客户 " + sameAddr.get(0).getPhone();
                    issues.add(msg);
                    if (!dryRun) {
                        exceptionService.raise("客户信息重复", sn, msg, "activate", warnMode, row.getL2Id());
                    }
                }
            }
        }

        if (dryRun) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("sn", sn);
            preview.put("issues", issues);
            preview.put("dryRun", true);
            preview.put("location", locMap);
            preview.put("phoneLoc", phoneReg.toMap());
            return preview;
        }

        Map<String, Object> user = customer == null ? new HashMap<>() : new HashMap<>(customer);
        user.put("phone", phone);
        user.put("addr", addr);
        user.put("phoneLoc", phoneReg.ok() ? phoneReg.display() : str(customer.get("phoneLoc")));
        user.put("ipRegion", loc.display());
        user.put("locate", locMap);
        user.put("phoneLocate", phoneReg.toMap());
        user.put("addrLocate", addrReg.toMap());

        row.setStatus("bound");
        row.setSoldAt(ChinaTime.now());
        row.setBindAt(ChinaTime.now());
        row.setBindIpRegion(loc.display());
        row.setUserJson(user);
        eventWriter.append(row, "销售到C端",
                phone + " · " + loc.display() + " · " + addr, "bind");
        snMapper.updateById(row);

        SalesOrder so = new SalesOrder();
        so.setId(Ids.next("SO"));
        so.setNo(orderNos.next("SO"));
        so.setChannel("direct");
        so.setL1Id(row.getL1Id());
        so.setL2Id(row.getL2Id());
        so.setProductId(row.getProductId());
        so.setPlanTotal(1);
        so.setPlanBySize(Map.of(row.getSizeCode() == null ? "-" : row.getSizeCode(), 1));
        so.setScanned(List.of(sn));
        so.setStatus("done");
        so.setCustomer(user);
        soMapper.insert(so);

        upsertCustomer(user, row, sn);
        logService.record("直销激活 " + sn, "op", true);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sn", sn);
        out.put("issues", issues);
        out.put("order", so);
        out.put("location", locMap);
        out.put("phoneLoc", phoneReg.toMap());
        return out;
    }

    private void enrich(SalesOrder so) {
        if (so.getL1Id() != null) {
            AgentL1 a = l1Mapper.selectById(so.getL1Id());
            so.setL1Name(a == null ? so.getL1Id() : a.getName());
        }
        if (so.getL2Id() != null) {
            AgentL2 a = l2Mapper.selectById(so.getL2Id());
            so.setL2Name(a == null ? so.getL2Id() : a.getName());
        }
        if (so.getProductId() != null) {
            Product p = productMapper.selectById(so.getProductId());
            so.setProductName(p == null ? so.getProductId() : p.getName());
        }
        if (so.getLines() != null) {
            for (Map<String, Object> line : so.getLines()) {
                String productId = str(line.get("productId"));
                Product p = StringUtils.hasText(productId) ? productMapper.selectById(productId) : null;
                if (p != null) {
                    line.put("productName", p.getName());
                }
            }
        }
        so.setProductDetail(detailOf(so));
        so.setWarnEx(stockWarnService.warnMeta(
                so.getL1Id(), "direct".equals(so.getChannel()) ? null : so.getL2Id()));
        fillSnRows(so);
    }

    private void fillSnRows(SalesOrder so) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (so.getScanned() != null) {
            for (String sn : so.getScanned()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("sn", sn);
                SnCode s = snMapper.selectById(sn);
                if (s != null) {
                    item.put("size", s.getSizeCode());
                    item.put("belt", s.getBelt());
                    item.put("productId", s.getProductId());
                    Product p = s.getProductId() == null ? null : productMapper.selectById(s.getProductId());
                    item.put("productName", p == null ? s.getProductId() : p.getName());
                    item.put("status", s.getStatus());
                    Map<String, Object> u = s.getUserJson() != null ? s.getUserJson() : s.getPrevUserJson();
                    if (u != null) {
                        item.put("user", (str(u.get("phone")) + " " + str(u.get("addr"))).trim());
                        item.put("customer", u);
                    } else {
                        item.put("user", "—");
                    }
                } else {
                    item.put("size", "—");
                    item.put("belt", "—");
                    item.put("user", "—");
                }
                rows.add(item);
            }
        }
        so.setSnRows(rows);
    }

    private String detailOf(SalesOrder so) {
        String name = StringUtils.hasText(so.getProductName())
                ? so.getProductName()
                : (so.getProductId() == null ? "" : so.getProductId());
        if (so.getLines() != null && !so.getLines().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> line : so.getLines()) {
                if (sb.length() > 0) {
                    sb.append("，");
                }
                Object lineName = line.get("productName");
                String item = lineName == null || String.valueOf(lineName).isBlank()
                        ? name
                        : String.valueOf(lineName);
                if (StringUtils.hasText(item)) {
                    sb.append(item).append("/");
                }
                sb.append(line.getOrDefault("size", "")).append(line.getOrDefault("belt", ""))
                        .append("×").append(line.getOrDefault("qty", 1));
            }
            return sb.toString();
        }
        if (so.getPlanBySize() != null && !so.getPlanBySize().isEmpty()) {
            String prefix = StringUtils.hasText(name) ? name + "/" : "";
            return so.getPlanBySize().entrySet().stream()
                    .map(e -> prefix + e.getKey() + "×" + e.getValue())
                    .reduce((a, b) -> a + "，" + b).orElse("");
        }
        return name;
    }

    private int saleQty(SalesOrder s) {
        if (s.getScanned() != null && !s.getScanned().isEmpty()) {
            return s.getScanned().size();
        }
        return s.getPlanTotal() == null ? 0 : s.getPlanTotal();
    }

    private static int sumLines(SalesOrder body) {
        int n = 0;
        if (body.getLines() != null) {
            for (Map<String, Object> line : body.getLines()) {
                n += (int) toLong(line.get("qty"));
            }
        }
        if (n == 0 && body.getPlanBySize() != null) {
            for (Object v : body.getPlanBySize().values()) {
                n += (int) toLong(v);
            }
        }
        return n;
    }

    private AgentL2 requireChild(String l2Id, String l1Id) {
        AgentL2 l2 = l2Mapper.selectById(l2Id);
        if (l2 == null || !"approved".equals(l2.getAuditStatus())
                || !StringUtils.hasText(l1Id) || !l1Id.equals(l2.getParentId())) {
            throw new BizException(ErrCode.FORBIDDEN, "只能选择当前一级已审核的下属二级");
        }
        return l2;
    }

    private void validateAndEnrichLines(SalesOrder body) {
        if (body.getLines() != null && !body.getLines().isEmpty()) {
            for (Map<String, Object> line : body.getLines()) {
                String productId = str(line.get("productId"));
                String size = str(line.get("size"));
                String belt = str(line.get("belt"));
                long qty = toLong(line.get("qty"));
                if (!StringUtils.hasText(productId) || !StringUtils.hasText(size)
                        || !StringUtils.hasText(belt) || qty <= 0) {
                    throw new BizException(ErrCode.BAD_REQUEST, "每个销售明细须填写商品、尺码、腰带和正数数量");
                }
                Product product = requireOnShelfProduct(productId);
                if (!maintainedSpec(product, size, belt)) {
                    throw new BizException(ErrCode.BAD_REQUEST, "商品规格不在维护范围：" + product.getName());
                }
                line.put("productName", product.getName());
            }
            return;
        }
        if (!StringUtils.hasText(body.getProductId())) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写销售商品明细");
        }
        Product product = requireOnShelfProduct(body.getProductId());
        body.setProductName(product.getName());
    }

    private Product requireOnShelfProduct(String productId) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new BizException(ErrCode.BAD_REQUEST, "商品不存在：" + productId);
        }
        if (!"上架".equals(product.getStatus())) {
            throw new BizException(ErrCode.BAD_REQUEST, "商品未上架：" + product.getName());
        }
        return product;
    }

    private static boolean maintainedSpec(Product product, String size, String belt) {
        Map<String, Object> extra = product.getExtra();
        if (extra == null) {
            return true;
        }
        if (!containsIfMaintained(extra.get("sizes"), size)
                || !containsIfMaintained(extra.get("sizePool"), size)
                || !containsIfMaintained(extra.get("belts"), belt)) {
            return false;
        }
        if (extra.get("stdCombos") instanceof List<?> combos && !combos.isEmpty()) {
            return combos.stream().anyMatch(raw -> raw instanceof Map<?, ?> combo
                    && size.equals(str(combo.get("size"))) && belt.equals(str(combo.get("belt"))));
        }
        return true;
    }

    private static boolean containsIfMaintained(Object raw, String value) {
        return !(raw instanceof List<?> list) || list.isEmpty()
                || list.stream().map(String::valueOf).anyMatch(value::equals);
    }

    private static Map<String, Integer> plannedByProduct(SalesOrder body) {
        Map<String, Integer> out = new LinkedHashMap<>();
        if (body.getLines() != null && !body.getLines().isEmpty()) {
            body.getLines().forEach(line -> out.merge(str(line.get("productId")),
                    (int) toLong(line.get("qty")), Integer::sum));
        } else {
            out.put(body.getProductId(), body.getPlanTotal() == null ? 0 : body.getPlanTotal());
        }
        return out;
    }

    private static Map<String, Object> matchingLine(SalesOrder so, SnCode row) {
        if (so.getLines() == null) {
            return null;
        }
        List<Map<String, Object>> matches = so.getLines().stream().filter(line -> sameSpec(row, line)).toList();
        if (matches.isEmpty()) {
            return null;
        }
        Map<String, Object> aggregate = new HashMap<>(matches.get(0));
        aggregate.put("qty", matches.stream().mapToLong(line -> toLong(line.get("qty"))).sum());
        return aggregate;
    }

    private static boolean sameSpec(SnCode row, Map<String, Object> line) {
        return str(line.get("productId")).equals(str(row.getProductId()))
                && str(line.get("size")).equals(str(row.getSizeCode()))
                && str(line.get("belt")).equals(str(row.getBelt()));
    }

    private void upsertCustomer(Map<String, Object> customer, SnCode row, String sn) {
        String phone = str(customer.get("phone"));
        Customer c = null;
        if (StringUtils.hasText(phone)) {
            c = customerMapper.selectOne(Wrappers.<Customer>lambdaQuery().eq(Customer::getPhone, phone).last("limit 1"));
        }
        if (c == null) {
            c = new Customer();
            c.setId(Ids.next("CU"));
            c.setPhone(phone);
            c.setName(str(customer.get("name")));
            c.setGender(str(customer.get("gender")));
            c.setAge(str(customer.get("age")));
            c.setPhoneLoc(str(customer.get("phoneLoc")));
            c.setAddr(str(customer.get("addr")));
            c.setNote(str(customer.get("note")));
            c.setSns(new ArrayList<>(List.of(sn)));
            c.setL1Id(row.getL1Id());
            c.setL2Id(row.getL2Id());
            customerMapper.insert(c);
        } else {
            List<String> sns = c.getSns() == null ? new ArrayList<>() : new ArrayList<>(c.getSns());
            if (!sns.contains(sn)) {
                sns.add(sn);
            }
            c.setSns(sns);
            if (StringUtils.hasText(str(customer.get("phoneLoc")))) {
                c.setPhoneLoc(str(customer.get("phoneLoc")));
            }
            customerMapper.updateById(c);
        }
    }

    private static long toLong(Object v) {
        if (v instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (Exception e) {
            return 0;
        }
    }

    private static String str(Object v) {
        return v == null || "null".equals(String.valueOf(v)) ? "" : String.valueOf(v);
    }
}
