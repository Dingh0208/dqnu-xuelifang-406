'use strict'
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query, one, tx } = require('../db')
const { ok, fail, wrap, throwIf } = require('../http')
const { sign, requireAuth, requireRole } = require('../auth')
const { resources } = require('../admin-meta')

const router = express.Router()
const byKey = new Map(resources.map((r) => [r.key, r]))

function getResource(key) {
  const r = byKey.get(key)
  if (!r) throw Object.assign(new Error('未知资源'), { code: 404 })
  return r
}

// ---------- 登录 ----------
router.post('/login', wrap(async (req, res) => {
  const account = String((req.body && req.body.account) || '').trim()
  const password = String((req.body && req.body.password) || '')
  throwIf(!account || !password, 400, '请输入账号和密码')
  const user = await one('SELECT * FROM users WHERE account = ?', [account])
  if (!user) return fail(res, 401, '账号或密码错误')
  if (user.role !== 'admin') return fail(res, 403, '该账号不是管理员')
  if (user.status !== 'active') return fail(res, 403, '账号已被停用')
  if (!(await bcrypt.compare(password, user.password_hash))) return fail(res, 401, '账号或密码错误')
  return ok(res, {
    token: sign(user),
    admin: { account: user.account, nickname: user.nickname, role: user.role }
  })
}))

router.use(requireAuth, requireRole('admin'))

// ---------- 元数据 ----------
router.get('/meta', (req, res) => ok(res, { resources }))

// ---------- 概览 ----------
router.get('/stats', wrap(async (req, res) => {
  const counts = {}
  const scalar = async (sql, params = []) => (await one(sql, params)).c
  counts.students = await scalar("SELECT COUNT(*) c FROM users WHERE role='student'")
  counts.teachers = await scalar("SELECT COUNT(*) c FROM users WHERE role='teacher'")
  counts.parents = await scalar("SELECT COUNT(*) c FROM users WHERE role='parent'")
  counts.classes = await scalar('SELECT COUNT(*) c FROM classes')
  counts.tasks = await scalar('SELECT COUNT(*) c FROM tasks')
  counts.completedTasks = await scalar("SELECT COUNT(*) c FROM student_tasks WHERE status='completed'")
  counts.studentTasks = await scalar('SELECT COUNT(*) c FROM student_tasks')
  counts.wrongQuestions = await scalar('SELECT COUNT(*) c FROM wrong_questions')
  counts.feedbackNew = await scalar("SELECT COUNT(*) c FROM feedback WHERE status='new'")
  counts.ordersPending = await scalar("SELECT COUNT(*) c FROM orders WHERE status='pending'")

  const recentFeedback = await query(
    `SELECT f.id, f.user_id, f.type, f.content, f.status, f.created_at, u.nickname
     FROM feedback f LEFT JOIN users u ON u.account = f.user_id
     ORDER BY f.created_at DESC LIMIT 5`)
  const classRanking = await query(
    `SELECT c.id, c.name,
        (SELECT COUNT(DISTINCT m.user_id) FROM class_memberships m WHERE m.class_id=c.id AND m.role='MEMBER' AND m.status='ACTIVE') AS students,
        (SELECT COUNT(*) FROM tasks t WHERE t.class_id=c.id) AS tasks,
        (SELECT COUNT(*) FROM student_tasks s WHERE s.class_id=c.id) AS total,
        (SELECT COUNT(*) FROM student_tasks s WHERE s.class_id=c.id AND s.status='completed') AS done
     FROM classes c ORDER BY students DESC LIMIT 5`)
  const coinTop = await query(
    `SELECT user_id, learning_coin, silver_coin FROM user_assets ORDER BY learning_coin DESC LIMIT 5`)
  const roleDist = await query("SELECT role, COUNT(*) c FROM users GROUP BY role")
  const taskDist = await query("SELECT status, COUNT(*) c FROM student_tasks GROUP BY status")

  return ok(res, {
    counts,
    roleDist,
    taskDist,
    recentFeedback,
    classRanking: classRanking.map((c) => ({ ...c, rate: c.total > 0 ? Math.round((c.done / c.total) * 1000) / 10 : null })),
    coinTop
  })
}))

