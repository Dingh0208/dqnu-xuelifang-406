// ============================================================
// P4-FIX E2E 测试：Task 生命周期 / deadline 校验 / 权限码 / 学生端回归
//
// 覆盖需求 Case 1-12（纯数据层；页面文案/跳转行为以代码审计佐证）：
//   1-3 有效状态（active+未到 / active+已过 / ended）
//   4-6 StudentTask 三态（completed / pending+active / pending+ended）
//   7   非法 deadline 创建失败（400）
//   8-10 401 / 403 / 404 契约
//   11  ADMIN 正常创建
//   12  学生端既有完成回写不受影响
//
// 运行：node test-p4-fix.js
// ============================================================

var fs = require('fs')
var path = require('path')
var ROOT = __dirname

var uni = {
	getStorageSync: function (k) { return storage[k] },
	setStorageSync: function (k, v) { storage[k] = v }
}
var storage = {}

// ---------- 函数作用域模块加载（与 test-p3-2 同套路） ----------
function loadModule(relPath, deps) {
	var src = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
	var exported = [], re = /export (?:function|const|var|let) (\w+)/g, m
	while ((m = re.exec(src)) !== null) exported.push(m[1])
	var importMap = {}, importRe = /import \{([^}]+)\} from '([^']+)'/g, im
	while ((im = importRe.exec(src)) !== null) importMap[im[2]] = im[1]
	src = src.replace(/import \{[^}]+\} from '[^']+'/g, '')
	src = src.replace(/export function (\w+)/g, 'var $1 = function $1')
	src = src.replace(/export (const|var|let) (\w+)/g, '$1 $2')
	var keys = Object.keys(deps)
	var paramNames = keys.map(function (_, i) { return 'd' + i })
	var head = ''
	keys.forEach(function (k, i) { head += 'var {' + importMap[k] + '} = d' + i + ';\n' })
	var fn = new Function('uni', ...paramNames, head + src + ';\nreturn {' + exported.join(',') + '};')
	return fn(uni, ...keys.map(function (k) { return deps[k] }))
}

var pass = 0, fail = 0
function check(cond, msg) {
	if (cond) { pass++; console.log('  PASS  ' + msg) }
	else { fail++; console.log('  FAIL  ' + msg) }
}
function eq(a, b, msg) { check(a === b, msg + '（实际=' + JSON.stringify(a) + '）') }

// ---------- 依赖链 ----------
var studentTask = loadModule('mock/studentTask.js', {})
var reward = loadModule('utils/reward.js', {})
var taskState = loadModule('utils/taskState.js', {})
var lifecycle = loadModule('utils/taskLifecycle.js', {})
var auth = loadModule('mock/auth.js', {})
var classMod = loadModule('mock/class.js', { './auth.js': auth })
var home = loadModule('mock/home.js', {
	'@/utils/reward.js': reward,
	'@/utils/taskState.js': taskState,
	'@/mock/studentTask.js': studentTask,
	'@/mock/class.js': classMod
})
var teacherTask = loadModule('mock/teacher/task.js', {
	'../class.js': classMod,
	'../home.js': home,
	'../studentTask.js': studentTask,
	'../auth.js': auth,
	'../../utils/taskLifecycle.js': lifecycle
})
var analytics = loadModule('mock/teacher/analytics.js', {
	'../class.js': classMod,
	'../auth.js': auth,
	'../studentTask.js': studentTask,
	'./task.js': teacherTask
})

var teacher01 = { userId: 'teacher01', nickname: '王老师' }
var student01 = { userId: 'student01', nickname: '小明同学' }

