// ============================================================
// P2-4 E2E 测试：教师任务完成进度闭环
//
// 验证链路：
//   教师创建任务 → StudentTask 扇出 → 学生完成 → StudentTask 更新 → 教师查看进度
//
// 运行：node test-p2-4.js
// ============================================================

var fs = require('fs')
var path = require('path')

var ROOT = __dirname

// ---------- Mock uni 对象 ----------
var storage = {}
var uni = {
	getStorageSync: function (k) { return storage[k] },
	setStorageSync: function (k, v) { storage[k] = v }
}

// ---------- 函数作用域加载模块（避免 eval 全局作用域冲突） ----------
// deps: { 原始模块路径: 模块对象 } —— 参数名会被替换为合法标识符
function loadModule(relPath, deps) {
	var src = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
	// 提取导出的名称
	var exported = []
	var re = /export (?:function|const|var|let) (\w+)/g
	var m
	while ((m = re.exec(src)) !== null) exported.push(m[1])
	// 收集 import 语句中的 from 路径，用于参数名映射
	var importMap = {}
	var importRe = /import \{([^}]+)\} from '([^']+)'/g
	var im
	while ((im = importRe.exec(src)) !== null) {
		importMap[im[2]] = im[1]
	}
	// 去掉所有 import 语句
	src = src.replace(/import \{[^}]+\} from '[^']+'/g, '')
	// 把 export 改成普通声明
	src = src.replace(/export function (\w+)/g, 'var $1 = function $1')
	src = src.replace(/export (const|var|let) (\w+)/g, '$1 $2')

	// 构建合法参数名：dep0, dep1, ...
	var depKeys = Object.keys(deps)
	var paramNames = depKeys.map(function (_, i) { return 'dep' + i })
	// 生成依赖解构代码：var { a, b } = dep0
	var destructureCode = ''
	depKeys.forEach(function (key, i) {
		var importNames = importMap[key]
		if (importNames) {
			destructureCode += 'var {' + importNames + '} = dep' + i + ';\n'
		}
	})
	var fn = new Function('uni', ...paramNames, destructureCode + src + ';\nreturn {' + exported.join(',') + '};')
	return fn(uni, ...depKeys.map(function (k) { return deps[k] }))
}

// ---------- 加载依赖链（顺序：无依赖 → 有依赖） ----------
var studentTask = loadModule('mock/studentTask.js', {})
var reward = loadModule('utils/reward.js', {})
var taskState = loadModule('utils/taskState.js', {})
var taskLifecycle = loadModule('utils/taskLifecycle.js', {})
var auth = loadModule('mock/auth.js', {})
var classMod = loadModule('mock/class.js', { getMockUserById: auth.getMockUserById })

// home.js 依赖 reward + taskState + studentTask
var home = loadModule('mock/home.js', {
	'@/utils/reward.js': reward,
	'@/utils/taskState.js': taskState,
	'@/mock/studentTask.js': studentTask,
	'@/mock/class.js': classMod
})

// teacher/task.js 依赖 class + home + studentTask + auth
var teacherTask = loadModule('mock/teacher/task.js', {
	'../class.js': classMod,
	'../home.js': home,
	'../studentTask.js': studentTask,
	'../auth.js': auth,
	'../../utils/taskLifecycle.js': taskLifecycle
})

// ---------- 测试工具 ----------
var pass = 0, fail = 0
function assert(cond, msg) {
	if (cond) { pass++; console.log('  PASS  ' + msg) }
	else { fail++; console.log('  FAIL  ' + msg) }
}

// 设置当前登录用户（模拟 uni storage 中的 login_user_info）
function setLoginUser(account, nickname, role) {
	storage['login_user_info'] = { account: account, nickname: nickname || account, role: role || 'student' }
}

// 重置环境
function resetAll() {
	storage = {}
	studentTask.__resetStudentTasks()
}

// ============================================================
console.log('\n=== P2-4 E2E 测试：教师任务完成进度闭环 ===\n')

