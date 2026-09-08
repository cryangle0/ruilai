package com.ruilai.module.customer;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.util.Ids;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.module.customer.entity.Customer;
import com.ruilai.module.customer.mapper.CustomerMapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerMapper mapper;
    private final SnCodeMapper snMapper;
    private final ProductMapper productMapper;

    public Customer get(String id) {
        Customer row = mapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "客户不存在");
        }
        LoginUser u = AuthUtil.current();
        boolean allowed = u.isAdmin()
                || ("L2".equals(u.getRoleCode()) && u.getAgentId().equals(row.getL2Id()))
                || (!"L2".equals(u.getRoleCode()) && u.getAgentId().equals(row.getL1Id()));
        if (!allowed) {
            throw new BizException(ErrCode.FORBIDDEN, "无权查看该客户");
        }
        enrich(List.of(row), null, null);
        List<Customer> duplicates = !StringUtils.hasText(row.getPhone()) && !StringUtils.hasText(row.getAddr())
                ? List.of()
                : mapper.selectList(Wrappers.<Customer>lambdaQuery()
                        .and(w -> w.eq(StringUtils.hasText(row.getPhone()), Customer::getPhone, row.getPhone())
                                .or().eq(StringUtils.hasText(row.getAddr()), Customer::getAddr, row.getAddr())));
        row.setDupPhone(StringUtils.hasText(row.getPhone()) && duplicates.stream()
                .anyMatch(c -> !row.getId().equals(c.getId()) && row.getPhone().equals(c.getPhone())));
        row.setDupAddr(StringUtils.hasText(row.getAddr()) && duplicates.stream()
                .anyMatch(c -> !row.getId().equals(c.getId()) && row.getAddr().equals(c.getAddr())));
        return row;
    }

    public CustomerPageResult page(long page, long size, String keyword, String l1Id, String l2Id,
                                     String sn, String phone, String addr, String mark,
                                     String from, String to, String channel) {
        var q = Wrappers.<Customer>lambdaQuery();
        LoginUser u = AuthUtil.current();
        if ("L2".equals(u.getRoleCode())) {
            q.eq(Customer::getL2Id, u.getAgentId());
        } else if (!u.isAdmin()) {
            q.eq(Customer::getL1Id, u.getAgentId());
        } else {
            if (StringUtils.hasText(l1Id)) {
                q.eq(Customer::getL1Id, l1Id);
            }
            if (StringUtils.hasText(l2Id)) {
                q.eq(Customer::getL2Id, l2Id);
            }
        }
        if (!StringUtils.hasText(l2Id) && "direct".equals(channel)) {
            q.and(w -> w.isNull(Customer::getL2Id).or().eq(Customer::getL2Id, ""));
        } else if (!StringUtils.hasText(l2Id) && "distribute".equals(channel)) {
            q.isNotNull(Customer::getL2Id).ne(Customer::getL2Id, "");
        }
        if (StringUtils.hasText(keyword)) {
            q.and(w -> w.like(Customer::getName, keyword)
                    .or().like(Customer::getPhone, keyword)
                    .or().like(Customer::getAddr, keyword));
        }
        if (StringUtils.hasText(phone)) {
            q.and(w -> w.like(Customer::getPhone, phone).or().like(Customer::getName, phone));
        }
        if (StringUtils.hasText(addr)) {
            q.like(Customer::getAddr, addr);
        }
        if (StringUtils.hasText(sn)) {
            q.apply("CAST(sns AS CHAR) LIKE {0}", "%" + sn + "%");
        }
        q.orderByDesc(Customer::getUpdatedAt);
        List<Customer> all = mapper.selectList(q);
        if (all == null) {
            all = new ArrayList<>();
        } else {
            all = new ArrayList<>(all);
        }
        Map<String, Long> phoneCnt = new HashMap<>();
        Map<String, Long> addrCnt = new HashMap<>();
        for (Customer c : mapper.selectList(null)) {
            if (StringUtils.hasText(c.getPhone())) phoneCnt.merge(c.getPhone(), 1L, Long::sum);
            if (StringUtils.hasText(c.getAddr())) addrCnt.merge(c.getAddr(), 1L, Long::sum);
        }
        enrich(all, from, to);
        for (Customer c : all) {
            c.setDupPhone(StringUtils.hasText(c.getPhone()) && phoneCnt.getOrDefault(c.getPhone(), 0L) > 1);
            c.setDupAddr(StringUtils.hasText(c.getAddr()) && addrCnt.getOrDefault(c.getAddr(), 0L) > 1);
        }
        if ("phone".equals(mark)) {
            all.removeIf(c -> !Boolean.TRUE.equals(c.getDupPhone()));
        } else if ("addr".equals(mark)) {
            all.removeIf(c -> !Boolean.TRUE.equals(c.getDupAddr()));
        } else if ("1".equals(mark)) {
            // 兼容旧链接中的“仅重复”筛选值。
            all.removeIf(c -> !Boolean.TRUE.equals(c.getDupPhone()) && !Boolean.TRUE.equals(c.getDupAddr()));
        }
        int histSum = all.stream().mapToInt(c -> c.getHistQty() == null ? 0 : c.getHistQty()).sum();
        if (StringUtils.hasText(from) || StringUtils.hasText(to)) {
            all.removeIf(c -> c.getRangeQty() == null || c.getRangeQty() <= 0);
        }
        int rangeSum = all.stream().mapToInt(c -> c.getRangeQty() == null ? 0 : c.getRangeQty()).sum();
        long total = all.size();
        long p = Math.max(1, page);
        long s = Math.max(1, size);
        int fromIdx = (int) ((p - 1) * s);
        List<Customer> slice = fromIdx >= all.size()
                ? List.of()
                : new ArrayList<>(all.subList(fromIdx, Math.min(all.size(), fromIdx + (int) s)));
        return new CustomerPageResult(total, slice, rangeSum, histSum);
    }

    private void enrich(List<Customer> list, String from, String to) {
        if (list == null || list.isEmpty()) {
            return;
        }
        Set<String> sns = new HashSet<>();
        for (Customer c : list) {
            if (c.getSns() != null) {
                sns.addAll(c.getSns());
            }
        }
        Map<String, SnCode> snMap = new HashMap<>();
        if (!sns.isEmpty()) {
            for (SnCode row : snMapper.selectBatchIds(sns)) {
                snMap.put(row.getSn(), row);
            }
        }
        Map<String, String> productNames = new HashMap<>();
        for (Customer c : list) {
            List<String> products = new ArrayList<>();
            List<Map<String, Object>> snRows = new ArrayList<>();
            int hist = 0;
            int range = 0;
            if (c.getSns() != null) {
                for (String code : c.getSns()) {
                    hist++;
                    SnCode row = snMap.get(code);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("sn", code);
                    if (row != null) {
                        String pname = productNames.computeIfAbsent(row.getProductId(), id -> {
                            Product p = productMapper.selectById(id);
                            return p == null ? id : p.getName();
                        });
                        item.put("productId", row.getProductId());
                        item.put("productName", pname);
                        item.put("size", row.getSizeCode());
                        item.put("belt", row.getBelt());
                        item.put("status", row.getStatus());
                        products.add(pname + "/" + row.getSizeCode() + (StringUtils.hasText(row.getBelt()) ? "+" + row.getBelt() : ""));
                        LocalDateTime sold = row.getSoldAt() != null ? row.getSoldAt() : row.getBindAt();
                        if (inRange(sold != null ? sold : c.getUpdatedAt(), from, to)) {
                            range++;
                        }
                    } else {
                        item.put("productName", "—");
                        item.put("size", "—");
                        item.put("belt", "");
                        item.put("status", "");
                        range++;
                    }
                    snRows.add(item);
                }
            }
            c.setProducts(products.stream().distinct().toList());
            c.setSnRows(snRows);
            c.setHistQty(hist);
            c.setRangeQty(range);
        }
    }

    private static boolean inRange(LocalDateTime t, String from, String to) {
        if (t == null) {
            return !StringUtils.hasText(from) && !StringUtils.hasText(to);
        }
        LocalDate d = t.toLocalDate();
        if (StringUtils.hasText(from)) {
            try {
                if (d.isBefore(LocalDate.parse(from.trim()))) {
                    return false;
                }
            } catch (Exception ignored) { }
        }
        if (StringUtils.hasText(to)) {
            try {
                if (d.isAfter(LocalDate.parse(to.trim()))) {
                    return false;
                }
            } catch (Exception ignored) { }
        }
        return true;
    }

    public Customer save(Customer body) {
        LoginUser u = AuthUtil.current();
        if (!u.isAdmin() && !StringUtils.hasText(body.getL1Id())) {
            if ("L2".equals(u.getRoleCode())) {
                body.setL2Id(u.getAgentId());
            } else {
                body.setL1Id(u.getAgentId());
            }
        }
        if (!StringUtils.hasText(body.getId())) {
            body.setId(Ids.next("CU"));
            mapper.insert(body);
        } else {
            mapper.updateById(body);
        }
        return mapper.selectById(body.getId());
    }

    public void delete(String id) {
        Customer row = mapper.selectById(id);
        if (row != null) {
            mapper.deleteById(id);
        }
    }
}
