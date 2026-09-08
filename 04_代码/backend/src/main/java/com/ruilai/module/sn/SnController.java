package com.ruilai.module.sn;

import com.ruilai.common.web.PageResult;
import com.ruilai.common.web.R;
import com.ruilai.module.sn.entity.SnCode;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sns")
@RequiredArgsConstructor
public class SnController {

    private final SnService snService;

    @GetMapping
    public R<PageResult<SnCode>> page(@RequestParam(defaultValue = "1") long page,
                                      @RequestParam(defaultValue = "20") long pageSize,
                                      @RequestParam(required = false) String sn,
                                      @RequestParam(required = false) String status,
                                      @RequestParam(required = false) String l1Id,
                                      @RequestParam(required = false) String l2Id,
                                      @RequestParam(required = false) String productName,
                                      @RequestParam(required = false) String productId,
                                      @RequestParam(required = false) String size,
                                      @RequestParam(required = false) String belt,
                                      @RequestParam(required = false) String channel,
                                      @RequestParam(required = false) String tag,
                                      @RequestParam(required = false) String factoryFrom,
                                      @RequestParam(required = false) String factoryTo,
                                      @RequestParam(required = false) String soldFrom,
                                      @RequestParam(required = false) String soldTo,
                                      @RequestParam(required = false) String returnFrom,
                                      @RequestParam(required = false) String returnTo) {
        return R.ok(snService.page(page, pageSize, sn, status, l1Id, l2Id, productName, productId, size, belt,
                channel, tag, factoryFrom, factoryTo, soldFrom, soldTo, returnFrom, returnTo));
    }

    @GetMapping("/{sn}")
    public R<SnCode> one(@PathVariable String sn) {
        return R.ok(snService.get(sn));
    }

    @PostMapping("/{sn}/freeze")
    public R<SnCode> freeze(@PathVariable String sn, @RequestBody Map<String, Object> body) {
        boolean frozen = !Boolean.FALSE.equals(body.get("frozen"));
        return R.ok(snService.freeze(sn, frozen));
    }

    @PostMapping("/generate")
    public R<List<SnCode>> generate(@RequestBody Map<String, Object> body) {
        int qty = body.get("qty") instanceof Number n ? n.intValue() : Integer.parseInt(String.valueOf(body.getOrDefault("qty", 10)));
        return R.ok(snService.generate(str(body.get("l1Id")), str(body.get("productId")),
                str(body.get("size")), str(body.get("belt")), qty));
    }

    @PostMapping("/import-seg")
    public R<List<SnCode>> importSeg(@RequestBody Map<String, Object> body) {
        return R.ok(snService.importSegments(str(body.get("l1Id")), str(body.get("productId")),
                str(body.get("size")), str(body.get("belt")), str(body.get("text"))));
    }

    @PostMapping("/{sn}/update")
    public R<SnCode> update(@PathVariable String sn, @RequestBody Map<String, Object> body) {
        return R.ok(snService.update(sn, body));
    }

    @PostMapping("/{sn}/reassign")
    public R<SnCode> reassign(@PathVariable String sn, @RequestBody Map<String, String> body) {
        return R.ok(snService.reassignFrozen(sn, body.get("l1Id")));
    }

    private static String str(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }
}
