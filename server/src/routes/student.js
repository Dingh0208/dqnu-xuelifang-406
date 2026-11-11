'use strict'
const express = require('express')
const { query, one, tx } = require('../db')
const { ok, fail, wrap, throwIf } = require('../http')
const { requireAuth } = require('../auth')

const router = express.Router()
router.use(requireAuth)

/* ---------------- 工具 ---------------- */
const pad = (n) => (n < 10 ? '0' + n : '' + n)
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function nowStr() {
  const d = new Date()
  return `${todayStr()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
const completionRate = (done, total) => (total > 0 ? Math.min(100, (done / total) * 100) : 0)
const todayRewardCoins = (done, total) => Math.min(10, Math.max(0, Math.floor(completionRate(done, total) / 10)))
function effectiveStatus(task, today = todayStr()) {
  if (!task) return 'active'
  if (task.status === 'ended') return 'ended'
  return task.deadline && task.deadline < today ? 'ended' : 'active'
}

async function assetsOf(account) {
  let row = await one('SELECT * FROM user_assets WHERE user_id = ?', [account])
  if (!row) {
    await query('INSERT INTO user_assets (user_id, learning_coin, silver_coin) VALUES (?,?,0)', [account, 0])
    row = await one('SELECT * FROM user_assets WHERE user_id = ?', [account])
  }
  return row
}

async function visibleTasks(account, date = todayStr()) {
  const rows = await query(
    'SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = ? ORDER BY id',
    [account, date]
  )
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    source: t.source,
    classId: t.class_id || undefined,
    teacherTaskId: t.teacher_task_id || undefined,
    estimatedMinutes: t.estimated_minutes,
    weight: t.weight,
    completed: !!t.completed
  }))
}

function welcomeOf(tasks) {
  const list = [
    '今天也向自己的目标靠近一点吧。',
    '不用一次完成所有事情，先做好眼前这一件。',
    '今天也不用急，按自己的节奏，一点一点来。',
    '昨天的努力已经留下痕迹，今天继续就好。',
    '慢一点没关系，重要的是没有停下来。'
  ]
  const h = new Date().getHours()
  const greeting = h >= 5 && h < 12 ? '早上好' : h >= 12 && h < 18 ? '下午好' : '晚上好'
  const d = new Date()
  return {
    greeting,
    message: list[(d.getFullYear() + d.getMonth() + d.getDate()) % list.length],
    todayTaskCount: tasks.length,
    estimatedStudyMinutes: tasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0)
  }
}

/* ---------------- 首页 ---------------- */
router.get('/home/today', wrap(async (req, res) => {
  const account = req.user.account
  const tasks = await visibleTasks(account)
  const schedule = await query('SELECT * FROM schedules WHERE user_id = ? AND task_date = ? ORDER BY start_time', [account, todayStr()])
  const reviews = await query('SELECT * FROM reviews WHERE user_id = ? AND task_date = ? ORDER BY id', [account, todayStr()])
  const completed = tasks.filter((t) => t.completed)
  const duration = completed.reduce((s, t) => s + (t.estimatedMinutes || 0), 0)
  return ok(res, {
    date: todayStr(),
    welcome: welcomeOf(tasks),
    tasks,
    schedule: schedule.map((s) => ({ id: s.id, startTime: s.start_time, endTime: s.end_time, title: s.title, type: s.type, status: s.status, taskId: s.task_id })),
    reviews: reviews.map((r) => ({ id: r.id, knowledgePointId: r.knowledge_point_id, title: r.title, lastStudyDaysAgo: r.last_study_days_ago, reviewLevel: r.review_level, due: !!r.due })),
    studyDuration: duration
  })
}))

router.get('/home/welcome', wrap(async (req, res) => ok(res, welcomeOf(await visibleTasks(req.user.account)))))
router.get('/home/today/tasks', wrap(async (req, res) => ok(res, { date: todayStr(), tasks: await visibleTasks(req.user.account) })))

router.patch('/home/today/tasks/:taskId', wrap(async (req, res) => {
  const account = req.user.account
  const id = Number(req.params.taskId)
  const completed = !!req.body.completed
  const task = await one('SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?', [id, account])
  if (!task) return fail(res, 404, '任务不存在')

  await tx(async (conn) => {
    await conn.execute('UPDATE daily_tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id])
    if (task.teacher_task_id) {
      await conn.execute(
        'UPDATE student_tasks SET status = ?, completed_at = ? WHERE task_id = ? AND user_id = ?',
        [completed ? 'completed' : 'pending', completed ? todayStr() : null, task.teacher_task_id, account]
      )
    }
  })
  return ok(res, { taskId: id, completed })
}))

router.get('/home/schedule', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM schedules WHERE user_id = ? AND task_date = ? ORDER BY start_time', [req.user.account, todayStr()])
  return ok(res, {
    date: todayStr(),
    schedule: rows.map((s) => ({ id: s.id, startTime: s.start_time, endTime: s.end_time, title: s.title, type: s.type, status: s.status, taskId: s.task_id }))
  })
}))

router.get('/home/reviews', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM reviews WHERE user_id = ? AND task_date = ? ORDER BY id', [req.user.account, todayStr()])
  return ok(res, {
    date: todayStr(),
    reviews: rows.map((r) => ({ id: r.id, knowledgePointId: r.knowledge_point_id, title: r.title, lastStudyDaysAgo: r.last_study_days_ago, reviewLevel: r.review_level, due: !!r.due }))
  })
}))

router.get('/rewards/today', wrap(async (req, res) => {
  const tasks = await visibleTasks(req.user.account)
  const completed = tasks.filter((t) => t.completed).length
  return ok(res, {
    completionRate: completionRate(completed, tasks.length),
    todayRewardCoins: todayRewardCoins(completed, tasks.length),
    dailyLimit: 10
  })
}))

router.get('/home/today/study-duration', wrap(async (req, res) => {
  const tasks = await visibleTasks(req.user.account)
  return ok(res, {
    date: todayStr(),
    studyDurationMinutes: tasks.filter((t) => t.completed).reduce((s, t) => s + (t.estimatedMinutes || 0), 0)
  })
}))

/* ---------------- 资产 / 资料 ---------------- */
router.get('/assets', wrap(async (req, res) => {
  const a = await assetsOf(req.user.account)
  return ok(res, { coins: a.learning_coin, silverCoins: a.silver_coin })
}))

router.get('/profile', wrap(async (req, res) => {
  const u = await one('SELECT * FROM users WHERE account = ?', [req.user.account])
  return ok(res, { id: u.id, nickname: u.nickname, avatar: u.avatar, avatarText: u.avatar_text || u.nickname.slice(0, 1), studyDays: u.study_days })
}))

router.get('/assets/incomplete-streak', wrap(async (req, res) => {
  const a = await assetsOf(req.user.account)
  const days = a.consecutive_incomplete_days || 0
  const penaltyToday = days <= 0 ? 0 : days === 1 ? 2 : days === 2 ? 4 : days === 3 ? 8 : 10
  return ok(res, { consecutiveIncompleteDays: days, penaltyToday })
}))

router.get('/me', wrap(async (req, res) => {
  const u = await one('SELECT * FROM users WHERE account = ?', [req.user.account])
  const a = await assetsOf(req.user.account)
  return ok(res, {
    profile: { avatar: u.avatar, avatarText: u.avatar_text || u.nickname.slice(0, 1), nickname: u.nickname, signature: u.signature },
    assets: { learningCoin: a.learning_coin, silverCoin: a.silver_coin },
    membership: { isMember: false, type: 'lifetime', price: null, coinDeduction: null }
  })
}))

/* ---------------- 金币 / 商城 ---------------- */
router.get('/coins/learning', wrap(async (req, res) => {
  const account = req.user.account
  const a = await assetsOf(account)
  const tasks = await visibleTasks(account)
  const completed = tasks.filter((t) => t.completed).length
  const records = await query('SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20', [account])
  return ok(res, {
    balance: a.learning_coin,
    todayEarned: todayRewardCoins(completed, tasks.length),
    todayCompletionRate: Math.round(completionRate(completed, tasks.length)),
    todayCompletedTasks: completed,
    todayTotalTasks: tasks.length,
    records: records.map((r) => ({ id: 'r_' + r.id, date: r.created_at.slice(0, 10), delta: r.delta, type: r.type, desc: r.description }))
  })
}))

router.get('/coins/learning/records', wrap(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
  const total = (await one('SELECT COUNT(*) AS c FROM coin_transactions WHERE user_id = ?', [req.user.account])).c
  const rows = await query(
    'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
    [req.user.account, pageSize, (page - 1) * pageSize]
  )
  return ok(res, {
    page, pageSize, total,
    records: rows.map((r) => ({ id: 'r_' + r.id, date: r.created_at.slice(0, 10), delta: r.delta, type: r.type, desc: r.description }))
  })
}))

router.get('/mall/silver/products', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM silver_products WHERE enabled = 1')
  return ok(res, { products: rows.map((p) => ({ productId: p.product_id, silverAmount: p.silver_amount, price: Number(p.price), unitPrice: Number(p.unit_price), enabled: !!p.enabled })) })
}))

router.get('/shop/products', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM silver_products WHERE enabled = 1')
  return ok(res, { products: rows.map((p) => ({ id: p.product_id, silverCoins: p.silver_amount, priceYuan: Number(p.price) })) })
}))

router.get('/mall/coin/products', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM coin_products WHERE enabled = 1')
  return ok(res, { products: rows.map((p) => ({ productId: p.product_id, name: p.name, cost: p.cost, type: p.type, description: p.description })) })
}))

router.post('/mall/coin/redeem', wrap(async (req, res) => {
  const productId = String((req.body && req.body.productId) || '')
  const product = await one('SELECT * FROM coin_products WHERE product_id = ? AND enabled = 1', [productId])
  if (!product) return fail(res, 404, '商品不存在')
  const account = req.user.account
  const a = await assetsOf(account)
  if (a.learning_coin < product.cost) return fail(res, 400, '金币不足，完成今日任务可以获得金币')

  const balance = a.learning_coin - product.cost
  await tx(async (conn) => {
    await conn.execute('UPDATE user_assets SET learning_coin = ? WHERE user_id = ?', [balance, account])
    await conn.execute(
      'INSERT INTO coin_transactions (user_id, delta, type, description, balance_after) VALUES (?,?,?,?,?)',
      [account, -product.cost, 'redeem', `兑换 ${product.name}`, balance]
    )
  })
  return ok(res, { productId, name: product.name, cost: product.cost, balance })
}))

async function createOrder(account, productId, productType) {
  if (productType === 'silver') {
    const p = await one('SELECT * FROM silver_products WHERE product_id = ? AND enabled = 1', [productId])
    throwIf(!p, 404, '商品不存在')
    const orderId = `XLF${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
    await query('INSERT INTO orders (id, user_id, product_id, product_type, amount, status) VALUES (?,?,?,?,?,?)',
      [orderId, account, productId, 'silver', p.price, 'pending'])
    return { productId, orderId, status: 'pending', amount: Number(p.price) }
  }
  const p = await one('SELECT * FROM coin_products WHERE product_id = ? AND enabled = 1', [productId])
  throwIf(!p, 404, '商品不存在')
  const orderId = `XLF${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
  await query('INSERT INTO orders (id, user_id, product_id, product_type, amount, status) VALUES (?,?,?,?,?,?)',
    [orderId, account, productId, 'coin', null, 'pending'])
  return { productId, orderId, status: 'pending', amount: null }
}

router.post('/mall/orders', wrap(async (req, res) => ok(res, await createOrder(req.user.account, String(req.body.productId || ''), 'silver'))))
router.post('/shop/orders', wrap(async (req, res) => ok(res, await createOrder(req.user.account, String(req.body.productId || ''), 'silver'))))

router.get('/membership', wrap(async (req, res) => ok(res, { isMember: false, type: 'lifetime', price: null, coinDeduction: null })))

router.get('/faq', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM faq_items WHERE enabled = 1 ORDER BY sort, id')
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.category)) map.set(r.category, { category: r.category, items: [] })
    map.get(r.category).items.push({ id: r.id, q: r.question, a: r.answer })
  }
  return ok(res, { categories: [...map.values()] })
}))

router.post('/feedback', wrap(async (req, res) => {
  const { type, content, images, contact } = req.body || {}
  throwIf(!content || !String(content).trim(), 400, '请填写建议内容')
  const r = await query(
    'INSERT INTO feedback (user_id, type, content, images, contact) VALUES (?,?,?,?,?)',
    [req.user.account, type || 'other', String(content).trim(), JSON.stringify(images || []), contact || '']
  )
  return ok(res, { id: r.insertId, received: true })
}))

/* ---------------- 主题 ---------------- */
router.get('/theme', wrap(async (req, res) => {
  let t = await one('SELECT * FROM user_themes WHERE user_id = ?', [req.user.account])
  if (!t) {
    await query('INSERT INTO user_themes (user_id) VALUES (?)', [req.user.account])
    t = await one('SELECT * FROM user_themes WHERE user_id = ?', [req.user.account])
  }
  return ok(res, {
    currentTheme: t.current_theme, homeTheme: t.home_theme, workbenchTheme: t.workbench_theme,
    syncWorkbenchTheme: !!t.sync_workbench_theme
  })
}))

router.patch('/theme', wrap(async (req, res) => {
  const account = req.user.account
  const map = { currentTheme: 'current_theme', homeTheme: 'home_theme', workbenchTheme: 'workbench_theme', syncWorkbenchTheme: 'sync_workbench_theme' }
  const sets = []
  const params = []
  for (const [key, col] of Object.entries(map)) {
    if (req.body[key] !== undefined) {
      sets.push(`${col} = ?`)
      params.push(key === 'syncWorkbenchTheme' ? (req.body[key] ? 1 : 0) : String(req.body[key]))
    }
  }
  await query('INSERT IGNORE INTO user_themes (user_id) VALUES (?)', [account])
  if (sets.length) await query(`UPDATE user_themes SET ${sets.join(', ')} WHERE user_id = ?`, [...params, account])
  const t = await one('SELECT * FROM user_themes WHERE user_id = ?', [account])
  return ok(res, {
    currentTheme: t.current_theme, homeTheme: t.home_theme, workbenchTheme: t.workbench_theme,
    syncWorkbenchTheme: !!t.sync_workbench_theme
  })
}))

/* ---------------- 班级（学生视图） ---------------- */
function classView(cls, adminName) {
  return {
    id: cls.id, name: cls.name, description: cls.description, goal: cls.goal,
    memberCount: cls.member_count, maxMembers: cls.max_members, status: cls.status, adminName
  }
}

async function classWithCount(classId) {
  return one(
    `SELECT c.*, (SELECT COUNT(DISTINCT m.user_id) FROM class_memberships m
       WHERE m.class_id = c.id AND m.role = 'MEMBER' AND m.status = 'ACTIVE') AS member_count
     FROM classes c WHERE c.id = ?`, [classId]
  )
}

async function adminNameOf(classId) {
  const row = await one(
    `SELECT u.nickname FROM class_memberships m JOIN users u ON u.account = m.user_id
     WHERE m.class_id = ? AND m.role = 'ADMIN' AND m.status = 'ACTIVE' LIMIT 1`, [classId])
  return row ? row.nickname : '—'
}

router.get('/classes', wrap(async (req, res) => {
  const account = req.user.account
  const rows = await query(
    `SELECT m.role AS my_role, c.*, (SELECT COUNT(DISTINCT m2.user_id) FROM class_memberships m2
        WHERE m2.class_id = c.id AND m2.role = 'MEMBER' AND m2.status = 'ACTIVE') AS member_count
     FROM class_memberships m JOIN classes c ON c.id = m.class_id
     WHERE m.user_id = ? AND m.status = 'ACTIVE' AND c.status = 'ACTIVE'
     ORDER BY c.created_at`, [account])
  const byClass = new Map()
  for (const row of rows) {
    if (!byClass.has(row.id)) byClass.set(row.id, { row, roles: new Set() })
    byClass.get(row.id).roles.add(row.my_role)
  }
  const joined = [], managed = []
  for (const { row, roles } of byClass.values()) {
    const view = classView(row, await adminNameOf(row.id))
    if (roles.has('MEMBER')) joined.push({ ...view, role: roles.has('ADMIN') ? 'ADMIN' : 'MEMBER' })
    if (roles.has('ADMIN')) managed.push({ ...view, role: 'ADMIN' })
  }
  return ok(res, { joinedClasses: joined, managedClasses: managed })
}))

router.get('/classes/:classId', wrap(async (req, res) => {
  const cls = await classWithCount(req.params.classId)
  if (!cls) return fail(res, 404, '班级不存在')
  const account = req.user.account
  const isMember = !!(await one("SELECT id FROM class_memberships WHERE user_id=? AND class_id=? AND role='MEMBER' AND status='ACTIVE'", [account, cls.id]))
  const isAdmin = !!(await one("SELECT id FROM class_memberships WHERE user_id=? AND class_id=? AND role='ADMIN' AND status='ACTIVE'", [account, cls.id]))
  if (!isMember && !isAdmin) return fail(res, 403, '无权限访问该班级')
  return ok(res, { classInfo: classView(cls, await adminNameOf(cls.id)), isMember, isAdmin })
}))

router.post('/classes/join', wrap(async (req, res) => {
  const code = String((req.body && req.body.inviteCode) || '').trim()
  throwIf(!code, 400, '请输入班级邀请码')
  const cls = await one('SELECT * FROM classes WHERE UPPER(invite_code) = ?', [code.toUpperCase()])
  if (!cls) return fail(res, 404, '邀请码不存在，请检查后重试')
  if (cls.status !== 'ACTIVE') return fail(res, 409, '该班级已解散，无法加入')
  const account = req.user.account
  const already = await one("SELECT id FROM class_memberships WHERE user_id=? AND class_id=? AND role='MEMBER' AND status='ACTIVE'", [account, cls.id])
  if (already) return fail(res, 409, '你已加入该班级')
  const count = (await one("SELECT COUNT(DISTINCT user_id) AS c FROM class_memberships WHERE class_id=? AND role='MEMBER' AND status='ACTIVE'", [cls.id])).c
  if (count >= cls.max_members) return fail(res, 409, '班级人数已满，无法加入')

  await query("INSERT INTO class_memberships (user_id, class_id, role, status, joined_at) VALUES (?,?,'MEMBER','ACTIVE',?)", [account, cls.id, todayStr()])
  // 班级里已布置的进行中任务，补发到新成员的学生端
  const tasks = await query("SELECT * FROM tasks WHERE class_id = ? AND status = 'active'", [cls.id])
  for (const t of tasks) {
    await query("INSERT IGNORE INTO student_tasks (task_id, class_id, user_id, status, created_at) VALUES (?,?,?,'pending',?)", [t.id, cls.id, account, todayStr()])
    await query("INSERT INTO daily_tasks (user_id, task_date, title, description, type, source, class_id, teacher_task_id, estimated_minutes, weight) VALUES (?,?,?,?,?,?,?,?,?,20)",
      [account, todayStr(), t.title, `班级任务：${t.description}`, 'study', 'class', cls.id, t.id, 30])
  }
  return ok(res, { classId: cls.id, name: cls.name })
}))

/* ---------------- 错题本 ---------------- */
function questionView(q) {
  return {
    id: q.id, imageUrl: q.image_url, subject: q.subject, title: q.title,
    knowledgePoint: q.knowledge_point, knowledgePointId: q.knowledge_point_id,
    questionType: q.question_type, uploadedAt: q.uploaded_at, source: q.source,
    sourceFileId: q.source_file_id, status: q.status, needReview: !!q.need_review,
    aiStatus: q.ai_status, aiRecognizedText: q.ai_recognized_text, aiAnalysis: q.ai_analysis,
    wrongCount: q.wrong_count, reviewLevel: q.review_level,
    createdAt: q.created_at, updatedAt: q.updated_at
  }
}

router.get('/wrongbook', wrap(async (req, res) => {
  const { keyword, status } = req.query
  const where = ['user_id = ?']
  const params = [req.user.account]
  if (status) { where.push('status = ?'); params.push(status) }
  if (keyword) { where.push('(title LIKE ? OR subject LIKE ? OR knowledge_point LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) }
  const rows = await query(`SELECT * FROM wrong_questions WHERE ${where.join(' AND ')} ORDER BY created_at DESC`, params)
  return ok(res, { list: rows.map(questionView) })
}))

router.get('/wrongbook/statistics', wrap(async (req, res) => {
  const rows = await query(
    "SELECT status, COUNT(*) AS c FROM wrong_questions WHERE user_id = ? GROUP BY status", [req.user.account])
  const total = rows.reduce((s, r) => s + r.c, 0)
  const reviewCount = (rows.find((r) => r.status === 'review') || { c: 0 }).c
  const masteredCount = (rows.find((r) => r.status === 'mastered') || { c: 0 }).c
  return ok(res, { total, reviewCount, masteredCount })
}))

router.get('/wrongbook/history', wrap(async (req, res) => {
  const rows = await query('SELECT * FROM upload_history WHERE user_id = ? ORDER BY upload_time DESC', [req.user.account])
  const list = []
  for (const h of rows) {
    const ids = h.question_ids ? h.question_ids.split(',').map(Number).filter(Boolean) : []
    let questions = []
    if (ids.length) {
      const qs = await query(`SELECT id, title, subject, status FROM wrong_questions WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
      questions = qs
    }
    list.push({ id: h.id, fileName: h.file_name, source: h.source, uploadTime: h.upload_time, status: h.status, resultCount: h.result_count, questionIds: ids, questions })
  }
  return ok(res, { list })
}))

