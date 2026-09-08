package com.ruilai.module.agent.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sub_account")
public class SubAccount extends StringEntity {
    private String l1Id;
    private String username;
    private String name;
    private String status;
}
