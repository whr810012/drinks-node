
#  二手交易平台Nodejs后端

这是一个简单的Node.js后端项目，使用MySQL数据库进行数据存储，提供RESTful API接口以供前端应用访问。

## 项目概述

该项目实现了一个简单的后端服务，主要功能是从MySQL数据库获取用户数据，并通过API接口提供给前端使用。项目使用了Express框架来创建HTTP服务，MySQL用于数据存储，axios用于可能的外部API请求。

## 项目结构

```
├─📄 db.js                         # 数据库相关的 JavaScript 文件
├─📄 index.js                      # 项目入口的 JavaScript 文件
├─📄 package-lock.json             # Node.js 项目的锁定文件，记录具体的依赖版本
├─📄 package.json                  # Node.js 项目的配置文件，定义项目的依赖、脚本等
└─📄 README.md                     # 项目的说明文件，通常包含项目概述、安装和使用指南
```

- `db.js`: 配置数据库连接池，并封装了执行SQL查询的函数。
- `index.js`: 项目入口，配置了Express服务器并定义了路由。
- `package.json`: 项目的配置文件，记录了依赖项及一些项目设置。
- `README.md`: 项目的说明文档。

## 安装和运行

### 1. 克隆项目

首先，你需要将项目克隆到本地：

```bash
git clone git@github.com:whr810012/second-hand-nodejs.git
```

### 2. 安装依赖

在项目根目录下运行以下命令来安装项目所需的依赖：

```bash
npm install
```

### 3. 配置数据库

确保你已经在本地安装了MySQL，并且创建了一个名为`demo1`的数据库。你可以使用以下命令连接到MySQL并创建数据库：

```sql
CREATE DATABASE demo1;
```

然后，在`db.js`文件中，根据需要调整数据库的连接配置（如`host`、`user`、`password`等）。

### 4. 启动服务器

在安装完所有依赖并配置好数据库后，运行以下命令启动服务器：

```bash
node index
```

默认情况下，服务器会启动在`http://localhost:3000`。

### 5. 配置跨域

服务器配置了跨域支持，你可以在前端应用中直接调用这些API接口，前提是前端运行在`http://localhost:8071`。

## 代码说明

### db.js

在`db.js`中，我们使用了MySQL的连接池来优化数据库的连接管理。`executeQuery`是一个封装了MySQL查询执行的函数，返回一个`Promise`对象，支持`async/await`。

### index.js

在`index.js`中，我们设置了Express服务器，使用`express.json()`和`body-parser`来解析请求体，设置了CORS（跨域资源共享）以允许来自指定域的请求。我们定义了一个简单的API路由`/getuser`，通过调用`executeQuery`从数据库中获取所有用户的数据并返回给客户端。

## 依赖

项目依赖以下Node.js模块：

- `express`: 用于构建Web服务器和处理HTTP请求。
- `mysql`: 用于连接和操作MySQL数据库。
- `axios`: 用于发送HTTP请求（可选，如果你计划与其他API进行交互）。

## 开发和贡献

1. Fork这个项目并克隆到本地。
2. 创建新的分支并进行开发。
3. 提交Pull Request（PR）以贡献代码。

## 常见问题

### Q: 如何修改数据库配置？

A: 你可以在`db.js`中修改MySQL连接池的配置。修改`host`、`user`、`password`和`database`字段来适应你的数据库环境。

### Q: 如何查看数据库中的数据？

A: 你可以使用MySQL的客户端工具（如MySQL Workbench）连接到数据库，并查询`user`表来查看数据。

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

```

### 说明：
1. **项目描述**：介绍了项目的基本信息、功能和架构。
2. **安装和运行步骤**：详细列出了如何克隆、安装依赖、配置数据库和启动项目的步骤。
3. **API文档**：简要描述了当前API的功能。
4. **开发和贡献**：引导开发者如何为项目贡献代码。
5. **常见问题**：解答了一些可能遇到的常见问题。

你可以根据实际需求对该文件进行适当修改和扩展！
