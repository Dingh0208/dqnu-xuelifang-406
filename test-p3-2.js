// ============================================================
// P3-2-1 E2E 测试：班级学习数据聚合（纯聚合，无第二套模型）
//
// 覆盖（对应用户要求 24 类场景）：
//  1 未登录 401          2 班级不存在 404      3 非 ADMIN 403
//  4 ADMIN 200           5 ADMIN-only 不计学生  6 ADMIN+MEMBER 计 1
//  7 MEMBER 去重          8 classId 隔离        9 Task 数量
// 10 ST 数量             11 completed 数量      12 active pending
// 13 ended pending       14 completionRate     15 studentsWithTasks
// 16 studentsCompleted   17 studentsActivePending  18 studentsEndedPending
// 19 studentRanking      20 taskSummary        21 创建任务后变化
// 22 完成 ST 后联动       23 空班级 rate=null
// 另：全局 role=student 但本班 ADMIN 可查；非互斥学生状态；非成员 403
//
// 运行：node test-p3-2.js
// ============================================================

var fs = require('fs')
var path = require('path')
var ROOT = __dirname

var storage = {}
var uni = {
	getStorageSync: function (k) { return storage[k] },
	setStorageSync: function (k, v) { storage[k] = v }
}

// ---------- 函数作用域加载 ES Mock 模块（与 test-p2-4 / test-p3-1 同套路） ----------
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
	var keys = Object.keys(deps)
	var paramNames = keys.map(function (_, i) { return 'd' + i })
	var head = ''
	keys.forEach(function (k, i) { head += 'var {' + importMap[k] + '} = d' + i + ';\n' })
	var fn = new Function('uni', ...paramNames, head + src + ';\nreturn {' + exported.join(',') + '};')
	return fn(uni, ...keys.map(function (k) { return deps[k] }))
}

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
var analytics = loadModule('mock/teacher/analytics.js', {
	'../class.js': classMod,
	'../auth.js': auth,
	'../studentTask.js': studentTask,
	'./task.js': teacherTask
})

var pass = 0, fail = 0
function assert(cond, msg) {
	if (cond) { pass++; console.log('  PASS  ' + msg) }
	else { fail++; console.log('  FAIL  ' + msg) }
}
function setLogin(account, nickname, role) {
	storage['login_user_info'] = { account: account, nickname: nickname || account, role: role || 'student' }
}
function resetST() { studentTask.__resetStudentTasks() }
function row(res, taskId) {
	var list = res.data.taskSummary
	for (var i = 0; i < list.length; i++) if (list[i].taskId === taskId) return list[i]
	return null
}
function rank(res, userId) {
	var list = res.data.studentRanking
	for (var i = 0; i < list.length; i++) if (list[i].userId === userId) return list[i]
	return null
}

var TEACHER = { userId: 'teacher01', nickname: '王老师' }
var STUDENT = { userId: 'student01', nickname: '小明同学' }
var PARENT = { userId: 'parent01', nickname: '小明家长' }

var REQUIRED_FIELDS = [
	'classId', 'classInfo', 'totalStudents', 'totalTasks', 'totalStudentTasks',
	'completedStudentTasks', 'activePendingStudentTasks', 'endedPendingStudentTasks',
	'completionRate', 'studentsWithTasks', 'studentsCompleted', 'studentsActivePending',
	'studentsEndedPending', 'studentRanking', 'taskSummary'
]

console.log('\n=== P3-2-1 E2E 测试：班级学习数据聚合 ===\n')

// ------------------------------------------------------------
// 1-4：权限链
// ------------------------------------------------------------
console.log('场景 1：未登录 → 401')
resetST()
var r401 = analytics.getClassAnalytics('class-001', null)
assert(r401.code === 401, '401：' + r401.message)

console.log('场景 2：班级不存在 → 404')
var r404 = analytics.getClassAnalytics('class-999', TEACHER)
assert(r404.code === 404 && r404.message === '班级不存在', '404 班级不存在')

console.log('场景 3：非 ADMIN → 403（MEMBER 与非成员都拒绝）')
var r403a = analytics.getClassAnalytics('class-001', STUDENT)
assert(r403a.code === 403, 'student01 是 class-001 的 MEMBER → 403')
var r403b = analytics.getClassAnalytics('class-001', PARENT)
assert(r403b.code === 403, 'parent01 非本班成员 → 403')

