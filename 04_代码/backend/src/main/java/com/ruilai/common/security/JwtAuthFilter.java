package com.ruilai.common.security;

import com.ruilai.common.config.RedisKeys;
import com.ruilai.module.account.entity.SysAccount;
import com.ruilai.module.account.mapper.SysAccountMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SysAccountMapper accountMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        resolveLoginUser(request).ifPresent(user -> {
            var authentication = new UsernamePasswordAuthenticationToken(user, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        });
        chain.doFilter(request, response);
    }

    private Optional<LoginUser> resolveLoginUser(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return Optional.empty();
        }
        return jwtService.parse(header.substring(BEARER_PREFIX.length()))
                .flatMap(this::loadSession);
    }

    private Optional<LoginUser> loadSession(Claims claims) {
        String jti = claims.getId();
        if (jti == null) {
            return Optional.empty();
        }
        Object cached;
        try {
            cached = redisTemplate.opsForValue().get(RedisKeys.token(jti));
        } catch (Exception e) {
            return Optional.empty();
        }
        if (!(cached instanceof LoginUser user)) {
            return Optional.empty();
        }
        if (user.getAccountId() != null) {
            SysAccount account = accountMapper.selectById(user.getAccountId());
            if (account == null || !"启用".equals(account.getStatus())) {
                redisTemplate.delete(RedisKeys.token(jti));
                return Optional.empty();
            }
        }
        return Optional.of(user);
    }
}
