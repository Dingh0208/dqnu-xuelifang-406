const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
;(async () => {
  const c = await mysql.createConnection({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4' })
  await c.execute("UPDATE daily_tasks SET title = ? WHERE id = 2", ['【MySQL】数据结构 · 链表'])
  await c.execute("UPDATE users SET nickname = ? WHERE account = 'student01'", ['后端小明'])
  const [rows] = await c.query("SELECT id, title, HEX(title) FROM daily_tasks WHERE user_id='student01' ORDER BY id LIMIT 2")
  const [u] = await c.query("SELECT nickname FROM users WHERE account='student01'")
  console.log(JSON.stringify(rows, null, 1))
  console.log('nickname:', u[0].nickname)
  await c.end()
})()

