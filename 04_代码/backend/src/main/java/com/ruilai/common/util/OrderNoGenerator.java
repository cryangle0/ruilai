package com.ruilai.common.util;

import com.ruilai.common.config.RedisKeys;
import com.ruilai.common.time.ChinaTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class OrderNoGenerator {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final Duration TTL = Duration.ofHours(48);

    private final StringRedisTemplate redis;

    public String next(String prefix) {
        String day = ChinaTime.today().format(DAY);
        String key = RedisKeys.orderNo(prefix, day);
        Long seq = redis.opsForValue().increment(key);
        redis.expire(key, TTL);
        return prefix + day + String.format("%03d", seq == null ? 1 : seq);
    }
}