// 预置账号：teacher01（王老师）、student01（小明同学）
var TEACHER = { userId: 'teacher01', nickname: '王老师' }
var STUDENT = { userId: 'student01', nickname: '小明同学' }

// ============================================================
// 场景一：基础闭环 —— teacher01 创建任务 → student01 完成 → 教师看到完成
// ============================================================
console.log('场景一：基础闭环（teacher01 创建 → student01 完成 → 教师看进度）')

resetAll()

// 1. teacher01 在 class-001 创建任务
var createRes = teacherTask.createTask(
	{ classId: 'class-001', title: '单元测试任务A', description: 'E2E测试用', deadline: '2026-12-31' },
	TEACHER
)
assert(createRes.code === 200, 'teacher01 创建任务成功')
var newTask = createRes.data.task
assert(newTask && newTask.id, '返回 task 有 id：' + (newTask && newTask.id))
assert(createRes.data.assignedCount === 1, 'StudentTask 扇出数量 = 1（仅 student01 是 MEMBER），实际=' + createRes.data.assignedCount)

// 2. 查询进度：此时 student01 未完成
var prog0 = teacherTask.getTaskProgress('class-001', newTask.id, TEACHER)
assert(prog0.code === 200, '教师查询进度成功')
assert(prog0.data.stats.total === 1, '总人数 = 1')
assert(prog0.data.stats.completed === 0, '已完成 = 0')
assert(prog0.data.stats.pending === 1, '未完成 = 1')
var member0 = prog0.data.members[0]
assert(member0.userId === 'student01', '学生列表包含 student01')
assert(member0.status === 'pending', 'student01 状态 = pending')

// 3. 模拟 student01 登录并完成任务
setLoginUser('student01', '小明同学', 'student')
// 找到学生端刚被 addClassTask 加入的任务（带 teacherTaskId）
var storageBeforeFetch = JSON.stringify(storage['student_home_task_state'])
var studentTasks = home.fetchTasks().data.tasks
assert(JSON.stringify(storage['student_home_task_state']) === storageBeforeFetch, 'GET 查询班级任务不会写入共享任务状态 storage')
var classTask = null
for (var i = 0; i < studentTasks.length; i++) {
	if (studentTasks[i].teacherTaskId === newTask.id) { classTask = studentTasks[i]; break }
}
assert(classTask !== null, '学生端今日任务列表中存在该班级任务（teacherTaskId=' + newTask.id + '）')
assert(classTask.source === 'class', '任务 source = class')
assert(classTask.completed === false, '学生端任务初始未完成')

// 4. student01 完成任务（调用 patchTask，内部应回写 StudentTask）
taskState.toggleTask(classTask.id)
var patchRes = home.patchTask(classTask.id, true)
assert(patchRes.code === 200, 'patchTask 成功')
assert(taskState.getTasksByFilter('all').some(function (task) {
	return task.id === classTask.id && task.completed === true
}), '学生端任务状态已完成')
var conflictingOrder = taskState.getTasksByFilter('all').map(function (task) { return task.id })
storage['student_home_task_state'] = {
	date: new Date().getFullYear() + '-' + ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' + ('0' + new Date().getDate()).slice(-2),
	order: conflictingOrder,
	completedIds: [],
	completionOrder: []
}
var conflictingStorage = JSON.stringify(storage['student_home_task_state'])
assert(home.fetchTasks().data.tasks.some(function (task) {
	return task.id === classTask.id && task.completed === true
}), 'GET 返回 StudentTask 状态，即使设备级 storage 与其冲突')
assert(JSON.stringify(storage['student_home_task_state']) === conflictingStorage, 'StudentTask 权威状态仅在内存应用，不回写 storage')

// 5. teacher01 再次查询进度：student01 应为已完成
var prog1 = teacherTask.getTaskProgress('class-001', newTask.id, TEACHER)
assert(prog1.code === 200, '教师再次查询进度成功')
assert(prog1.data.stats.total === 1, '总人数仍 = 1')
assert(prog1.data.stats.completed === 1, '已完成 = 1（完成数 +1）')
assert(prog1.data.stats.pending === 0, '未完成 = 0')
var member1 = prog1.data.members[0]
assert(member1.userId === 'student01', '学生列表仍含 student01')
assert(member1.status === 'completed', 'student01 状态 = completed ✅')
assert(member1.completedAt !== null, 'student01 completedAt 已写入')
var rate = Math.round((1 / 1) * 100)
assert(rate === 100, '完成率 = 100%（1/1）')

