package com.ruilai.module.sn;

import com.ruilai.module.sn.entity.SnCode;
import com.ruilai.common.time.ChinaTime;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SnEventWriter {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void append(SnCode row, String title, String desc, String type) {
        if (row == null) {
            return;
        }
        List<Map<String, Object>> ev = row.getEvents() == null ? new ArrayList<>() : new ArrayList<>(row.getEvents());
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("time", ChinaTime.now().format(FMT));
        item.put("title", title);
        item.put("desc", desc == null ? "" : desc);
        item.put("type", type);
        ev.add(0, item);
        if (ev.size() > 80) {
            ev = new ArrayList<>(ev.subList(0, 80));
        }
        row.setEvents(ev);
    }
}
