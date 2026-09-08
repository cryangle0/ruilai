package com.ruilai.common.thirdparty;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * 号码归属地离线兜底。真实业务以阿里云号码百科/云市场为准；
 * 无 AppKey 时用号段表，保证激活校验链路可跑通。
 */
@Component
public class OfflinePhoneLocator {

    private static final Map<String, String> PREFIX7 = new HashMap<>();
    private static final Map<String, String> PREFIX3 = new HashMap<>();

    static {
        // 演示种子号 + 常见号段（省）
        put7("1380000", "浙江", "杭州");
        put7("1380001", "浙江", "杭州");
        put7("1390000", "广东", "广州");
        put7("1370000", "上海", "上海");
        put7("1360000", "北京", "北京");
        put7("1350000", "江苏", "南京");
        put7("1880000", "四川", "成都");
        PREFIX3.put("130", "北京");
        PREFIX3.put("131", "北京");
        PREFIX3.put("132", "北京");
        PREFIX3.put("133", "北京");
        PREFIX3.put("134", "北京");
        PREFIX3.put("135", "江苏");
        PREFIX3.put("136", "北京");
        PREFIX3.put("137", "上海");
        PREFIX3.put("138", "浙江");
        PREFIX3.put("139", "广东");
        PREFIX3.put("147", "北京");
        PREFIX3.put("150", "浙江");
        PREFIX3.put("151", "江苏");
        PREFIX3.put("152", "上海");
        PREFIX3.put("153", "广东");
        PREFIX3.put("155", "河北");
        PREFIX3.put("156", "山东");
        PREFIX3.put("157", "四川");
        PREFIX3.put("158", "浙江");
        PREFIX3.put("159", "广东");
        PREFIX3.put("180", "浙江");
        PREFIX3.put("181", "广东");
        PREFIX3.put("182", "上海");
        PREFIX3.put("183", "江苏");
        PREFIX3.put("184", "四川");
        PREFIX3.put("185", "北京");
        PREFIX3.put("186", "浙江");
        PREFIX3.put("187", "广东");
        PREFIX3.put("188", "四川");
        PREFIX3.put("189", "上海");
        PREFIX3.put("198", "北京");
        PREFIX3.put("199", "广东");
    }

    private static void put7(String prefix, String province, String city) {
        PREFIX7.put(prefix, province + "|" + city);
    }

    public Region locate(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() < 3) {
            return Region.empty("offline");
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() >= 7) {
            String hit = PREFIX7.get(digits.substring(0, 7));
            if (hit != null) {
                String[] p = hit.split("\\|", 2);
                return Region.of(p[0], p.length > 1 ? p[1] : "", "", "offline-7");
            }
        }
        String p3 = PREFIX3.get(digits.substring(0, 3));
        if (p3 != null) {
            return Region.of(p3, "", "", "offline-3");
        }
        return Region.empty("offline");
    }
}
