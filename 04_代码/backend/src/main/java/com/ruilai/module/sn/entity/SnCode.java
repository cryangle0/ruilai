package com.ruilai.module.sn.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@TableName(value = "sn_code", autoResultMap = true)
public class SnCode {
    @TableId(value = "sn", type = IdType.INPUT)
    private String sn;
    private String productId;
    private String sizeCode;
    private String belt;
    private String l1Id;
    private String l2Id;
    private String status;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> tags;
    private Integer frozen;
    private LocalDateTime factoryAt;
    private LocalDateTime soldAt;
    private LocalDateTime returnAt;
    private LocalDateTime bindAt;
    private String bindIpRegion;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> userJson;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> prevUserJson;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> events;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> extra;
    private Integer reIn;
    private Integer resale;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    @TableLogic
    @TableField(select = false)
    private Integer deleted;

    @TableField(exist = false)
    private String productName;
}
