// ============================================================
// P4.5 导航断链修复 + 班级中心 回归
// 覆盖：resolveAssignTargetClass 单/多/无管理班决策；fetchManagedClasses 仅返回 ACTIVE ADMIN 班级（多班级支持）；
//       getClassMembers.isMember 字段（纯 ADMIN=false → 拦截进学生详情；ADMIN+MEMBER=true → 放行）；
//       班级中心真实学生数采用聚合口径（不用 Class.memberCount 冗余字段）。
// 运行：node test-p4-5.js
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

// ---- ES module 函数作用域加载（沿用既有测试套路） ----
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

console.log('Case A：resolveAssignTargetClass 导航决策（纯函数）')
check(ws.resolveAssignTargetClass([]).type === 'none', '无管理班 → none')
var single = ws.resolveAssignTargetClass([{ id: 'c1' }])
check(single.type === 'single' && single.classId === 'c1', '单管理班 → single 且携带 classId（可直接进任务创建）')
check(ws.resolveAssignTargetClass([{ id: 'c1' }, { id: 'c2' }]).type === 'multi', '多管理班 → multi（禁止替用户瞎选，进班级中心选择）')

console.log('Case B：fetchManagedClasses 仅返回 ACTIVE ADMIN 班级（student01：class-002 ADMIN，class-001 仅 MEMBER）')
login('student01', '小明同学', 'student')
ws.fetchManagedClasses().then(function (list) {
	check(list.length === 1, 'student01 仅 1 个 ADMIN 班级')
	check(list[0].id === 'class-002', '返回的是其 ADMIN 班级 class-002，不含仅 MEMBER 的 class-001')
	check(list[0].memberCount === 16, 'Class.memberCount 冗余字段仍随对象返回（页面不展示该值，改用聚合口径）')

	console.log('Case B2：新增 ADMIN 班级 → 多班级管理支持')
	var c = mockClass.createClass({ name: 'P45班', joinSelf: false }, { userId: 'student01', nickname: '小明同学' })
	check(c.code === 200, '创建 ADMIN 班级成功')
	return ws.fetchManagedClasses().then(function (list2) {
		check(list2.length === 2, '新增 ADMIN 班级后 → 2 个（多班级管理支持）')

		console.log('Case C：getClassMembers.isMember 字段（纯 ADMIN vs 双身份）')
		return classApi.getClassMembers('class-002').then(function (res) {
			check(res.code === 200, 'class-002 成员查询 200')
			var me = null
			for (var i = 0; i < res.data.members.length; i++) {
				if (res.data.members[i].userId === 'student01') me = res.data.members[i]
			}
			check(me && me.isMember === false, '纯 ADMIN 成员 isMember=false（进入学生详情应被拦截，不跳 404）')
			check(me && me.role === 'ADMIN', '显示身份为 ADMIN')

			console.log('Case C2：ADMIN+MEMBER 双身份（joinSelf=true）')
			var dual = mockClass.createClass({ name: 'P45双身份', joinSelf: true }, { userId: 'student01', nickname: '小明同学' })
			return classApi.getClassMembers(dual.data.classId).then(function (res2) {
				check(res2.code === 200, '双身份班成员查询 200')
				var me2 = null
				for (var j = 0; j < res2.data.members.length; j++) {
					if (res2.data.members[j].userId === 'student01') me2 = res2.data.members[j]
				}
				check(me2 && me2.isMember === true, 'ADMIN+MEMBER 双身份 isMember=true（允许进入学生详情）')
				check(res2.data.classInfo.memberCount === 1, '双身份班真实学生数=1（聚合口径，不用 Class.memberCount 冗余）')

				console.log('Case D：班级中心取数口径 — 真实 ACTIVE MEMBER 数（聚合，不用 Class.memberCount 冗余）')
				// class-002 中 student01 为纯 ADMIN 且无成员：真实学生数应为 0，而非 Class.memberCount=16 冗余值
				return classApi.getClassMembers('class-002').then(function (res3) {
					check(res3.code === 200, 'class-002 成员查询 200（student01 为 ADMIN，可查）')
					check(res3.data.classInfo.memberCount === 0, 'class-002 真实学生数=0（非冗余 Class.memberCount=16，聚合口径生效）')
					// 越权保护：非 ADMIN 查成员返回 403，不伪装成功
					return classApi.getClassMembers('class-001').then(function (res4) {
						check(res4.code === 403, 'class-001 非 ADMIN 查成员 → 403（权限如实暴露，不伪装成功）')
						return classApi.getClassMembers('class-003-not-exist').then(function (res5) {
							check(res5.code === 404, '不存在的班级 → 404（错误态如实暴露）')
							console.log('\n测试结果：PASS ' + passed + ' / FAIL 0')
						})
					})
				})
			})
		})
	})
}).catch(function (e) {
	console.error(e)
	process.exit(1)
})
