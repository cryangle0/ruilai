-- 平台账号绑定 sys_role；role_code 仍表示数据范围 ADMIN/L1/L2/SUB
ALTER TABLE sys_account
  ADD COLUMN role_id VARCHAR(16) NULL COMMENT 'sys_role.id' AFTER role_code;

UPDATE sys_account SET role_id = 'R1' WHERE role_code = 'ADMIN' AND (role_id IS NULL OR role_id = '');
UPDATE sys_account SET role_id = 'R2' WHERE role_code = 'L1' AND (role_id IS NULL OR role_id = '');
UPDATE sys_account SET role_id = 'R3' WHERE role_code = 'SUB' AND (role_id IS NULL OR role_id = '');
UPDATE sys_account SET role_id = 'R4' WHERE role_code = 'L2' AND (role_id IS NULL OR role_id = '');