console.log('场景 4：ADMIN → 200；全局 role=student 但本班 ADMIN 也可查')
var r200 = analytics.getClassAnalytics('class-001', TEACHER)
assert(r200.code === 200, 'teacher01 查 class-001 → 200')
REQUIRED_FIELDS.forEach(function (f) {
	if (!(f in r200.data)) assert(false, '返回缺少字段：' + f)
})
assert(REQUIRED_FIELDS.every(function (f) { return f in r200.data }), '返回 15 个约定字段齐全')
var r200b = analytics.getClassAnalytics('class-002', STUDENT)
assert(r200b.code === 200, 'student01 全局 role=student，但凭 class-002 的 ClassMembership ADMIN → 200')
assert(r200b.message === 'success' && r200b.data !== null, '成功结构 {code:200,message:success,data}')
console.log('')

// ------------------------------------------------------------
// 5：ADMIN-only 不计学生
// ------------------------------------------------------------
console.log('场景 5：class-002 中 student01 仅 ADMIN，不计学生')
var a002 = analytics.getClassAnalytics('class-002', STUDENT)
assert(a002.data.totalStudents === 0, 'totalStudents = 0（ADMIN-only 不算学生）')
assert(a002.data.studentRanking.length === 0, '排行榜为空')
assert(a002.data.totalTasks === 1, 'totalTasks = 1（t-3003 仍存在）')
assert(a002.data.totalStudentTasks === 0, 'totalStudentTasks = 0（种子任务无扇出）')
assert(a002.data.completionRate === null, 'completionRate = null（不是 0）')
var r3003 = row(a002, 't-3003')
assert(r3003 && r3003.total === 0 && r3003.completionRate === null, 'taskSummary 含 t-3003 且 total=0 / rate=null')
console.log('')

// ------------------------------------------------------------
// 6 / 7 / 23：双身份计 1 人、去重、空班级
// ------------------------------------------------------------
console.log('场景 6：ADMIN + MEMBER 双身份 → 计 1 名学生')
var dual = classMod.createClass({ name: '双身份统计班', joinSelf: true }, TEACHER)
var dualId = dual.data.classId
var dualMemberIds = classMod.getActiveMemberUserIds(dualId)
assert(dualMemberIds.length === 1 && dualMemberIds[0] === 'teacher01', 'getActiveMemberUserIds 仅含 teacher01 一次')
var aDual = analytics.getClassAnalytics(dualId, TEACHER)
assert(aDual.code === 200 && aDual.data.totalStudents === 1, 'totalStudents = 1（双身份不重复计数）')
assert(aDual.data.studentRanking.length === 1 && aDual.data.studentRanking[0].userId === 'teacher01', '排行榜仅 teacher01')

console.log('场景 7：MEMBER 去重（同一 userId 两条 membership 只算一次）')
assert(dualMemberIds.filter(function (id) { return id === 'teacher01' }).length === 1, 'teacher01 在 memberIds 中只出现 1 次')

console.log('场景 23：空班级（joinSelf=false，无成员无任务）→ completionRate === null')
var empty = classMod.createClass({ name: '空班级', joinSelf: false }, TEACHER)
var emptyId = empty.data.classId
var aEmpty = analytics.getClassAnalytics(emptyId, TEACHER)
assert(aEmpty.data.totalStudents === 0, 'totalStudents = 0')
assert(aEmpty.data.totalTasks === 0, 'totalTasks = 0')
assert(aEmpty.data.totalStudentTasks === 0, 'totalStudentTasks = 0')
assert(aEmpty.data.completionRate === null, 'completionRate = null（页面未来显示暂无任务数据）')
assert(aEmpty.data.studentRanking.length === 0 && aEmpty.data.taskSummary.length === 0, 'ranking / taskSummary 均为空数组')
assert(aEmpty.data.studentsWithTasks === 0 && aEmpty.data.studentsCompleted === 0, '学生状态计数全 0')
console.log('')

