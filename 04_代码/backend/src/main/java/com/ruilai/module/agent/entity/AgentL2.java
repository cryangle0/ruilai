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
@TableName(value = "agent_l2", autoResultMap = true)
public class AgentL2 extends StringEntity {
    private String code;
    private String name;
    private String type;
    private String parentId;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> areas;
    private String status;
    private Integer pending;
    private String auditStatus;
    private Integer protocolOk;
    private BigDecimal warnMultiplier;
    private String warnMode;
    private String prevParentId;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> prevAreas;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> ent;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> extra;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> disableCosign;

    @TableField(exist = false)
    private String parentName;
    @TableField(exist = false)
    private String loginUsername;
    @TableField(exist = false)
    private String loginPassword;
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
}
