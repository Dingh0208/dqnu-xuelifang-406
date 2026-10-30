// ============================================================
// P3-WS 工作空间切换 E2E（Node 纯数据层，不依赖小程序运行时）
// 覆盖：ADMIN 预检 / 越权拦截 / 双身份 / 创建班级后放行 / 学生空间切换 / 退出后拦截
// 运行：node test-ws.js
// ============================================================
var fs = require('fs')

var passed = 0
function check(cond, msg) {
	if (!cond) { console.error('❌ FAIL: ' + msg); process.exit(1) }
	passed++
	console.log('  ✅ ' + msg)
}

// ---- 极简 uni 运行时（storage + 跳转记录） ----
var storage = {}
var launches = []
var uni = {
	getStorageSync: function (k) { return storage[k] },
	setStorageSync: function (k, v) { storage[k] = v },
	removeStorageSync: function (k) { delete storage[k] },
	reLaunch: function (o) { launches.push(o.url) }
}

// ---- ES module 函数作用域加载（避免多文件 var tasks 全局碰撞，沿用既有测试套路） ----
function loadModule(relPath, deps) {
	var src = fs.readFileSync(relPath, 'utf8')
	var exported = [], re = /export (?:function|const|var|let) (\w+)/g, m
	while ((m = re.exec(src)) !== null) exported.push(m[1])
	var importMap = {}, importRe = /import \{([^}]+)\} from '([^']+)'/g, im
	var nsMap = {}, nsRe = /import \* as (\w+) from '([^']+)'/g, nm
	while ((im = importRe.exec(src)) !== null) importMap[im[2]] = im[1]
	while ((nm = nsRe.exec(src)) !== null) nsMap[nm[2]] = nm[1]
	src = src.replace(/import \{[^}]+\} from '[^']+'/g, '')
	src = src.replace(/import \* as \w+ from '[^']+';?/g, '')
	src = src.replace(/export \{[^}]+\} from '[^']+';?/g, '')
	src = src.replace(/export default [\w$]+;?/g, '')
	src = src.replace(/export function (\w+)/g, 'var $1 = function $1')
	src = src.replace(/export (const|var|let) (\w+)/g, '$1 $2')
	var keys = Object.keys(deps), params = keys.map(function (_, i) { return 'd' + i })
	var head = ''
	keys.forEach(function (k, i) {
		if (nsMap[k]) head += 'var ' + nsMap[k] + ' = d' + i + ';\n'
		else head += 'var {' + importMap[k] + '} = d' + i + ';\n'
	})
	var fn = new Function('uni', ...params, head + src + ';\nreturn {' + exported.join(',') + '};')
	return fn(uni, ...keys.map(function (k) { return deps[k] }))
}

var config = loadModule('utils/config.js', {})
var request = loadModule('api/request.js', { '@/utils/config.js': config })
var mockAuth = loadModule('mock/auth.js', {})
var auth = loadModule('api/auth.js', {
	'@/utils/config.js': config,
	'./request.js': request,
	'@/mock/auth.js': mockAuth
})
var mockClass = loadModule('mock/class.js', { './auth.js': mockAuth })
var classApi = loadModule('api/class.js', {
	'@/utils/config.js': config,
	'./request.js': request,
	'@/mock/class.js': mockClass,
	'./auth.js': auth
})
var ws = loadModule('utils/workspace.js', {
	'@/api/auth.js': auth,
	'@/api/class.js': classApi
})

function login(account, nickname, role) {
	storage['login_user_info'] = { account: account, nickname: nickname, role: role }
	storage['student_token'] = 'mock-token-' + account
}
function logout() { delete storage['login_user_info']; delete storage['student_token'] }
function lastLaunch() { return launches.length ? launches[launches.length - 1] : null }

