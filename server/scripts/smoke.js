'use strict'
/**
 * 接口自检：把前端 api/ 层用到的每个接口跑一遍，校验 code/字段。
 * 用法：node scripts/smoke.js  （需后端已在 3100 运行）
 */
const BASE = process.env.BASE || 'http://127.0.0.1:3100'

let pass = 0
let fail = 0
const failures = []

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  let json = null
  const text = await res.text()
  try { json = JSON.parse(text) } catch (e) { json = { raw: text } }
  return { status: res.status, json }
}

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; failures.push(`${name} :: ${detail}`); console.log(`  ✗ ${name}  ${detail ? '— ' + detail : ''}`) }
}

async function login(account, password) {
  const r = await call('POST', '/api/auth/login', { body: { account, password } })
  return r.json && r.json.data ? r.json.data.token : null
}

async function main() {
  console.log('\n== 健康检查 ==')
  let r = await call('GET', '/api/health')
  check('GET /api/health', r.json.code === 200 && r.json.data.mysql, JSON.stringify(r.json).slice(0, 160))

  console.log('\n== 认证 ==')
  const stu = await login('student01', '123456')
  check('POST /api/auth/login (student01)', !!stu)
  const bad = await call('POST', '/api/auth/login', { body: { account: 'student01', password: 'wrong' } })
  check('登录密码错误 → 401', bad.json.code === 401, bad.json.code)
  r = await call('GET', '/api/student/home/today')
  check('未带 token → 401', r.status === 401, r.status)

  console.log('\n== 学生端 ==')
  r = await call('GET', '/api/student/home/today', { token: stu })
  check('GET /api/student/home/today', r.json.code === 200 && Array.isArray(r.json.data.tasks) && r.json.data.tasks.length === 6,
    `tasks=${r.json.data && r.json.data.tasks && r.json.data.tasks.length}`)
  const taskId = r.json.data.tasks.find((t) => !t.completed).id
  r = await call('PATCH', `/api/student/home/today/tasks/${taskId}`, { token: stu, body: { completed: true } })
  check('PATCH 今日任务完成', r.json.code === 200 && r.json.data.completed === true)
  r = await call('GET', '/api/student/rewards/today', { token: stu })
  check('GET /api/student/rewards/today', r.json.code === 200 && typeof r.json.data.todayRewardCoins === 'number')
  r = await call('GET', '/api/student/home/welcome', { token: stu })
  check('GET /api/student/home/welcome', r.json.code === 200 && r.json.data.greeting)
  r = await call('GET', '/api/student/home/schedule', { token: stu })
  check('GET /api/student/home/schedule', r.json.data.schedule.length === 3)
  r = await call('GET', '/api/student/home/reviews', { token: stu })
  check('GET /api/student/home/reviews', r.json.data.reviews.length === 3)
  r = await call('GET', '/api/student/home/today/study-duration', { token: stu })
  check('GET study-duration', typeof r.json.data.studyDurationMinutes === 'number')

  r = await call('GET', '/api/student/assets', { token: stu })
  check('GET /api/student/assets', r.json.data.coins === 126 && r.json.data.silverCoins === 20, JSON.stringify(r.json.data))
  r = await call('GET', '/api/student/profile', { token: stu })
  check('GET /api/student/profile', r.json.data.nickname === '小明同学')
  r = await call('GET', '/api/student/assets/incomplete-streak', { token: stu })
  check('GET incomplete-streak', r.json.data.consecutiveIncompleteDays === 0)
  r = await call('GET', '/api/student/me', { token: stu })
  check('GET /api/student/me', r.json.data.profile && r.json.data.assets && r.json.data.membership)

  r = await call('GET', '/api/student/coins/learning', { token: stu })
  check('GET coins/learning', r.json.data.balance === 126 && Array.isArray(r.json.data.records))
  r = await call('GET', '/api/student/coins/learning/records?page=1&pageSize=2', { token: stu })
  check('GET coins/learning/records 分页', r.json.data.records.length === 2 && r.json.data.total === 5, JSON.stringify(r.json.data.total))

  r = await call('GET', '/api/student/mall/silver/products', { token: stu })
  check('GET mall/silver/products', r.json.data.products.length === 4)
  r = await call('GET', '/api/student/mall/coin/products', { token: stu })
  check('GET mall/coin/products', r.json.data.products.length === 4)
  r = await call('POST', '/api/student/mall/coin/redeem', { token: stu, body: { productId: 'coin_report_once' } })
  check('POST mall/coin/redeem 扣金币', r.json.code === 200 && r.json.data.balance === 106, JSON.stringify(r.json.data))
  r = await call('GET', '/api/student/assets', { token: stu })
  check('兑换后余额落库', r.json.data.coins === 106, r.json.data.coins)
  r = await call('POST', '/api/student/mall/coin/redeem', { token: stu, body: { productId: 'coin_focus_skin' } })
  check('金币兑换 80 档', r.json.code === 200 && r.json.data.balance === 26, JSON.stringify(r.json.data))
  r = await call('POST', '/api/student/mall/coin/redeem', { token: stu, body: { productId: 'coin_focus_skin' } })
  check('金币不足 → 400', r.json.code === 400, r.json.code)

  r = await call('POST', '/api/student/mall/orders', { token: stu, body: { productId: 'silver_50' } })
  check('POST mall/orders 创建订单', r.json.code === 200 && r.json.data.orderId && r.json.data.amount === 19.9)
  r = await call('GET', '/api/student/membership', { token: stu })
  check('GET membership', r.json.data.price === null)

  r = await call('GET', '/api/student/faq', { token: stu })
  check('GET /api/student/faq', r.json.data.categories.length >= 5)

  r = await call('GET', '/api/student/wrongbook', { token: stu })
  check('GET wrongbook', r.json.data.list.length === 6)
  r = await call('GET', '/api/student/wrongbook/statistics', { token: stu })
  check('GET wrongbook/statistics', r.json.data.total === 6 && r.json.data.reviewCount === 4, JSON.stringify(r.json.data))
  r = await call('GET', '/api/student/wrongbook/3001', { token: stu })
  check('GET wrongbook/:id', r.json.data.title === '极限的定义与基本性质')
  r = await call('GET', '/api/student/wrongbook/history', { token: stu })
  check('GET wrongbook/history', r.json.data.list.length === 4)
  r = await call('GET', '/api/student/wrongbook/history/h_001', { token: stu })
  check('GET wrongbook/history/:id', r.json.data.questions.length === 1)
  r = await call('PATCH', '/api/student/wrongbook/3004', { token: stu, body: { status: 'mastered', needReview: false } })
  check('PATCH wrongbook', r.json.code === 200)
  r = await call('GET', '/api/student/wrongbook/3004/analysis', { token: stu })
  check('GET wrongbook/:id/analysis', r.json.data.aiStatus === 'processing')

  r = await call('GET', '/api/student/classes', { token: stu })
  check('GET student/classes', r.json.data.joinedClasses.length === 1 && r.json.data.managedClasses.length >= 1, JSON.stringify(r.json.data).slice(0, 120))
  r = await call('GET', '/api/student/classes/class-001', { token: stu })
  check('GET student/classes/class-001', r.json.data.isMember === true && r.json.data.classInfo.name === '高一（3）班')
  r = await call('GET', '/api/student/classes/class-002', { token: stu })
  check('GET class-002 (ADMIN)', r.json.data.isAdmin === true)
  r = await call('POST', '/api/student/classes/join', { token: stu, body: { inviteCode: 'A8K29D' } })
  check('重复加入 → 409', r.json.code === 409, r.json.code)

  r = await call('GET', '/api/student/theme', { token: stu })
  check('GET theme', r.json.data.currentTheme === 'mint')
  r = await call('PATCH', '/api/student/theme', { token: stu, body: { homeTheme: 'ocean' } })
  check('PATCH theme', r.json.data.homeTheme === 'ocean')
  r = await call('GET', '/api/student/workbench/inspirations', { token: stu })
  check('GET workbench/inspirations', r.json.data.list.length === 3)
  r = await call('POST', '/api/student/workbench/create', { token: stu, body: { title: '测试工作台', mode: 'free' } })
  check('POST workbench/create', r.json.code === 200 && r.json.data.workbenchId)
  const wbId = r.json.data.workbenchId
  r = await call('POST', `/api/student/workbench/${wbId}/generate`, { token: stu })
  check('POST workbench/:id/generate', r.json.data.status === 'generated')
  r = await call('GET', `/api/student/workbench/${wbId}`, { token: stu })
  check('GET workbench/:id', r.json.data.title === '测试工作台')

  console.log('\n== 教师端 ==')
  const tea = await login('teacher01', '123456')
  check('POST /api/auth/login (teacher01)', !!tea)
  r = await call('GET', '/api/teacher/home', { token: tea })
  check('GET teacher/home', r.json.data.statistics.classCount === 1 && r.json.data.classes[0].studentCount === 5,
    JSON.stringify(r.json.data.statistics))
  r = await call('GET', '/api/teacher/classes/class-001/members', { token: tea })
  check('GET teacher/classes/members', r.json.data.members.length === 6 && r.json.data.classInfo.inviteCode === 'A8K29D',
    `${r.json.data.members.length}`)
  r = await call('GET', '/api/teacher/classes/class-001/tasks', { token: tea })
  check('GET teacher/classes/tasks', r.json.data.tasks.length === 2 && r.json.data.tasks.some((t) => t.status === 'ended'))
  r = await call('GET', '/api/teacher/classes/class-001/tasks/t-3001', { token: tea })
  check('GET task detail + progress', r.json.data.progress.total === 5 && r.json.data.progress.completed === 3, JSON.stringify(r.json.data.progress))
  r = await call('GET', '/api/teacher/classes/class-001/tasks/t-3001/progress', { token: tea })
  check('GET task progress 名单', r.json.data.members.length === 5 && r.json.data.members[0].status === 'completed')
  r = await call('GET', '/api/teacher/classes/class-001/analytics', { token: tea })
  check('GET class analytics', r.json.data.totalStudents === 5 && r.json.data.taskSummary.length === 2,
    JSON.stringify({ s: r.json.data.totalStudents }))
  r = await call('GET', '/api/teacher/classes/class-001/students/student01', { token: tea })
  check('GET student detail', r.json.data.student.nickname === '小明同学')
  r = await call('GET', '/api/teacher/classes/class-001/students/student01/analytics', { token: tea })
  check('GET student analytics', r.json.data.stats.total === 2 && r.json.data.stats.completed === 2, JSON.stringify(r.json.data.stats))
  r = await call('POST', '/api/teacher/classes/class-001/tasks', { token: tea, body: { title: '自检任务', description: 'smoke', deadline: '2030-01-01' } })
  check('POST 创建班级任务', r.json.code === 200 && r.json.data.assignedCount === 5, JSON.stringify(r.json.data.assignedCount))
  const newTask = r.json.data.task.id
  r = await call('POST', '/api/teacher/classes/class-001/tasks', { token: tea, body: { title: '', deadline: '2030-01-01' } })
  check('空标题 → 400', r.json.code === 400)
  r = await call('POST', '/api/teacher/classes/class-001/tasks', { token: tea, body: { title: 'x', deadline: '2026-13-01' } })
  check('非法日期 → 400', r.json.code === 400)
  r = await call('GET', '/api/teacher/classes/class-002/tasks', { token: tea })
  check('非本班 ADMIN → 403', r.json.code === 403, r.json.code)
  r = await call('GET', '/api/teacher/memos', { token: tea })
  check('GET teacher/memos', r.json.data.items.length >= 1)
  r = await call('POST', '/api/teacher/memos', { token: tea, body: { title: '自检备忘', category: 'TEACHING' } })
  check('POST teacher/memos', r.json.code === 200 && r.json.data.id)
  const memoId = r.json.data.id
  r = await call('PATCH', `/api/teacher/memos/${memoId}`, { token: tea, body: { title: '自检备忘-改' } })
  check('PATCH teacher/memos', r.json.data.title === '自检备忘-改')
  r = await call('DELETE', `/api/teacher/memos/${memoId}`, { token: tea })
  check('DELETE teacher/memos', r.json.data.deleted === true)
  r = await call('POST', '/api/teacher/classes', { token: tea, body: { name: '自检班级', joinSelf: true } })
  check('POST /api/teacher/classes', r.json.code === 200 && r.json.data.classId)
  const newClass = r.json.data.classId
  r = await call('GET', '/api/student/classes/' + newClass, { token: tea })
  check('新班级详情（创建者身份）', r.json.code === 200 && r.json.data.isAdmin === true)

  console.log('\n== 家长端 ==')
  const par = await login('parent01', '123456')
  r = await call('GET', '/api/parent/home', { token: par })
  check('GET parent/home', r.json.data.children.length === 2 && r.json.data.child.name === '林小满')
  r = await call('GET', '/api/parent/reports/weekly?childId=child-001', { token: par })
  check('GET parent/reports/weekly', r.json.data.subjects.length === 3)
  r = await call('GET', '/api/parent/children', { token: par })
  check('GET parent/children', r.json.data.children.length === 2)
  r = await call('GET', '/api/parent/children/child-002/dashboard', { token: par })
  check('GET parent child dashboard', r.json.data.grades.values.length === 5)
  r = await call('GET', '/api/parent/profile', { token: par })
  check('GET parent/profile', r.json.data.parent.name === '小明家长')
  r = await call('POST', '/api/parent/reminders', { token: par, body: { text: '周六 15:00 复习' } })
  check('POST parent/reminders', r.json.code === 200)
  r = await call('POST', '/api/parent/children/bind', { token: par, body: { code: '20240408' } })
  check('POST parent/children/bind', r.json.code === 200)

  console.log('\n== 后台管理 ==')
  const adm = await login('admin', 'admin123')
  check('管理员登录', !!adm)
  r = await call('POST', '/api/admin/login', { body: { account: 'admin', password: 'admin123' } })
  check('POST /api/admin/login', r.json.code === 200 && r.json.data.token)
  const admToken = r.json.data.token
  r = await call('POST', '/api/admin/login', { body: { account: 'student01', password: '123456' } })
  check('非管理员 → 403', r.json.code === 403, r.json.code)
  r = await call('GET', '/api/admin/stats', { token: admToken })
  check('GET admin/stats', r.json.data.counts.students === 5 && r.json.data.counts.classes >= 2, JSON.stringify(r.json.data.counts))
  r = await call('GET', '/api/admin/meta', { token: admToken })
  check('GET admin/meta', r.json.data.resources.length >= 12)
  for (const res of ['users', 'classes', 'tasks', 'student_tasks', 'wrong_questions', 'coin_transactions', 'orders', 'feedback', 'faq_items']) {
    r = await call('GET', `/api/admin/list/${res}?page=1&pageSize=5`, { token: admToken })
    check(`GET admin/list/${res}`, r.json.code === 200 && Array.isArray(r.json.data.items), JSON.stringify(r.json).slice(0, 100))
  }
  r = await call('GET', '/api/admin/list/users?page=1&pageSize=5', { token: admToken })
  check('用户列表不含密码哈希', !('password_hash' in r.json.data.items[0]))
  r = await call('POST', '/api/admin/list/users', { token: admToken, body: { account: 'smoketest01', password: '123456', role: 'student', nickname: '自检学生' } })
  check('新增用户', r.json.code === 200, JSON.stringify(r.json).slice(0, 120))
  const newUserId = r.json.data.id
  r = await call('POST', '/api/auth/login', { body: { account: 'smoketest01', password: '123456' } })
  check('新用户可登录', r.json.code === 200)
  r = await call('PATCH', `/api/admin/one/users/${newUserId}`, { token: admToken, body: { nickname: '自检学生2' } })
  check('编辑用户', r.json.code === 200)
  r = await call('POST', '/api/admin/coins/adjust', { token: admToken, body: { account: 'smoketest01', delta: 50, description: '自检发放' } })
  check('手动调金币', r.json.data.balance === 50, JSON.stringify(r.json.data))
  r = await call('DELETE', `/api/admin/one/users/${newUserId}`, { token: admToken })
  check('删除用户（级联）', r.json.data.deleted === true)
  r = await call('GET', '/api/admin/list/classes?q=class-001', { token: admToken })
  check('列表搜索', r.json.data.items.length === 1)

  console.log(`\n================ 结果: ${pass} 通过 / ${fail} 失败 ================`)
  if (fail) { console.log('失败项:'); failures.forEach((f) => console.log('  - ' + f)) }
  process.exit(fail ? 1 : 0)
}

main().catch((e) => { console.error('自检异常:', e); process.exit(2) })
