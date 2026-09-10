ALTER TABLE notification
  ADD COLUMN route VARCHAR(255) NULL COMMENT '管理端点击通知后的站内路由' AFTER body;