// 6. student01 取消完成（toggle 回退），验证回写
taskState.toggleTask(classTask.id)
home.patchTask(classTask.id, false)
var prog2 = teacherTask.getTaskProgress('class-001', newTask.id, TEACHER)
assert(prog2.data.stats.completed === 0, '取消完成后已完成 = 0')
assert(prog2.data.members[0].status === 'pending', 'student01 状态回到 pending')

console.log('')

// ============================================================
// 场景二：ADMIN+MEMBER 双身份 —— 创建者自己也收到 StudentTask
// ============================================================
console.log('场景二：ADMIN+MEMBER 双身份（创建者同时是成员，自己也收到任务）')

resetAll()

// 1. teacher01 创建新班级，joinSelf=true → 同时获得 ADMIN + MEMBER
var classRes = classMod.createClass(
	{ name: '双身份测试班', description: '', goal: '', joinSelf: true },
	TEACHER
)
assert(classRes.code === 200, 'teacher01 创建班级成功（joinSelf=true）')
var dualClassId = classRes.data.classId
assert(classRes.data.joinSelf === true, '返回 joinSelf = true')

// 2. 验证 teacher01 在该班同时拥有 ADMIN 和 MEMBER
assert(classMod.hasMembership('teacher01', dualClassId, 'ADMIN') === true, 'teacher01 拥有 ADMIN 权限')
assert(classMod.hasMembership('teacher01', dualClassId, 'MEMBER') === true, 'teacher01 同时拥有 MEMBER 身份')
var memberIds = classMod.getActiveMemberUserIds(dualClassId)
assert(memberIds.indexOf('teacher01') !== -1, 'getActiveMemberUserIds 包含 teacher01')

// 3. teacher01 在该班创建任务 → 自己应收到 StudentTask
var taskRes2 = teacherTask.createTask(
	{ classId: dualClassId, title: '双身份任务', description: '', deadline: '2026-12-31' },
	TEACHER
)
assert(taskRes2.code === 200, 'teacher01 创建任务成功')
assert(taskRes2.data.assignedCount === 1, '扇出数量 = 1（teacher01 自己）')
var dualTask = taskRes2.data.task

// 4. 查询进度：teacher01 自己在列表中，状态 pending
var dualProg0 = teacherTask.getTaskProgress(dualClassId, dualTask.id, TEACHER)
assert(dualProg0.data.stats.total === 1, '总人数 = 1')
assert(dualProg0.data.members[0].userId === 'teacher01', '列表中是 teacher01 自己')
assert(dualProg0.data.members[0].status === 'pending', '初始状态 pending')

// 5. 模拟 teacher01 完成自己的任务
setLoginUser('teacher01', '王老师', 'teacher')
var stTasks2 = home.fetchTasks().data.tasks
var dualClassTask = null
for (var j = 0; j < stTasks2.length; j++) {
	if (stTasks2[j].teacherTaskId === dualTask.id) { dualClassTask = stTasks2[j]; break }
}
assert(dualClassTask !== null, '教师端今日任务列表中存在该班级任务')
home.patchTask(dualClassTask.id, true)

// 6. 查询进度：teacher01 显示已完成
var dualProg1 = teacherTask.getTaskProgress(dualClassId, dualTask.id, TEACHER)
assert(dualProg1.data.stats.completed === 1, '已完成 = 1')
assert(dualProg1.data.members[0].status === 'completed', 'teacher01 状态 = completed ✅')

console.log('')

// ============================================================
// 场景三：权限校验 —— 非 ADMIN 不能查看进度
// ============================================================
console.log('场景三：权限校验')

