package com.ruilai.module.account.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ruilai.common.config.StringEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "sys_role", autoResultMap = true)
public class SysRole extends StringEntity {
    private String name;
    private String remark;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> perms;
}
