-- ============================================================
-- 学立方（learnmate）后端数据库结构  MySQL 8.0 / utf8mb4
-- 表结构对应用户端预留接口：
--   /api/auth/*            → users
--   /api/student/classes*  → classes / class_memberships
--   /api/student/home/*    → daily_tasks / schedules / reviews
--   /api/student/wrongbook → wrong_questions / upload_history
--   /api/student/coins*    → user_assets / coin_transactions
--   /api/student/mall*     → silver_products / coin_products / orders
--   /api/teacher/classes/* → tasks / student_tasks
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. 用户（学生 / 教师 / 家长 / 后台管理员）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `account`       VARCHAR(64)  NOT NULL COMMENT '登录账号，业务主键',
  `password_hash` VARCHAR(100) NOT NULL,
  `role`          ENUM('student','teacher','parent','admin') NOT NULL DEFAULT 'student',
  `nickname`      VARCHAR(64)  NOT NULL DEFAULT '',
  `avatar`        VARCHAR(255) NOT NULL DEFAULT '',
  `avatar_text`   VARCHAR(8)   NOT NULL DEFAULT '',
  `signature`     VARCHAR(255) NOT NULL DEFAULT '',
  `status`        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  `study_days`    INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_account` (`account`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ------------------------------------------------------------
-- 2. 学生资产（金币 / 银币）—— 余额以后端为权威
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `user_assets`;
CREATE TABLE `user_assets` (
  `user_id`                    VARCHAR(64) NOT NULL,
  `learning_coin`              INT         NOT NULL DEFAULT 0 COMMENT '学习金币',
  `silver_coin`                INT         NOT NULL DEFAULT 0 COMMENT '银币',
  `consecutive_incomplete_days`INT         NOT NULL DEFAULT 0 COMMENT '连续完全未完成天数',
  `updated_at`                 DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生资产表';

-- ------------------------------------------------------------
-- 3. 班级 & 成员关系（多对多，ADMIN ≠ MEMBER）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id`          VARCHAR(32)  NOT NULL COMMENT '如 class-001',
  `name`        VARCHAR(64)  NOT NULL,
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `goal`        VARCHAR(255) NOT NULL DEFAULT '',
  `invite_code` VARCHAR(16)  NOT NULL,
  `max_members` INT          NOT NULL DEFAULT 60,
  `status`      ENUM('ACTIVE','DISSOLVED') NOT NULL DEFAULT 'ACTIVE',
  `created_by`  VARCHAR(64)  NOT NULL DEFAULT '',
  `created_at`  DATE         NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_classes_invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

DROP TABLE IF EXISTS `class_memberships`;
CREATE TABLE `class_memberships` (
  `id`        BIGINT      NOT NULL AUTO_INCREMENT,
  `user_id`   VARCHAR(64) NOT NULL,
  `class_id`  VARCHAR(32) NOT NULL,
  `role`      ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
  `status`    ENUM('ACTIVE','LEFT')  NOT NULL DEFAULT 'ACTIVE',
  `joined_at` DATE        NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_membership` (`user_id`,`class_id`,`role`),
  KEY `idx_membership_class` (`class_id`,`role`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级成员关系（ADMIN 管理 / MEMBER 学生）';

-- ------------------------------------------------------------
-- 4. 教师布置的班级任务 & 学生完成归属（StudentTask）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id`          VARCHAR(32)  NOT NULL COMMENT '如 t-3001',
  `class_id`    VARCHAR(32)  NOT NULL,
  `title`       VARCHAR(128) NOT NULL,
  `description` VARCHAR(500) NOT NULL DEFAULT '',
  `deadline`    DATE         NOT NULL,
  `status`      ENUM('active','ended') NOT NULL DEFAULT 'active',
  `created_by`  VARCHAR(64)  NOT NULL DEFAULT '',
  `created_at`  DATE         NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级任务表';

DROP TABLE IF EXISTS `student_tasks`;
CREATE TABLE `student_tasks` (
  `id`           BIGINT      NOT NULL AUTO_INCREMENT,
  `task_id`      VARCHAR(32) NOT NULL,
  `class_id`     VARCHAR(32) NOT NULL,
  `user_id`      VARCHAR(64) NOT NULL,
  `status`       ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  `completed_at` DATE        NULL,
  `created_at`   DATE        NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_task` (`task_id`,`user_id`),
  KEY `idx_st_user` (`user_id`),
  KEY `idx_st_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务×学生完成归属';

-- ------------------------------------------------------------
-- 5. 学生首页：今日任务 / 学习安排 / 复习
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `daily_tasks`;
CREATE TABLE `daily_tasks` (
  `id`                BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`           VARCHAR(64)  NOT NULL,
  `task_date`         DATE         NOT NULL,
  `title`             VARCHAR(128) NOT NULL,
  `description`       VARCHAR(255) NOT NULL DEFAULT '',
  `type`              ENUM('study','review') NOT NULL DEFAULT 'study',
  `source`            ENUM('ai','class')     NOT NULL DEFAULT 'ai',
  `class_id`          VARCHAR(32)  NULL,
  `teacher_task_id`   VARCHAR(32)  NULL,
  `estimated_minutes` INT          NOT NULL DEFAULT 30,
  `weight`            INT          NOT NULL DEFAULT 20,
  `completed`         TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_daily_user_date` (`user_id`,`task_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生个人今日任务';

DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT,
  `user_id`    VARCHAR(64) NOT NULL,
  `task_date`  DATE        NOT NULL,
  `start_time` VARCHAR(8)  NOT NULL,
  `end_time`   VARCHAR(8)  NOT NULL,
  `title`      VARCHAR(128) NOT NULL,
  `type`       ENUM('class','study','review') NOT NULL DEFAULT 'study',
  `status`     ENUM('completed','current','upcoming') NOT NULL DEFAULT 'upcoming',
  `task_id`    BIGINT      NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sched_user_date` (`user_id`,`task_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='今日学习安排';

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id`                   BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`              VARCHAR(64)  NOT NULL,
  `task_date`            DATE         NOT NULL,
  `knowledge_point_id`   BIGINT       NULL,
  `title`                VARCHAR(128) NOT NULL,
  `last_study_days_ago`  INT          NOT NULL DEFAULT 0,
  `review_level`         INT          NOT NULL DEFAULT 1,
  `due`                  TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_review_user_date` (`user_id`,`task_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='今日复习安排';

-- ------------------------------------------------------------
-- 6. 错题本 & 上传历史
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `wrong_questions`;
CREATE TABLE `wrong_questions` (
  `id`                 BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`            VARCHAR(64)  NOT NULL,
  `image_url`          VARCHAR(500) NOT NULL DEFAULT '',
  `subject`            VARCHAR(32)  NOT NULL DEFAULT '',
  `title`              VARCHAR(128) NOT NULL DEFAULT '',
  `knowledge_point`    VARCHAR(64)  NOT NULL DEFAULT '',
  `knowledge_point_id` BIGINT       NULL,
  `question_type`      ENUM('choice','fill','application','proof') NOT NULL DEFAULT 'choice',
  `uploaded_at`        DATETIME     NOT NULL,
  `source`             ENUM('camera','document') NOT NULL DEFAULT 'camera',
  `source_file_id`     VARCHAR(64)  NOT NULL DEFAULT '',
  `status`             ENUM('review','mastered') NOT NULL DEFAULT 'review',
  `need_review`        TINYINT(1)   NOT NULL DEFAULT 1,
  `ai_status`          ENUM('processing','success','failed') NOT NULL DEFAULT 'processing',
  `ai_recognized_text` TEXT         NULL,
  `ai_analysis`        TEXT         NULL,
  `wrong_count`        INT          NOT NULL DEFAULT 1,
  `review_level`       INT          NOT NULL DEFAULT 0,
  `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wq_user` (`user_id`,`status`),
  KEY `idx_wq_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题本';

DROP TABLE IF EXISTS `upload_history`;
CREATE TABLE `upload_history` (
  `id`            VARCHAR(32)  NOT NULL,
  `user_id`       VARCHAR(64)  NOT NULL,
  `file_name`     VARCHAR(255) NOT NULL DEFAULT '',
  `source`        ENUM('camera','document') NOT NULL DEFAULT 'camera',
  `upload_time`   DATETIME     NOT NULL,
  `status`        ENUM('processing','success','failed') NOT NULL DEFAULT 'processing',
  `result_count`  INT          NOT NULL DEFAULT 0,
  `question_ids`  VARCHAR(500) NOT NULL DEFAULT '' COMMENT '逗号分隔的错题ID',
  PRIMARY KEY (`id`),
  KEY `idx_uh_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题上传历史';

-- ------------------------------------------------------------
-- 7. 金币流水 / 商城商品 / 订单
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `coin_transactions`;
CREATE TABLE `coin_transactions` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`       VARCHAR(64)  NOT NULL,
  `delta`         INT          NOT NULL COMMENT '正数获得，负数扣除',
  `type`          ENUM('earn','penalty','redeem','recharge') NOT NULL DEFAULT 'earn',
  `description`   VARCHAR(128) NOT NULL DEFAULT '',
  `balance_after` INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_coin_user_time` (`user_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习金币流水';

DROP TABLE IF EXISTS `silver_products`;
CREATE TABLE `silver_products` (
  `product_id`    VARCHAR(32)  NOT NULL,
  `silver_amount` INT          NOT NULL,
  `price`         DECIMAL(10,2) NOT NULL,
  `unit_price`    DECIMAL(10,4) NOT NULL DEFAULT 0,
  `enabled`       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='银币充值套餐';

DROP TABLE IF EXISTS `coin_products`;
CREATE TABLE `coin_products` (
  `product_id`  VARCHAR(32)  NOT NULL,
  `name`        VARCHAR(64)  NOT NULL,
  `cost`        INT          NOT NULL,
  `type`        VARCHAR(32)  NOT NULL DEFAULT 'virtual',
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `enabled`     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习金币兑换商品';

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`           VARCHAR(40)  NOT NULL,
  `user_id`      VARCHAR(64)  NOT NULL,
  `product_id`   VARCHAR(32)  NOT NULL,
  `product_type` ENUM('silver','coin') NOT NULL DEFAULT 'silver',
  `amount`       DECIMAL(10,2) NULL,
  `status`       ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城订单';

-- ------------------------------------------------------------
-- 8. 反馈 / FAQ / 主题 / 工作台 / 家长孩子
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`    VARCHAR(64)  NOT NULL,
  `type`       VARCHAR(32)  NOT NULL DEFAULT 'other',
  `content`    TEXT         NOT NULL,
  `images`     VARCHAR(1000) NOT NULL DEFAULT '',
  `contact`    VARCHAR(128) NOT NULL DEFAULT '',
  `status`     ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new',
  `reply`      TEXT         NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fb_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户建议反馈';

DROP TABLE IF EXISTS `faq_items`;
CREATE TABLE `faq_items` (
  `id`       VARCHAR(32)  NOT NULL,
  `category` VARCHAR(64)  NOT NULL,
  `question` VARCHAR(255) NOT NULL,
  `answer`   TEXT         NOT NULL,
  `sort`     INT          NOT NULL DEFAULT 0,
  `enabled`  TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='常见问题';

DROP TABLE IF EXISTS `user_themes`;
CREATE TABLE `user_themes` (
  `user_id`              VARCHAR(64) NOT NULL,
  `current_theme`        VARCHAR(32) NOT NULL DEFAULT 'mint',
  `home_theme`           VARCHAR(32) NOT NULL DEFAULT 'mint',
  `workbench_theme`      VARCHAR(32) NOT NULL DEFAULT 'mint',
  `sync_workbench_theme` TINYINT(1)  NOT NULL DEFAULT 1,
  `updated_at`           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题设置';

DROP TABLE IF EXISTS `workbenches`;
CREATE TABLE `workbenches` (
  `id`         VARCHAR(32)  NOT NULL,
  `user_id`    VARCHAR(64)  NOT NULL,
  `title`      VARCHAR(128) NOT NULL DEFAULT '',
  `mode`       VARCHAR(32)  NOT NULL DEFAULT 'free',
  `content`    JSON         NULL,
  `status`     ENUM('draft','generated') NOT NULL DEFAULT 'draft',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wb_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习工作台';

DROP TABLE IF EXISTS `teacher_records`;
CREATE TABLE `teacher_records` (
  `id`         VARCHAR(48)  NOT NULL,
  `user_id`    VARCHAR(64)  NOT NULL,
  `type`       ENUM('memos','activities','conversations','courseware','schedule','grades','studentMeta') NOT NULL,
  `payload`    JSON         NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tr_user_type` (`user_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师工作台模块记录（备忘/活动/谈话/课件/课表/成绩/学生档案）';

DROP TABLE IF EXISTS `parent_children`;
CREATE TABLE `parent_children` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `parent_id`   VARCHAR(64) NOT NULL COMMENT '家长账号',
  `child_name`  VARCHAR(32) NOT NULL,
  `short_name`  VARCHAR(8)  NOT NULL DEFAULT '',
  `grade`       VARCHAR(16) NOT NULL DEFAULT '',
  `class_name`  VARCHAR(32) NOT NULL DEFAULT '',
  `student_no`  VARCHAR(32) NOT NULL DEFAULT '',
  `relation`    VARCHAR(16) NOT NULL DEFAULT '',
  `is_primary`  TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_pc_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长-孩子绑定';

SET FOREIGN_KEY_CHECKS = 1;
