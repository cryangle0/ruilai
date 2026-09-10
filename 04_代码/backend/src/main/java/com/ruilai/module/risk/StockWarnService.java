package com.ruilai.module.risk;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL1Mapper;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.ProductDisplayNames;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.risk.entity.ExceptionTicket;
import com.ruilai.module.risk.mapper.ExceptionTicketMapper;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.SettingService;
import com.ruilai.common.time.ChinaTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockWarnService {

    private final SnCodeMapper snMapper;
    private final AgentL1Mapper l1Mapper;
    private final AgentL2Mapper l2Mapper;
    private final ProductMapper productMapper;
    private final ExceptionService exceptionService;
    private final ExceptionTicketMapper exMapper;
    private final SettingService settingService;

    public WarnMode resolve(String l1Id, String l2Id) {
        AgentL1 l1 = l1Id == null ? null : l1Mapper.selectById(l1Id);
        AgentL2 l2 = l2Id == null ? null : l2Mapper.selectById(l2Id);
        double global = settingService.multiplier();
        double mult = l2 != null && l2.getWarnMultiplier() != null
                ? l2.getWarnMultiplier().doubleValue()
                : (l1 != null && l1.getWarnMultiplier() != null ? l1.getWarnMultiplier().doubleValue() : global);
        String mode = l2 != null
                ? (l2.getWarnMode() == null ? "strict" : l2.getWarnMode())
                : (l1 != null && l1.getWarnMode() != null ? l1.getWarnMode() : "strict");
        boolean noAlarm = l2 != null && l2.getExtra() != null && Boolean.TRUE.equals(l2.getExtra().get("exNoAlarm"));
        if (noAlarm) {
            mode = "off";
        }
        return new WarnMode(mult, mode, settingService.overOrderRatio(), settingService.stockTurnover());
    }

    public Map<String, Object> warnMeta(String l1Id, String l2Id) {
        var q = Wrappers.<ExceptionTicket>lambdaQuery().eq(ExceptionTicket::getDim, "stock");
        if (l2Id != null && !l2Id.isBlank()) {
            q.and(w -> w.apply("JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')) = {0}", l2Id)
                    .or().apply("target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l2_id = {0})", l2Id));
        } else if (l1Id != null && !l1Id.isBlank()) {
            q.and(w -> w.apply("JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l1Id')) = {0}", l1Id)
                    .or().apply("target IN (SELECT sn FROM sn_code WHERE deleted = 0 AND l1_id = {0})", l1Id)
                    .or().apply("JSON_UNQUOTE(JSON_EXTRACT(extra,'$.l2Id')) IN "
                            + "(SELECT id FROM agent_l2 WHERE deleted = 0 AND parent_id = {0})", l1Id));
        } else {
            return Map.of("has", false, "open", false, "label", "—");
        }
        List<ExceptionTicket> tickets = exMapper.selectList(q.orderByDesc(ExceptionTicket::getOccurredAt).last("limit 20"));
        if (tickets.isEmpty()) {
            return Map.of("has", false, "open", false, "label", "—");
        }
        boolean open = tickets.stream().anyMatch(e -> "待处理".equals(e.getStatus()) || "会签中".equals(e.getStatus()));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("has", true);
        out.put("open", open);
        out.put("label", open ? "预警倍数异常 · 未处理" : "预警倍数异常 · 已处理");
        out.put("count", tickets.size());
        return out;
    }

    /** 二级在库充足仍大量分销进货 → 超量下单预警 */
    public void checkOverOrder(String l1Id, String l2Id, String productId, int planTotal, String l2Name) {
        if (l2Id == null || planTotal <= 0) {
            return;
        }
        long l2Stock = snMapper.selectCount(Wrappers.<SnCode>lambdaQuery()
                .eq(SnCode::getL2Id, l2Id)
                .eq(SnCode::getStatus, "l2")
                .eq(productId != null, SnCode::getProductId, productId)
                .eq(SnCode::getFrozen, 0));
        WarnMode cfg = resolve(l1Id, l2Id);
        int line = (int) Math.max(1, Math.ceil(l2Stock * cfg.overOrderRatio()));
        if (l2Stock > 0 && planTotal >= line) {
            exceptionService.raise("超量下单预警", l2Name == null ? l2Id : l2Name,
                    "二级在库 " + l2Stock + " 仍出货 " + planTotal + "（超量比 " + cfg.overOrderRatio() + "，代理倍数 " + cfg.multiplier() + "）",
                    "stock", cfg.mode(), l2Id);
        }
    }

    /** 本次转入二级数量 > 近 30 天该规格 C 端销量 × 周转倍数 → 销售库存异常 */
    public void checkInbound(String l1Id, String l2Id, String productId, String size, int inbound, String targetLabel) {
        if (l2Id == null || inbound <= 0) {
            return;
        }
        WarnMode cfg = resolve(l1Id, l2Id);
        LocalDateTime from = ChinaTime.now().minusDays(30);
        var q = Wrappers.<SnCode>lambdaQuery()
                .eq(SnCode::getL2Id, l2Id)
                .eq(SnCode::getStatus, "bound")
                .ge(SnCode::getSoldAt, from);
        if (productId != null) {
            q.eq(SnCode::getProductId, productId);
        }
        if (size != null) {
            q.eq(SnCode::getSizeCode, size);
        }
        long sold = snMapper.selectCount(q);
        if (sold <= 0) {
            return;
        }
        double line = Math.max(1, sold * cfg.multiplier());
        if (inbound > line) {
            String label = targetLabel != null ? targetLabel
                    : (ProductDisplayNames.of(productMapper, productId) + (size == null ? "" : size));
            exceptionService.raise("销售库存异常", label,
                    "本次新增 " + inbound + " > 预警线 " + (int) Math.ceil(line) + "（区间销量 " + sold + " × 倍数 " + cfg.multiplier() + "）",
                    "stock", cfg.mode(), l2Id);
        }
    }

    /** 每日凌晨扫描二级仓压货 */
    @Scheduled(cron = "0 40 2 * * ?")
    public void nightlyScan() {
        List<AgentL2> l2s = l2Mapper.selectList(Wrappers.<AgentL2>lambdaQuery()
                .eq(AgentL2::getPending, 0)
                .eq(AgentL2::getAuditStatus, "approved")
                .eq(AgentL2::getStatus, "启用"));
        for (AgentL2 l2 : l2s) {
            List<SnCode> stock = snMapper.selectList(Wrappers.<SnCode>lambdaQuery()
                    .eq(SnCode::getL2Id, l2.getId())
                    .eq(SnCode::getStatus, "l2")
                    .eq(SnCode::getFrozen, 0));
            Map<String, Integer> grouped = new HashMap<>();
            for (SnCode sn : stock) {
                String key = sn.getProductId() + "|" + (sn.getSizeCode() == null ? "" : sn.getSizeCode());
                grouped.merge(key, 1, Integer::sum);
            }
            for (var e : grouped.entrySet()) {
                String[] parts = e.getKey().split("\\|", -1);
                long dup = exMapper.selectCount(Wrappers.<ExceptionTicket>lambdaQuery()
                        .eq(ExceptionTicket::getDim, "stock")
                        .eq(ExceptionTicket::getStatus, "待处理")
                        .like(ExceptionTicket::getTarget, l2.getName())
                        .ge(ExceptionTicket::getOccurredAt, ChinaTime.now().minusDays(1)));
                if (dup > 0) {
                    continue;
                }
                checkInbound(l2.getParentId(), l2.getId(), parts[0], parts[1].isBlank() ? null : parts[1],
                        e.getValue(), l2.getName() + " · 在库" + e.getValue());
            }
        }
        log.info("stock warn nightly scan agents={}", l2s.size());
    }

    public record WarnMode(double multiplier, String mode, double overOrderRatio, double stockTurnover) {
        public WarnMode {
            if (multiplier <= 0) {
                multiplier = 1.5;
            }
        }
    }
}
