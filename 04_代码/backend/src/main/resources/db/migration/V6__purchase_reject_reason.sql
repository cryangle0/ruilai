ALTER TABLE purchase_order
    ADD COLUMN reject_reason VARCHAR(500) NULL AFTER cosign;
