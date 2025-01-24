const { pool, executeQuery } = require("./db");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
// 使用环境变量存储敏感信息
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 增加文件名安全处理
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(sanitizedFilename));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 限制2MB
  },
  fileFilter: (req, file, cb) => {
    // 严格的文件类型检查
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPG, PNG, GIF 格式的图片!'));
    }
  }
});

// 请求大小限制
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 配置CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // CORS预检请求缓存1天
}));

// 静态文件服务
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true
}));

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证token' 
      });
    }

    // 检查 Authorization header 格式
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'token格式错误' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'token不能为空' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token验证错误:', err);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false, 
            message: 'token已过期，请重新登录' 
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            success: false, 
            message: 'token无效' 
          });
        }

        return res.status(403).json({ 
          success: false, 
          message: 'token验证失败' 
        });
      }

      // 验证成功，将用户信息添加到请求对象
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Token验证异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 验证管理员角色的中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限执行此操作' 
      });
    }
    next();
  };
};

// 用户认证相关接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, phone = null, email = null } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码为必填项' 
      });
    }

    // 验证用户名是否已存在
    const checkUser = await executeQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (checkUser.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 验证手机号是否已存在
    if (phone) {
      const checkPhone = await executeQuery('SELECT id FROM users WHERE phone = ?', [phone]);
      if (checkPhone.length > 0) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }
    }

    // 验证邮箱是否已存在
    if (email) {
      const checkEmail = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
      if (checkEmail.length > 0) {
        return res.status(400).json({ success: false, message: '邮箱已被注册' });
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入新用户
    const sql = `
      INSERT INTO users (
        username, 
        password, 
        phone, 
        email,
        balance,
        points,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [
      username,
      hashedPassword,
      phone,
      email,
      0.00,  // 默认余额
      0,     // 默认积分
      1      // 默认状态为正常
    ]);
    
    res.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    // 添加具体的错误信息处理
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已被使用' 
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ 
        success: false, 
        message: '数据关联错误' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 获取用户信息
    const sql = 'SELECT * FROM users WHERE username = ?';
    const users = await executeQuery(sql, [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        // 添加 token 创建时间和过期时间
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      },
      JWT_SECRET
    );

    // 返回用户信息和token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token: `Bearer ${token}` // 添加 Bearer 前缀
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取当前用户信息
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const sql = 'SELECT id, username, phone, email, balance, points, created_at FROM users WHERE id = ?';
    const users = await executeQuery(sql, [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 商品相关接口
app.get('/api/products', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, 
             COALESCE(SUM(oi.quantity), 0) as sales_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    const products = await executeQuery(sql);
    
    // 格式化数据
    const formattedProducts = products.map(product => ({
      ...product,
      status: product.status === 1 ? 'active' : 'inactive',
      price: parseFloat(product.price)
    }));
    
    res.json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, stock, description, image_url } = req.body;
    
    // 验证必填字段
    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: '商品名称、类别和价格为必填项' });
    }

    const sql = `
      INSERT INTO products 
      (name, category, price, stock, description, image_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    
    await executeQuery(sql, [name, category, price, stock || 0, description, image_url]);
    res.json({ success: true, message: '商品添加成功' });
  } catch (error) {
    console.error('添加商品错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock, description, image_url } = req.body;
    
    // 验证商品是否存在
    const checkProduct = await executeQuery('SELECT id FROM products WHERE id = ?', [id]);
    if (checkProduct.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    const sql = `
      UPDATE products 
      SET name = ?, 
          category = ?, 
          price = ?, 
          stock = ?, 
          description = ?, 
          image_url = ?
      WHERE id = ?
    `;
    
    await executeQuery(sql, [name, category, price, stock, description, image_url, id]);
    res.json({ success: true, message: '商品更新成功' });
  } catch (error) {
    console.error('更新商品错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/products/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 验证商品是否存在
    const checkProduct = await executeQuery('SELECT id FROM products WHERE id = ?', [id]);
    if (checkProduct.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    // 转换状态值
    const newStatus = status === 'active' ? 1 : 0;
    
    const sql = 'UPDATE products SET status = ? WHERE id = ?';
    await executeQuery(sql, [newStatus, id]);
    
    res.json({ 
      success: true, 
      message: `商品已${status === 'active' ? '上架' : '下架'}`
    });
  } catch (error) {
    console.error('更新商品状态错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 订单相关接口
app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, total_amount, items } = req.body;
    const orderNo = 'ORD' + Date.now();
    
    // 开始事务
    await executeQuery('START TRANSACTION');
    
    // 创建订单
    const orderSql = 'INSERT INTO orders (order_no, user_id, total_amount, status) VALUES (?, ?, ?, ?)';
    const orderResult = await executeQuery(orderSql, [orderNo, user_id, total_amount, 'pending']);
    const orderId = orderResult.insertId;
    
    // 添加订单项
    for (const item of items) {
      const itemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
      await executeQuery(itemSql, [orderId, item.product_id, item.quantity, item.price]);
      
      // 更新库存
      const updateStockSql = 'UPDATE products SET stock = stock - ? WHERE id = ?';
      await executeQuery(updateStockSql, [item.quantity, item.product_id]);
    }
    
    await executeQuery('COMMIT');
    res.json({ success: true, order_no: orderNo });
  } catch (error) {
    await executeQuery('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const sql = `
      SELECT o.*, u.username 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `;
    const orders = await executeQuery(sql);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取订单统计数据
app.get('/api/orders/stats', authenticateToken, async (req, res) => {
  try {
    // 获取总订单数
    const totalOrdersSql = 'SELECT COUNT(*) as total FROM orders';
    const [totalOrdersResult] = await executeQuery(totalOrdersSql);
    const totalOrders = totalOrdersResult.total;

    // 获取待处理订单数
    const pendingOrdersSql = "SELECT COUNT(*) as pending FROM orders WHERE status = 'pending'";
    const [pendingOrdersResult] = await executeQuery(pendingOrdersSql);
    const pendingOrders = pendingOrdersResult.pending;

    // 获取已完成订单数
    const completedOrdersSql = "SELECT COUNT(*) as completed FROM orders WHERE status = 'completed'";
    const [completedOrdersResult] = await executeQuery(completedOrdersSql);
    const completedOrders = completedOrdersResult.completed;

    // 获取今日收入
    const todayIncomeSql = `
      SELECT COALESCE(SUM(total_amount), 0) as income 
      FROM orders 
      WHERE status = 'completed' 
      AND DATE(created_at) = CURDATE()
    `;
    const [todayIncomeResult] = await executeQuery(todayIncomeSql);
    const todayIncome = parseFloat(todayIncomeResult.income);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        todayIncome
      }
    });
  } catch (error) {
    console.error('获取订单统计数据错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新订单状态
app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证订单是否存在
    const checkOrder = await executeQuery('SELECT id FROM orders WHERE id = ?', [id]);
    if (checkOrder.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const sql = 'UPDATE orders SET status = ? WHERE id = ?';
    await executeQuery(sql, [status, id]);
    
    res.json({ success: true, message: '订单状态更新成功' });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 处理订单
app.post('/api/orders/:id/process', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证订单是否存在
    const checkOrder = await executeQuery('SELECT id, status FROM orders WHERE id = ?', [id]);
    if (checkOrder.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (checkOrder[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: '只能处理待支付订单' });
    }

    const sql = "UPDATE orders SET status = 'completed' WHERE id = ?";
    await executeQuery(sql, [id]);
    
    res.json({ success: true, message: '订单处理成功' });
  } catch (error) {
    console.error('处理订单错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 取消订单
app.post('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证订单是否存在
    const checkOrder = await executeQuery('SELECT id, status FROM orders WHERE id = ?', [id]);
    if (checkOrder.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (checkOrder[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: '只能取消待支付订单' });
    }

    // 开始事务
    await executeQuery('START TRANSACTION');

    try {
      // 更新订单状态
      const updateOrderSql = "UPDATE orders SET status = 'cancelled' WHERE id = ?";
      await executeQuery(updateOrderSql, [id]);

      // 恢复库存
      const restoreStockSql = `
        UPDATE products p
        INNER JOIN order_items oi ON p.id = oi.product_id
        SET p.stock = p.stock + oi.quantity
        WHERE oi.order_id = ?
      `;
      await executeQuery(restoreStockSql, [id]);

      await executeQuery('COMMIT');
      res.json({ success: true, message: '订单取消成功' });
    } catch (error) {
      await executeQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 促销活动相关接口
app.get('/api/promotions', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, 
             CASE 
               WHEN NOW() BETWEEN p.start_time AND p.end_time THEN 'active'
               ELSE 'inactive'
             END as status
      FROM promotions p 
      ORDER BY p.created_at DESC
    `;
    const promotions = await executeQuery(sql);
    res.json({ success: true, data: promotions });
  } catch (error) {
    console.error('获取促销活动列表错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/promotions', authenticateToken, async (req, res) => {
  try {
    const { name, type, start_time, end_time, discount_value, min_amount } = req.body;
    
    // 验证必填字段
    if (!name || !type || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const sql = `
      INSERT INTO promotions 
      (name, type, start_time, end_time, discount_value, min_amount) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [
      name, 
      type, 
      formatDate(start_time),
      formatDate(end_time),
      discount_value,
      min_amount
    ]);
    res.json({ success: true, message: '促销活动创建成功' });
  } catch (error) {
    console.error('创建促销活动错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/promotions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, start_time, end_time, discount_value, min_amount } = req.body;
    
    // 验证促销活动是否存在
    const checkPromotion = await executeQuery('SELECT id FROM promotions WHERE id = ?', [id]);
    if (checkPromotion.length === 0) {
      return res.status(404).json({ success: false, message: '促销活动不存在' });
    }

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const sql = `
      UPDATE promotions 
      SET name = ?, 
          type = ?, 
          start_time = ?, 
          end_time = ?, 
          discount_value = ?,
          min_amount = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(sql, [
      name, 
      type, 
      formatDate(start_time),
      formatDate(end_time),
      discount_value,
      min_amount,
      id
    ]);
    
    res.json({ success: true, message: '促销活动更新成功' });
  } catch (error) {
    console.error('更新促销活动错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/promotions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证促销活动是否存在
    const checkPromotion = await executeQuery('SELECT id FROM promotions WHERE id = ?', [id]);
    if (checkPromotion.length === 0) {
      return res.status(404).json({ success: false, message: '促销活动不存在' });
    }

    // 使用连接池获取连接
    const connection = await pool.getConnection();
    
    try {
      // 开始事务
      await connection.beginTransaction();

      // 先删除关联的商品
      await connection.execute('DELETE FROM promotion_products WHERE promotion_id = ?', [id]);
      // 再删除促销活动
      await connection.execute('DELETE FROM promotions WHERE id = ?', [id]);

      // 提交事务
      await connection.commit();
      
      res.json({ success: true, message: '促销活动删除成功' });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('删除促销活动错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 用户管理相关接口
// 获取用户列表
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT id, username, email, phone, status, balance, points, 
             created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    const users = await executeQuery(sql);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 添加用户
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    // 验证用户名是否已存在
    const checkUser = await executeQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (checkUser.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 验证邮箱是否已存在
    if (email) {
      const checkEmail = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
      if (checkEmail.length > 0) {
        return res.status(400).json({ success: false, message: '邮箱已被注册' });
      }
    }

    // 验证手机号是否已存在
    if (phone) {
      const checkPhone = await executeQuery('SELECT id FROM users WHERE phone = ?', [phone]);
      if (checkPhone.length > 0) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入新用户
    const sql = `
      INSERT INTO users (username, password, email, phone, status) 
      VALUES (?, ?, ?, ?, 'active')
    `;
    await executeQuery(sql, [username, hashedPassword, email, phone]);
    
    res.json({ success: true, message: '用户添加成功' });
  } catch (error) {
    console.error('添加用户错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 编辑用户
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone } = req.body;

    // 验证用户是否存在
    const checkUser = await executeQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (checkUser.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 验证邮箱是否已被其他用户使用
    if (email) {
      const checkEmail = await executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (checkEmail.length > 0) {
        return res.status(400).json({ success: false, message: '邮箱已被其他用户使用' });
      }
    }

    // 验证手机号是否已被其他用户使用
    if (phone) {
      const checkPhone = await executeQuery('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, id]);
      if (checkPhone.length > 0) {
        return res.status(400).json({ success: false, message: '手机号已被其他用户使用' });
      }
    }

    // 更新用户信息
    const sql = 'UPDATE users SET email = ?, phone = ? WHERE id = ?';
    await executeQuery(sql, [email, phone, id]);
    
    res.json({ success: true, message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新用户状态
app.patch('/api/users/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证用户是否存在
    const checkUser = await executeQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (checkUser.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 更新用户状态
    const sql = 'UPDATE users SET status = ? WHERE id = ?';
    await executeQuery(sql, [status, id]);
    
    res.json({ 
      success: true, 
      message: `用户状态已${status === 'active' ? '启用' : '禁用'}`
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 文件上传接口
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的文件' });
    }

    // 返回文件访问URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 管理员相关接口
// 获取管理员列表
app.get('/api/admins', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT id, username, name, role, phone, email, status, last_login, created_at, updated_at 
      FROM admins 
      ORDER BY created_at DESC
    `;
    const admins = await executeQuery(sql);
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 搜索管理员
app.get('/api/admins/search', authenticateToken, async (req, res) => {
  try {
    const { username, role, status, startDate, endDate } = req.query;
    
    let conditions = [];
    let params = [];
    
    if (username) {
      conditions.push('username LIKE ?');
      params.push(`%${username}%`);
    }
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status === 'active' ? 1 : 0);
    }
    
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    const sql = `
      SELECT id, username, name, role, phone, email, status, 
             last_login, created_at, updated_at 
      FROM admins 
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const admins = await executeQuery(sql, params);
    
    // 格式化返回数据
    const formattedAdmins = admins.map(admin => ({
      ...admin,
      status: admin.status === 1 ? 'active' : 'inactive'
    }));
    
    res.json({ 
      success: true, 
      data: formattedAdmins,
      total: formattedAdmins.length
    });
  } catch (error) {
    console.error('搜索管理员错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 管理员登录接口 - 不需要 token 验证
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 获取管理员信息
    const sql = 'SELECT * FROM admins WHERE username = ?';
    const admins = await executeQuery(sql, [username]);
    
    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const admin = admins[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 检查管理员状态
    if (admin.status !== 1) {
      return res.status(403).json({ success: false, message: '账号已被禁用' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username,
        role: admin.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      },
      JWT_SECRET
    );

    // 更新最后登录时间
    await executeQuery('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

    // 返回管理员信息和token（不包含密码）
    const { password: _, ...adminWithoutPassword } = admin;
    res.json({
      success: true,
      message: '登录成功',
      data: {
        admin: adminWithoutPassword,
        token: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 添加管理员接口 - 初始化时使用，后续可以关闭
app.post('/api/admin/register', async (req, res) => {
  try {
    const { username, password, name, phone = null, email = null } = req.body;

    // 验证必填字段
    if (!username || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、密码和姓名为必填项' 
      });
    }

    // 验证用户名是否已存在
    const checkAdmin = await executeQuery('SELECT id FROM admins WHERE username = ?', [username]);
    if (checkAdmin.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入新管理员，默认角色为普通管理员
    const sql = `
      INSERT INTO admins (
        username, 
        password, 
        name,
        role,
        phone, 
        email,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [
      username,
      hashedPassword,
      name,
      'admin',     // 默认角色为普通管理员
      phone,
      email,
      1           // 默认状态为正常
    ]);
    
    res.json({ success: true, message: '管理员添加成功' });
  } catch (error) {
    console.error('添加管理员错误:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已被使用' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
});

// 获取当前管理员信息
app.get('/api/admin/profile', authenticateToken, async (req, res) => {
  try {
    // 检查用户是否是管理员
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false, 
        message: '无权访问管理员信息' 
      });
    }

    const sql = `
      SELECT 
        id, 
        username, 
        name, 
        role, 
        phone, 
        email, 
        status, 
        last_login,
        created_at, 
        updated_at,
        (
          SELECT COUNT(*) 
          FROM orders 
          WHERE status = 'completed' 
          AND DATE(created_at) = CURDATE()
        ) as today_orders,
        (
          SELECT COALESCE(SUM(total_amount), 0) 
          FROM orders 
          WHERE status = 'completed' 
          AND DATE(created_at) = CURDATE()
        ) as today_sales
      FROM admins 
      WHERE id = ?
    `;
    
    const admins = await executeQuery(sql, [req.user.id]);
    
    if (admins.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '管理员不存在' 
      });
    }

    // 格式化数据
    const admin = {
      ...admins[0],
      status: admins[0].status === 1 ? 'active' : 'inactive',
      today_sales: parseFloat(admins[0].today_sales || 0),
      permissions: {
        canManageUsers: ['admin', 'super_admin'].includes(admins[0].role),
        canManageProducts: true,
        canManageOrders: true,
        canManagePromotions: ['admin', 'super_admin'].includes(admins[0].role),
        canViewAnalytics: true
      }
    };

    res.json({ 
      success: true, 
      message: '获取管理员信息成功',
      data: admin 
    });
  } catch (error) {
    console.error('获取管理员信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取管理员信息失败，请稍后重试' 
    });
  }
});

// 数据分析相关接口
// 获取数据概览
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    // 获取今日销售额
    const todaySalesSql = `
      SELECT COALESCE(SUM(total_amount), 0) as value
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
      AND status = 'completed'
    `;
    const [todaySales] = await executeQuery(todaySalesSql);

    // 获取今日订单数
    const todayOrdersSql = `
      SELECT COUNT(*) as value
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `;
    const [todayOrders] = await executeQuery(todayOrdersSql);

    // 获取平均客单价
    const avgOrderValueSql = `
      SELECT COALESCE(AVG(total_amount), 0) as value
      FROM orders 
      WHERE status = 'completed'
      AND DATE(created_at) = CURDATE()
    `;
    const [avgOrderValue] = await executeQuery(avgOrderValueSql);

    // 获取转化率（完成订单数/总订单数）
    const conversionRateSql = `
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM orders WHERE status = 'completed' AND DATE(created_at) = CURDATE()) * 100.0 /
          NULLIF((SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()), 0),
          0
        ) as value
    `;
    const [conversionRate] = await executeQuery(conversionRateSql);

    // 获取同比增长
    const getGrowthRate = async () => {
      const sql = `
        WITH today_value AS (
          SELECT COALESCE(SUM(total_amount), 0) as value 
          FROM orders 
          WHERE status = 'completed'
          AND DATE(created_at) = CURDATE()
        ),
        yesterday_value AS (
          SELECT COALESCE(SUM(total_amount), 0) as value 
          FROM orders 
          WHERE status = 'completed'
          AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        )
        SELECT 
          COALESCE(
            ((SELECT value FROM today_value) - (SELECT value FROM yesterday_value)) * 100.0 / 
            NULLIF((SELECT value FROM yesterday_value), 0),
            0
          ) as growth_rate
      `;
      const [result] = await executeQuery(sql);
      return result.growth_rate || 0;
    };

    const salesGrowth = await getGrowthRate();
    const ordersGrowth = await getGrowthRate();
    const avgOrderGrowth = await getGrowthRate();

    res.json({
      success: true,
      data: {
        overviewCards: [
          {
            title: '总销售额',
            value: parseFloat(todaySales.value) || 0,
            prefix: '¥',
            suffix: '',
            trend: salesGrowth,
            icon: 'el-icon-money',
            class: 'total-sales'
          },
          {
            title: '订单总量',
            value: parseInt(todayOrders.value) || 0,
            prefix: '',
            suffix: '',
            trend: ordersGrowth,
            icon: 'el-icon-s-order',
            class: 'total-orders'
          },
          {
            title: '平均客单价',
            value: (parseFloat(avgOrderValue.value) || 0).toFixed(2),
            prefix: '¥',
            suffix: '',
            trend: avgOrderGrowth,
            icon: 'el-icon-price-tag',
            class: 'avg-price'
          },
          {
            title: '转化率',
            value: (parseFloat(conversionRate.value) || 0).toFixed(1),
            prefix: '',
            suffix: '%',
            trend: 0,
            icon: 'el-icon-data-analysis',
            class: 'conversion-rate'
          }
        ]
      }
    });
  } catch (error) {
    console.error('获取数据概览错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取销售趋势
app.get('/api/analytics/sales-trend', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    let sql = '';
    let labels = [];

    switch (timeRange) {
      case 'week':
        sql = `
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') as date,
            COALESCE(SUM(total_amount), 0) as amount
          FROM orders
          WHERE status = 'completed'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY date
          ORDER BY date
        `;
        break;
      case 'month':
        sql = `
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') as date,
            COALESCE(SUM(total_amount), 0) as amount
          FROM orders
          WHERE status = 'completed'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY date
          ORDER BY date
        `;
        break;
      case 'year':
        sql = `
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as date,
            COALESCE(SUM(total_amount), 0) as amount
          FROM orders
          WHERE status = 'completed'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY date
          ORDER BY date
        `;
        break;
    }

    const salesData = await executeQuery(sql);
    
    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('获取销售趋势错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取商品分类占比
app.get('/api/analytics/category-distribution', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.category,
        COUNT(*) as count,
        COALESCE(SUM(oi.quantity), 0) as total_sales,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_amount
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
      GROUP BY p.category
      ORDER BY total_sales DESC
    `;
    
    const categoryData = await executeQuery(sql);
    
    res.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('获取商品分类占比错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取热销商品排行
app.get('/api/analytics/hot-products', authenticateToken, async (req, res) => {
  try {
    const { rankingPeriod = 'today' } = req.query;
    let dateCondition = '';

    switch (rankingPeriod) {
      case 'today':
        dateCondition = 'DATE(o2.created_at) = CURDATE()';
        break;
      case 'week':
        dateCondition = 'o2.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateCondition = 'o2.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
    }

    const sql = `
      WITH total_sales AS (
        SELECT SUM(oi2.quantity) as total_quantity
        FROM order_items oi2 
        JOIN orders o2 ON oi2.order_id = o2.id 
        WHERE o2.status = 'completed' AND ${dateCondition}
      )
      SELECT 
        p.id,
        p.name,
        p.image_url,
        COALESCE(SUM(oi.quantity), 0) as sales,
        COALESCE(SUM(oi.quantity * oi.price), 0) as amount,
        COALESCE(SUM(oi.quantity) * 100.0 / NULLIF((SELECT total_quantity FROM total_sales), 0), 0) as percentage
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o2 ON oi.order_id = o2.id AND o2.status = 'completed'
      WHERE (o2.id IS NULL) OR (${dateCondition})
      GROUP BY p.id, p.name, p.image_url
      ORDER BY sales DESC
      LIMIT 5
    `;
    
    const hotProducts = await executeQuery(sql);
    
    res.json({
      success: true,
      data: hotProducts
    });
  } catch (error) {
    console.error('获取热销商品排行错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 添加测试接口
app.get('/api/verify-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'token有效',
    data: {
      user: req.user
    }
  });
});

// 修改管理员信息
app.put('/api/admins/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;

    // 验证管理员是否存在
    const checkAdmin = await executeQuery('SELECT id FROM admins WHERE id = ?', [id]);
    if (checkAdmin.length === 0) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    // 验证邮箱是否已被其他管理员使用
    if (email) {
      const checkEmail = await executeQuery('SELECT id FROM admins WHERE email = ? AND id != ?', [email, id]);
      if (checkEmail.length > 0) {
        return res.status(400).json({ success: false, message: '邮箱已被其他管理员使用' });
      }
    }

    // 验证手机号是否已被其他管理员使用
    if (phone) {
      const checkPhone = await executeQuery('SELECT id FROM admins WHERE phone = ? AND id != ?', [phone, id]);
      if (checkPhone.length > 0) {
        return res.status(400).json({ success: false, message: '手机号已被其他管理员使用' });
      }
    }

    // 更新管理员信息
    const sql = 'UPDATE admins SET name = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(sql, [name, phone, email, id]);
    
    res.json({ success: true, message: '管理员信息更新成功' });
  } catch (error) {
    console.error('更新管理员信息错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除管理员
app.delete('/api/admins/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证管理员是否存在
    const checkAdmin = await executeQuery('SELECT id, role FROM admins WHERE id = ?', [id]);
    if (checkAdmin.length === 0) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    // 检查是否为超级管理员
    if (checkAdmin[0].role === 'super_admin') {
      return res.status(403).json({ success: false, message: '不能删除超级管理员' });
    }

    // 删除管理员
    const sql = 'DELETE FROM admins WHERE id = ?';
    await executeQuery(sql, [id]);
    
    res.json({ success: true, message: '管理员删除成功' });
  } catch (error) {
    console.error('删除管理员错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新管理员状态
app.patch('/api/admins/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证管理员是否存在
    const checkAdmin = await executeQuery('SELECT id, role FROM admins WHERE id = ?', [id]);
    if (checkAdmin.length === 0) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    // 检查是否为超级管理员
    if (checkAdmin[0].role === 'super_admin') {
      return res.status(403).json({ success: false, message: '不能修改超级管理员状态' });
    }

    // 更新管理员状态
    const sql = 'UPDATE admins SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(sql, [status, id]);
    
    res.json({ 
      success: true, 
      message: `管理员状态已${status === 1 ? '启用' : '禁用'}`
    });
  } catch (error) {
    console.error('更新管理员状态错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建管理员
app.post('/api/admins', authenticateToken, async (req, res) => {
  try {
    const { username, password, name, role, phone, email, status } = req.body;

    // 验证必填字段
    if (!username || !password || !name || !role) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、密码、姓名和角色为必填项' 
      });
    }

    // 验证用户名是否已存在
    const checkUsername = await executeQuery('SELECT id FROM admins WHERE username = ?', [username]);
    if (checkUsername.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 验证邮箱是否已存在
    if (email) {
      const checkEmail = await executeQuery('SELECT id FROM admins WHERE email = ?', [email]);
      if (checkEmail.length > 0) {
        return res.status(400).json({ success: false, message: '邮箱已被使用' });
      }
    }

    // 验证手机号是否已存在
    if (phone) {
      const checkPhone = await executeQuery('SELECT id FROM admins WHERE phone = ?', [phone]);
      if (checkPhone.length > 0) {
        return res.status(400).json({ success: false, message: '手机号已被使用' });
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入新管理员
    const sql = `
      INSERT INTO admins (
        username, 
        password, 
        name,
        role,
        phone, 
        email,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await executeQuery(sql, [
      username,
      hashedPassword,
      name,
      role,
      phone,
      email,
      status || 1
    ]);
    
    res.json({ success: true, message: '管理员创建成功' });
  } catch (error) {
    console.error('创建管理员错误:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已被使用' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || '创建管理员失败' 
    });
  }
});

app.listen(3000, () => {
  console.log('服务已启动，监听端口 3000');
});
