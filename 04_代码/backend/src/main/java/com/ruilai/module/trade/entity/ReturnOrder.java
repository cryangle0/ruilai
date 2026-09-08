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
@TableName(value = "return_order", autoResultMap = true)
public class ReturnOrder extends StringEntity {
    private String no;
    private String type;
    private String typeLabel;
    private String fromId;
    private String fromName;
    private String approverId;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> sns;
    private String status;
    private String reason;
    private String reasonType;
    private String processNote;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> customer;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> photos;
    @TableField(exist = false)
    private String productDetail;
    @TableField(exist = false)
    private List<Map<String, Object>> snDetail;
}
