package com.ruilai.module.trade.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("stock_log")
public class StockLog extends StringEntity {
    private String agentType;
    private String agentId;
    private String productId;
    private String sizeCode;
    private Integer delta;
    private String reason;
    @TableField("ref_no")
    private String refNo;
    private LocalDateTime occurredAt;
}
