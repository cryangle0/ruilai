package com.ruilai.module.system;

import com.ruilai.common.security.AuthUtil;
import com.ruilai.common.security.LoginUser;
import com.ruilai.module.system.entity.OpLog;
import com.ruilai.module.system.mapper.OpLogMapper;
import com.ruilai.common.time.ChinaTime;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class LogService {

    private final OpLogMapper opLogMapper;

    public void record(String action, String type, boolean ok) {
        LoginUser user = AuthUtil.currentOrNull();
        record(user == null ? "" : user.getUsername(),
                user == null ? "" : user.getName(),
                action, type, ok);
    }

    public void record(String account, String roleName, String action, String type, boolean ok) {
        OpLog log = new OpLog();
        log.setOccurredAt(ChinaTime.now());
        log.setAccount(account);
        log.setRoleName(roleName);
        log.setAction(action);
        log.setIp(clientIp());
        log.setOk(ok ? 1 : 0);
        log.setType(type);
        opLogMapper.insert(log);
    }

    public static String clientIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return "";
        }
        HttpServletRequest req = attrs.getRequest();
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
