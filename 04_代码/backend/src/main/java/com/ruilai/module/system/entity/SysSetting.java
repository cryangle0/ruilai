package com.ruilai.module.system.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@TableName(value = "sys_setting", autoResultMap = true)
public class SysSetting {
    @TableId
    private String k;
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> v;
    private LocalDateTime updatedAt;
}
