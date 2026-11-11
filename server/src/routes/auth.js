'use strict'
const express = require('express')
const bcrypt = require('bcryptjs')
const { query, one } = require('../db')
const { ok, fail, wrap, throwIf } = require('../http')
const { sign, requireAuth } = require('../auth')

const router = express.Router()

function publicUser(user) {
  return {
    account: user.account,
    role: user.role,
    nickname: user.nickname,
    avatar: user.avatar || '',
    avatarText: user.avatar_text || (user.nickname || '').slice(0, 1)
  }
}

// POST /api/auth/login  { account, password }
router.post('/login', wrap(async (req, res) => {
  const account = String((req.body && req.body.account) || '').trim()
  const password = String((req.body && req.body.password) || '')
  throwIf(!account || !password, 400, '请输入账号和密码')

  const user = await one('SELECT * FROM users WHERE account = ?', [account])
  if (!user) return fail(res, 404, '账号不存在，请先注册')
  if (user.status !== 'active') return fail(res, 403, '账号已被停用，请联系管理员')
  const matched = await bcrypt.compare(password, user.password_hash)
  if (!matched) return fail(res, 401, '密码错误')

  const token = sign(user)
  return ok(res, { user: publicUser(user), token }, 'ok')
}))

// POST /api/auth/register  { account, password, role, nickname }
// 教师账号必须由管理员开通（与 mock 语义一致），学生/家长可自助注册
router.post('/register', wrap(async (req, res) => {
  const account = String((req.body && req.body.account) || '').trim()
  const password = String((req.body && req.body.password) || '')
  const role = String((req.body && req.body.role) || '')
  const nickname = String((req.body && req.body.nickname) || account).trim()

  throwIf(!account || !password, 400, '请输入账号和密码')
  throwIf(account.length < 4 || password.length < 6, 400, '账号至少 4 位、密码至少 6 位')
  throwIf(role === 'teacher', 403, '教师账号需由学校管理员开通，请使用教师入口登录已有账号')
  throwIf(!['student', 'parent'].includes(role), 400, '不支持的注册身份')

  const exists = await one('SELECT id FROM users WHERE account = ?', [account])
  if (exists) return fail(res, 409, '该账号已被注册')

  const hash = await bcrypt.hash(password, 10)
  await query(
    'INSERT INTO users (account, password_hash, role, nickname, avatar_text, signature) VALUES (?,?,?,?,?,?)',
    [account, hash, role, nickname, nickname.slice(0, 1), '']
  )
  if (role === 'student') {
    await query('INSERT INTO user_assets (user_id, learning_coin, silver_coin) VALUES (?, 20, 0)', [account])
    await query('INSERT INTO user_themes (user_id) VALUES (?)', [account])
  }
  const user = await one('SELECT * FROM users WHERE account = ?', [account])
  const token = sign(user)
  return ok(res, { user: publicUser(user), token }, 'ok')
}))

// GET /api/auth/me  校验 token / 获取当前用户
router.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await one('SELECT * FROM users WHERE account = ?', [req.user.account])
  return ok(res, publicUser(user))
}))

module.exports = router
