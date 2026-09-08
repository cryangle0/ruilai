package com.ruilai.module.customer;

import com.ruilai.common.web.R;
import com.ruilai.module.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public R<CustomerPageResult> page(@RequestParam(defaultValue = "1") long page,
                                        @RequestParam(defaultValue = "20") long pageSize,
                                        @RequestParam(required = false) String keyword,
                                        @RequestParam(required = false) String l1Id,
                                        @RequestParam(required = false) String l2Id,
                                        @RequestParam(required = false) String sn,
                                        @RequestParam(required = false) String phone,
                                        @RequestParam(required = false) String addr,
                                        @RequestParam(required = false) String mark,
                                        @RequestParam(required = false) String from,
                                        @RequestParam(required = false) String to,
                                        @RequestParam(required = false) String channel) {
        return R.ok(customerService.page(page, pageSize, keyword, l1Id, l2Id, sn, phone, addr, mark, from, to, channel));
    }

    @GetMapping("/{id}")
    public R<Customer> get(@PathVariable String id) {
        return R.ok(customerService.get(id));
    }

    @PostMapping
    public R<Customer> save(@RequestBody Customer body) {
        return R.ok(customerService.save(body));
    }

    @PostMapping("/{id}/delete")
    public R<Void> delete(@PathVariable String id) {
        customerService.delete(id);
        return R.ok();
    }
}