// ------------------------------------------------------------
// 9-18、20-22：class-001 主统计流程
// ------------------------------------------------------------
console.log('场景 9-18/20：class-001 初始空数据')
resetST()
var aInit = analytics.getClassAnalytics('class-001', TEACHER)
assert(aInit.data.totalStudents === 1, 'totalStudents = 1（student01，未使用 Class.memberCount=48）')
assert(aInit.data.totalTasks === 2, '场景9 totalTasks = 2（t-3001 active + t-3002 ended）')
assert(aInit.data.totalStudentTasks === 0, '场景10 初始 totalStudentTasks = 0')
assert(aInit.data.completedStudentTasks === 0, '场景11 初始 completed = 0')
assert(aInit.data.activePendingStudentTasks === 0, '场景12 初始 activePending = 0')
assert(aInit.data.endedPendingStudentTasks === 0, '场景13 初始 endedPending = 0')
assert(aInit.data.completionRate === null, '场景14 初始 completionRate = null')
assert(aInit.data.studentsWithTasks === 0, '场景15 初始 studentsWithTasks = 0')
assert(aInit.data.studentsCompleted === 0, '场景16 初始 studentsCompleted = 0')
assert(aInit.data.studentsActivePending === 0, '场景17 初始 studentsActivePending = 0')
assert(aInit.data.studentsEndedPending === 0, '场景18 初始 studentsEndedPending = 0')
var rk0 = rank(aInit, 'student01')
assert(rk0 && rk0.nickname === '小明同学' && rk0.total === 0 && rk0.rate === null && rk0.lastCompletedAt === null,
	'场景19 初始排行榜 student01：昵称真实 / total=0 / rate=null')
var r3001 = row(aInit, 't-3001')
var r3002 = row(aInit, 't-3002')
assert(r3001 && r3001.status === 'active' && r3001.total === 0 && r3001.completionRate === null,
	'场景20 t-3001 active / total=0 / rate=null')
assert(r3002 && r3002.status === 'ended' && r3002.total === 0 && r3002.endedPending === 0,
	'场景20 t-3002 ended / total=0 / endedPending=0')

console.log('步骤 a：为 ended 种子任务 t-3002 扇出 1 条 StudentTask（模拟截止时未完成）')
studentTask.createStudentTasksForTask({ id: 't-3002', classId: 'class-001' }, ['student01'])
var aA = analytics.getClassAnalytics('class-001', TEACHER)
assert(aA.data.totalStudentTasks === 1, 'totalStudentTasks = 1')
assert(aA.data.completedStudentTasks === 0 && aA.data.activePendingStudentTasks === 0, 'completed=0 / activePending=0')
assert(aA.data.endedPendingStudentTasks === 1, '场景13 endedPendingStudentTasks = 1')
assert(aA.data.completionRate === 0, '场景14 total>0 且全未完成 → rate = 0（区别于 null）')
assert(aA.data.studentsWithTasks === 1, '场景15 studentsWithTasks = 1')
assert(aA.data.studentsEndedPending === 1 && aA.data.studentsCompleted === 0, '场景18 studentsEndedPending = 1')
var r3002a = row(aA, 't-3002')
assert(r3002a.total === 1 && r3002a.pending === 1 && r3002a.endedPending === 1 && r3002a.completionRate === 0,
	'场景20 t-3002 任务汇总：total=1 pending=1 endedPending=1 rate=0')

console.log('步骤 b / 场景21：teacher01 新建 1 个 active 任务 → 自动扇出')
var c1 = teacherTask.createTask({ classId: 'class-001', title: '统计联动任务一', deadline: '2026-12-20' }, TEACHER)
var newId1 = c1.data.task.id
var aB = analytics.getClassAnalytics('class-001', TEACHER)
assert(c1.data.assignedCount === 1, '扇出 1 条（仅 student01 是 MEMBER）')
assert(aB.data.totalTasks === 3, '场景9/21 totalTasks 2 → 3')
assert(aB.data.totalStudentTasks === 2, '场景10/21 totalStudentTasks 1 → 2')
assert(aB.data.activePendingStudentTasks === 1, '场景12 activePendingStudentTasks = 1')
assert(aB.data.endedPendingStudentTasks === 1, 'endedPending 仍 = 1')
assert(aB.data.studentsActivePending === 1, '场景17 studentsActivePending = 1')
assert(aB.data.studentsEndedPending === 1, '非互斥：同一学生同时 activePending=1 与 endedPending=1')
var rNew1 = row(aB, newId1)
assert(rNew1 && rNew1.status === 'active' && rNew1.total === 1 && rNew1.pending === 1, '新任务进入 taskSummary：active/pending=1')

