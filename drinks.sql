/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80300 (8.3.0)
 Source Host           : localhost:3306
 Source Schema         : drinks

 Target Server Type    : MySQL
 Target Server Version : 80300 (8.3.0)
 File Encoding         : 65001

 Date: 24/01/2025 14:37:30
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '管理员用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(加密)',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '管理员姓名',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色：super_admin-超级管理员,admin-普通管理员',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '电子邮箱',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：1-正常,0-禁用',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admins
-- ----------------------------
INSERT INTO `admins` VALUES (1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'super_admin', '13800138001', 'admin@example.com', 1, NULL, '2025-01-21 21:50:58', '2025-01-24 12:28:43');
INSERT INTO `admins` VALUES (3, 'user', '$2a$10$gU4K2K2QtNVsC3ijionUXuspL1zUKiGLFuLHXIr2UVNX5rJTDBnla', '王洪瑞', 'super_admin', '19861427085', '1028943406@qq.com', 1, '2025-01-24 12:27:07', '2025-01-21 23:21:49', '2025-01-24 12:28:38');
INSERT INTO `admins` VALUES (5, '阿达啊是的', '$2a$10$5RQBoif1XzCQYtNLdcwe6eB58ICxUmo8P2dzv14KtqfPFpBSUXSp.', '阿达撒大声地', 'admin', '19872640985', '123@qq.com', 1, NULL, '2025-01-24 11:56:24', '2025-01-24 14:25:21');
INSERT INTO `admins` VALUES (6, '阿达是的', '$2a$10$n8xFkJLqfwKSjrBYV2kjP.6ox/V05uIkujNLpnsJNlH3LRcKKqEpS', '阿萨德阿是', 'admin', NULL, NULL, 1, NULL, '2025-01-24 12:09:33', '2025-01-24 14:25:21');
INSERT INTO `admins` VALUES (7, '123123', '$2a$10$gtV5wwGeTyzXmxSHoXuDVOjMd8SdZdJUF1FMzfUUXzjfMh9z5k9ka', '123', 'normal_admin', '19861427087', '1028941113406@qq.com', 1, NULL, '2025-01-24 14:25:00', '2025-01-24 14:25:20');

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单项ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL COMMENT '购买数量',
  `price` decimal(10, 2) NOT NULL COMMENT '商品单价',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_product_quantity`(`product_id` ASC, `quantity` ASC) USING BTREE,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单商品明细表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_items
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单编号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `total_amount` decimal(10, 2) NOT NULL COMMENT '订单总金额',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单状态：pending-待支付,paid-已支付,completed-已完成,cancelled-已取消',
  `payment_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支付方式',
  `payment_time` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_created_at_status`(`created_at` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商品名称',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商品类别',
  `price` decimal(10, 2) NOT NULL COMMENT '商品价格',
  `stock` int NOT NULL DEFAULT 0 COMMENT '库存数量',
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '商品图片URL',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '商品描述',
  `status` tinyint NULL DEFAULT 1 COMMENT '商品状态：1-上架,0-下架',
  `sales_count` int NULL DEFAULT 0 COMMENT '销售数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商品信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (1, '可口可乐', '碳酸饮料', 3.50, 100, NULL, '经典可口可乐', 1, 0, '2025-01-21 21:50:58', '2025-01-24 14:29:42');
INSERT INTO `products` VALUES (2, '百事可乐', '碳酸饮料', 3.50, 100, NULL, '百事可乐', 1, 0, '2025-01-21 21:50:58', '2025-01-21 21:50:58');
INSERT INTO `products` VALUES (3, '农夫山泉', '矿泉水', 2.00, 200, NULL, '天然矿泉水', 1, 0, '2025-01-21 21:50:58', '2025-01-21 21:50:58');
INSERT INTO `products` VALUES (4, '红牛', '功能饮料', 6.00, 50, NULL, '提神饮料', 1, 0, '2025-01-21 21:50:58', '2025-01-21 21:50:58');
INSERT INTO `products` VALUES (5, '雀巢咖啡', '咖啡', 5.00, 80, NULL, '即饮咖啡', 1, 0, '2025-01-21 21:50:58', '2025-01-21 21:50:58');
INSERT INTO `products` VALUES (6, 'asd 123', '碳酸饮料', 10.00, 10, 'https://tse1-mm.cn.bing.net/th/id/OIP-C.qmIh5R-d_DmDKOYgzN09agHaJQ?rs=1&pid=ImgDetMain', 'asdasdasd', 1, 0, '2025-01-24 14:34:30', '2025-01-24 14:35:26');

-- ----------------------------
-- Table structure for promotion_products
-- ----------------------------
DROP TABLE IF EXISTS `promotion_products`;
CREATE TABLE `promotion_products`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `promotion_id` int NOT NULL COMMENT '促销活动ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `promotion_id`(`promotion_id` ASC) USING BTREE,
  INDEX `product_id`(`product_id` ASC) USING BTREE,
  CONSTRAINT `promotion_products_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `promotion_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '促销活动商品关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of promotion_products
-- ----------------------------
INSERT INTO `promotion_products` VALUES (1, 1, 1, '2025-01-21 21:50:58');
INSERT INTO `promotion_products` VALUES (2, 1, 2, '2025-01-21 21:50:58');

-- ----------------------------
-- Table structure for promotions
-- ----------------------------
DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '促销活动ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '活动名称',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '活动类型：discount-折扣,special_price-特价,points-积分',
  `start_time` timestamp NOT NULL COMMENT '活动开始时间',
  `end_time` timestamp NOT NULL COMMENT '活动结束时间',
  `discount_value` decimal(10, 2) NULL DEFAULT NULL COMMENT '折扣值或特价金额',
  `points_value` int NULL DEFAULT NULL COMMENT '积分值',
  `status` tinyint NULL DEFAULT 1 COMMENT '活动状态：1-活动中,0-已结束',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '促销活动表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of promotions
-- ----------------------------
INSERT INTO `promotions` VALUES (1, '夏季特惠', 'discount', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 0.80, NULL, 1, '2025-01-21 21:50:58', '2025-01-21 21:50:58');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(加密)',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '电子邮箱',
  `balance` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '账户余额',
  `points` int NULL DEFAULT 0 COMMENT '积分',
  `status` tinyint NULL DEFAULT 1 COMMENT '用户状态：1-正常,0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '123', '$2a$10$hkFFAC2ZIvapzUTpG9rmzuBORjUmSyJLWGu048gqLUYAHgaNfmHRa', NULL, NULL, 0.00, 0, 1, '2025-01-21 22:59:50', '2025-01-21 22:59:50');
INSERT INTO `users` VALUES (2, '333', '$2a$10$QMmF81eXwZ9I.ol06W.5..FuaTUcTbQBQArqySabDmNSoQNLX8fFu', NULL, NULL, 0.00, 0, 1, '2025-01-21 23:01:17', '2025-01-21 23:01:17');

-- ----------------------------
-- View structure for v_category_sales
-- ----------------------------
DROP VIEW IF EXISTS `v_category_sales`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_category_sales` AS select `p`.`category` AS `category`,count(distinct `p`.`id`) AS `product_count`,count(distinct `o`.`id`) AS `order_count`,sum(`oi`.`quantity`) AS `total_quantity`,sum((`oi`.`quantity` * `oi`.`price`)) AS `total_amount`,avg(`oi`.`price`) AS `avg_price` from ((`products` `p` left join `order_items` `oi` on((`p`.`id` = `oi`.`product_id`))) left join `orders` `o` on(((`oi`.`order_id` = `o`.`id`) and (`o`.`status` = 'completed')))) group by `p`.`category`;

