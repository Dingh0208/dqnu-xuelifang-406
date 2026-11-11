// ============================================================
// P3-1 E2E 测试：教师端学生详情（纯聚合，无新模型）
//
// 覆盖：
//   1. teacher01/class-001/student01 正常 200
//   2. student01 查看他人 → 403
//   3. 不存在学生 → 404
//   4. 不存在班级 → 404
//   5. 未登录 → 401
//   6. 无 StudentTask → 200 total=0 空数据
//   7. ADMIN+MEMBER 双身份查看自己
//   8. 多班级 StudentTask 隔离
//   9. 教师创建任务后学生详情实时统计
//  10. 学生完成任务后统计联动（completed+1 / activePending-1 / 完成率重算）
//
// 运行：node test-p3-1.js
// ============================================================

var fs = require('fs')
var path = require('path')
var ROOT = __dirname

var storage = {}
var uni = {
	getStorageSync: function (k) { return storage[k] },
	setStorageSync: function (k, v) { storage[k] = v }
}

// ---------- 函数作用域加载 ES Mock 模块 ----------
function loadModule(relPath, deps) {
	var src = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
	var exported = []
	var re = /export (?:function|const|var|let) (\w+)/g
	var m
	while ((m = re.exec(src)) !== null) exported.push(m[1])
	var importMap = {}
	var importRe = /import \{([^}]+)\} from '([^']+)'/g
	var im
	while ((im = importRe.exec(src)) !== null) importMap[im[2]] = im[1]
	src = src.replace(/import \{[^}]+\} from '[^']+'/g, '')
	src = src.replace(/export function (\w+)/g, 'var $1 = function $1')
	src = src.replace(/export (const|var|let) (\w+)/g, '$1 $2')
	var depKeys = Object.keys(deps)
	var paramNames = depKeys.map(function (_, i) { return 'dep' + i })
	var destructureCode = ''
	depKeys.forEach(function (key, i) {
		if (importMap[key]) destructureCode += 'var {' + importMap[key] + '} = dep' + i + ';\n'
	})
	var fn = new Function('uni', ...paramNames, destructureCode + src + ';\nreturn {' + exported.join(',') + '};')
	return fn(uni, ...depKeys.map(function (k) { return deps[k] }))
}

// ---------- 依赖链（与 P2-4 同一套路，确保复用同一份模型） ----------
var studentTask = loadModule('mock/studentTask.js', {})
var reward = loadModule('utils/reward.js', {})
var taskState = loadModule('utils/taskState.js', {})
var taskLifecycle = loadModule('utils/taskLifecycle.js', {})
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
	'../../utils/taskLifecycle.js': taskLifecycle
})
var teacherStudent = loadModule('mock/teacher/student.js', {
	'../class.js': classMod,
	'../auth.js': auth,
	'../studentTask.js': studentTask,
	'./task.js': teacherTask
})

// ---------- 工具 ----------
var pass = 0, fail = 0
function assert(cond, msg) {
	if (cond) { pass++; console.log('  PASS  ' + msg) }
	else { fail++; console.log('  FAIL  ' + msg) }
}
function setLoginUser(account, nickname, role) {
	storage['login_user_info'] = { account: account, nickname: nickname || account, role: role || 'student' }
}
function resetAll() {
	storage = {}
	studentTask.__resetStudentTasks()
}

var TEACHER = { userId: 'teacher01', nickname: '王老师' }
var STUDENT = { userId: 'student01', nickname: '小明同学' }

console.log('\n=== P3-1 E2E 测试：教师端学生详情 ===\n')

// ------------------------------------------------------------
// 测试 1 + 6：正常返回基本信息；初始无 StudentTask 时空数据
// ------------------------------------------------------------
console.log('测试 1/6：teacher01 查看 class-001 的 student01（初始无任务）')
resetAll()
var detail = teacherStudent.getStudentDetail('class-001', 'student01', TEACHER)
assert(detail.code === 200, 'getStudentDetail 返回 200')
assert(detail.data.student.userId === 'student01', 'student.userId = student01（无 studentId 新字段）')
assert(detail.data.student.nickname === '小明同学', '昵称来自 getMockUserById：小明同学')
assert(detail.data.student.role === 'MEMBER', '学生身份 role = MEMBER')
assert(detail.data.student.joinedAt === '2026-09-02', 'joinedAt 来自 ClassMembership：2026-09-02')
assert(detail.data.classInfo.id === 'class-001' && detail.data.classInfo.name === '高一（3）班', 'classInfo 正确')
assert(!('studentId' in detail.data.student), '返回体不含 studentId 字段')

