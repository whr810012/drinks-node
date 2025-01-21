# 饮料商城后端服务

## 项目介绍
这是一个基于Node.js和Express框架开发的饮料商城后端服务，提供RESTful API接口，支持用户认证、商品管理、订单处理等功能。

## 技术栈
- Node.js
- Express - Web框架
- MySQL - 数据库
- JWT - 用户认证
- Express-validator - 请求验证

## 项目结构
```
drinks-nodejs/
├── config/        # 配置文件
├── controllers/   # 控制器
├── middleware/    # 中间件
├── models/        # 数据模型
├── routes/        # 路由定义
├── utils/         # 工具函数
├── db.js          # 数据库连接
└── index.js       # 应用入口
```

## 主要功能
- 用户认证：登录、注册、token验证
- 用户管理：用户信息CRUD
- 商品管理：商品CRUD、库存管理
- 订单系统：订单创建、状态更新
- 数据统计：销售统计、用户分析
- 权限控制：基于角色的访问控制

## 安装和运行

### 环境要求
- Node.js >= 14.x
- MySQL >= 5.7
- npm >= 6.x

### 安装依赖
```bash
npm install
```

### 数据库配置
1. 创建MySQL数据库
2. 导入`drinks.sql`文件
3. 配置数据库连接信息（config/database.js）

### 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## API文档
主要API端点：
- POST /api/auth/login - 用户登录
- POST /api/auth/register - 用户注册
- GET /api/products - 获取商品列表
- POST /api/orders - 创建订单
- GET /api/analytics - 获取统计数据

## 开发规范
- 使用ESLint进行代码规范检查
- 遵循RESTful API设计规范
- 统一错误处理和响应格式
- 使用环境变量管理敏感配置

## 部署说明
1. 确保服务器已安装Node.js和MySQL
2. 配置环境变量
3. 安装依赖并构建
4. 使用PM2等工具管理进程

## 注意事项
- 生产环境需要配置适当的环境变量
- 定期备份数据库
- 注意API访问频率限制
- 确保数据库连接的安全性
