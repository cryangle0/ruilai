package com.ruilai.module.account.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ruilai.common.config.LongEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_account")
public class SysAccount extends LongEntity {
    private String username;
    private String passwordHash;
    private String name;
    private String roleCode;
    private String roleId;
    private String agentId;
    private String phone;
    private String status;
}
