'use strict'
const express = require('express')
const { query, one, tx } = require('../db')
const { ok, fail, wrap, throwIf } = require('../http')
const { requireAuth, isClassAdmin } = require('../auth')

const router = express.Router()
router.use(requireAuth)

const pad = (n) => (n < 10 ? '0' + n : '' + n)
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const round1 = (ratio) => Math.round(ratio * 1000) / 10
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + 'T00:00:00').getTime())
const effectiveStatus = (t, today = todayStr()) => (t.status === 'ended' || (t.deadline && t.deadline < today) ? 'ended' : 'active')

async function requireClassAdmin(req, res, classId) {
  const cls = await one('SELECT * FROM classes WHERE id = ?', [classId])
  if (!cls) { fail(res, 404, '班级不存在'); return null }
  if (!(await isClassAdmin(req.user.account, classId))) { fail(res, 403, '你没有该班级的管理权限'); return null }
  return cls
}

function genInviteCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/* ---------------- 创建班级 ---------------- */
router.post('/classes', wrap(async (req, res) => {
  const name = String((req.body && req.body.name) || '').trim()
  throwIf(!name, 400, '请输入班级名称')
  const joinSelf = !!req.body.joinSelf
  const id = `class-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  let inviteCode = genInviteCode()
  while (await one('SELECT id FROM classes WHERE invite_code = ?', [inviteCode])) inviteCode = genInviteCode()

  await tx(async (conn) => {
    await conn.execute(
      'INSERT INTO classes (id, name, description, goal, invite_code, max_members, status, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, name, String(req.body.description || '').trim(), String(req.body.goal || '').trim(), inviteCode, 60, 'ACTIVE', req.user.account, todayStr()]
    )
    await conn.execute("INSERT INTO class_memberships (user_id, class_id, role, status, joined_at) VALUES (?,?,'ADMIN','ACTIVE',?)", [req.user.account, id, todayStr()])
    if (joinSelf) {
      await conn.execute("INSERT INTO class_memberships (user_id, class_id, role, status, joined_at) VALUES (?,?,'MEMBER','ACTIVE',?)", [req.user.account, id, todayStr()])
    }
  })
  return ok(res, { classId: id, name, joinSelf })
}))

/* ---------------- 教师首页 ---------------- */
router.get('/home', wrap(async (req, res) => {
  const teacherId = req.user.account
  const managed = await query(
    `SELECT c.* FROM class_memberships m JOIN classes c ON c.id = m.class_id
     WHERE m.user_id = ? AND m.role = 'ADMIN' AND m.status = 'ACTIVE' AND c.status = 'ACTIVE'`, [teacherId])

  const h = new Date().getHours()
  const greeting = h >= 5 && h < 12 ? '早上好' : h >= 12 && h < 18 ? '下午好' : '晚上好'
  const classes = []
  const studentSet = new Set()
  let seatCount = 0

  for (const cls of managed) {
    const members = await query("SELECT DISTINCT user_id FROM class_memberships WHERE class_id = ? AND role='MEMBER' AND status='ACTIVE'", [cls.id])
    members.forEach((m) => studentSet.add(m.user_id))
    seatCount += members.length
    const activeTasks = (await one("SELECT COUNT(*) AS c FROM tasks WHERE class_id = ? AND status = 'active'", [cls.id])).c
    const stat = await one(
      `SELECT COUNT(*) AS total, SUM(status='completed') AS done FROM student_tasks WHERE class_id = ?`, [cls.id])
    const total = stat.total || 0
    classes.push({
      id: cls.id, name: cls.name, studentCount: members.length, activeTaskCount: activeTasks,
      completionRate: total === 0 ? null : round1((stat.done || 0) / total)
    })
  }

  return ok(res, {
    date: todayStr(),
    teacher: { id: teacherId, name: req.user.nickname || '老师', greeting },
    statistics: { classCount: classes.length, studentCount: studentSet.size, studentSeatCount: seatCount },
    classes
  })
}))

/* ---------------- 班级成员 ---------------- */
router.get('/classes/:classId/members', wrap(async (req, res) => {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return
  const rows = await query(
    `SELECT m.user_id, m.role, m.joined_at, u.nickname FROM class_memberships m
     LEFT JOIN users u ON u.account = m.user_id
     WHERE m.class_id = ? AND m.status = 'ACTIVE' ORDER BY m.role DESC, m.joined_at`, [cls.id])
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.user_id)) map.set(r.user_id, { userId: r.user_id, nickname: r.nickname || ('用户' + r.user_id), role: r.role, isMember: r.role === 'MEMBER', joinedAt: r.joined_at })
    else {
      const item = map.get(r.user_id)
      if (r.role === 'ADMIN') item.role = 'ADMIN'
      if (r.role === 'MEMBER') item.isMember = true
    }
  }
  const members = [...map.values()]
  const admin = members.find((m) => m.role === 'ADMIN')
  const memberCount = members.filter((m) => m.isMember).length
  return ok(res, {
    classInfo: {
      id: cls.id, name: cls.name, description: cls.description, goal: cls.goal, inviteCode: cls.invite_code,
      status: cls.status, createdAt: cls.created_at, maxMembers: cls.max_members, memberCount
    },
    adminName: admin ? admin.nickname : '—',
    members
  })
}))

/* ---------------- 班级任务 ---------------- */
router.get('/classes/:classId/tasks', wrap(async (req, res) => {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return
  const rows = await query('SELECT * FROM tasks WHERE class_id = ? ORDER BY created_at DESC, id DESC', [cls.id])
  return ok(res, {
    classInfo: { id: cls.id, name: cls.name },
    tasks: rows.map((t) => ({
      id: t.id, classId: t.class_id, title: t.title, description: t.description,
      createdAt: t.created_at, deadline: t.deadline, status: effectiveStatus(t)
    }))
  })
}))

router.post('/classes/:classId/tasks', wrap(async (req, res) => {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return
  const title = String((req.body && req.body.title) || '').trim()
  if (!title) return fail(res, 400, '请输入任务标题')
  let deadline = String((req.body && req.body.deadline) || '').trim()
  if (!deadline) deadline = todayStr()
  else if (!isValidDate(deadline)) return fail(res, 400, '截止时间格式不正确，请使用 YYYY-MM-DD（如 2026-10-10）')

  const id = 't-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10)
  const description = String(req.body.description || '').trim()
  const members = await query("SELECT DISTINCT user_id FROM class_memberships WHERE class_id = ? AND role='MEMBER' AND status='ACTIVE'", [cls.id])

  await tx(async (conn) => {
    await conn.execute('INSERT INTO tasks (id, class_id, title, description, deadline, status, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [id, cls.id, title, description, deadline, 'active', req.user.account, todayStr()])
    for (const m of members) {
      await conn.execute("INSERT IGNORE INTO student_tasks (task_id, class_id, user_id, status, created_at) VALUES (?,?,?,'pending',?)",
        [id, cls.id, m.user_id, todayStr()])
      await conn.execute(
        `INSERT INTO daily_tasks (user_id, task_date, title, description, type, source, class_id, teacher_task_id, estimated_minutes, weight)
         VALUES (?,?,?,?, 'study', 'class', ?, ?, 30, 20)`,
        [m.user_id, todayStr(), title, description ? `班级任务：${description}` : '班级任务', cls.id, id])
    }
  })

  return ok(res, {
    task: { id, classId: cls.id, title, description, createdAt: todayStr(), deadline, status: 'active' },
    assignedCount: members.length
  })
}))

router.get('/classes/:classId/tasks/:taskId', wrap(async (req, res) => {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return
  const task = await one('SELECT * FROM tasks WHERE id = ? AND class_id = ?', [req.params.taskId, cls.id])
  if (!task) return fail(res, 404, '任务不存在')
  return ok(res, await taskDetailPayload(task))
}))

async function taskDetailPayload(task) {
  const rows = await query('SELECT * FROM student_tasks WHERE task_id = ?', [task.id])
  const ended = effectiveStatus(task) === 'ended'
  let completed = 0, pending = 0, endedPending = 0
  for (const r of rows) {
    if (r.status === 'completed') completed++
    else { pending++; if (ended) endedPending++ }
  }
  return {
    task: { id: task.id, classId: task.class_id, title: task.title, description: task.description, createdAt: task.created_at, deadline: task.deadline, status: effectiveStatus(task) },
    progress: { total: rows.length, completed, pending, pendingActive: Math.max(pending - endedPending, 0), ended: endedPending }
  }
}

router.get('/classes/:classId/tasks/:taskId/progress', wrap(async (req, res) => {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return
  const task = await one('SELECT * FROM tasks WHERE id = ? AND class_id = ?', [req.params.taskId, cls.id])
  if (!task) return fail(res, 404, '任务不存在')
  const rows = await query(
    `SELECT st.*, u.nickname FROM student_tasks st LEFT JOIN users u ON u.account = st.user_id
     WHERE st.task_id = ? ORDER BY st.status DESC, st.user_id`, [task.id])
  const ended = effectiveStatus(task) === 'ended'
  let completed = 0, pending = 0, endedPending = 0
  const members = rows.map((r) => {
    if (r.status === 'completed') completed++
    else { pending++; if (ended) endedPending++ }
    return { userId: r.user_id, nickname: r.nickname || ('用户' + r.user_id), status: r.status, completedAt: r.completed_at }
  })
  return ok(res, {
    task: { id: task.id, classId: task.class_id, title: task.title, deadline: task.deadline, status: effectiveStatus(task) },
    stats: { total: rows.length, completed, pending, pendingActive: Math.max(pending - endedPending, 0), ended: endedPending },
    members
  })
}))

/* ---------------- 学生详情 / 学生分析 ---------------- */
async function studentContext(req, res) {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return null
  const studentId = req.params.studentId
  const user = await one('SELECT * FROM users WHERE account = ?', [studentId])
  if (!user) { fail(res, 404, '学生不存在'); return null }
  const isMember = await one("SELECT id FROM class_memberships WHERE user_id=? AND class_id=? AND role='MEMBER' AND status='ACTIVE'", [studentId, cls.id])
  if (!isMember) {
    const isAdminHere = await one("SELECT id FROM class_memberships WHERE user_id=? AND class_id=? AND role='ADMIN' AND status='ACTIVE'", [studentId, cls.id])
    fail(res, 404, isAdminHere ? '该成员没有学生身份或暂无学生任务数据' : '该学生不在此班级')
    return null
  }
  const joined = await one("SELECT joined_at FROM class_memberships WHERE user_id=? AND class_id=? AND role='MEMBER' AND status='ACTIVE'", [studentId, cls.id])
  return { cls, user, joinedAt: joined ? joined.joined_at : '' }
}

router.get('/classes/:classId/students/:studentId', wrap(async (req, res) => {
  const ctx = await studentContext(req, res)
  if (!ctx) return
  return ok(res, {
    student: { userId: ctx.user.account, nickname: ctx.user.nickname || ('用户' + ctx.user.account), role: 'MEMBER', joinedAt: ctx.joinedAt },
    classInfo: { id: ctx.cls.id, name: ctx.cls.name }
  })
}))

router.get('/classes/:classId/students/:studentId/analytics', wrap(async (req, res) => {
  const ctx = await studentContext(req, res)
  if (!ctx) return
  const studentId = ctx.user.account
  const tasks = await query('SELECT * FROM tasks WHERE class_id = ?', [ctx.cls.id])
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const own = await query('SELECT * FROM student_tasks WHERE class_id = ? AND user_id = ?', [ctx.cls.id, studentId])

  let completed = 0, activePending = 0, endedPending = 0, lastCompletedAt = null
  const rows = []
  for (const st of own) {
    const task = taskMap.get(st.task_id)
    if (!task) continue
    const status = effectiveStatus(task)
    if (st.status === 'completed') {
      completed++
      if (st.completed_at && (!lastCompletedAt || st.completed_at > lastCompletedAt)) lastCompletedAt = st.completed_at
    } else if (status === 'ended') endedPending++
    else activePending++
    rows.push({ taskId: st.task_id, title: task.title, deadline: task.deadline, taskStatus: status, status: st.status, completedAt: st.completed_at })
  }
  const total = own.length
  return ok(res, {
    stats: { total, completed, activePending, endedPending, rate: total > 0 ? round1(completed / total) : 0 },
    tasks: rows,
    lastCompletedAt
  })
}))

/* ---------------- 班级学习数据 ---------------- */
router.get('/classes/:classId/analytics', wrap(async (req, res) => {
  const cls = await requireClassAdmin(req, res, req.params.classId)
  if (!cls) return
  const memberIds = (await query("SELECT DISTINCT user_id FROM class_memberships WHERE class_id=? AND role='MEMBER' AND status='ACTIVE'", [cls.id])).map((r) => r.user_id)
  const perUser = new Map(memberIds.map((id) => [id, { total: 0, completed: 0, activePending: 0, endedPending: 0, lastCompletedAt: null }]))

  const tasks = await query('SELECT * FROM tasks WHERE class_id = ?', [cls.id])
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const rows = await query('SELECT * FROM student_tasks WHERE class_id = ?', [cls.id])

  const taskSummary = new Map(tasks.map((t) => [t.id, {
    taskId: t.id, title: t.title, deadline: t.deadline, status: effectiveStatus(t),
    total: 0, completed: 0, pending: 0, endedPending: 0, completionRate: null
  }]))

  let totalStudentTasks = 0, completedStudentTasks = 0, activePending = 0, endedPendingTotal = 0
  for (const st of rows) {
    const task = taskMap.get(st.task_id)
    if (!task) continue
    const sum = taskSummary.get(st.task_id)
    totalStudentTasks++
    sum.total++
    if (st.status === 'completed') { completedStudentTasks++; sum.completed++ }
    else {
      sum.pending++
      if (effectiveStatus(task) === 'ended') { endedPendingTotal++; sum.endedPending++ }
      else activePending++
    }
    const u = perUser.get(st.user_id)
    if (!u) continue
    u.total++
    if (st.status === 'completed') {
      u.completed++
      if (st.completed_at && (!u.lastCompletedAt || st.completed_at > u.lastCompletedAt)) u.lastCompletedAt = st.completed_at
    } else if (effectiveStatus(task) === 'ended') u.endedPending++
    else u.activePending++
  }

  const summary = [...taskSummary.values()]
  summary.forEach((s) => { if (s.total > 0) s.completionRate = round1(s.completed / s.total) })

  let studentsWithTasks = 0, studentsCompleted = 0, studentsActivePending = 0, studentsEndedPending = 0
  const studentRanking = []
  for (const uid of memberIds) {
    const s = perUser.get(uid)
    const user = await one('SELECT nickname FROM users WHERE account = ?', [uid])
    if (s.total > 0) studentsWithTasks++
    if (s.completed > 0) studentsCompleted++
    if (s.activePending > 0) studentsActivePending++
    if (s.endedPending > 0) studentsEndedPending++
    studentRanking.push({
      userId: uid, nickname: (user && user.nickname) || ('用户' + uid),
      total: s.total, completed: s.completed, activePending: s.activePending, endedPending: s.endedPending,
      rate: s.total === 0 ? null : round1(s.completed / s.total), lastCompletedAt: s.lastCompletedAt
    })
  }
  studentRanking.sort((a, b) => {
    if (a.rate === null && b.rate !== null) return 1
    if (b.rate === null && a.rate !== null) return -1
    if (a.rate !== b.rate) return (b.rate || 0) - (a.rate || 0)
    if (b.completed !== a.completed) return b.completed - a.completed
    return a.userId < b.userId ? -1 : 1
  })

  return ok(res, {
    classId: cls.id,
    classInfo: { id: cls.id, name: cls.name },
    totalStudents: memberIds.length,
    totalTasks: tasks.length,
    totalStudentTasks,
    completedStudentTasks,
    activePendingStudentTasks: activePending,
    endedPendingStudentTasks: endedPendingTotal,
    completionRate: totalStudentTasks === 0 ? null : round1(completedStudentTasks / totalStudentTasks),
    studentsWithTasks, studentsCompleted, studentsActivePending, studentsEndedPending,
    studentRanking,
    taskSummary: summary
  })
}))

/* ---------------- 教师工作台各模块（通用记录表） ---------------- */
const RECORD_TYPES = ['memos', 'activities', 'conversations', 'courseware', 'schedule', 'grades', 'studentMeta']
const TYPE_ALIAS = { exams: 'grades', 'student-profiles': 'studentMeta' }

function resolveType(param) {
  const t = TYPE_ALIAS[param] || param
  return RECORD_TYPES.includes(t) ? t : null
}

router.get('/:type(memos|activities|conversations|courseware|schedule|exams|grades|student-profiles|studentMeta)', wrap(async (req, res) => {
  const type = resolveType(req.params.type)
  const rows = await query('SELECT * FROM teacher_records WHERE user_id = ? AND type = ? ORDER BY created_at DESC', [req.user.account, type])
  const items = rows.map((r) => ({ ...(typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload), id: r.id, createdAt: r.created_at, updatedAt: r.updated_at }))
  return ok(res, type === 'schedule' ? { lessons: items, items } : { items, records: items })
}))

router.post('/:type(memos|activities|conversations|courseware|schedule|exams|grades|student-profiles|studentMeta)', wrap(async (req, res) => {
  const type = resolveType(req.params.type)
  const id = 'tw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
  const payload = { ...req.body }
  delete payload.id
  await query('INSERT INTO teacher_records (id, user_id, type, payload) VALUES (?,?,?,?)', [id, req.user.account, type, JSON.stringify(payload)])
  return ok(res, { ...payload, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
}))

router.patch('/:type(memos|activities|conversations|courseware|schedule|exams|grades|student-profiles|studentMeta)/:id', wrap(async (req, res) => {
  const type = resolveType(req.params.type)
  const row = await one('SELECT * FROM teacher_records WHERE id = ? AND user_id = ? AND type = ?', [req.params.id, req.user.account, type])
  if (!row) return fail(res, 404, '记录不存在')
  const base = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
  const payload = { ...base, ...req.body }
  delete payload.id
  await query('UPDATE teacher_records SET payload = ? WHERE id = ?', [JSON.stringify(payload), row.id])
  return ok(res, { ...payload, id: row.id, createdAt: row.created_at, updatedAt: new Date().toISOString() })
}))

router.delete('/:type(memos|activities|conversations|courseware|schedule|exams|grades|student-profiles|studentMeta)/:id', wrap(async (req, res) => {
  const type = resolveType(req.params.type)
  await query('DELETE FROM teacher_records WHERE id = ? AND user_id = ? AND type = ?', [req.params.id, req.user.account, type])
  return ok(res, { id: req.params.id, deleted: true })
}))

module.exports = router
