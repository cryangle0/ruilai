-- 二级停用双人会签、SN 情况/处理说明
ALTER TABLE agent_l2
  ADD COLUMN disable_cosign JSON NULL AFTER extra;

ALTER TABLE sn_code
  ADD COLUMN extra JSON NULL AFTER events;