router.get('/wrongbook/history/:id', wrap(async (req, res) => {
  const h = await one('SELECT * FROM upload_history WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  if (!h) return ok(res, null)
  const ids = h.question_ids ? h.question_ids.split(',').map(Number).filter(Boolean) : []
  const questions = ids.length ? await query(`SELECT id, title, subject, status FROM wrong_questions WHERE id IN (${ids.map(() => '?').join(',')})`, ids) : []
  return ok(res, { id: h.id, fileName: h.file_name, source: h.source, uploadTime: h.upload_time, status: h.status, resultCount: h.result_count, questionIds: ids, questions })
}))

router.get('/wrongbook/:id', wrap(async (req, res) => {
  const q = await one('SELECT * FROM wrong_questions WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  return ok(res, q ? questionView(q) : null)
}))

router.patch('/wrongbook/:id', wrap(async (req, res) => {
  const allowed = { status: 'status', needReview: 'need_review', reviewLevel: 'review_level', title: 'title', subject: 'subject', knowledgePoint: 'knowledge_point' }
  const sets = [], params = []
  for (const [k, col] of Object.entries(allowed)) {
    if (req.body[k] !== undefined) { sets.push(`${col} = ?`); params.push(k === 'needReview' ? (req.body[k] ? 1 : 0) : req.body[k]) }
  }
  if (sets.length) await query(`UPDATE wrong_questions SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, [...params, req.params.id, req.user.account])
  return ok(res, { id: Number(req.params.id), patch: req.body })
}))

router.delete('/wrongbook/:id', wrap(async (req, res) => {
  await query('DELETE FROM wrong_questions WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  return ok(res, { id: Number(req.params.id), deleted: true })
}))

router.post('/wrongbook/:id/reanalyze', wrap(async (req, res) => {
  await query("UPDATE wrong_questions SET ai_status = 'processing' WHERE id = ? AND user_id = ?", [req.params.id, req.user.account])
  return ok(res, { id: Number(req.params.id), aiStatus: 'processing' })
}))

router.get('/wrongbook/:id/analysis', wrap(async (req, res) => {
  const q = await one('SELECT * FROM wrong_questions WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  if (!q) return ok(res, null)
  return ok(res, { id: q.id, aiStatus: q.ai_status, aiRecognizedText: q.ai_recognized_text, aiAnalysis: q.ai_analysis })
}))

// 上传（multipart 走 busboy 成本高：此处接收文件名生成待识别记录，真实 OCR 由后续 AI 服务接入）
router.post('/wrongbook/upload/:kind', wrap(async (req, res) => {
  const kind = req.params.kind === 'document' ? 'document' : 'camera'
  const stamp = nowStr()
  const r = await query(
    `INSERT INTO wrong_questions (user_id, image_url, subject, title, knowledge_point, question_type, uploaded_at, source, source_file_id, status, need_review, ai_status, ai_recognized_text, ai_analysis, wrong_count, review_level)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.account, '', '待识别', kind === 'document' ? '新导入错题' : '新拍照错题', '待识别', 'choice', stamp, kind,
      'mock_' + kind + '_' + Date.now(), 'review', 1, 'processing', '正在识别题目内容…', '识别完成后会在这里显示 AI 解析。', 1, 1]
  )
  const uploadId = 'up_' + (kind === 'document' ? 'doc' : 'cam') + '_' + Date.now()
  await query('INSERT INTO upload_history (id, user_id, file_name, source, upload_time, status, result_count, question_ids) VALUES (?,?,?,?,?,?,?,?)',
    [uploadId, req.user.account, kind === 'document' ? '错题文档.pdf' : '错题照片.jpg', kind, stamp, 'processing', 1, String(r.insertId)])
  return ok(res, {
    uploadId, source: kind, fileName: kind === 'document' ? '错题文档.pdf' : '错题照片.jpg',
    filePath: '', fileSize: 0, status: 'processing', progress: 0, createdAt: new Date().toISOString(),
    wrongQuestionIds: [r.insertId]
  })
}))

/* ---------------- 工作台 ---------------- */
const INSPIRATIONS = [
  { id: 'insp-001', title: '番茄钟 + 错题复盘', tag: '效率', summary: '用 25 分钟专注 + 5 分钟复盘，把今天的错题吃透。' },
  { id: 'insp-002', title: '晨间 30 分钟英语', tag: '语言', summary: '早起先背 40 个高频词，再用 10 分钟做一篇阅读。' },
  { id: 'insp-003', title: '周末知识地图', tag: '复习', summary: '把一周知识点画成一张图，找出还没连上的地方。' }
]
const CREATE_MODES = [
  { mode: 'free', label: '自由描述' },
  { mode: 'questionnaire', label: '问卷生成' },
  { mode: 'inspiration', label: '灵感衍生' }
]

router.get('/workbench/inspirations', wrap(async (req, res) => ok(res, { list: INSPIRATIONS })))
router.get('/workbench/create-modes', wrap(async (req, res) => ok(res, { modes: CREATE_MODES })))
router.get('/workbench/inspirations/:id', wrap(async (req, res) => {
  const item = INSPIRATIONS.find((i) => i.id === req.params.id)
  return ok(res, item || null)
}))
router.post('/workbench/create', wrap(async (req, res) => {
  const id = 'wb-' + Date.now().toString(36)
  const title = String((req.body && req.body.title) || '我的学习计划')
  await query('INSERT INTO workbenches (id, user_id, title, mode, content, status) VALUES (?,?,?,?,?,?)',
    [id, req.user.account, title, (req.body && req.body.mode) || 'free', JSON.stringify(req.body || {}), 'draft'])
  return ok(res, { workbenchId: id, id, title, status: 'draft' })
}))
router.post('/workbench/:id/generate', wrap(async (req, res) => {
  const wb = await one('SELECT * FROM workbenches WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  if (!wb) return fail(res, 404, '工作台不存在')
  const plan = {
    title: wb.title,
    tasks: [
      { title: '整理今日错题 3 道', estimatedMinutes: 25 },
      { title: '完成 1 组专项练习', estimatedMinutes: 30 },
      { title: '复盘并记录 1 条心得', estimatedMinutes: 10 }
    ]
  }
  await query("UPDATE workbenches SET status = 'generated', content = ? WHERE id = ?", [JSON.stringify(plan), wb.id])
  return ok(res, { workbenchId: wb.id, status: 'generated', plan })
}))
router.get('/workbench/:id', wrap(async (req, res) => {
  const wb = await one('SELECT * FROM workbenches WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  return ok(res, wb ? { id: wb.id, title: wb.title, mode: wb.mode, content: wb.content, status: wb.status } : null)
}))
router.patch('/workbench/:id', wrap(async (req, res) => {
  if (req.body.title) await query('UPDATE workbenches SET title = ? WHERE id = ? AND user_id = ?', [req.body.title, req.params.id, req.user.account])
  const wb = await one('SELECT * FROM workbenches WHERE id = ? AND user_id = ?', [req.params.id, req.user.account])
  return ok(res, wb ? { id: wb.id, title: wb.title, mode: wb.mode, content: wb.content, status: wb.status } : null)
}))

module.exports = router