-- ----------------------------
-- View structure for v_product_sales_ranking
-- ----------------------------
DROP VIEW IF EXISTS `v_product_sales_ranking`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_product_sales_ranking` AS select `p`.`id` AS `id`,`p`.`name` AS `name`,`p`.`category` AS `category`,`p`.`image_url` AS `image_url`,count(distinct `o`.`id`) AS `order_count`,sum(`oi`.`quantity`) AS `total_quantity`,sum((`oi`.`quantity` * `oi`.`price`)) AS `total_amount`,avg(`oi`.`price`) AS `avg_price` from ((`products` `p` left join `order_items` `oi` on((`p`.`id` = `oi`.`product_id`))) left join `orders` `o` on(((`oi`.`order_id` = `o`.`id`) and (`o`.`status` = 'completed')))) group by `p`.`id`,`p`.`name`,`p`.`category`,`p`.`image_url`;

-- ----------------------------
-- View structure for v_sales_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_sales_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_sales_stats` AS select cast(`o`.`created_at` as date) AS `sale_date`,count(distinct `o`.`id`) AS `order_count`,sum(`o`.`total_amount`) AS `total_sales`,avg(`o`.`total_amount`) AS `avg_order_value`,count(distinct `o`.`user_id`) AS `customer_count` from `orders` `o` where (`o`.`status` = 'completed') group by cast(`o`.`created_at` as date);

-- ----------------------------
-- View structure for v_user_consumption
-- ----------------------------
DROP VIEW IF EXISTS `v_user_consumption`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_user_consumption` AS select `u`.`id` AS `user_id`,`u`.`username` AS `username`,count(distinct `o`.`id`) AS `order_count`,sum(`o`.`total_amount`) AS `total_consumption`,avg(`o`.`total_amount`) AS `avg_order_amount`,min(`o`.`created_at`) AS `first_order_time`,max(`o`.`created_at`) AS `last_order_time` from (`users` `u` left join `orders` `o` on(((`u`.`id` = `o`.`user_id`) and (`o`.`status` = 'completed')))) group by `u`.`id`,`u`.`username`;

SET FOREIGN_KEY_CHECKS = 1;
