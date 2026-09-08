package com.ruilai.module.risk;

import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.RolePerms;
import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.R;
import com.ruilai.module.risk.entity.ExceptionTicket;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/exceptions")
@RequiredArgsConstructor
public class ExceptionController {

    private final ExceptionService exceptionService;
    private final com.ruilai.module.risk.StockWarnService stockWarnService;

    @GetMapping("/counts")
    public R<Map<String, Long>> counts(@RequestParam(required = false) String l1Id,
                                       @RequestParam(required = false) String l2Id,
                                       @RequestParam(required = false) String from,
                                       @RequestParam(required = false) String to) {
        return R.ok(exceptionService.counts(l1Id, l2Id, from, to));
    }

    @GetMapping
    public R<PageResult<ExceptionTicket>> page(@RequestParam(defaultValue = "1") long page,
                                               @RequestParam(defaultValue = "20") long pageSize,
                                               @RequestParam(required = false) String status,
                                               @RequestParam(required = false) String dim,
                                               @RequestParam(required = false) String type,
                                               @RequestParam(required = false) String l1Id,
                                               @RequestParam(required = false) String l2Id,
                                               @RequestParam(required = false) String from,
                                               @RequestParam(required = false) String to,
                                               @RequestParam(required = false) String sn) {
        return R.ok(exceptionService.page(page, pageSize, status, dim, type, l1Id, l2Id, from, to, sn));
    }

    @PostMapping("/scan-stock")
    public R<Void> scanStock() {
        AuthUtil.requireAdminPerm(RolePerms.ALL);
        stockWarnService.nightlyScan();
        return R.ok();
    }

    @GetMapping("/{id}")
    public R<ExceptionTicket> one(@PathVariable String id) {
        return R.ok(exceptionService.get(id));
    }

    @PostMapping("/{id}/explain")
    public R<ExceptionTicket> explain(@PathVariable String id, @RequestBody Map<String, String> body) {
        boolean asL2 = "L2".equals(AuthUtil.current().getRoleCode());
        return R.ok(exceptionService.explain(id, body.get("text"), asL2));
    }

    @PostMapping("/{id}/handle")
    public R<ExceptionTicket> handle(@PathVariable String id) {
        return R.ok(exceptionService.handle(id));
    }

    @PostMapping("/{id}/delete")
    public R<Void> delete(@PathVariable String id) {
        exceptionService.delete(id);
        return R.ok();
    }
}
