package com.ruilai.module.agent.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "agent_l1", autoResultMap = true)
public class AgentL1 extends StringEntity {
    private String code;
    private String name;
    private String contact;
    private String phone;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> mainAreas;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> saleAreas;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> directAreas;
    private BigDecimal warnMultiplier;
    private String warnMode;
    private String status;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> ent;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> extra;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> disableCosign;

    @TableField(exist = false)
    private Integer monthPurchaseQty;
    @TableField(exist = false)
    private Integer monthSalesQty;
    @TableField(exist = false)
    private Integer stockQty;
    @TableField(exist = false)
    private Integer exCount;
    @TableField(exist = false)
    private Integer pendingPoCount;
    @TableField(exist = false)
    private Integer pendingReturnCount;
    @TableField(exist = false)
    private String loginUsername;
    @TableField(exist = false)
    private String loginPassword;
    @TableField(exist = false)
    private List<String> saleCities;
}