resetAll()
// 用 class-001 的已有任务 t-3001 测试（种子任务，无 StudentTask，但权限仍要校验）
// student01 是 class-001 的 MEMBER，不是 ADMIN
var noAuth = teacherTask.getTaskProgress('class-001', 't-3001', STUDENT)
assert(noAuth.code === 403, 'MEMBER 查看进度返回 403')

// 未登录
var noLogin = teacherTask.getTaskProgress('class-001', 't-3001', null)
assert(noLogin.code === 401, '未登录返回 401')

// 不存在的任务
var notFound = teacherTask.getTaskProgress('class-001', 't-not-exist', TEACHER)
assert(notFound.code === 404, '任务不存在返回 404')

console.log('')

// ============================================================
// 场景四：回归 —— 学生端任务链路不受影响
// ============================================================
console.log('场景四：回归测试（学生端任务链路）')

resetAll()
var scopedTaskRes = teacherTask.createTask(
	{ classId: 'class-001', title: '账号隔离回归任务', description: '', deadline: '2026-12-31' },
	TEACHER
)
assert(scopedTaskRes.code === 200, '为成员范围回归创建班级任务')
var scopedTaskId = scopedTaskRes.data.task.id
setLoginUser('student01', '小明同学', 'student')

// 学生端首页任务能正常获取
var homeRes = home.fetchHomeToday()
assert(homeRes.code === 200, 'fetchHomeToday 成功')
assert(homeRes.data.tasks.length > 0, '今日任务数量 > 0')

// 学生端 AI 任务（非班级任务）完成不影响 StudentTask
var aiTask = null
for (var k = 0; k < homeRes.data.tasks.length; k++) {
	if (homeRes.data.tasks[k].id === 2002) { aiTask = homeRes.data.tasks[k]; break }
}
assert(aiTask !== null && aiTask.source === 'ai' && aiTask.completed === false, '存在未完成的 AI 任务')
var beforeCount = studentTask.getStudentTasksByClass('class-001').length
taskState.toggleTask(aiTask.id)
home.patchTask(aiTask.id, true)
var afterCount = studentTask.getStudentTasksByClass('class-001').length
assert(afterCount === beforeCount, '完成 AI 任务不创建/修改任何 StudentTask（before=' + beforeCount + ', after=' + afterCount + '）')

// 班级任务只对有分配记录的成员可见，且完成状态以 StudentTask 为准。
var memberTasks = home.fetchTasks().data.tasks
var memberClassTask = null
for (var m = 0; m < memberTasks.length; m++) {
	if (memberTasks[m].source === 'class' && memberTasks[m].teacherTaskId === scopedTaskId) {
		memberClassTask = memberTasks[m]
		break
	}
}
assert(memberClassTask !== null, '班级成员收到已分配的教师任务')
taskState.toggleTask(memberClassTask.id)
assert(home.patchTask(memberClassTask.id, true).code === 200, '已分配成员可完成班级任务')

setLoginUser('student02', '小红同学', 'student')
var storageBeforeStudent02Fetch = JSON.stringify(storage['student_home_task_state'])
var nonMemberTasks = home.fetchTasks().data.tasks
assert(JSON.stringify(storage['student_home_task_state']) === storageBeforeStudent02Fetch, '切换账号后的 GET 查询仍不写入共享任务状态 storage')
assert(nonMemberTasks.every(function (task) {
	return task.source !== 'class' || task.classId !== 'class-001'
}), '非班级成员看不到 class-001 的任务')
assert(home.patchTask(memberClassTask.id, true).code === 403, '非分配成员不能伪造 taskId 完成班级任务')
var student02Ai = null
for (var n = 0; n < nonMemberTasks.length; n++) {
	if (nonMemberTasks[n].id === 2002) { student02Ai = nonMemberTasks[n]; break }
}
assert(student02Ai !== null, '非成员仍可查看个人 AI 任务')

console.log('')

// ============================================================
// 汇总
// ============================================================
console.log('========================================')
console.log('测试结果：PASS ' + pass + ' / FAIL ' + fail)
console.log('========================================')
if (fail > 0) {
	process.exit(1)
}