var ana0 = teacherStudent.getStudentAnalytics('class-001', 'student01', TEACHER)
assert(ana0.code === 200, 'getStudentAnalytics 返回 200（无任务也 200）')
assert(ana0.data.stats.total === 0, 'total = 0')
assert(ana0.data.stats.completed === 0, 'completed = 0')
assert(ana0.data.stats.activePending === 0, 'activePending = 0')
assert(ana0.data.stats.endedPending === 0, 'endedPending = 0')
assert(ana0.data.stats.rate === 0, 'rate = 0（页面应显示暂无任务数据，非虚假 0%）')
assert(Array.isArray(ana0.data.tasks) && ana0.data.tasks.length === 0, 'tasks = []')
assert(ana0.data.lastCompletedAt === null, 'lastCompletedAt = null')
console.log('')

// ------------------------------------------------------------
// 测试 2：MEMBER 查看他人 → 403
// ------------------------------------------------------------
console.log('测试 2：student01（非 ADMIN）查看 → 403')
resetAll()
var r403d = teacherStudent.getStudentDetail('class-001', 'student02', STUDENT)
assert(r403d.code === 403, '详情接口 403：' + r403d.message)
var r403a = teacherStudent.getStudentAnalytics('class-001', 'student02', STUDENT)
assert(r403a.code === 403, '分析接口 403')
console.log('')

// ------------------------------------------------------------
// 测试 3：不存在学生 → 404
// ------------------------------------------------------------
console.log('测试 3：teacher01 查看 student999 → 404')
resetAll()
var r404stu = teacherStudent.getStudentDetail('class-001', 'student999', TEACHER)
assert(r404stu.code === 404, '404：' + r404stu.message)
assert(r404stu.message === '学生不存在', '提示：学生不存在')
console.log('')

// ------------------------------------------------------------
// 测试 4：不存在班级 → 404
// ------------------------------------------------------------
console.log('测试 4：class-999 → 404')
resetAll()
var r404cls = teacherStudent.getStudentDetail('class-999', 'student01', TEACHER)
assert(r404cls.code === 404, '404：' + r404cls.message)
assert(r404cls.message === '班级不存在', '提示：班级不存在')
console.log('')

// ------------------------------------------------------------
// 测试 5：未登录 → 401
// ------------------------------------------------------------
console.log('测试 5：未登录 → 401')
resetAll()
var r401 = teacherStudent.getStudentDetail('class-001', 'student01', null)
assert(r401.code === 401, '401：' + r401.message)
console.log('')

// 额外：非本班学生（用户存在但无 membership）→ 404
console.log('附加：teacher01 查看非本班成员 parent01 → 404')
var rOutsider = teacherStudent.getStudentDetail('class-001', 'parent01', TEACHER)
assert(rOutsider.code === 404 && rOutsider.message === '该学生不在此班级', '404 该学生不在此班级')
console.log('')

// 额外：纯 ADMIN（class-002 的 student01 只有 ADMIN 无 MEMBER）→ 404 特殊提示
console.log('附加：class-002 中 student01 仅 ADMIN 无 MEMBER → 404 特殊提示')
var rAdminOnly = teacherStudent.getStudentDetail('class-002', 'student01', STUDENT)
assert(rAdminOnly.code === 404, '404：' + rAdminOnly.message)
assert(rAdminOnly.message === '该成员没有学生身份或暂无学生任务数据', '纯管理员提示正确')
console.log('')

// ------------------------------------------------------------
// 测试 9：教师创建任务 → 学生详情统计实时读取
// ------------------------------------------------------------
console.log('测试 9：teacher01 创建任务后，student01 分析数据更新')
resetAll()
var c1 = teacherTask.createTask(
	{ classId: 'class-001', title: '数学函数专项练习', description: '', deadline: '2026-12-20' },
	TEACHER
)
assert(c1.code === 200 && c1.data.assignedCount === 1, '创建任务并扇出 1 条 StudentTask')
var ana1 = teacherStudent.getStudentAnalytics('class-001', 'student01', TEACHER)
assert(ana1.data.stats.total === 1, 'total = 1')
assert(ana1.data.stats.completed === 0, 'completed = 0')
assert(ana1.data.stats.activePending === 1, 'activePending = 1')
assert(ana1.data.stats.endedPending === 0, 'endedPending = 0')
assert(ana1.data.stats.rate === 0, 'rate = 0')
var row0 = ana1.data.tasks[0]
assert(row0.taskId === c1.data.task.id, '明细 taskId 来自 StudentTask')
assert(row0.title === '数学函数专项练习', '明细标题来自 Task（非复制数据）')
assert(row0.deadline === '2026-12-20', '明细截止时间来自 Task')
assert(row0.taskStatus === 'active', 'taskStatus = active（Task）')
assert(row0.status === 'pending', 'status = pending（StudentTask）')
assert(row0.completedAt === null, 'completedAt = null')
console.log('')

// ------------------------------------------------------------
// 测试 10：学生完成 → completed+1 / activePending-1 / 完成率重算
// ------------------------------------------------------------
console.log('测试 10：student01 完成任务后统计联动')
setLoginUser('student01', '小明同学', 'student')
var stTasks = home.fetchTasks().data.tasks
var classTask = null
for (var i = 0; i < stTasks.length; i++) {
	if (stTasks[i].teacherTaskId === c1.data.task.id) { classTask = stTasks[i]; break }
}
assert(classTask !== null, '学生端收到该班级任务')
home.patchTask(classTask.id, true)

