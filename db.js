const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'text123',
  database: 'drinks',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 添加连接池错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('数据库连接丢失，尝试重新连接...');
  }
});

const executeQuery = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL执行错误:', error);
    throw error;
  }
};

module.exports = {
  pool,
  executeQuery
};
