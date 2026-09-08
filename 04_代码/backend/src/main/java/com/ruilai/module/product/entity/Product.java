package com.ruilai.module.product.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "product", autoResultMap = true)
public class Product extends StringEntity {
    private String code;
    private String name;
    private String type;
    private String status;
    private String note;
    private String lineId;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> extra;
}
