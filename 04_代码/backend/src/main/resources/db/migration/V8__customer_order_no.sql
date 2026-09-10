ALTER TABLE customer
  ADD COLUMN order_no VARCHAR(32) NULL COMMENT '关联C端销售单号' AFTER sns,
  ADD KEY idx_customer_order_no (order_no);