// ---------- 通用 CRUD ----------
function visibleColumns(r) {
  return r.fields.filter((f) => !f.virtual).map((f) => f.name)
}

function pickBody(r, body, { forCreate }) {
  const cols = []
  const values = []
  for (const f of r.fields) {
    if (f.virtual) continue
    if (f.onlyCreate && !forCreate) continue
    if (body[f.name] === undefined) continue
    let v = body[f.name]
    if (v === '' && f.type === 'number') v = null
    if (f.type === 'number' && v !== null && v !== '') v = Number(v)
    cols.push(f.name)
    values.push(v === undefined ? null : v)
  }
  return { cols, values }
}

router.get('/list/:resource', wrap(async (req, res) => {
  const r = getResource(req.params.resource)
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 20))
  const where = []
  const params = []

  const q = String(req.query.q || '').trim()
  if (q && r.search.length) {
    where.push('(' + r.search.map((c) => `${c} LIKE ?`).join(' OR ') + ')')
    r.search.forEach(() => params.push(`%${q}%`))
  }
  for (const f of r.fields) {
    const val = req.query[f.name]
    if (val !== undefined && val !== '' && f.name !== r.pk) {
      where.push(`${f.name} = ?`)
      params.push(val)
    }
  }

  const sortable = new Set([r.pk, ...r.fields.map((f) => f.name), 'created_at', 'updated_at'])
  const sort = sortable.has(String(req.query.sort)) ? req.query.sort : r.defaultSort
  const order = String(req.query.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const total = (await one(`SELECT COUNT(*) c FROM \`${r.table}\` ${whereSql}`, params)).c
  const rows = await query(
    `SELECT * FROM \`${r.table}\` ${whereSql} ORDER BY \`${sort}\` ${order} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize])

  for (const row of rows) delete row.password_hash
  return ok(res, { items: rows, total, page, pageSize, columns: visibleColumns(r), sort, order })
}))

router.get('/one/:resource/:id', wrap(async (req, res) => {
  const r = getResource(req.params.resource)
  const row = await one(`SELECT * FROM \`${r.table}\` WHERE \`${r.pk}\` = ?`, [req.params.id])
  if (!row) return fail(res, 404, '记录不存在')
  delete row.password_hash
  return ok(res, row)
}))

router.post('/list/:resource', wrap(async (req, res) => {
  const r = getResource(req.params.resource)
  const { cols, values } = pickBody(r, req.body || {}, { forCreate: true })

  if (r.key === 'users') {
    const account = String(req.body.account || '').trim()
    throwIf(!account, 400, '账号不能为空')
    throwIf(await one('SELECT id FROM users WHERE account = ?', [account]), 409, '账号已存在')
    const password = String(req.body.password || '123456')
    const hash = await bcrypt.hash(password, 10)
    const idx = cols.indexOf('account')
    const finalCols = [...cols, 'password_hash']
    const finalValues = [...values, hash]
    if (idx < 0) { finalCols.push('account'); finalValues.push(account) }
    if (!cols.includes('avatar_text')) {
      finalCols.push('avatar_text')
      finalValues.push(String(req.body.nickname || account).slice(0, 1))
    }
    const placeholders = finalCols.map(() => '?').join(',')
    try {
      const result = await query(`INSERT INTO users (${finalCols.join(',')}) VALUES (${placeholders})`, finalValues)
      if (req.body.role === 'student') {
        await query('INSERT IGNORE INTO user_assets (user_id) VALUES (?)', [account])
        await query('INSERT IGNORE INTO user_themes (user_id) VALUES (?)', [account])
      }
      return ok(res, { id: result.insertId, account })
    } catch (e) {
      if (cols.length === 0 || e.code === 'ER_NO_DEFAULT_FOR_FIELD') return fail(res, 400, '字段不完整：' + e.message)
      throw e
    }
  }

  throwIf(cols.length === 0, 400, '没有可写入的字段')
  const placeholders = cols.map(() => '?').join(',')
  const result = await query(`INSERT INTO \`${r.table}\` (${cols.join(',')}) VALUES (${placeholders})`, values)
  return ok(res, { id: result.insertId, affected: result.affectedRows })
}))

