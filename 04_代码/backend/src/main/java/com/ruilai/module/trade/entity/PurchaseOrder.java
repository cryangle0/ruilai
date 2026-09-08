package com.ruilai.module.trade.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "purchase_order", autoResultMap = true)
public class PurchaseOrder extends StringEntity {
    private String no;
    private String l1Id;
    private String status;
    @TableField(value = "`lines`", typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> lines;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> customLines;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> parts;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> segments;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> cosign;
    private LocalDateTime approvedAt;
    @TableField(exist = false)
    private Map<String, Object> warnEx;
}
