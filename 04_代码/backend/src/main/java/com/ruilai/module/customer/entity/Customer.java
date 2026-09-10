package com.ruilai.module.customer.entity;

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
@TableName(value = "customer", autoResultMap = true)
public class Customer extends StringEntity {
    private String name;
    private String gender;
    private String age;
    private String phone;
    private String phoneLoc;
    private String addr;
    private String note;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> sns;
    private String orderNo;
    private String l1Id;
    private String l2Id;

    @TableField(exist = false)
    private List<String> products;
    @TableField(exist = false)
    private List<Map<String, Object>> snRows;
    @TableField(exist = false)
    private Boolean dupPhone;
    @TableField(exist = false)
    private Boolean dupAddr;
    @TableField(exist = false)
    private Integer rangeQty;
    @TableField(exist = false)
    private Integer histQty;
}
