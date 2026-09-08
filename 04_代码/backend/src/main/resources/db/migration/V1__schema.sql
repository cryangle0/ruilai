-- 锐涞经销商管理系统 · 核心表
-- 业务主键沿用原型字符串 ID（L1A / P1 / PO0），便于对齐走查数据。

CREATE TABLE sys_account (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(120) NOT NULL,
  name          VARCHAR(64)  NOT NULL,
  role_code     VARCHAR(16)  NOT NULL COMMENT 'ADMIN/L1/L2/SUB',
  agent_id      VARCHAR(32)  NULL,
  phone         VARCHAR(20)  NULL,
  status        VARCHAR(16)  NOT NULL DEFAULT '启用',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted       TINYINT      NOT NULL DEFAULT 0,
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sys_role (
  id         VARCHAR(16)  PRIMARY KEY,
  name       VARCHAR(64)  NOT NULL,
  remark     VARCHAR(255) NULL,
  perms      JSON         NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted    TINYINT      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_line (
  id         VARCHAR(32)  PRIMARY KEY,
  code       VARCHAR(32)  NOT NULL,
  name       VARCHAR(64)  NOT NULL,
  active     TINYINT      NOT NULL DEFAULT 0,
  note       VARCHAR(255) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted    TINYINT      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product (
  id             VARCHAR(32)  PRIMARY KEY,
  code           VARCHAR(64)  NOT NULL,
  name           VARCHAR(128) NOT NULL,
  type           VARCHAR(16)  NOT NULL COMMENT 'kit/single/part',
  status         VARCHAR(16)  NOT NULL DEFAULT '上架',
  note           VARCHAR(255) NULL,
  line_id        VARCHAR(32)  NULL,
  extra          JSON         NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted        TINYINT      NOT NULL DEFAULT 0,
  KEY idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agent_l1 (
  id               VARCHAR(32)  PRIMARY KEY,
  code             VARCHAR(64)  NOT NULL,
  name             VARCHAR(128) NOT NULL,
  contact          VARCHAR(64)  NULL,
  phone            VARCHAR(20)  NULL,
  main_areas       JSON         NULL,
  sale_areas       JSON         NULL,
  direct_areas     JSON         NULL,
  warn_multiplier  DECIMAL(6,2) NOT NULL DEFAULT 1.50,
  warn_mode        VARCHAR(16)  NOT NULL DEFAULT 'soft',
  status           VARCHAR(16)  NOT NULL DEFAULT '启用',
  ent              JSON         NULL,
  extra            JSON         NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted          TINYINT      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agent_l2 (
  id               VARCHAR(32)  PRIMARY KEY,
  code             VARCHAR(64)  NOT NULL,
  name             VARCHAR(128) NOT NULL,
  type             VARCHAR(16)  NOT NULL DEFAULT '法人',
  parent_id        VARCHAR(32)  NULL,
  areas            JSON         NULL,
  status           VARCHAR(16)  NOT NULL DEFAULT '启用',
  pending          TINYINT      NOT NULL DEFAULT 0,
  audit_status     VARCHAR(16)  NOT NULL DEFAULT 'pending',
  protocol_ok      TINYINT      NOT NULL DEFAULT 0,
  warn_multiplier  DECIMAL(6,2) NOT NULL DEFAULT 1.50,
  warn_mode        VARCHAR(16)  NOT NULL DEFAULT 'strict',
  prev_parent_id   VARCHAR(32)  NULL,
  prev_areas       JSON         NULL,
  ent              JSON         NULL,
  extra            JSON         NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted          TINYINT      NOT NULL DEFAULT 0,
  KEY idx_parent (parent_id),
  KEY idx_audit (audit_status, pending)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sub_account (
  id         VARCHAR(32)  PRIMARY KEY,
  l1_id      VARCHAR(32)  NOT NULL,
  username   VARCHAR(64)  NOT NULL,
  name       VARCHAR(64)  NOT NULL,
  status     VARCHAR(16)  NOT NULL DEFAULT '启用',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted    TINYINT      NOT NULL DEFAULT 0,
  KEY idx_l1 (l1_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sn_code (
  sn              VARCHAR(64)  PRIMARY KEY,
  product_id      VARCHAR(32)  NOT NULL,
  size_code       VARCHAR(32)  NULL,
  belt            VARCHAR(32)  NULL,
  l1_id           VARCHAR(32)  NULL,
  l2_id           VARCHAR(32)  NULL,
  status          VARCHAR(16)  NOT NULL COMMENT 'warehouse/l1/l2/bound',
  tags            JSON         NULL,
  frozen          TINYINT      NOT NULL DEFAULT 0,
  factory_at      DATETIME     NULL,
  sold_at         DATETIME     NULL,
  return_at       DATETIME     NULL,
  bind_at         DATETIME     NULL,
  bind_ip_region  VARCHAR(64)  NULL,
  user_json       JSON         NULL,
  prev_user_json  JSON         NULL,
  events          JSON         NULL,
  re_in           TINYINT      NOT NULL DEFAULT 0,
  resale          TINYINT      NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted         TINYINT      NOT NULL DEFAULT 0,
  KEY idx_status (status),
  KEY idx_l1 (l1_id),
  KEY idx_l2 (l2_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order (
  id           VARCHAR(32)  PRIMARY KEY,
  no           VARCHAR(32)  NOT NULL,
  l1_id        VARCHAR(32)  NOT NULL,
  status       VARCHAR(16)  NOT NULL,
  `lines`      JSON         NULL,
  custom_lines JSON         NULL,
  parts        JSON         NULL,
  segments     JSON         NULL,
  cosign       JSON         NULL,
  approved_at  DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted      TINYINT      NOT NULL DEFAULT 0,
  UNIQUE KEY uk_no (no),
  KEY idx_l1_status (l1_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales_order (
  id           VARCHAR(32)  PRIMARY KEY,
  no           VARCHAR(32)  NOT NULL,
  channel      VARCHAR(16)  NOT NULL COMMENT 'distribute/direct',
  l1_id        VARCHAR(32)  NOT NULL,
  l2_id        VARCHAR(32)  NULL,
  product_id   VARCHAR(32)  NULL,
  plan_total   INT          NOT NULL DEFAULT 0,
  plan_by_size JSON         NULL,
  scanned      JSON         NULL,
  status       VARCHAR(16)  NOT NULL,
  customer     JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted      TINYINT      NOT NULL DEFAULT 0,
  UNIQUE KEY uk_no (no),
  KEY idx_l1 (l1_id),
  KEY idx_l2 (l2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE return_order (
  id           VARCHAR(32)  PRIMARY KEY,
  no           VARCHAR(32)  NOT NULL,
  type         VARCHAR(32)  NOT NULL,
  type_label   VARCHAR(64)  NULL,
  from_id      VARCHAR(32)  NULL,
  from_name    VARCHAR(128) NULL,
  approver_id  VARCHAR(32)  NULL,
  sns          JSON         NULL,
  status       VARCHAR(16)  NOT NULL,
  reason       VARCHAR(255) NULL,
  reason_type  VARCHAR(32)  NULL,
  process_note VARCHAR(512) NULL,
  customer     JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted      TINYINT      NOT NULL DEFAULT 0,
  UNIQUE KEY uk_no (no),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exception_ticket (
  id          VARCHAR(32)  PRIMARY KEY,
  occurred_at DATETIME     NOT NULL,
  type        VARCHAR(64)  NOT NULL,
  target      VARCHAR(128) NULL,
  detail      VARCHAR(512) NULL,
  notify_to   VARCHAR(64)  NULL,
  status      VARCHAR(16)  NOT NULL,
  dim         VARCHAR(16)  NOT NULL COMMENT 'activate/scan/stock',
  explain_txt VARCHAR(512) NULL,
  explain_l2  VARCHAR(512) NULL,
  dup_phone   VARCHAR(20)  NULL,
  extra       JSON         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted     TINYINT      NOT NULL DEFAULT 0,
  KEY idx_status (status),
  KEY idx_dim (dim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer (
  id         VARCHAR(32)  PRIMARY KEY,
  name       VARCHAR(64)  NULL,
  gender     VARCHAR(8)   NULL,
  age        VARCHAR(8)   NULL,
  phone      VARCHAR(20)  NULL,
  phone_loc  VARCHAR(32)  NULL,
  addr       VARCHAR(255) NULL,
  note       VARCHAR(255) NULL,
  sns        JSON         NULL,
  l1_id      VARCHAR(32)  NULL,
  l2_id      VARCHAR(32)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted    TINYINT      NOT NULL DEFAULT 0,
  KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_log (
  id          VARCHAR(32)  PRIMARY KEY,
  agent_type  VARCHAR(8)   NOT NULL,
  agent_id    VARCHAR(32)  NOT NULL,
  product_id  VARCHAR(32)  NULL,
  size_code   VARCHAR(32)  NULL,
  delta       INT          NOT NULL,
  reason      VARCHAR(64)  NULL,
  ref_no      VARCHAR(64)  NULL,
  occurred_at DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted     TINYINT      NOT NULL DEFAULT 0,
  KEY idx_agent (agent_type, agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE op_log (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  occurred_at DATETIME    NOT NULL,
  account    VARCHAR(64)  NULL,
  role_name  VARCHAR(64)  NULL,
  action     VARCHAR(255) NOT NULL,
  ip         VARCHAR(64)  NULL,
  ok         TINYINT      NOT NULL DEFAULT 1,
  type       VARCHAR(16)  NOT NULL DEFAULT 'op',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted    TINYINT      NOT NULL DEFAULT 0,
  KEY idx_time (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification (
  id         VARCHAR(32)  PRIMARY KEY,
  occurred_at DATETIME    NOT NULL,
  title      VARCHAR(128) NOT NULL,
  body       VARCHAR(512) NULL,
  to_role    VARCHAR(64)  NULL,
  read_flag  TINYINT      NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted    TINYINT      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sys_setting (
  k          VARCHAR(64)  PRIMARY KEY,
  v          JSON         NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
