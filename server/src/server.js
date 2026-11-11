'use strict'
const path = require('path')
const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = Number(process.env.PORT || 3100)
const HOST = process.env.HOST || '127.0.0.1'

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// 请求日志（简单版，便于联调）
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`)
    }
  })
  next()
})

app.get('/api/health', async (req, res) => {
  const { one } = require('./db')
  try {
    const row = await one('SELECT VERSION() AS v, DATABASE() AS db')
    res.json({ code: 200, message: 'success', data: { server: 'ok', mysql: row.v, database: row.db, time: new Date().toISOString() } })
  } catch (e) {
    res.status(500).json({ code: 500, message: '数据库连接失败: ' + e.message, data: null })
  }
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/student', require('./routes/student'))
app.use('/api/teacher', require('./routes/teacher'))
app.use('/api/parent', require('./routes/parent'))
app.use('/api/admin', require('./routes/admin'))

// 后台管理网页
app.use('/admin', express.static(path.join(__dirname, '..', 'public')))
app.get('/', (req, res) => res.redirect('/admin/'))
app.get('/admin', (req, res) => res.redirect('/admin/'))

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ code: 404, message: '接口不存在: ' + req.path, data: null })
  res.status(404).send('Not Found')
})

// 统一错误处理
app.use((err, req, res, next) => {
  const code = err.code && Number.isInteger(err.code) ? err.code : 500
  if (code >= 500) console.error('[ERROR]', err)
  res.status(code >= 400 && code < 600 ? code : 500).json({ code, message: err.message || '服务器内部错误', data: null })
})

const server = app.listen(PORT, HOST, () => {
  console.log(`学立方后端已启动: http://${HOST}:${PORT}`)
  console.log(`后台管理台:     http://${HOST}:${PORT}/admin/`)
  console.log(`健康检查:       http://${HOST}:${PORT}/api/health`)
  console.log(`数据库:         ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
})

process.on('SIGINT', () => server.close(() => process.exit(0)))
process.on('SIGTERM', () => server.close(() => process.exit(0)))

module.exports = app