function offsetDate(days) {
	var d = new Date()
	d.setDate(d.getDate() + days)
	function p(n) { return n < 10 ? '0' + n : '' + n }
	return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

// ========== Case 1-3：helper 有效状态（注入 today 保证确定性） ==========
console.log('Case 1-3：Task 有效状态 = status + deadline（不新增状态值）')
var T = '2026-10-08'
eq(lifecycle.getEffectiveTaskStatus({ status: 'active', deadline: '2026-10-20' }, T), 'active', 'Case1 active + deadline 未到 → active')
eq(lifecycle.getEffectiveTaskStatus({ status: 'active', deadline: '2026-10-07' }, T), 'ended', 'Case2 active + deadline 已过 → ended')
eq(lifecycle.getEffectiveTaskStatus({ status: 'active', deadline: '2026-10-08' }, T), 'active', '边界：deadline 当天仍 active')
eq(lifecycle.getEffectiveTaskStatus({ status: 'ended', deadline: '2026-10-20' }, T), 'ended', 'Case3 status=ended（即使 deadline 未到）→ ended')
eq(lifecycle.getEffectiveTaskStatus({ status: 'active', deadline: '' }, T), 'active', '无 deadline 不误判 ended')

// ========== Case 4-6：StudentTask 三态（真实建班/建任务/完成回写） ==========
console.log('Case 4-6：StudentTask 三态语义')
var cls = classMod.createClass({ name: 'P4FIX班', joinSelf: true }, { userId: 'student01', nickname: '小明同学' })
eq(cls.code, 200, '学生 ADMIN+MEMBER 双身份建班成功')
var cid = cls.data.classId

var r1 = teacherTask.createTask({ classId: cid, title: '未来截止的任务', deadline: offsetDate(3) }, student01)
eq(r1.code, 200, 'Case5 建任务（未来 deadline）成功')
var id1 = r1.data.task.id
var p1 = teacherTask.getTaskProgress(cid, id1, student01)
eq(p1.data.task.status, 'active', 'Case5 任务有效状态 active')
eq(p1.data.stats.pending, 1, 'Case5 1 名学生未完成')
eq(p1.data.stats.ended, 0, 'Case5 进行中任务 ended=0')

// 学生端完成回写（唯一既有通道）→ 教师侧实时反映
studentTask.completeStudentTask(id1, 'student01')
var p1b = teacherTask.getTaskProgress(cid, id1, student01)
eq(p1b.data.stats.completed, 1, 'Case4 完成回写后 completed=1')
eq(p1b.data.stats.ended, 0, 'Case4 已完成不计入 ended')
var mem1 = p1b.data.members[0]
eq(mem1.status, 'completed', 'Case4 数据层 StudentTask.status=completed（页面文案：已完成）')

var r2 = teacherTask.createTask({ classId: cid, title: '昨天截止的任务', deadline: offsetDate(-1) }, student01)
eq(r2.code, 200, 'Case6 建任务（过去 deadline）成功入库，存储状态仍为 active')
eq(r2.data.task.status, 'active', 'Case6 存储模型不被改写（仍 active，由有效状态派生 ended）')
var id2 = r2.data.task.id
var p2 = teacherTask.getTaskProgress(cid, id2, student01)
eq(p2.data.task.status, 'ended', 'Case6 接口有效状态 ended（deadline 已过）')
eq(p2.data.stats.pending, 1, 'Case6 pending=1')
eq(p2.data.stats.ended, 1, 'Case6 ended=1（未完成且任务已结束）')
var mem2 = p2.data.members[0]
eq(mem2.status, 'pending', 'Case6 数据层 StudentTask.status=pending（页面文案：已过期）')

// 班级分析口径同步
var a = analytics.getClassAnalytics(cid, student01)
eq(a.data.completedStudentTasks, 1, '分析：班级完成任务=1')
eq(a.data.endedPendingStudentTasks, 1, '分析：逾期未完成=1')
eq(a.data.taskSummary.length, 2, '分析：任务汇总=2，且状态由 getClassTasks 归一化')

// ========== Case 7：deadline 校验 ==========
console.log('Case 7：deadline 严格 YYYY-MM-DD')
;['abc', '明天', '2026', '2026/10/10', '10-10', '20261010', '2026-13-01', '2026-02-31', '2026-1-1'].forEach(function (bad) {
	var r = teacherTask.createTask({ classId: 'class-001', title: '非法日期任务', deadline: bad }, teacher01)
	eq(r.code, 400, '非法 deadline「' + bad + '」→ 400')
})
var okDate = teacherTask.createTask({ classId: 'class-001', title: '合法日期任务', deadline: '2026-10-10' }, teacher01)
eq(okDate.code, 200, '合法 2026-10-10 → 200')
eq(okDate.data.task.deadline, '2026-10-10', '入库 deadline 原样保留')
var emptyDate = teacherTask.createTask({ classId: 'class-001', title: '空日期任务', deadline: '' }, teacher01)
eq(emptyDate.code, 200, '空 deadline → 沿用既有语义 200')
eq(emptyDate.data.task.deadline, lifecycle.todayStr(), '空 deadline 默认当天')
eq(lifecycle.isValidDeadline(' 2026-10-10 '), true, 'helper 容忍首尾空格（页面/Mock 均 trim）')

// ========== Case 8-10：401 / 403 / 404 / 400 契约 ==========
console.log('Case 8-10：权限与错误码契约')
eq(teacherTask.createTask({ classId: 'class-001', title: 'x' }, null).code, 401, 'Case8 未登录创建 → 401（页面：logout+reLaunch）')
eq(teacherTask.getTaskProgress('class-001', 't-3001', null).code, 401, 'Case8 未登录查进度 → 401')
eq(teacherTask.getClassTasks('class-001', student01).code, 403, 'Case9 student01 对 class-001 非 ADMIN → 403（不退出登录）')
eq(teacherTask.getClassTasks('class-404', teacher01).code, 404, 'Case10 班级不存在 → 404')
var d404 = teacherTask.getTaskDetail('class-001', 't-not-exist', teacher01)
eq(d404.code, 404, 'Case10 任务不存在 → 404')
var t400 = teacherTask.createTask({ classId: 'class-001', title: '  ' }, teacher01)
eq(t400.code, 400, '空标题 → 400 业务错误')

// ========== Case 11：ADMIN 正常创建（种子班） ==========
console.log('Case 11：ADMIN 正常任务链路')
var good = teacherTask.createTask({ classId: 'class-001', title: 'P4FIX 正常任务', deadline: offsetDate(5) }, teacher01)
eq(good.code, 200, 'teacher01（class-001 ADMIN）创建成功')
eq(good.data.assignedCount, 1, 'StudentTask 扇出=1（class-001 仅 student01 一名 ACTIVE MEMBER）')
var list = teacherTask.getClassTasks('class-001', teacher01)
var found = null
for (var i = 0; i < list.data.tasks.length; i++) if (list.data.tasks[i].id === good.data.task.id) found = list.data.tasks[i]
check(!!found, '新任务出现在任务列表')
eq(found && found.status, 'active', '新任务有效状态 active')

// ========== 种子状态稳定性（旧基线口径不被破坏） ==========
console.log('种子稳定性：t-3001 仍 active / t-3002 仍 ended，且只有 active|ended 两种状态')
var seedMap = {}
list.data.tasks.forEach(function (t) { seedMap[t.id] = t.status })
eq(seedMap['t-3001'], 'active', 't-3001（deadline+3）active')
eq(seedMap['t-3002'], 'ended', 't-3002（status ended, deadline-1）ended')
list.data.tasks.forEach(function (t) {
	check(t.status === 'active' || t.status === 'ended', '任务 ' + t.id + ' 状态仍只有 active/ended')
})

// ========== Case 12：学生端既有功能回归 ==========
console.log('Case 12：学生端完成/取消完成回写链路不受影响')
studentTask.uncompleteStudentTask(id1, 'student01')
var p1c = teacherTask.getTaskProgress(cid, id1, student01)
eq(p1c.data.stats.completed, 0, '取消完成后 completed 回到 0')
eq(p1c.data.stats.pending, 1, '取消完成后 pending 回到 1')
// 学生今日任务通道仍通过 addClassTask 同步，受众由 StudentTask 决定
check(typeof home.fetchHomeToday === 'function', 'mock/home.js fetchHomeToday 接口保持不变')

console.log('\n测试结果：PASS ' + pass + ' / FAIL ' + fail)
if (fail > 0) process.exit(1)
