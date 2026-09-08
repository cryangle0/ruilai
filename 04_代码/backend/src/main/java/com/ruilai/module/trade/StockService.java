package com.ruilai.module.trade;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.trade.entity.StockLog;
import com.ruilai.module.trade.mapper.StockLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StockService {

    private final SnCodeMapper snMapper;
    private final StockLogMapper stockLogMapper;
    private final ProductMapper productMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;

    public List<Map<String, Object>> summary(String agentType, String agentId, String productId, String size, String belt) {
        LoginUser u = AuthUtil.current();
        String type = agentType;
        String id = agentId;
        if ("L2".equals(u.getRoleCode())) {
            type = "l2";
            id = u.getAgentId();
        } else if (!u.isAdmin()) {
            if ("l2".equals(type) && StringUtils.hasText(id)) {
                AgentL2 kid = l2Mapper.selectById(id);
                if (kid == null || !u.getAgentId().equals(kid.getParentId())) {
                    throw new BizException(ErrCode.FORBIDDEN, "只能查看本一级下属二级库存");
                }
            } else if ("all".equals(type)) {
                type = "all";
                id = u.getAgentId();
            } else {
                type = "l1";
                id = u.getAgentId();
            }
        }
        var q = Wrappers.<SnCode>lambdaQuery();
        if ("l2".equals(type) && StringUtils.hasText(id)) {
            q.eq(SnCode::getL2Id, id).eq(SnCode::getStatus, "l2");
        } else if ("all".equals(type) && StringUtils.hasText(id)) {
            q.eq(SnCode::getL1Id, id).in(SnCode::getStatus, List.of("l1", "l2"));
        } else if ("l1".equals(type) && StringUtils.hasText(id)) {
            q.eq(SnCode::getL1Id, id).eq(SnCode::getStatus, "l1");
        } else if ("l2".equals(type)) {
            q.eq(SnCode::getStatus, "l2");
        } else if ("l1".equals(type)) {
            q.eq(SnCode::getStatus, "l1");
        } else {
            q.in(SnCode::getStatus, List.of("l1", "l2"));
        }
        if (StringUtils.hasText(productId)) q.eq(SnCode::getProductId, productId);
        if (StringUtils.hasText(size)) q.eq(SnCode::getSizeCode, size);
        if (StringUtils.hasText(belt)) q.eq(SnCode::getBelt, belt);
        List<SnCode> sns = snMapper.selectList(q);
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (SnCode sn : sns) {
            String key = (sn.getL1Id() == null ? "" : sn.getL1Id()) + "|"
                    + (sn.getL2Id() == null ? "" : sn.getL2Id()) + "|"
                    + sn.getProductId() + "|" + sn.getSizeCode() + "|" + sn.getBelt()
                    + "|" + (sn.getStatus() == null ? "" : sn.getStatus());
            grouped.computeIfAbsent(key, k -> {
                Map<String, Object> row = new LinkedHashMap<>();
                Product p = productMapper.selectById(sn.getProductId());
                row.put("id", k);
                row.put("productId", sn.getProductId());
                row.put("productName", p == null ? sn.getProductId() : p.getName());
                row.put("size", sn.getSizeCode());
                row.put("belt", sn.getBelt());
                row.put("qty", 0);
                row.put("sns", new ArrayList<String>());
                row.put("l1Id", sn.getL1Id());
                row.put("l2Id", sn.getL2Id());
                row.put("status", sn.getStatus());
                row.put("agentType", "l2".equals(sn.getStatus()) ? "l2" : "l1");
                AgentL1 a1 = sn.getL1Id() == null ? null : l1Mapper.selectById(sn.getL1Id());
                AgentL2 a2 = sn.getL2Id() == null ? null : l2Mapper.selectById(sn.getL2Id());
                row.put("l1Name", a1 == null ? (sn.getL1Id() == null ? "—" : sn.getL1Id()) : a1.getName());
                row.put("l2Name", a2 == null ? "—" : a2.getName());
                return row;
            });
            Map<String, Object> row = grouped.get(key);
            row.put("qty", ((Number) row.get("qty")).intValue() + 1);
            @SuppressWarnings("unchecked")
            List<String> list = (List<String>) row.get("sns");
            list.add(sn.getSn());
        }
        return new ArrayList<>(grouped.values());
    }

    public List<StockLog> logs(String agentId, String agentType) {
        LoginUser u = AuthUtil.current();
        if ("L2".equals(u.getRoleCode())) {
            return stockLogMapper.selectList(Wrappers.<StockLog>lambdaQuery()
                    .eq(StockLog::getAgentId, u.getAgentId())
                    .orderByDesc(StockLog::getOccurredAt)
                    .last("limit 200"));
        }
        if (!u.isAdmin()) {
            if ("l2".equals(agentType) && StringUtils.hasText(agentId)) {
                AgentL2 kid = l2Mapper.selectById(agentId);
                if (kid == null || !u.getAgentId().equals(kid.getParentId())) {
                    throw new BizException(ErrCode.FORBIDDEN, "只能查看本一级下属二级流水");
                }
                return stockLogMapper.selectList(Wrappers.<StockLog>lambdaQuery()
                        .eq(StockLog::getAgentId, agentId)
                        .orderByDesc(StockLog::getOccurredAt)
                        .last("limit 200"));
            }
            if ("all".equals(agentType)) {
                List<String> ids = new ArrayList<>();
                ids.add(u.getAgentId());
                l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery()
                                .eq(AgentL2::getParentId, u.getAgentId())
                                .select(AgentL2::getId))
                        .forEach(k -> ids.add(k.getId()));
                return stockLogMapper.selectList(Wrappers.<StockLog>lambdaQuery()
                        .in(StockLog::getAgentId, ids)
                        .orderByDesc(StockLog::getOccurredAt)
                        .last("limit 200"));
            }
            return stockLogMapper.selectList(Wrappers.<StockLog>lambdaQuery()
                    .eq(StockLog::getAgentId, u.getAgentId())
                    .orderByDesc(StockLog::getOccurredAt)
                    .last("limit 200"));
        }
        String id = agentId;
        return stockLogMapper.selectList(Wrappers.<StockLog>lambdaQuery()
                .eq(id != null, StockLog::getAgentId, id)
                .orderByDesc(StockLog::getOccurredAt)
                .last("limit 200"));
    }
}