var ana2 = teacherStudent.getStudentAnalytics('class-001', 'student01', TEACHER)
assert(ana2.data.stats.total === 1, 'total 仍 = 1')
assert(ana2.data.stats.completed === 1, 'completed +1 → 1')
assert(ana2.data.stats.activePending === 0, 'activePending -1 → 0')
assert(ana2.data.stats.rate === 100, '完成率重算 = 100')
assert(ana2.data.tasks[0].status === 'completed', '明细 status = completed')
assert(ana2.data.tasks[0].completedAt !== null && /^\d{4}-\d{2}-\d{2}$/.test(ana2.data.tasks[0].completedAt),
	'completedAt 为 YYYY-MM-DD 日期（无时分秒）')
assert(ana2.data.lastCompletedAt === ana2.data.tasks[0].completedAt, 'lastCompletedAt 取最大完成日期')
console.log('')

// ------------------------------------------------------------
// 测试 7：ADMIN+MEMBER 双身份查看自己 + 完成率 1 位小数
// ------------------------------------------------------------
console.log('测试 7：ADMIN+MEMBER 双身份（teacher01 自建班 joinSelf）')
resetAll()
setLoginUser('teacher01', '王老师', 'teacher')
var cc = classMod.createClass({ name: '双身份班', joinSelf: true }, TEACHER)
var dualId = cc.data.classId
var dd = teacherStudent.getStudentDetail(dualId, 'teacher01', TEACHER)
assert(dd.code === 200, '双身份用户可查看自己的学生详情 200')
assert(dd.data.student.role === 'MEMBER', '学生身份按 MEMBER 展示（未被 ADMIN 去重吞掉）')

// 创建 3 个任务，完成其中 2 个 → 2/3 = 66.7%
var dualTaskIds = []
for (var t = 0; t < 3; t++) {
	var cr = teacherTask.createTask({ classId: dualId, title: '双身份任务' + (t + 1), deadline: '2026-12-30' }, TEACHER)
	dualTaskIds.push(cr.data.task.id)
}
var da0 = teacherStudent.getStudentAnalytics(dualId, 'teacher01', TEACHER)
assert(da0.data.stats.total === 3, 'total = 3（自己收到 3 条 StudentTask）')
assert(da0.data.stats.activePending === 3, '初始 activePending = 3')

// 学生端完成前 2 个
var dualStTasks = home.fetchTasks().data.tasks
function findStudentTask(tid) {
	for (var q = 0; q < dualStTasks.length; q++) {
		if (dualStTasks[q].teacherTaskId === tid) return dualStTasks[q]
	}
	return null
}
home.patchTask(findStudentTask(dualTaskIds[0]).id, true)
home.patchTask(findStudentTask(dualTaskIds[1]).id, true)
var da1 = teacherStudent.getStudentAnalytics(dualId, 'teacher01', TEACHER)
assert(da1.data.stats.completed === 2, 'completed = 2')
assert(da1.data.stats.activePending === 1, 'activePending = 1')
assert(da1.data.stats.rate === 66.7, '完成率保留 1 位小数：66.7（2/3），实际=' + da1.data.stats.rate)
console.log('')

// ------------------------------------------------------------
// 测试 8：多班级隔离
// ------------------------------------------------------------
console.log('测试 8：Class A 的 StudentTask 不出现在 Class B')
var ccB = classMod.createClass({ name: '双身份班B', joinSelf: true }, TEACHER)
var dualIdB = ccB.data.classId
// 在 B 班创建 1 个任务
teacherTask.createTask({ classId: dualIdB, title: 'B班任务', deadline: '2026-12-31' }, TEACHER)
var daA = teacherStudent.getStudentAnalytics(dualId, 'teacher01', TEACHER)
var daB = teacherStudent.getStudentAnalytics(dualIdB, 'teacher01', TEACHER)
assert(daA.data.stats.total === 3, 'A 班仍 = 3（不受 B 班影响）')
assert(daB.data.stats.total === 1, 'B 班 = 1（不含 A 班任务）')
assert(daB.data.tasks[0].title === 'B班任务', 'B 班明细仅含 B 班任务')
// class-001 的 student01 数据也不应混入教师自建班（测试 7 resetAll 后 class-001 未再建任务，应为 0）
var daOther = teacherStudent.getStudentAnalytics('class-001', 'student01', TEACHER)
assert(daOther.data.stats.total === 0, 'class-001/student01 = 0（A/B 班任务未串入其他班，且 reset 后无残留）')
console.log('')

// ------------------------------------------------------------
// 汇总
// ------------------------------------------------------------
console.log('========================================')
console.log('测试结果：PASS ' + pass + ' / FAIL ' + fail)
console.log('========================================')
if (fail > 0) process.exit(1)
