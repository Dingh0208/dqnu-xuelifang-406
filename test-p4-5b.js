// ============================================================
// P4.5-4 教师端任务导航闭环修复 回归
// 覆盖 F1/F2/F3 共 10 类场景：
//   F1 任务导航闭环：
//     [1] 单管理班 → 直进 task/index?classId
//     [2] 多管理班 → class/index?from=task（不替用户瞎选）
//     [3] 无管理班 → 提示并引导创建班级
//     [4] 首页任务统计卡 与 任务 Tab 共用 goTaskCenter（决策一致）
//     [5] from=assign 仍进入 task/create（不被 from=task 破坏）
//     [6] from=task → 用户选择班级后进入 task/index?classId
//   F2 创建页 classId 守卫：
//     [7] 缺少 classId 时加载即锁定 + 提交前再校验（不调用创建 API；Mock 层空 classId 亦返回 404 不自建）
//   F3 创建成功跳转：
//     [8] 成功 → task/index?classId（assign 源 redirectTo，其余 navigateBack）
//   数据链回归：
//     [9] 纯 ADMIN 班 / 双身份班 创建任务的 StudentTask 扇出不变（F2/F3 不影响扇出）
//     [10] 页面接线静态校验（home / TabBar / class/index / task/create 关键分支存在）
// 运行：node test-p4-5b.js
// ============================================================
var fs = require('fs')
var path = require('path')
var ROOT = __dirname

// F1 行为测试需要 navigateTo/showToast 记录；none 分支用 setTimeout 延迟跳转，
// 为了让 none 场景可同步断言，这里把全局 setTimeout 改为立即执行（本脚本内无其它 setTimeout 依赖）。
global.setTimeout = function (fn) { fn() }

var storage = {}
var launches = []
var navs = []
var toasts = []
var uni = {
	getStorageSync: function (k) { return storage[k] },
	setStorageSync: function (k, v) { storage[k] = v },
	removeStorageSync: function (k) { delete storage[k] },
	reLaunch: function (o) { launches.push(o.url) },
	navigateTo: function (o) { navs.push(o.url) },
	showToast: function (o) { toasts.push(o.title) }
}

var pass = 0, fail = 0
function check(cond, msg) {
	if (cond) { pass++; console.log('  PASS  ' + msg) }
	else { fail++; console.log('  FAIL  ' + msg) }
}
function eq(a, b, msg) { check(a === b, msg + '（实际=' + JSON.stringify(a) + '）') }

