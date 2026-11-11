'use strict'
/**
 * 初始化数据库：建库 + 建应用账号 + 执行 schema.sql
 * 依赖便携版 MySQL（mysql/mysql-8.0.28-winx64）已在 3307 端口运行，root 空密码或 MYSQL_ROOT_PASSWORD。
 */
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const ROOT_USER = process.env.MYSQL_ROOT_USER || 'root'
const ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD || ''
const DB = process.env.DB_NAME || 'xuelifang'
const APP_USER = process.env.DB_USER || 'xlf'
const APP_PASSWORD = process.env.DB_PASSWORD || 'xlf123456'

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3307),
    user: ROOT_USER,
    password: ROOT_PASSWORD,
    multipleStatements: true
  })

  console.log(`[init] 已连接 MySQL ${process.env.DB_HOST}:${process.env.DB_PORT}`)
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.query(`CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`, [APP_USER, APP_PASSWORD])
  await conn.query(`ALTER USER ?@'%' IDENTIFIED BY ?`, [APP_USER, APP_PASSWORD])
  await conn.query(`GRANT ALL PRIVILEGES ON \`${DB}\`.* TO ?@'%'`, [APP_USER])
  await conn.query('FLUSH PRIVILEGES')
  await conn.query(`USE \`${DB}\``)
  console.log(`[init] 数据库 ${DB} 与账号 ${APP_USER} 就绪`)

  const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8')
  await conn.query(schema)
  console.log('[init] schema.sql 执行完成（18 张表）')
  await conn.end()
}

main().catch((e) => {
  console.error('[init] 失败:', e.message)
  process.exit(1)
})
