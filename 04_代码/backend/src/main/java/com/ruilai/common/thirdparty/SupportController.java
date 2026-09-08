package com.ruilai.common.thirdparty;

import com.ruilai.common.web.R;
import com.ruilai.module.system.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final ThirdPartyGateway gateway;

    @GetMapping("/capabilities")
    public R<Map<String, Object>> capabilities() {
        return R.ok(gateway.capabilities());
    }

    @GetMapping("/locate")
    public R<Map<String, Object>> locate(@RequestParam(required = false) String ip,
                                         @RequestParam(required = false) String phone,
                                         @RequestParam(required = false) String address,
                                         @RequestParam(required = false) Double lng,
                                         @RequestParam(required = false) Double lat) {
        Map<String, Object> out = new LinkedHashMap<>();
        String clientIp = (ip == null || ip.isBlank()) ? LogService.clientIp() : ip;
        out.put("ip", clientIp);
        out.put("ipRegion", gateway.locateIp(clientIp).toMap());
        if (lng != null && lat != null) {
            out.put("gpsRegion", gateway.locateGps(lng, lat).toMap());
        }
        if (phone != null) {
            out.put("phoneRegion", gateway.locatePhone(phone).toMap());
        }
        if (address != null) {
            out.put("addrRegion", gateway.geocodeAddress(address).toMap());
        }
        return R.ok(out);
    }
}