console.log('Case 10：未登录 → enterTeacherWorkspace 拦截并跳身份选择')
launches = []
ws.enterTeacherWorkspace().then(function (ok) {
	check(ok === false, '未登录返回 false')
	check(lastLaunch() === '/pages/auth/select', '已 reLaunch 到身份选择页')

	console.log('Case 7/2：student01（class-002 的 ADMIN，class-001 仅 MEMBER）')
	login('student01', '小明同学', 'student')
	return ws.enterTeacherWorkspace()
}).then(function (ok) {
	check(ok === true, '有 ADMIN 班级 → 放行')
	check(lastLaunch() === '/pages/teacher/home', '泛入口进入教师首页（不带 classId，展示全部管理班）')
	check(storage['teacher_workspace_access'] === 'student01', '进入前已验证 ADMIN 后记录教师工作区权限')

	console.log('Case 6：指定 class-002（本人 ADMIN）')
	launches = []
	return ws.enterTeacherWorkspace('class-002')
}).then(function (ok) {
	check(ok === true, 'class-002 放行')
	check(lastLaunch() === '/pages/teacher/home?classId=class-002', 'URL 携带真实 classId')

	console.log('Case 8：指定 class-001（本人仅 MEMBER）→ 越权拦截')
	launches = []
	return ws.enterTeacherWorkspace('class-001')
}).then(function (ok) {
	check(ok === false, '非 ADMIN 班级被拦截')
	check(lastLaunch() === null, '没有发生任何跳转')

	console.log('Case 2：parent01 无任何 ADMIN → 拦截')
	login('parent01', '小明家长', 'parent')
	launches = []
	return ws.enterTeacherWorkspace()
}).then(function (ok) {
	check(ok === false, 'parent01 不能进入教师工作台')
	check(lastLaunch() === null, '不跳转，由调用方弹「暂无可管理的班级」引导')

	console.log('Case 3：student01 创建班级（仅管理者）后立即放行')
	login('student01', '小明同学', 'student')
	var created = mockClass.createClass({ name: 'WS新班', joinSelf: false }, { userId: 'student01', nickname: '小明同学' })
	check(created.code === 200, '创建班级成功')
	return ws.enterTeacherWorkspace(created.data.classId)
}).then(function (ok) {
	check(ok === true, '创建后凭 ADMIN membership 放行（无需重新登录、role 仍为 student）')
	check(lastLaunch() === '/pages/teacher/home?classId=' + lastLaunch().split('classId=')[1], '进入新建班级工作台')
	var user = storage['login_user_info']
	check(user.role === 'student', 'user.role 未被修改（仍为 student，规则 1）')

	console.log('Case 4：ADMIN+MEMBER 双身份（joinSelf=true）')
	var dual = mockClass.createClass({ name: 'WS双身份班', joinSelf: true }, { userId: 'student01', nickname: '小明同学' })
	check(mockClass.hasMembership('student01', dual.data.classId, 'ADMIN') === true, '拥有 ADMIN')
	check(mockClass.hasMembership('student01', dual.data.classId, 'MEMBER') === true, '同时拥有 MEMBER')
	var memberIds = mockClass.getActiveMemberUserIds(dual.data.classId)
	check(memberIds.length === 1 && memberIds[0] === 'student01', '学生身份计入 MEMBER 且不重复')
	return ws.enterTeacherWorkspace(dual.data.classId)
}).then(function (ok) {
	check(ok === true, '双身份可进入教师工作台')

	console.log('Case 5：教师空间 → 学生空间（登录态保持）')
	launches = []
	ws.enterStudentWorkspace()
	check(lastLaunch() === '/pages/index/index', 'reLaunch 学生首页')
	check(storage['login_user_info'] && storage['student_token'], '登录态/token 保持，未重新登录')
	check(!storage['teacher_workspace_access'], '切回学生空间后清除教师工作区权限标记')

	console.log('Case 10：退出后 enterStudentWorkspace 也被拦截')
	logout()
	launches = []
	ws.enterStudentWorkspace()
	check(lastLaunch() === '/pages/auth/select', '跳身份选择页')

	console.log('\n测试结果：PASS ' + passed + ' / FAIL 0')
}).catch(function (e) {
	console.error(e)
	process.exit(1)
})
