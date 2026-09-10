package com.ruilai.module.trade;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.util.Ids;
import com.ruilai.common.util.OrderNoGenerator;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import com.ruilai.common.web.PageResult;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.mapper.AgentL2Mapper;
import com.ruilai.module.product.entity.Product;
import com.ruilai.module.product.mapper.ProductMapper;
import com.ruilai.module.sn.SnEventWriter;
import com.ruilai.module.sn.SnWriter;
import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.module.sn.mapper.SnCodeMapper;
import com.ruilai.module.system.LogService;
import com.ruilai.module.trade.entity.ReturnOrder;
import com.ruilai.module.trade.entity.StockLog;
import com.ruilai.module.trade.mapper.ReturnOrderMapper;
import com.ruilai.module.trade.mapper.StockLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReturnService {

    private final ReturnOrderMapper rtMapper;
    private final SnCodeMapper snMapper;
    private final ProductMapper productMapper;
    private final AgentL2Mapper l2Mapper;
    private final StockLogMapper stockLogMapper;
    private final OrderNoGenerator orderNos;
    private final LogService logService;
    private final SnEventWriter eventWriter;
    private final SnWriter snWriter;

    public PageResult<ReturnOrder> page(long page, long size, String status, String type, String l1Id, String l2Id,
                                        String from, String to, String reasonType, String sn) {
        var q = Wrappers.<ReturnOrder>lambdaQuery();
        LoginUser u = AuthUtil.current();
        if ("L2".equals(u.getRoleCode())) {
            q.eq(ReturnOrder::getFromId, u.getAgentId());
        } else if (!u.isAdmin()) {
            List<String> childIds = l2Mapper.selectList(
                    Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getParentId, u.getAgentId()).select(AgentL2::getId)
            ).stream().map(AgentL2::getId).toList();
            q.and(w -> {
                w.eq(ReturnOrder::getFromId, u.getAgentId()).or().eq(ReturnOrder::getApproverId, u.getAgentId());
                if (!childIds.isEmpty()) {
                    w.or().in(ReturnOrder::getFromId, childIds);
                }
            });
        }
        if (StringUtils.hasText(status)) {
            q.eq(ReturnOrder::getStatus, status);
        }
        if (StringUtils.hasText(type)) {
            q.eq(ReturnOrder::getType, type);
        }
        if (StringUtils.hasText(reasonType)) {
            q.eq(ReturnOrder::getReasonType, reasonType);
        }
        if (StringUtils.hasText(l2Id)) {
            q.eq(ReturnOrder::getFromId, l2Id);
        } else if (StringUtils.hasText(l1Id)) {
            List<String> childIds = l2Mapper.selectList(
                    Wrappers.<AgentL2>lambdaQuery().eq(AgentL2::getParentId, l1Id).select(AgentL2::getId)
            ).stream().map(AgentL2::getId).toList();
            q.and(w -> {
                w.eq(ReturnOrder::getFromId, l1Id).or().eq(ReturnOrder::getApproverId, l1Id);
                if (!childIds.isEmpty()) {
                    w.or().in(ReturnOrder::getFromId, childIds);
                }
            });
        }
        if (StringUtils.hasText(from)) {
            q.ge(ReturnOrder::getCreatedAt, java.time.LocalDate.parse(from).atStartOfDay());
        }
        if (StringUtils.hasText(to)) {
            q.le(ReturnOrder::getCreatedAt, java.time.LocalDate.parse(to).atTime(23, 59, 59));
        }
        if (StringUtils.hasText(sn)) {
            q.apply("JSON_SEARCH(sns, 'one', {0}) IS NOT NULL", sn.trim());
        }
        boolean noAudit = "l2_to_l1".equals(type) || "user".equals(type);
        if (!noAudit) {
            q.last("ORDER BY CASE WHEN `status` = 'pending' THEN 0 ELSE 1 END ASC, created_at DESC");
        } else {
            q.orderByDesc(ReturnOrder::getCreatedAt);
        }
        PageResult<ReturnOrder> result = PageResult.of(rtMapper.selectPage(Page.of(page, size), q));
        if (result.list() != null) {
            result.list().forEach(this::enrich);
        }
        return result;
    }

    public ReturnOrder get(String id) {
        ReturnOrder row = rtMapper.selectById(id);
        if (row == null) {
            throw new BizException(ErrCode.NOT_FOUND, "退货单不存在");
        }
        assertCanAccess(row);
        enrich(row);
        return row;
    }

    private void assertCanAccess(ReturnOrder row) {
        LoginUser u = AuthUtil.current();
        if (u.isAdmin()) {
            return;
        }
        if ("L2".equals(u.getRoleCode()) && u.getAgentId().equals(row.getFromId())) {
            return;
        }
        if ("L1".equals(u.getRoleCode())) {
            if (u.getAgentId().equals(row.getFromId()) || u.getAgentId().equals(row.getApproverId())) {
                return;
            }
            AgentL2 from = StringUtils.hasText(row.getFromId()) ? l2Mapper.selectById(row.getFromId()) : null;
            if (from != null && u.getAgentId().equals(from.getParentId())) {
                return;
            }
        }
        throw new BizException(ErrCode.FORBIDDEN, "无权查看该退货单");
    }

    private void enrich(ReturnOrder r) {
        if (!StringUtils.hasText(r.getTypeLabel())) {
            if ("user".equals(r.getType())) r.setTypeLabel("终端退货");
            else if ("l2_to_l1".equals(r.getType())) r.setTypeLabel("二级退一级");
            else if ("l1_to_factory".equals(r.getType())) r.setTypeLabel("一级退原厂");
        }
        if (!StringUtils.hasText(r.getFromName()) && StringUtils.hasText(r.getFromId())) {
            AgentL2 from = l2Mapper.selectById(r.getFromId());
            if (from != null) r.setFromName(from.getName());
        }
        List<String> sns = r.getSns() == null ? List.of() : r.getSns();
        Map<String, Integer> counts = new LinkedHashMap<>();
        List<Map<String, Object>> detail = new ArrayList<>();
        for (String sn : sns) {
            SnCode row = snMapper.selectById(sn);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sn", sn);
            if (row == null) {
                item.put("productName", "—");
                item.put("spec", "—");
                item.put("status", "未找到");
                item.put("situation", "");
            } else {
                Product p = productMapper.selectById(row.getProductId());
                String pname = p == null ? row.getProductId() : p.getName();
                if ((r.getCustomer() == null || r.getCustomer().isEmpty())) {
                    Map<String, Object> customer = row.getUserJson() != null ? row.getUserJson() : row.getPrevUserJson();
                    if (customer != null && !customer.isEmpty()) {
                        r.setCustomer(new LinkedHashMap<>(customer));
                    }
                }
                String spec = specText(row.getSizeCode(), row.getBelt());
                String key = pname + "/" + spec;
                counts.merge(key, 1, Integer::sum);
                item.put("productId", row.getProductId());
                item.put("productName", pname);
                item.put("size", row.getSizeCode());
                item.put("belt", row.getBelt());
                item.put("spec", spec);
                item.put("status", row.getStatus());
                Object notes = row.getExtra() == null ? null : row.getExtra().get("situationNotes");
                if (notes == null && row.getExtra() != null) {
                    notes = row.getExtra().get("situation");
                }
                item.put("situationNotes", notes == null ? List.of() : notes);
                item.put("situation", notesText(notes));
            }
            detail.add(item);
        }
        r.setSnDetail(detail);
        if (counts.isEmpty()) {
            r.setProductDetail("—");
        } else {
            StringBuilder sb = new StringBuilder();
            counts.forEach((k, q) -> {
                if (sb.length() > 0) sb.append("，");
                sb.append(k).append("×").append(q);
            });
            r.setProductDetail(sb.toString());
        }
    }

    private static String specText(String size, String belt) {
        String b = belt == null ? "" : belt.replaceFirst("^腰带", "");
        if (b.isEmpty()) {
            return size == null || size.isBlank() ? "—" : size;
        }
        return (size == null ? "" : size) + "+腰带" + b;
    }

    @Transactional
    public ReturnOrder create(ReturnOrder body) {
        LoginUser u = AuthUtil.current();
        if ("SUB".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "子账号不可提交退货");
        }
        validateReturnSns(body, u);
        body.setId(Ids.next("RT"));
        String prefix = "user".equals(body.getType()) ? "RTU" : "RT";
        body.setNo(orderNos.next(prefix));
        body.setStatus("pending");
        if (!StringUtils.hasText(body.getFromId())) {
            body.setFromId(u.getAgentId());
            body.setFromName(u.getName());
        }
        body.setTypeLabel(switch (String.valueOf(body.getType())) {
            case "user" -> "终端退货";
            case "l1_to_factory" -> "退原厂";
            default -> "二级退一级";
        });
        if ("l1_to_factory".equals(body.getType()) && !u.isAdmin() && !"L1".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "仅一级可申请退原厂");
        }
        if ("l2_to_l1".equals(body.getType())) {
            if ("L2".equals(u.getRoleCode())) {
                AgentL2 self = l2Mapper.selectById(u.getAgentId());
                if (self != null) {
                    body.setApproverId(self.getParentId());
                }
            } else if ("L1".equals(u.getRoleCode())) {
                if (!StringUtils.hasText(body.getFromId()) || body.getFromId().equals(u.getAgentId())) {
                    throw new BizException(ErrCode.BAD_REQUEST, "请选择退货的二级代理");
                }
                AgentL2 l2 = l2Mapper.selectById(body.getFromId());
                if (l2 == null || !u.getAgentId().equals(l2.getParentId())) {
                    throw new BizException(ErrCode.FORBIDDEN, "只能代提本一级下属二级退货");
                }
                body.setFromName(l2.getName());
                body.setApproverId(u.getAgentId());
            }
        }
        if ("user".equals(body.getType())) {
            String l2Parent = null;
            if ("L2".equals(u.getRoleCode())) {
                AgentL2 self = l2Mapper.selectById(u.getAgentId());
                l2Parent = self == null ? null : self.getParentId();
            } else if (StringUtils.hasText(body.getFromId())) {
                AgentL2 from = l2Mapper.selectById(body.getFromId());
                l2Parent = from == null ? null : from.getParentId();
            }
            body.setApproverId(ReturnApprovers.resolveUser(
                    body.getApproverId(), u.getRoleCode(), u.getAgentId(), l2Parent, firstSnL1(body)));
        }
        rtMapper.insert(body);
        logService.record("提交退货 " + body.getNo(), "op", true);
        if ("l1_to_factory".equals(body.getType())) {
            appendSnEvent(body, "提交退原厂申请", body.getReason(), "return");
        }
        if ("user".equals(body.getType()) || "l2_to_l1".equals(body.getType())) {
            return applyPass(body, "无需审核，自动入库");
        }
        return body;
    }

    private void validateReturnSns(ReturnOrder body, LoginUser u) {
        List<String> sns = body.getSns() == null ? List.of() : body.getSns();
        if (sns.isEmpty()) {
            throw new BizException(ErrCode.BAD_REQUEST, "请填写 SN");
        }
        if (sns.stream().distinct().count() != sns.size()) {
            throw new BizException(ErrCode.BAD_REQUEST, "退货单存在重复 SN");
        }
        for (String sn : sns) {
            SnCode row = snMapper.selectById(sn);
            if (row == null) {
                throw new BizException(ErrCode.BAD_REQUEST, "SN 不存在：" + sn);
            }
            if (hasTag(row, "已退货")) {
                throw new BizException(ErrCode.BAD_REQUEST, sn + " 已退货，不可重复提交");
            }
            if ("user".equals(body.getType())) {
                if (!"bound".equals(row.getStatus())) {
                    throw new BizException(ErrCode.BAD_REQUEST, sn + " 非已售出状态，不可终端退货");
                }
                if ("L2".equals(u.getRoleCode()) && !u.getAgentId().equals(row.getL2Id())) {
                    throw new BizException(ErrCode.BAD_REQUEST, sn + " 非本二级售出，不可退货");
                }
                if ("L1".equals(u.getRoleCode()) && !u.getAgentId().equals(row.getL1Id())) {
                    throw new BizException(ErrCode.BAD_REQUEST, sn + " 非本一级体系售出，不可退货");
                }
            } else if ("l2_to_l1".equals(body.getType())) {
                String from = StringUtils.hasText(body.getFromId()) ? body.getFromId() : u.getAgentId();
                if (!"l2".equals(row.getStatus()) || !from.equals(row.getL2Id())) {
                    throw new BizException(ErrCode.BAD_REQUEST, sn + " 不在该二级仓库");
                }
            } else if ("l1_to_factory".equals(body.getType())) {
                if (!"l1".equals(row.getStatus()) || (StringUtils.hasText(u.getAgentId()) && !u.getAgentId().equals(row.getL1Id()) && !u.isAdmin())) {
                    throw new BizException(ErrCode.BAD_REQUEST, sn + " 不在本一级仓库，不可退原厂");
                }
            }
        }
    }

    @Transactional
    public ReturnOrder decide(String id, boolean pass, String processNote) {
        ReturnOrder rt = get(id);
        if (!"pending".equals(rt.getStatus()) && !"approved".equals(rt.getStatus())) {
            throw BizException.state("当前状态不可审批");
        }
        LoginUser u = AuthUtil.current();
        if ("SUB".equals(u.getRoleCode())) {
            throw new BizException(ErrCode.FORBIDDEN, "子账号不可审批退货");
        }
        boolean factory = "l1_to_factory".equals(rt.getType());
        if (factory && !u.isAdmin()) {
            throw new BizException(ErrCode.FORBIDDEN, "一级退原厂需平台审批");
        }
        if (("l2_to_l1".equals(rt.getType()) || "user".equals(rt.getType())) && !u.isAdmin()) {
            boolean isApprover = u.getAgentId().equals(rt.getApproverId());
            boolean ownsChild = false;
            if ("L1".equals(u.getRoleCode()) && StringUtils.hasText(rt.getFromId())) {
                AgentL2 from = l2Mapper.selectById(rt.getFromId());
                ownsChild = from != null && u.getAgentId().equals(from.getParentId());
            }
            if (!isApprover && !ownsChild && !u.getAgentId().equals(rt.getFromId())) {
                throw new BizException(ErrCode.FORBIDDEN, "仅所属一级可审");
            }
        }
        rt.setProcessNote(processNote);
        if (!pass) {
            rt.setStatus("rejected");
            rtMapper.updateById(rt);
            syncProcessNote(rt, processNote, "退货申请已驳回");
            logService.record("驳回退货 " + rt.getNo(), "op", true);
            return get(rt.getId());
        }
        syncProcessNote(rt, processNote, "退货申请已通过");
        return applyPass(rt, processNote);
    }

    private ReturnOrder applyPass(ReturnOrder rt, String processNote) {
        if (StringUtils.hasText(processNote) && !StringUtils.hasText(rt.getProcessNote())) {
            rt.setProcessNote(processNote);
        }
        List<String> sns = rt.getSns() == null ? List.of() : rt.getSns();
        for (String sn : sns) {
            SnCode row = snMapper.selectById(sn);
            if (row == null) {
                continue;
            }
            if ("l1_to_factory".equals(rt.getType())) {
                String l1 = row.getL1Id();
                writeStockLog(row, "l1", l1, -1, "退原厂", rt.getNo());
                row.setStatus("warehouse");
                row.setL1Id(null);
                row.setFrozen(1);
                addTag(row, "已冻结");
                addTag(row, "已退货");
                row.setReturnAt(ChinaTime.now());
                eventWriter.append(row, "一级退回原厂", rt.getNo() + " · 已冻结", "factory");
            } else if ("l2_to_l1".equals(rt.getType())) {
                String l2 = row.getL2Id();
                String l1 = row.getL1Id();
                writeStockLog(row, "l2", l2, -1, "二级退一级", rt.getNo());
                writeStockLog(row, "l1", l1, 1, "二级退货入库", rt.getNo());
                clearUser(row);
                row.setReIn(1);
                row.setReturnAt(ChinaTime.now());
                row.setStatus("l1");
                row.setL2Id(null);
                addTag(row, "已退货");
                addTag(row, "再入库");
                eventWriter.append(row, rt.getTypeLabel() == null ? "二级退一级" : rt.getTypeLabel(),
                        rt.getNo() + " · " + (rt.getReason() == null ? "" : rt.getReason()), "return");
            } else if ("user".equals(rt.getType())) {
                boolean soldByL2 = StringUtils.hasText(row.getL2Id());
                clearUser(row);
                row.setReIn(1);
                row.setReturnAt(ChinaTime.now());
                addTag(row, "已退货");
                addTag(row, "再入库");
                if (soldByL2) {
                    writeStockLog(row, "l2", row.getL2Id(), 1, "终端退货入库", rt.getNo());
                    row.setStatus("l2");
                } else {
                    writeStockLog(row, "l1", row.getL1Id(), 1, "终端退货入库", rt.getNo());
                    row.setStatus("l1");
                    row.setL2Id(null);
                }
                eventWriter.append(row, rt.getTypeLabel() == null ? "终端退货" : rt.getTypeLabel(),
                        rt.getNo() + " · " + (rt.getReason() == null ? "" : rt.getReason()), "return");
            }
            snWriter.update(row);
        }
        rt.setStatus("done");
        rtMapper.updateById(rt);
        logService.record("通过退货 " + rt.getNo(), "op", true);
        return get(rt.getId());
    }

    private void writeStockLog(SnCode row, String agentType, String agentId, int delta, String reason, String refNo) {
        if (!StringUtils.hasText(agentId) || delta == 0) {
            return;
        }
        StockLog log = new StockLog();
        log.setId(Ids.next("H"));
        log.setAgentType(agentType);
        log.setAgentId(agentId);
        log.setProductId(row.getProductId());
        log.setSizeCode(row.getSizeCode());
        log.setDelta(delta);
        log.setReason(reason);
        log.setRefNo(refNo);
        log.setOccurredAt(ChinaTime.now());
        stockLogMapper.insert(log);
    }

    private static void clearUser(SnCode row) {
        if (row.getUserJson() != null) {
            row.setPrevUserJson(row.getUserJson());
            row.setUserJson(null);
        }
    }

    private static boolean hasTag(SnCode row, String tag) {
        return row.getTags() != null && row.getTags().contains(tag);
    }

    private static void addTag(SnCode row, String tag) {
        List<String> tags = row.getTags() == null ? new ArrayList<>() : new ArrayList<>(row.getTags());
        if (!tags.contains(tag)) {
            tags.add(tag);
        }
        row.setTags(tags);
    }

    private String firstSnL1(ReturnOrder body) {
        List<String> sns = body.getSns() == null ? List.of() : body.getSns();
        for (String sn : sns) {
            SnCode row = snMapper.selectById(sn);
            if (row != null && StringUtils.hasText(row.getL1Id())) {
                return row.getL1Id();
            }
        }
        return null;
    }

    private void syncProcessNote(ReturnOrder rt, String processNote, String eventTitle) {
        for (String sn : rt.getSns() == null ? List.<String>of() : rt.getSns()) {
            SnCode row = snMapper.selectById(sn);
            if (row == null) {
                continue;
            }
            if (StringUtils.hasText(processNote)) {
                Map<String, Object> extra = row.getExtra() == null
                        ? new LinkedHashMap<>()
                        : new LinkedHashMap<>(row.getExtra());
                List<Object> notes = new ArrayList<>();
                Object raw = extra.get("processNotes");
                if (raw instanceof List<?> list) {
                    notes.addAll(list);
                }
                boolean exists = notes.stream().anyMatch(note ->
                        note instanceof Map<?, ?> map && rt.getNo().equals(String.valueOf(map.get("ref"))));
                if (!exists) {
                    Map<String, Object> note = new LinkedHashMap<>();
                    note.put("date", ChinaTime.today().toString());
                    note.put("text", processNote.trim());
                    note.put("source", "return");
                    note.put("ref", rt.getNo());
                    notes.add(note);
                    extra.put("processNotes", notes);
                    row.setExtra(extra);
                }
            }
            eventWriter.append(row, eventTitle,
                    rt.getNo() + (StringUtils.hasText(processNote) ? " · " + processNote.trim() : ""), "return");
            snWriter.update(row);
        }
    }

    private void appendSnEvent(ReturnOrder rt, String title, String detail, String type) {
        for (String sn : rt.getSns() == null ? List.<String>of() : rt.getSns()) {
            SnCode row = snMapper.selectById(sn);
            if (row == null) {
                continue;
            }
            eventWriter.append(row, title,
                    rt.getNo() + (StringUtils.hasText(detail) ? " · " + detail.trim() : ""), type);
            snWriter.update(row);
        }
    }

    private static String notesText(Object raw) {
        if (raw instanceof List<?> list) {
            return list.stream().map(note -> {
                if (note instanceof Map<?, ?> map) {
                    String date = map.get("date") == null ? "" : String.valueOf(map.get("date"));
                    String text = map.get("text") == null ? "" : String.valueOf(map.get("text"));
                    return (date + " " + text).trim();
                }
                return String.valueOf(note);
            }).filter(StringUtils::hasText).reduce((a, b) -> a + "；" + b).orElse("");
        }
        return raw == null ? "" : String.valueOf(raw);
    }
}