console.log('步骤 c / 场景22：student01 通过学生端完成新任务（patchTask 端到端回写）')
setLogin('student01', '小明同学', 'student')
var stTasks = home.fetchTasks().data.tasks
var studentTaskRow = null
for (var i = 0; i < stTasks.length; i++) {
	if (stTasks[i].teacherTaskId === newId1) { studentTaskRow = stTasks[i]; break }
}
assert(studentTaskRow !== null, '学生端收到该班级任务（teacherTaskId 透传）')
home.patchTask(studentTaskRow.id, true)
var aC = analytics.getClassAnalytics('class-001', TEACHER)
assert(aC.data.completedStudentTasks === 1, '场景11/22 completed 0 → 1')
assert(aC.data.activePendingStudentTasks === 0, '场景12/22 activePending 1 → 0')
assert(aC.data.endedPendingStudentTasks === 1, 'endedPending 仍 = 1')
assert(aC.data.completionRate === 50, '场景14/22 rate = 50（1/2）')
assert(aC.data.studentsCompleted === 1, '场景16 studentsCompleted = 1')
assert(aC.data.studentsActivePending === 0, '场景17 studentsActivePending = 0')
assert(aC.data.studentsEndedPending === 1, '非互斥：studentsCompleted=1 且 studentsEndedPending=1（同一学生）')
var rkC = rank(aC, 'student01')
assert(rkC.completed === 1 && rkC.activePending === 0 && rkC.endedPending === 1 && rkC.rate === 50,
	'场景19 个人排行数据：completed=1 / endedPending=1 / rate=50')
assert(rkC.lastCompletedAt !== null && /^\d{4}-\d{2}-\d{2}$/.test(rkC.lastCompletedAt), 'lastCompletedAt 为 YYYY-MM-DD')

console.log('步骤 d：再建 1 个 active 任务 → rate 33.3（1/3）')
var c2 = teacherTask.createTask({ classId: 'class-001', title: '统计联动任务二', deadline: '2026-12-22' }, TEACHER)
var newId2 = c2.data.task.id
var aD = analytics.getClassAnalytics('class-001', TEACHER)
assert(aD.data.totalTasks === 4 && aD.data.totalStudentTasks === 3, 'totalTasks=4 / totalStudentTasks=3')
assert(aD.data.activePendingStudentTasks === 1, 'activePending = 1')
assert(aD.data.completionRate === 33.3, '场景14 rate = 33.3（1/3），实际=' + aD.data.completionRate)

console.log('步骤 e：完成 t-3002（ended）→ rate 66.7（2/3），非互斥状态再现')
studentTask.completeStudentTask('t-3002', 'student01')
var aE = analytics.getClassAnalytics('class-001', TEACHER)
assert(aE.data.completedStudentTasks === 2, 'completed = 2')
assert(aE.data.endedPendingStudentTasks === 0, '场景13 endedPending 1 → 0')
assert(aE.data.activePendingStudentTasks === 1, 'activePending 仍 = 1')
assert(aE.data.completionRate === 66.7, '场景14 rate = 66.7（2/3），实际=' + aE.data.completionRate)
assert(aE.data.studentsCompleted === 1 && aE.data.studentsActivePending === 1,
	'非互斥：studentsCompleted=1 同时 studentsActivePending=1')
assert(aE.data.studentsEndedPending === 0, 'studentsEndedPending = 0')
var r3002e = row(aE, 't-3002')
assert(r3002e.completed === 1 && r3002e.pending === 0 && r3002e.endedPending === 0 && r3002e.completionRate === 100,
	'场景20 t-3002：completed=1 / rate=100')
var r3001e = row(aE, 't-3001')
assert(r3001e.total === 0 && r3001e.completionRate === null, 't-3001 始终无 ST：total=0 / rate=null（不被其他任务影响）')
var rNew2 = row(aE, newId2)
assert(rNew2.total === 1 && rNew2.completed === 0 && rNew2.completionRate === 0, 'newId2：total=1 completed=0 rate=0')
// 恒等式：completed + activePending + endedPending = total（所有 ST 均可匹配 Task）
assert(aE.data.completedStudentTasks + aE.data.activePendingStudentTasks + aE.data.endedPendingStudentTasks === aE.data.totalStudentTasks,
	'ST 恒等式：completed + activePending + endedPending = total')
console.log('')

// ------------------------------------------------------------
// 8：跨班级隔离
// ------------------------------------------------------------
console.log('场景 8：classId 隔离（双身份班 / 空班级 / class-001 互不串）')
teacherTask.createTask({ classId: dualId, title: '双身份班任务', deadline: '2026-12-30' }, TEACHER)
var aDual2 = analytics.getClassAnalytics(dualId, TEACHER)
var aEmpty2 = analytics.getClassAnalytics(emptyId, TEACHER)
var a001After = analytics.getClassAnalytics('class-001', TEACHER)
assert(aDual2.data.totalTasks === 1 && aDual2.data.totalStudentTasks === 1, '双身份班：1 任务 / 1 ST')
assert(aDual2.data.completionRate === 0, '双身份班 rate=0（未完成），不含 class-001 的 66.7')
assert(aEmpty2.data.totalTasks === 0 && aEmpty2.data.totalStudentTasks === 0 && aEmpty2.data.completionRate === null,
	'空班级仍为空，不被任何班级任务污染')
