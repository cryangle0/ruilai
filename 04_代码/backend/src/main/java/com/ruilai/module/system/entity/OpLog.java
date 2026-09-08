package com.ruilai.module.system.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ruilai.common.config.LongEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("op_log")
public class OpLog extends LongEntity {
    private LocalDateTime occurredAt;
    private String account;
    @TableField("role_name")
    private String roleName;
    private String action;
    private String ip;
    private Integer ok;
    private String type;
}
