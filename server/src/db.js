'use strict'
const mysql = require('mysql2/promise')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'xlf',
  password: process.env.DB_PASSWORD || 'xlf123456',
  database: process.env.DB_NAME || 'xuelifang',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  timezone: 'local'
})

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

async function one(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] || null
}

async function tx(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = { pool, query, one, tx }
