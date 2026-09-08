package com.ruilai.module.dashboard;

import com.ruilai.common.web.R;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public R<Map<String, Object>> overview() {
        return R.ok(dashboardService.overview());
    }

    @GetMapping("/stats")
    public R<Map<String, Object>> stats(@RequestParam(required = false) String l1Id,
                                        @RequestParam(required = false) String l2Id,
                                        @RequestParam(required = false) String from,
                                        @RequestParam(required = false) String to) {
        return R.ok(dashboardService.stats(l1Id, l2Id, from, to));
    }
}
