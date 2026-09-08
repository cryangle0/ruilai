package com.ruilai.module.risk.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "exception_ticket", autoResultMap = true)
public class ExceptionTicket extends StringEntity {
    private LocalDateTime occurredAt;
    private String type;
    private String target;
    private String detail;
    @TableField("notify_to")
    private String notifyTo;
    private String status;
    private String dim;
    @TableField("explain_txt")
    private String explainTxt;
    private String explainL2;
    private String dupPhone;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> extra;
}
