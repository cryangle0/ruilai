package com.ruilai.common.web;

import com.ruilai.common.time.ChinaTime;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public R<Map<String, Object>> health() {
        return R.ok(Map.of(
                "app", "ruilai-server",
                "version", "0.1.0",
                "time", ChinaTime.now().toString(),
                "zone", ChinaTime.ZONE.getId()
        ));
    }
}
