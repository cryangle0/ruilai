package com.ruilai.module.customer;

import com.ruilai.module.customer.entity.Customer;

import java.util.List;

public record CustomerPageResult(long total, List<Customer> list, int rangeQty, int histQty) {
}