assert(a001After.data.totalStudentTasks === 3, 'class-001 仍 = 3（双身份班任务未串入）')
assert(a001After.data.totalTasks === 4, 'class-001 totalTasks 仍 = 4')
console.log('')

// ------------------------------------------------------------
// 19：多人排行榜排序（独立 C 班，不污染 class-001）
// ------------------------------------------------------------
console.log('场景 19：studentRanking 多人排序（rate 降序 → completed → userId）')
var cClass = classMod.createClass({ name: '排行榜班', joinSelf: true }, TEACHER)
var cId = cClass.data.classId
var cCode = classMod.classById(cId).inviteCode
// parent01 凭邀请码加入 → C 班 2 名 MEMBER
var joinRes = classMod.joinClassByInviteCode(cCode, PARENT)
assert(joinRes.code === 200, 'parent01 凭邀请码加入 C 班')
var cIds = classMod.getActiveMemberUserIds(cId)
assert(cIds.length === 2 && cIds.indexOf('teacher01') !== -1 && cIds.indexOf('parent01') !== -1,
	'C 班 MEMBER：teacher01 + parent01')
var aC0 = analytics.getClassAnalytics(cId, TEACHER)
assert(aC0.data.studentRanking.length === 2, '排行榜 2 人')
assert(aC0.data.studentRanking[0].userId === 'parent01' && aC0.data.studentRanking[1].userId === 'teacher01',
	'无任务时两人 rate=null → 按 userId 升序：parent01 在前（p < t）')

// 建 1 个任务 → 两人各 1 条 ST
var cTask = teacherTask.createTask({ classId: cId, title: 'C班唯一任务', deadline: '2026-12-25' }, TEACHER)
var cTaskId = cTask.data.task.id
var aC1 = analytics.getClassAnalytics(cId, TEACHER)
assert(aC1.data.totalStudentTasks === 2, '2 名学生各扇出 1 条 → totalStudentTasks=2')
assert(aC1.data.studentsWithTasks === 2 && aC1.data.studentsActivePending === 2, '两人都有待完成（非互斥计数各 2）')

// teacher01 在学生端完成自己的那条
setLogin('teacher01', '王老师', 'teacher')
var cStTasks = home.fetchTasks().data.tasks
var cStRow = null
for (var j = 0; j < cStTasks.length; j++) {
	if (cStTasks[j].teacherTaskId === cTaskId) { cStRow = cStTasks[j]; break }
}
assert(cStRow !== null, 'teacher01 学生端收到 C 班任务')
home.patchTask(cStRow.id, true)
var aC2 = analytics.getClassAnalytics(cId, TEACHER)
var rkT = rank(aC2, 'teacher01')
var rkP = rank(aC2, 'parent01')
assert(rkT.rate === 100 && rkT.completed === 1, 'teacher01 rate=100 completed=1')
assert(rkP.rate === 0 && rkP.completed === 0 && rkP.nickname === '小明家长', 'parent01 rate=0 / 昵称来自 getMockUserById')
assert(aC2.data.studentRanking[0].userId === 'teacher01' && aC2.data.studentRanking[1].userId === 'parent01',
	'排序：teacher01(100) 在 parent01(0) 之前')
assert(aC2.data.completionRate === 50, '班级任务口径 rate = 50（1/2），非学生口径 100')
var cTaskSummary = row(aC2, cTaskId)
assert(cTaskSummary.total === 2 && cTaskSummary.completed === 1 && cTaskSummary.pending === 1 && cTaskSummary.completionRate === 50,
	'场景20 C 班任务汇总：total=2 completed=1 pending=1 rate=50')
// C 班数据不串入 class-001
assert(analytics.getClassAnalytics('class-001', TEACHER).data.totalStudentTasks === 3, '复查：class-001 仍 = 3')
console.log('')

// ------------------------------------------------------------
// 汇总
// ------------------------------------------------------------
console.log('========================================')
console.log('测试结果：PASS ' + pass + ' / FAIL ' + fail)
console.log('========================================')
if (fail > 0) process.exit(1)
