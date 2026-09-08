-- 退货凭证、一级停用双人会签（对齐原型）
ALTER TABLE return_order
  ADD COLUMN photos JSON NULL AFTER customer;

ALTER TABLE agent_l1
  ADD COLUMN disable_cosign JSON NULL AFTER extra;
