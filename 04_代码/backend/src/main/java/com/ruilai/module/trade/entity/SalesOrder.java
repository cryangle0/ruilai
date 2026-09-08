package com.ruilai.module.trade.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "sales_order", autoResultMap = true)
public class SalesOrder extends StringEntity {
    private String no;
    private String channel;
    private String l1Id;
    private String l2Id;
    private String productId;
    private Integer planTotal;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> planBySize;
    @TableField(value = "`lines`", typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> lines;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> scanned;
    private String status;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> customer;
    @TableField(exist = false)
    private String l1Name;
    @TableField(exist = false)
    private String l2Name;
    @TableField(exist = false)
    private String productName;
    @TableField(exist = false)
    private String productDetail;
    @TableField(exist = false)
    private Map<String, Object> warnEx;
    @TableField(exist = false)
    private List<Map<String, Object>> snRows;
    @TableField(exist = false)
    private List<Map<String, Object>> parts;
}
