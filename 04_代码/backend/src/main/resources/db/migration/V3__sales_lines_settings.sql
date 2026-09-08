-- 销售单明细行（标品/非标/随售），以及异常规则缺省值
ALTER TABLE sales_order
  ADD COLUMN `lines` JSON NULL COMMENT '销售明细行' AFTER plan_by_size;

INSERT INTO sys_setting (k, v)
VALUES ('exception_rules', JSON_OBJECT(
  'multiplier', 1.5,
  'overOrderRatio', 1.0,
  'stockTurnover', 1.5,
  'softAutoClose', false
))
ON DUPLICATE KEY UPDATE k = k;