router.patch('/one/:resource/:id', wrap(async (req, res) => {
  const r = getResource(req.params.resource)
  const { cols, values } = pickBody(r, req.body || {}, { forCreate: false })
  if (r.key === 'users' && req.body.password) {
    cols.push('password_hash')
    values.push(await bcrypt.hash(String(req.body.password), 10))
    if (req.body.account) {
      const old = await one('SELECT account FROM users WHERE id = ?', [req.params.id])
      if (old && old.account !== req.body.account) {
        await query('UPDATE user_assets SET user_id = ? WHERE user_id = ?', [req.body.account, old.account])
      }
    }
  }
  if (!cols.length) return fail(res, 400, '没有可更新的字段')
  const sets = cols.map((c) => `${c} = ?`).join(', ')
  await query(`UPDATE \`${r.table}\` SET ${sets} WHERE \`${r.pk}\` = ?`, [...values, req.params.id])
  return ok(res, { id: req.params.id, updated: true })
}))

router.delete('/one/:resource/:id', wrap(async (req, res) => {
  const r = getResource(req.params.resource)
  if (r.key === 'users') {
    const user = await one('SELECT account, role FROM users WHERE id = ?', [req.params.id])
    if (!user) return fail(res, 404, '用户不存在')
    if (user.role === 'admin') return fail(res, 403, '不能删除管理员账号')
    await tx(async (conn) => {
      await conn.execute('DELETE FROM user_assets WHERE user_id = ?', [user.account])
      await conn.execute('DELETE FROM user_themes WHERE user_id = ?', [user.account])
      await conn.execute('DELETE FROM class_memberships WHERE user_id = ?', [user.account])
      await conn.execute('DELETE FROM student_tasks WHERE user_id = ?', [user.account])
      await conn.execute('DELETE FROM daily_tasks WHERE user_id = ?', [user.account])
      await conn.execute('DELETE FROM wrong_questions WHERE user_id = ?', [user.account])
      await conn.execute('DELETE FROM users WHERE id = ?', [req.params.id])
    })
    return ok(res, { id: req.params.id, deleted: true })
  }
  await query(`DELETE FROM \`${r.table}\` WHERE \`${r.pk}\` = ?`, [req.params.id])
  return ok(res, { id: req.params.id, deleted: true })
}))

// ---------- 运营动作 ----------
// 手动调整金币（写流水，保持余额与流水一致）
router.post('/coins/adjust', wrap(async (req, res) => {
  const account = String(req.body.account || '')
  const delta = Number(req.body.delta)
  const description = String(req.body.description || '管理员调整')
  throwIf(!account || !delta, 400, '账号和变动值必填')
  const a = await one('SELECT * FROM user_assets WHERE user_id = ?', [account])
  if (!a) return fail(res, 404, '该学生没有资产记录')
  const balance = Math.max(0, a.learning_coin + delta)
  await tx(async (conn) => {
    await conn.execute('UPDATE user_assets SET learning_coin = ? WHERE user_id = ?', [balance, account])
    await conn.execute('INSERT INTO coin_transactions (user_id, delta, type, description, balance_after) VALUES (?,?,?,?,?)',
      [account, delta, delta >= 0 ? 'earn' : 'penalty', description, balance])
  })
  return ok(res, { account, balance })
}))

// 重置某个班级任务的完成情况（运营修数）
router.post('/tasks/:taskId/reset', wrap(async (req, res) => {
  await query("UPDATE student_tasks SET status='pending', completed_at=NULL WHERE task_id = ?", [req.params.taskId])
  await query('UPDATE daily_tasks SET completed = 0 WHERE teacher_task_id = ?', [req.params.taskId])
  return ok(res, { taskId: req.params.taskId, reset: true })
}))

module.exports = router
