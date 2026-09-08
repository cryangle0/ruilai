package com.ruilai.module.agent;

import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.R;
import com.ruilai.module.agent.entity.AgentL1;
import com.ruilai.module.agent.entity.AgentL2;
import com.ruilai.module.agent.entity.SubAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @GetMapping("/l1")
    public R<PageResult<AgentL1>> l1(@RequestParam(defaultValue = "1") long page,
                                     @RequestParam(defaultValue = "20") long pageSize,
                                     @RequestParam(required = false) String name,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(required = false) String region) {
        return R.ok(agentService.pageL1(page, pageSize, name, status, region));
    }

    @GetMapping("/l1/{id}")
    public R<AgentL1> l1One(@PathVariable String id) {
        return R.ok(agentService.getL1(id));
    }

    @PostMapping("/l1")
    public R<AgentL1> saveL1(@RequestBody AgentL1 body) {
        return R.ok(agentService.saveL1(body));
    }

    @PostMapping("/l1/{id}/status")
    public R<AgentL1> l1Status(@PathVariable String id, @RequestBody Map<String, String> body) {
        return R.ok(agentService.setL1Status(id, body.get("status")));
    }

    @PostMapping("/l1/{id}/disable-cosign")
    public R<AgentL1> disableCosign(@PathVariable String id) {
        return R.ok(agentService.signDisableL1(id));
    }

    @GetMapping("/l2")
    public R<PageResult<AgentL2>> l2(@RequestParam(defaultValue = "1") long page,
                                     @RequestParam(defaultValue = "20") long pageSize,
                                     @RequestParam(required = false) String name,
                                     @RequestParam(required = false) String parentId,
                                     @RequestParam(required = false) String auditStatus,
                                     @RequestParam(required = false) Boolean pending,
                                     @RequestParam(required = false) String type,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(required = false) String region) {
        return R.ok(agentService.pageL2(page, pageSize, name, parentId, auditStatus, pending, type, status, region));
    }

    @PostMapping("/l2/mute-alarm")
    public R<Integer> muteAlarm(@RequestBody Map<String, Object> body) {
        Object raw = body.get("ids");
        List<String> ids = new ArrayList<>();
        if (raw instanceof List<?> list) {
            for (Object o : list) {
                if (o != null && !String.valueOf(o).isBlank()) {
                    ids.add(String.valueOf(o));
                }
            }
        }
        boolean mute = Boolean.TRUE.equals(body.get("mute")) || "true".equals(String.valueOf(body.getOrDefault("mute", "true")));
        return R.ok(agentService.muteExAlarm(ids, mute));
    }

    @GetMapping("/l2/{id}")
    public R<AgentL2> l2One(@PathVariable String id) {
        return R.ok(agentService.getL2(id));
    }

    @PostMapping("/l2")
    public R<AgentL2> saveL2(@RequestBody AgentL2 body) {
        return R.ok(agentService.saveL2(body));
    }

    @PostMapping("/l2/{id}/audit")
    public R<Void> audit(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        agentService.auditL2(id, Boolean.TRUE.equals(body.get("pass")));
        return R.ok();
    }

    @PostMapping("/l2/{id}/assign")
    public R<Void> assign(@PathVariable String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> areas = (List<String>) body.getOrDefault("areas", List.of());
        agentService.assignL2(id, String.valueOf(body.get("parentId")), areas);
        return R.ok();
    }

    @PostMapping("/l2/{id}/status")
    public R<AgentL2> l2Status(@PathVariable String id, @RequestBody Map<String, String> body) {
        return R.ok(agentService.setL2Status(id, body.get("status")));
    }

    @PostMapping("/l2/{id}/disable-cosign")
    public R<AgentL2> disableL2(@PathVariable String id) {
        return R.ok(agentService.signDisableL2(id));
    }

    @PostMapping("/l2/{id}/unbind")
    public R<AgentL2> unbind(@PathVariable String id) {
        return R.ok(agentService.unbindL2(id));
    }

    @GetMapping("/disable-pending")
    public R<Map<String, Object>> disablePending() {
        return R.ok(agentService.disablePending());
    }

    @PostMapping("/l2/{id}/delete")
    public R<Void> deleteL2(@PathVariable String id) {
        agentService.deleteL2(id);
        return R.ok();
    }

    @GetMapping("/subs")
    public R<List<SubAccount>> subs(@RequestParam(required = false) String l1Id) {
        return R.ok(agentService.listSubs(l1Id));
    }

    @PostMapping("/subs")
    public R<SubAccount> saveSub(@RequestBody Map<String, Object> body) {
        SubAccount row = new SubAccount();
        if (body.get("id") != null) {
            row.setId(String.valueOf(body.get("id")));
        }
        if (body.get("l1Id") != null) {
            row.setL1Id(String.valueOf(body.get("l1Id")));
        }
        row.setUsername(String.valueOf(body.getOrDefault("username", "")));
        row.setName(String.valueOf(body.getOrDefault("name", "")));
        if (body.get("status") != null) {
            row.setStatus(String.valueOf(body.get("status")));
        }
        String pwd = body.get("password") == null ? null : String.valueOf(body.get("password"));
        return R.ok(agentService.saveSub(row, pwd));
    }

    @PostMapping("/subs/{id}/status")
    public R<Void> subStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        agentService.setSubStatus(id, body.get("status"));
        return R.ok();
    }

    @GetMapping("/badges")
    public R<Map<String, Long>> badges() {
        return R.ok(agentService.badges());
    }
}
