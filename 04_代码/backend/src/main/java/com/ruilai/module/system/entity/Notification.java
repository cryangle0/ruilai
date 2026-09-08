package com.ruilai.module.system.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("notification")
public class Notification extends StringEntity {
    private LocalDateTime occurredAt;
    private String title;
    private String body;
    private String route;
    @TableField("to_role")
    private String toRole;
    private Integer readFlag;
}