// ---------- 函数作用域模块加载（沿用既有测试套路） ----------
function loadModule(relPath, deps) {
	var src = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
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

// ---------- F1 行为：goTaskCenter（依赖注入，可控 managedClasses） ----------
var managed = { list: [] }
var authMock = { isLoggedIn: function () { return true }, requireLogin: function () {}, logout: function () {} }
var classApiMock = {
	getClasses: function () { return Promise.resolve({ code: 200, data: { managedClasses: managed.list } }) }
}
var ws = loadModule('utils/workspace.js', {
	'@/api/auth.js': authMock,
	'@/api/class.js': classApiMock
})

function readVue(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('F1-1：单管理班 → 直进任务列表（携带真实 classId）')
managed.list = [{ id: 'class-A' }]
navs = []; toasts = []
ws.goTaskCenter().then(function (r) {
	eq(r.type, 'single', '决策类型 single')
	eq(navs.length, 1, '恰好一次 navigateTo')
	eq(navs[0], '/pages/teacher/task/index?classId=class-A', '跳转到该班任务列表')

	console.log('F1-2：多管理班 → 进班级中心（from=task，不替用户瞎选）')
	managed.list = [{ id: 'class-A' }, { id: 'class-B' }]
	navs = []
	return ws.goTaskCenter().then(function (r2) {
		eq(r2.type, 'multi', '决策类型 multi')
		eq(navs[0], '/pages/teacher/class/index?from=task', '进班级中心并标记 from=task')

		console.log('F1-3：无管理班 → 提示并引导创建班级')
		managed.list = []
		navs = []; toasts = []
		return ws.goTaskCenter().then(function (r3) {
			eq(r3.type, 'none', '决策类型 none')
			check(toasts.indexOf('还没有管理的班级，请先创建') >= 0, '弹出创建引导提示')
			eq(navs[0], '/pages/teacher/class/create', '引导跳转到创建班级页')

			console.log('P2：教师主导航 = 首页 / 班级 / 教学 / 我的（课表整合进首页，不再单独占 Tab）')
			var home = readVue('pages/teacher/home.vue')
			var tab = readVue('components/teacher/TeacherTabBar.vue')
			var appMain = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8')
			var appShell = fs.readFileSync(path.join(ROOT, 'App.vue'), 'utf8')
			check(appMain.indexOf('menuButtonRect.bottom') >= 0 && appMain.indexOf('menuButtonTopGap') >= 0, '自定义导航栏高度覆盖微信胶囊与上下间距')
			check(appMain.indexOf('style.paddingRight') === -1, '微信胶囊避让不再通过不对称内边距推偏页面标题')
			check(appMain.indexOf('--teacher-top-action-top') >= 0 && appMain.indexOf('menuButtonRect.right') >= 0, '顶部操作按钮位置跟随微信胶囊下沿')
			var primaryPages = [home, readVue('pages/teacher/class/index.vue'), readVue('pages/teacher/teaching/index.vue'), readVue('pages/teacher/profile/index.vue')]
			check(primaryPages.every(function (page) { return page.indexOf(':style="teacherTopBarStyle"') >= 0 }), '四个教师主页面共用修正后的顶部导航高度')
			check(primaryPages.every(function (page) { return page.indexOf('width: 160rpx;') >= 0 && page.indexOf('text-align: center;') >= 0 }), '四个教师主页面以等宽侧栏将标题居中到屏幕')
			check(home.indexOf('logout-spaced-content') >= 0 && readVue('pages/teacher/profile/index.vue').indexOf('logout-spaced-content') >= 0, '首页和我的页为胶囊下方的退出按钮留出内容间距')
			var teaching = readVue('pages/teacher/teaching/index.vue')
			check(appShell.indexOf('.top-bar .add-hit') >= 0 && teaching.indexOf('top-action-spaced-content') >= 0, '教学页创建入口避开胶囊，并为其下移留出内容间距')
			check(home.indexOf('goTaskCenter()') >= 0, 'home.vue 任务统计卡调用 goTaskCenter（带 classId 进任务列表）')
			check(home.indexOf("'/pages/teacher/task/index'") === -1, 'home.vue 已移除无 classId 的旧直跳')
			check(tab.indexOf("key: 'teaching'") >= 0 && tab.indexOf('/pages/teacher/teaching/index') >= 0, 'TeacherTabBar 教学 Tab → 教学模块主页')
			check(tab.indexOf("key: 'task'") === -1, 'TeacherTabBar 已移除旧「任务」Tab（课表不再单独占 Tab）')
			var teach = readVue('pages/teacher/teaching/index.vue')
			check(teach.indexOf('current="teaching"') >= 0, '教学页渲染教师端底部导航（主 Tab 页面才展示）')
			check(teach.indexOf('goAssignTask') >= 0, '教学页创建任务复用 goAssignTask（与首页同一决策）')
			check(teach.indexOf('getClassTasks') >= 0, '教学页复用现有 getClassTasks（未新建任务模型）')
			var pj = fs.readFileSync(path.join(ROOT, 'pages.json'), 'utf8')
			check(pj.indexOf('pages/teacher/teaching/index') >= 0, '教学页已注册到 pages.json')
			// 今日课表读取教师自己的记录，不复用学生端日程
			check(home.indexOf('今日课表') >= 0 && home.indexOf('loadTodaySchedule()') >= 0, '首页加载教师今日课表')
			check(home.indexOf("getTeacherRecords('schedule'") >= 0 && home.indexOf("goTeacherModule('schedule')") >= 0, '首页课表来自教师记录并可进入课表模块')
			// 断言只针对真实代码（避免命中说明性注释中的字面量）
			check(home.indexOf('@/api/home.js') === -1, '首页未引入学生端 api/home.js（不复用学生端课表数据）')
			check(home.indexOf('getSchedule(') === -1, '首页未调用学生端 getSchedule 接口')

			console.log('F1-5/F1-6：班级中心 from=assign / from=task 分支')
			var ci = readVue('pages/teacher/class/index.vue')
			check(ci.indexOf("from === 'assign'") >= 0 && ci.indexOf('&from=assign') >= 0, 'from=assign → task/create?classId=…&from=assign（供 F3 跳转）')
			check(ci.indexOf("from === 'task'") >= 0 && ci.indexOf('/pages/teacher/task/index?classId=') >= 0, 'from=task → 用户选择后进入 task/index?classId=所选')

			// ---------- F2/F3 数据层回归 + 静态接线 ----------
			console.log('F2-7：缺少 classId 时创建 API 不自建任务（Mock 层空 classId → 404）')
			return runTaskMockTests()
		})
	})
}).catch(function (e) { console.error(e); process.exit(1) })

// ---------- 深层 Mock 图：createTask 扇出 + 权限契约（F2/F3 数据链回归） ----------
function runTaskMockTests() {
	var reward = loadModule('utils/reward.js', {})
	var taskState = loadModule('utils/taskState.js', {})
	var lifecycle = loadModule('utils/taskLifecycle.js', {})
	var auth = loadModule('mock/auth.js', {})
	var classMod = loadModule('mock/class.js', { './auth.js': auth })
	var studentTask = loadModule('mock/studentTask.js', {})
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

	var teacher01 = { userId: 'teacher01', nickname: '王老师' }

	// 空 classId → 404，绝不自建任务（F2 数据层兜底）
	var emptyCls = teacherTask.createTask({ classId: '', title: '无班级任务' }, teacher01)
	eq(emptyCls.code, 404, '空 classId 创建 → 404（页面已守卫，Mock 再兜底，无任务入库）')

	console.log('F3-8：创建成功跳转接线（静态）')
	var cv = readVue('pages/teacher/task/create.vue')
	check(cv.indexOf('this.locked = true') >= 0, 'create.vue onLoad 缺 classId → 锁定表单')
	check(cv.indexOf('if (!this.classId)') >= 0, 'create.vue onSubmit 缺 classId 再次拦截')
	check(cv.indexOf("redirectTo({ url: '/pages/teacher/task/index?classId=' + self.classId })") >= 0, 'create.vue 成功（assign 源）→ redirectTo 任务列表')
	check(cv.indexOf('uni.navigateBack()') >= 0, 'create.vue 成功（任务列表源）→ navigateBack 回任务列表')
	check(cv.indexOf("from === 'assign'") >= 0, 'create.vue 依据 from=assign 选择跳转方式')

	console.log('F3-9：StudentTask 扇出回归（纯 ADMIN vs 双身份）')
	// 双身份班（joinSelf=true）：ADMIN+MEMBER，学生身份计入扇出
	var dual = classMod.createClass({ name: 'P45B双身份', joinSelf: true }, { userId: 'student01', nickname: '小明同学' })
	eq(dual.code, 200, '双身份班创建成功')
	var rDual = teacherTask.createTask({ classId: dual.data.classId, title: '双身份任务', deadline: lifecycle.todayStr() }, { userId: 'student01', nickname: '小明同学' })
	eq(rDual.code, 200, '双身份班创建任务成功')
	eq(rDual.data.assignedCount, 1, '扇出=1（仅 ACTIVE MEMBER，ADMIN 身份不计重复）')

	// 纯 ADMIN 班（joinSelf=false）：只有教师 ADMIN，无学生 → 扇出=0
	var pureAdmin = classMod.createClass({ name: 'P45B纯ADMIN', joinSelf: false }, { userId: 'teacher02', nickname: '李老师' })
	eq(pureAdmin.code, 200, '纯 ADMIN 班创建成功')
	var rPure = teacherTask.createTask({ classId: pureAdmin.data.classId, title: '纯ADMIN任务', deadline: lifecycle.todayStr() }, { userId: 'teacher02', nickname: '李老师' })
	eq(rPure.code, 200, '纯 ADMIN 班创建任务成功')
	eq(rPure.data.assignedCount, 0, '扇出=0（无 ACTIVE MEMBER，不产生伪学生任务）')

	// 学生端同步通道（addClassTask）仍被调用，F2/F3 不影响既有同步
	check(typeof home.addClassTask === 'function', 'mock/home.addClassTask 接口保留（学生端同步不受影响）')

	console.log('\n测试结果：PASS ' + pass + ' / FAIL ' + fail)
	if (fail > 0) process.exit(1)
}
