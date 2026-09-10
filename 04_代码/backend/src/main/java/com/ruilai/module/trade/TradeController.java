package com.ruilai.module.trade;

import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.R;
import com.ruilai.module.trade.entity.PurchaseOrder;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.entity.SalesOrder;
import com.ruilai.module.trade.entity.StockLog;
import com.ruilai.module.system.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TradeController {

    private final PurchaseService purchaseService;
    private final SalesService salesService;
    private final ReturnService returnService;
    private final StockService stockService;

    @GetMapping("/purchases")
    public R<PageResult<PurchaseOrder>> purchases(@RequestParam(defaultValue = "1") long page,
                                                  @RequestParam(defaultValue = "20") long pageSize,
                                                  @RequestParam(required = false) String status,
                                                  @RequestParam(required = false) String l1Id,
                                                  @RequestParam(required = false) String from,
                                                  @RequestParam(required = false) String to,
                                                  @RequestParam(required = false) String sn) {
        return R.ok(purchaseService.page(page, pageSize, status, l1Id, from, to, sn));
    }

    @GetMapping("/purchases/{id}")
    public R<PurchaseOrder> purchase(@PathVariable String id) {
        return R.ok(purchaseService.get(id));
    }

    @PostMapping("/purchases")
    public R<PurchaseOrder> createPo(@RequestBody PurchaseOrder body) {
        return R.ok(purchaseService.create(body));
    }

    @PostMapping("/purchases/{id}/cosign")
    public R<PurchaseOrder> cosign(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, Object> segments = body == null ? null : (Map<String, Object>) body.get("segments");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> customLines = body == null ? null : (List<Map<String, Object>>) body.get("customLines");
        return R.ok(purchaseService.cosign(id, segments, customLines));
    }

    @PostMapping("/purchases/{id}/reject")
    public R<Void> rejectPo(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        purchaseService.reject(id, body == null ? null : body.get("reason"));
        return R.ok();
    }

    @PostMapping("/purchases/{id}/delete")
    public R<Void> deletePo(@PathVariable String id) {
        purchaseService.delete(id);
        return R.ok();
    }

    @GetMapping("/sales")
    public R<PageResult<SalesOrder>> sales(@RequestParam(defaultValue = "1") long page,
                                           @RequestParam(defaultValue = "20") long pageSize,
                                           @RequestParam(required = false) String channel,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) String l1Id,
                                           @RequestParam(required = false) String l2Id,
                                           @RequestParam(required = false) String from,
                                           @RequestParam(required = false) String to,
                                           @RequestParam(required = false) String sn) {
        return R.ok(salesService.page(page, pageSize, channel, status, l1Id, l2Id, from, to, sn));
    }

    @GetMapping("/sales/summary")
    public R<Map<String, Object>> salesSummary(@RequestParam(required = false) String channel,
                                               @RequestParam(required = false) String l1Id,
                                               @RequestParam(required = false) String l2Id,
                                               @RequestParam(required = false) String from,
                                               @RequestParam(required = false) String to) {
        return R.ok(salesService.summary(channel, l1Id, l2Id, from, to));
    }

    @GetMapping("/sales/{id}")
    public R<SalesOrder> sale(@PathVariable String id) {
        return R.ok(salesService.get(id));
    }

    @PostMapping("/sales")
    public R<SalesOrder> createSo(@RequestBody SalesOrder body) {
        return R.ok(salesService.create(body));
    }

    @PostMapping("/sales/{id}/scan")
    public R<SalesOrder> scan(@PathVariable String id, @RequestBody Map<String, String> body) {
        return R.ok(salesService.scan(id, body.get("sn")));
    }

    @PostMapping("/sales/{id}/confirm")
    public R<SalesOrder> confirm(@PathVariable String id) {
        return R.ok(salesService.confirm(id));
    }

    @PostMapping("/sales/direct-bind")
    public R<Map<String, Object>> bind(@RequestBody Map<String, Object> body) {
        String sn = String.valueOf(body.get("sn"));
        String hint = String.valueOf(body.getOrDefault("ipRegion", ""));
        Double lng = toDouble(body.get("lng"));
        Double lat = toDouble(body.get("lat"));
        @SuppressWarnings("unchecked")
        Map<String, Object> customer = (Map<String, Object>) body.getOrDefault("customer", Map.of());
        boolean dryRun = Boolean.TRUE.equals(body.get("dryRun")) || "true".equals(String.valueOf(body.get("dryRun")));
        return R.ok(salesService.directBind(sn, customer, hint, LogService.clientIp(), lng, lat, dryRun));
    }

    @GetMapping("/returns")
    public R<PageResult<ReturnOrder>> returns(@RequestParam(defaultValue = "1") long page,
                                              @RequestParam(defaultValue = "20") long pageSize,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String type,
                                              @RequestParam(required = false) String l1Id,
                                              @RequestParam(required = false) String l2Id,
                                              @RequestParam(required = false) String from,
                                              @RequestParam(required = false) String to,
                                              @RequestParam(required = false) String reasonType,
                                              @RequestParam(required = false) String sn) {
        return R.ok(returnService.page(page, pageSize, status, type, l1Id, l2Id, from, to, reasonType, sn));
    }

    @GetMapping("/returns/{id}")
    public R<ReturnOrder> rt(@PathVariable String id) {
        return R.ok(returnService.get(id));
    }

    @PostMapping("/returns")
    public R<ReturnOrder> createRt(@RequestBody ReturnOrder body) {
        return R.ok(returnService.create(body));
    }

    @PostMapping("/returns/{id}/decide")
    public R<ReturnOrder> decide(@PathVariable String id, @RequestBody Map<String, Object> body) {
        boolean pass = Boolean.TRUE.equals(body.get("pass"));
        return R.ok(returnService.decide(id, pass, body.get("processNote") == null ? null : String.valueOf(body.get("processNote"))));
    }

    @GetMapping("/stock/summary")
    public R<List<Map<String, Object>>> stock(@RequestParam(required = false) String agentType,
                                              @RequestParam(required = false) String agentId,
                                              @RequestParam(required = false) String productId,
                                              @RequestParam(required = false) String size,
                                              @RequestParam(required = false) String belt) {
        return R.ok(stockService.summary(agentType, agentId, productId, size, belt));
    }

    @GetMapping("/stock/logs")
    public R<List<StockLog>> stockLogs(@RequestParam(required = false) String agentId,
                                       @RequestParam(required = false) String agentType) {
        return R.ok(stockService.logs(agentId, agentType));
    }

    private static Double toDouble(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        try {
            String s = String.valueOf(v).trim();
            if (s.isEmpty() || "null".equals(s)) {
                return null;
            }
            return Double.parseDouble(s);
        } catch (Exception e) {
            return null;
        }
    }
}
