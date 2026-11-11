'use strict'
const jwt = require('jsonwebtoken')
const { one } = require('./db')

const SECRET = process.env.JWT_SECRET || 'xuelifang-dev-secret'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h'

function sign(user) {
  return jwt.sign({ sub: user.account, role: user.role, nickname: user.nickname }, SECRET, { expiresIn: EXPIRES_IN })
}

function readToken(req) {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return ''
}

// 解析 token 并加载用户（账号被禁用/删除 → 401）
async function requireAuth(req, res, next) {
  const token = readToken(req)
  if (!token) return res.status(401).json({ code: 401, message: '登录已失效，请重新登录', data: null })
  let payload
  try {
    payload = jwt.verify(token, SECRET)
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已失效，请重新登录', data: null })
  }
  const user = await one('SELECT account, role, nickname, status FROM users WHERE account = ?', [payload.sub])
  if (!user || user.status !== 'active') {
    return res.status(401).json({ code: 401, message: '账号不存在或已被停用', data: null })
  }
  req.user = user
  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 401, message: '登录已失效，请重新登录', data: null })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '无权访问该资源', data: null })
    }
    next()
  }
}

// 班级管理权：ClassMembership.role === 'ADMIN' 且 ACTIVE（与 user.role 无关）
async function isClassAdmin(account, classId) {
  const row = await one(
    "SELECT id FROM class_memberships WHERE user_id = ? AND class_id = ? AND role = 'ADMIN' AND status = 'ACTIVE'",
    [account, classId]
  )
  return !!row
}

module.exports = { sign, requireAuth, requireRole, isClassAdmin, readToken }
