-- 创建数据库
CREATE DATABASE IF NOT EXISTS drinks DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE drinks;

-- 用户表 - 存储用户基本信息、余额和积分
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    phone VARCHAR(20) COMMENT '手机号码',
    email VARCHAR(100) COMMENT '电子邮箱',
    balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额',
    points INT DEFAULT 0 COMMENT '积分',
    status TINYINT DEFAULT 1 COMMENT '用户状态：1-正常,0-禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 管理员表 - 存储系统管理员信息
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '管理员用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    name VARCHAR(50) NOT NULL COMMENT '管理员姓名',
    role VARCHAR(20) NOT NULL COMMENT '角色：super_admin-超级管理员,admin-普通管理员',
    phone VARCHAR(20) COMMENT '手机号码',
    email VARCHAR(100) COMMENT '电子邮箱',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常,0-禁用',
    last_login TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员信息表';

-- 商品表 - 存储饮品商品信息
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品ID',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    category VARCHAR(50) NOT NULL COMMENT '商品类别',
    price DECIMAL(10,2) NOT NULL COMMENT '商品价格',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    image_url VARCHAR(255) COMMENT '商品图片URL',
    description TEXT COMMENT '商品描述',
    status TINYINT DEFAULT 1 COMMENT '商品状态：1-上架,0-下架',
    sales_count INT DEFAULT 0 COMMENT '销售数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品信息表';

-- 订单表 - 存储用户订单信息
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
    user_id INT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    status VARCHAR(20) NOT NULL COMMENT '订单状态：pending-待支付,paid-已支付,completed-已完成,cancelled-已取消',
    payment_method VARCHAR(20) COMMENT '支付方式',
    payment_time TIMESTAMP NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单信息表';

-- 订单详情表 - 存储订单商品明细
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '订单项ID',
    order_id INT NOT NULL COMMENT '订单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL COMMENT '购买数量',
    price DECIMAL(10,2) NOT NULL COMMENT '商品单价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细表';

-- 促销活动表 - 存储促销活动信息
CREATE TABLE IF NOT EXISTS promotions (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '促销活动ID',
    name VARCHAR(100) NOT NULL COMMENT '活动名称',
    type VARCHAR(20) NOT NULL COMMENT '活动类型：discount-折扣,special_price-特价,points-积分',
    start_time TIMESTAMP NOT NULL COMMENT '活动开始时间',
    end_time TIMESTAMP NOT NULL COMMENT '活动结束时间',
    discount_value DECIMAL(10,2) COMMENT '折扣值或特价金额',
    points_value INT COMMENT '积分值',
    status TINYINT DEFAULT 1 COMMENT '活动状态：1-活动中,0-已结束',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='促销活动表';

-- 促销商品关联表 - 存储促销活动和商品的关联关系
CREATE TABLE IF NOT EXISTS promotion_products (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    promotion_id INT NOT NULL COMMENT '促销活动ID',
    product_id INT NOT NULL COMMENT '商品ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='促销活动商品关联表';

-- 插入初始管理员数据
INSERT INTO admins (username, password, name, role, phone, email) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'super_admin', '13800138000', 'admin@example.com');

-- 插入示例商品数据
INSERT INTO products (name, category, price, stock, description, status) VALUES
('可口可乐', '碳酸饮料', 3.50, 100, '经典可口可乐', 1),
('百事可乐', '碳酸饮料', 3.50, 100, '百事可乐', 1),
('农夫山泉', '矿泉水', 2.00, 200, '天然矿泉水', 1),
('红牛', '功能饮料', 6.00, 50, '提神饮料', 1),
('雀巢咖啡', '咖啡', 5.00, 80, '即饮咖啡', 1);

-- 插入示例促销活动
INSERT INTO promotions (name, type, start_time, end_time, discount_value, status) VALUES
('夏季特惠', 'discount', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 0.8, 1);

-- 关联促销活动和商品
INSERT INTO promotion_products (promotion_id, product_id) VALUES
(1, 1),
(1, 2);

-- 添加索引以优化数据分析查询
ALTER TABLE orders ADD INDEX idx_created_at_status (created_at, status);
ALTER TABLE order_items ADD INDEX idx_product_quantity (product_id, quantity);
ALTER TABLE products ADD INDEX idx_category (category);

-- 创建销售统计视图
CREATE OR REPLACE VIEW v_sales_stats AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(DISTINCT o.id) as order_count,
    SUM(o.total_amount) as total_sales,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT o.user_id) as customer_count
FROM orders o
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at);

-- 创建商品销售排行视图
CREATE OR REPLACE VIEW v_product_sales_ranking AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.image_url,
    COUNT(DISTINCT o.id) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.quantity * oi.price) as total_amount,
    AVG(oi.price) as avg_price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY p.id, p.name, p.category, p.image_url;

-- 创建分类销售统计视图
CREATE OR REPLACE VIEW v_category_sales AS
SELECT 
    p.category,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT o.id) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.quantity * oi.price) as total_amount,
    AVG(oi.price) as avg_price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY p.category;

-- 创建用户消费统计视图
CREATE OR REPLACE VIEW v_user_consumption AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT o.id) as order_count,
    SUM(o.total_amount) as total_consumption,
    AVG(o.total_amount) as avg_order_amount,
    MIN(o.created_at) as first_order_time,
    MAX(o.created_at) as last_order_time
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
GROUP BY u.id, u.username; 