'use strict'
const express = require('express')
const { query, one } = require('../db')
const { ok, fail, wrap, throwIf } = require('../http')
const { requireAuth } = require('../auth')

const router = express.Router()
router.use(requireAuth)

// 家长-孩子绑定（家长端只读演示数据 + 绑定/提醒写入）
async function childrenOf(parentId) {
  const rows = await query('SELECT * FROM parent_children WHERE parent_id = ? ORDER BY is_primary DESC, id', [parentId])
  return rows.map((c) => ({
    id: 'child-' + String(c.id).padStart(3, '0'),
    name: c.child_name, shortName: c.short_name, grade: c.grade,
    className: c.class_name, studentNo: c.student_no, relation: c.relation, isPrimary: !!c.is_primary
  }))
}

function homeData(children, childId) {
  const child = children.find((c) => c.id === childId) || children[0] || null
  return {
    child,
    children,
    stats: { studyHours: 4.5, studyDelta: '+0.8h', newWrong: 12, wrongDelta: '较上周 -3', masteredWrong: 8, masteryRate: 67 },
    weeklyReport: {
      weekLabel: '第 8 周学习周报', masteryDelta: '+3.2%', reviewProgress: '复习完成 9/10',
      syncText: '已自动同步至家长端 · 支持月报与趋势', chart: [22, 30, 26, 42, 38, 56, 52, 72]
    },
    wrongDistribution: [
      { subject: '数学', count: 54, percent: 45 },
      { subject: '物理', count: 36, percent: 30 },
      { subject: '英语', count: 30, percent: 25 }
    ],
    advice: {
      title: 'AI 陪伴建议', focus: '二次函数图象平移',
      text: '孩子当前薄弱点为二次函数图象平移，近两周 3 次复习均未达标。建议本周末陪同完成 1 次变式训练（约 25 分钟），并给予正向鼓励。'
    },
    reminder: null
  }
}

router.get('/children', wrap(async (req, res) => ok(res, { children: await childrenOf(req.user.account) })))

router.get('/home', wrap(async (req, res) => {
  const children = await childrenOf(req.user.account)
  return ok(res, homeData(children, req.query.childId))
}))

router.get('/reports/weekly', wrap(async (req, res) => {
  const children = await childrenOf(req.user.account)
  const home = homeData(children, req.query.childId)
  return ok(res, {
    child: home.child,
    week: { label: '第 8 周', dateRange: '10.19 - 10.25' },
    stats: { studyHours: 4.5, studyDelta: '+0.8h', targetRate: 90, homeworkRate: 92, knowledgeDelta: '+3.2%', wrongCount: 8, averageDaily: 45, streakDays: 6 },
    chart: [22, 30, 26, 42, 38, 56, 52, 72],
    subjects: [
      { name: '数学', score: 78, classAverage: 74 },
      { name: '物理', score: 82, classAverage: 77 },
      { name: '英语', score: 86, classAverage: 80 }
    ],
    knowledge: [
      { name: '二次函数图象平移', before: 61, after: 73, detail: '复习 3 次', change: '+12%', positive: true },
      { name: '圆的切线判定', before: 68, after: 64, detail: '步骤遗漏', change: '-4%', positive: false }
    ],
    advice: home.advice,
    reminder: home.reminder
  })
}))

router.get('/children/:childId/dashboard', wrap(async (req, res) => {
  const children = await childrenOf(req.user.account)
  const child = children.find((c) => c.id === req.params.childId) || children[0] || null
  return ok(res, {
    child,
    progress: { completed: 18, total: 22, percent: 82, dailyHours: 1.6, streakDays: 46, pendingWrong: 27 },
    grades: { labels: ['月考一', '期中', '月考二', '一模', '月考三'], values: [84, 87, 86, 89, 91], latest: 91, latestName: '第二次月考', delta: '+3' },
    wrong: {
      total: 120, mastered: 89,
      items: [
        { subject: '数学', count: 54, percent: 45 },
        { subject: '物理', count: 36, percent: 30 },
        { subject: '英语', count: 30, percent: 25 }
      ]
    },
    school: {
      tags: [{ label: '出勤 100%', tone: 'neutral' }, { label: '作业按时率 96%', tone: 'positive' }, { label: '课堂表现 优', tone: 'neutral' }],
      comment: '李老师：本周课堂专注度提升明显，二次函数专题还需加强，建议周末完成 1 次变式训练。'
    }
  })
}))

router.get('/profile', wrap(async (req, res) => {
  const u = await one('SELECT * FROM users WHERE account = ?', [req.user.account])
  return ok(res, {
    parent: { name: u.nickname, relation: '妈妈', school: '明德中学家长', membership: '成长陪伴会员至 2027.03' },
    children: await childrenOf(req.user.account),
    sections: [
      {
        title: '孩子与成长',
        items: [
          { key: 'archive', icon: '▱', label: '成长档案', detail: '46 天记录 · 12 张证书' },
          { key: 'classroom', icon: '▤', label: '家长课堂', detail: '本周 3 节新课程' },
          { key: 'notice', icon: '♧', label: '消息通知', detail: '周报已更新 · 2 条未读' },
          { key: 'settings', icon: '◉', label: '设置', detail: '周报推送 · 隐私' }
        ]
      },
      {
        title: '服务与支持',
        items: [
          { key: 'help', icon: '?', label: '帮助与反馈', detail: '常见问题 · 联系客服' },
          { key: 'orders', icon: '▤', label: '会员与订单', detail: '会员剩余 156 天' }
        ]
      }
    ],
    recommendation: { title: '初三冲刺期，如何帮孩子稳住心态', meta: '李明 · 家庭教育指导师 · 28 分钟 · 1.2 万人学过' }
  })
}))

router.post('/reminders', wrap(async (req, res) => {
  const { childId, text } = req.body || {}
  throwIf(!text, 400, '请填写提醒内容')
  return ok(res, { id: 'reminder-' + Date.now(), childId: childId || null, text, createdAt: Date.now() })
}))

router.post('/children/bind', wrap(async (req, res) => {
  const code = String((req.body && req.body.code) || '').trim()
  throwIf(!code, 400, '请输入孩子的邀请码')
  // 演示绑定码：20240408 / linhe  → 绑定「林小禾」，与 mock 保持一致
  if (code === '20240408' || code.toLowerCase() === 'linhe') {
    let child = await one('SELECT * FROM parent_children WHERE parent_id = ? AND student_no = ?', [req.user.account, code])
    if (!child) {
      await query(
        'INSERT INTO parent_children (parent_id, child_name, short_name, grade, class_name, student_no, relation, is_primary) VALUES (?,?,?,?,?,?,?,0)',
        [req.user.account, '林小禾', '禾', '初二', '初二(4)班', code, '妹妹'])
    }
    const children = await childrenOf(req.user.account)
    return ok(res, { child: children.find((c) => c.studentNo === code) || children[0], children })
  }
  return fail(res, 404, '未找到匹配的孩子，请核对邀请码')
}))

module.exports = router
