package com.ruilai.module.product.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("product_line")
public class ProductLine extends StringEntity {
    private String code;
    private String name;
    private Integer active;
    private String note;
}
