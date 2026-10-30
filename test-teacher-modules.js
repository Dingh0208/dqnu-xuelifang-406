// 教师端登录与模块数据回归
// 运行：node test-teacher-modules.js
// 覆盖真实登录成功码 200、教师首页路由、导航拦截器放行参数，以及 Mock 模块 CRUD/账号隔离。
var fs = require('fs')
var path = require('path')
var ROOT = __dirname
var storage = {}
var launches = []
var uni = {
	getStorageSync: function (key) { return storage[key] },
	setStorageSync: function (key, value) { storage[key] = value },
	removeStorageSync: function (key) { delete storage[key] },
	reLaunch: function (options) { launches.push(options && options.url) }
}

var pass = 0
var fail = 0
function check(condition, message) {
	if (condition) { pass++; console.log('  PASS  ' + message) }
	else { fail++; console.log('  FAIL  ' + message) }
}
function equal(actual, expected, message) { check(actual === expected, message + '（实际=' + JSON.stringify(actual) + '）') }

function loadModule(relativePath, dependencies) {
	var source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
	var exported = []
	var exportRe = /export (?:function|const|var|let) (\w+)/g
	var match
	while ((match = exportRe.exec(source)) !== null) exported.push(match[1])
	var imports = {}
	var importRe = /import \{([^}]+)\} from '([^']+)'/g
	while ((match = importRe.exec(source)) !== null) imports[match[2]] = match[1]
	var namespaces = {}
	var namespaceRe = /import \* as (\w+) from '([^']+)'/g
	while ((match = namespaceRe.exec(source)) !== null) namespaces[match[2]] = match[1]
	source = source.replace(/import \{[^}]+\} from '[^']+'/g, '')
	source = source.replace(/import \* as \w+ from '[^']+';?/g, '')
	source = source.replace(/export \{[^}]+\} from '[^']+';?/g, '')
	source = source.replace(/export default [\w$]+;?/g, '')
	source = source.replace(/export function (\w+)/g, 'var $1 = function $1')
	source = source.replace(/export (const|var|let) (\w+)/g, '$1 $2')
	var keys = Object.keys(dependencies || {})
	var params = keys.map(function (_, index) { return 'd' + index })
	var header = ''
	keys.forEach(function (key, index) {
		if (namespaces[key]) header += 'var ' + namespaces[key] + ' = d' + index + ';\n'
		else header += 'var {' + imports[key] + '} = d' + index + ';\n'
	})
	var fn = new Function('uni', ...params, header + source + ';\nreturn {' + exported.join(',') + '};')
	return fn(uni, ...keys.map(function (key) { return dependencies[key] }))
}

console.log('Case 1：Mock 教师账号登录后进入教师首页')
var mockAuth = loadModule('mock/auth.js', {})
var config = loadModule('utils/config.js', {})
var request = loadModule('api/request.js', { '@/utils/config.js': config })
var auth = loadModule('api/auth.js', {
	'@/utils/config.js': config,
	'./request.js': request,
	'@/mock/auth.js': mockAuth
})
mockAuth.mockLogin({ account: 'teacher01', password: '123456' }).then(function (loginResult) {
	equal(loginResult.code, 0, '教师账号 Mock 登录成功码为 0')
	auth.saveLoginUser(loginResult.data)
	equal(auth.getLoginUser().role, 'teacher', '登录用户角色为 teacher')
	equal(storage.student_token, 'mock-token-teacher01', '登录成功写入统一 Token')
	equal(auth.ROLE_HOME.teacher, '/pages/teacher/home', '教师角色首页路由正确')

	console.log('Case 2：真实接口 code=200 / data.user 归一化')
	var realAuth = loadModule('api/auth.js', {
		'@/utils/config.js': { USE_MOCK: false },
		'./request.js': {
			request: function () {
				return Promise.resolve({
					code: 200,
					message: 'success',
					data: { token: 'server-token', user: { id: 'u-teacher', nickname: '老师', roles: ['teacher'] } }
				})
			},
			setToken: function (token) { storage.student_token = token },
			getToken: function () { return storage.student_token || '' },
			clearToken: function () { delete storage.student_token }
		},
		'@/mock/auth.js': mockAuth
	})
	return realAuth.login({ account: 'server-teacher', password: 'secret' }).then(function (result) {
		equal(result.code, 0, '真实接口成功码 200 被登录页契约归一为 0')
		equal(result.data.role, 'teacher', 'data.user.roles 被归一为 role')
		equal(result.data.token, 'server-token', '顶层 Token 被合并到登录用户')
	realAuth.saveLoginUser(result.data)
	equal(storage.student_token, 'server-token', '真实 Token 写入统一存储')
		storage.login_user_info = { account: 'parent01', role: 'parent' }
		check(realAuth.requireTeacher() === false, '家长账号不能进入教师页面')
		equal(launches[launches.length - 1], '/pages/parent/home', '家长账号回到家长首页')
		realAuth.saveLoginUser({ account: 'student01', role: 'student' })
		check(realAuth.requireTeacher() === false, '未通过班级管理入口的学生不能直达教师页面')
		equal(launches[launches.length - 1], '/pages/index/index', '学生直达教师路由回到学生首页')
		realAuth.setTeacherWorkspaceAccess()
		check(realAuth.requireTeacher() === true, '班级管理员切入教师工作区后可打开教师页面')
		realAuth.clearTeacherWorkspaceAccess()
		global.getCurrentPages = function () { return [{ route: 'pages/teacher/class/create' }] }
		check(realAuth.requireTeacher() === true, '学生仍可从班级入口打开创建班级表单')
		delete global.getCurrentPages
		realAuth.saveLoginUser({ account: 'teacher01', role: 'teacher', token: 'server-token' })

		console.log('Case 3：教师模块 CRUD 按账号隔离')
		var workspace = loadModule('mock/teacher/workspace.js', {})
		storage.login_user_info = { account: 'teacher01', role: 'teacher' }
		storage['teacher_workspace_v1:teacher01'] = { memos: [{ id: 'legacy-memo', category: '教学', priority: '紧急', pinned: true, status: 'OPEN' }] }
		var legacyMemo = workspace.getTeacherRecords('memos')[0]
		equal(legacyMemo.category, 'TEACHING', '旧备忘分类兼容到 MD 枚举')
		equal(legacyMemo.priority, 'URGENT', '旧备忘优先级兼容到 MD 枚举')
		equal(legacyMemo.starred, true, '旧 pinned 字段兼容为 starred')
		storage['teacher_workspace_v1:teacher01'] = undefined
		var created = workspace.saveTeacherRecord('memos', { title: '准备家长会', category: '会议', pinned: true, status: 'OPEN' })
		check(!!created.id, '备忘创建生成稳定 id')
		equal(created.category, 'MEETING', '新备忘使用 MD 分类枚举')
		equal(created.starred, true, '新备忘置顶写入 starred 字段')
		check(workspace.getTeacherRecords('memos').length === 1, '备忘列表可读取')
		var updated = workspace.saveTeacherRecord('memos', Object.assign({}, created, { status: 'DONE', starred: false }))
		equal(updated.status, 'DONE', '备忘可编辑并完成')
		equal(workspace.getTeacherRecords('memos')[0].starred, false, '备忘可取消置顶')
		storage.login_user_info = { account: 'another-teacher', role: 'teacher' }
		check(workspace.getTeacherRecords('memos').length === 0, '不同账号看不到他人的备忘')
		storage.login_user_info = { account: 'teacher01', role: 'teacher' }
		equal(workspace.deleteTeacherRecord('memos', created.id), true, '备忘可删除')
		equal(workspace.getTeacherRecords('memos').length, 0, '删除后列表为空')

		console.log('Case 4：导航拦截器放行原始 options')
		var appSource = fs.readFileSync(path.join(ROOT, 'App.vue'), 'utf8')
		check(appSource.indexOf('return options') >= 0, '导航放行返回原始 options')
		check(appSource.indexOf('return true') < 0, '导航拦截器不再返回 true 丢失路由参数')
		check(appSource.indexOf("path === '/pages/auth/select'") >= 0, '登录入口被拦截器明确放行')
		var appScript = appSource.match(/<script>([\s\S]*?)<\/script>/)[1]
		appScript = appScript.replace(/import \{[^}]+\} from '[^']+';?/, '').replace('export default', 'var app =')
		var registered = {}
		var appLaunches = []
		var appUni = {
			addInterceptor: function (method, handlers) { registered[method] = handlers },
			reLaunch: function (options) { appLaunches.push(options.url) }
		}
		var loggedIn = true
		var app = new Function('uni', 'isLoggedIn', appScript + '\nreturn app;')(appUni, function () { return loggedIn })
		app.onLaunch()
		var teacherRoute = { url: realAuth.ROLE_HOME.teacher }
		equal(registered.reLaunch.invoke(teacherRoute), teacherRoute, '已登录后教师首页 reLaunch 保留原始 options')
		var loginRoute = { url: '/pages/auth/login?role=teacher' }
		equal(registered.navigateTo.invoke(loginRoute), loginRoute, '登录页导航保留 role 参数')
		loggedIn = false
		equal(registered.reLaunch.invoke({ url: '/pages/teacher/home' }), false, '未登录不能直接进入教师首页')
		equal(appLaunches[0], '/pages/auth/select', '未登录教师路由回身份选择页')

		console.log('Case 5：教师页面路由与模块入口完整')
		var pageConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages.json'), 'utf8'))
		var teacherPages = pageConfig.pages.filter(function (page) { return page.path.indexOf('pages/teacher/') === 0 })
		check(teacherPages.length >= 14, '教师首页及业务页面均已注册')
		check(teacherPages.every(function (page) { return fs.existsSync(path.join(ROOT, page.path + '.vue')) }), '每条教师路由都有页面文件')
		check(teacherPages.every(function (page) { return fs.readFileSync(path.join(ROOT, page.path + '.vue'), 'utf8').indexOf('requireTeacher()') >= 0 }), '教师页面统一执行登录守卫')
		var teachingPage = fs.readFileSync(path.join(ROOT, 'pages/teacher/teaching/index.vue'), 'utf8')
		var homePage = fs.readFileSync(path.join(ROOT, 'pages/teacher/home.vue'), 'utf8')
		var moduleSource = fs.readFileSync(path.join(ROOT, 'pages/teacher/module/index.vue'), 'utf8')
		var loginSource = fs.readFileSync(path.join(ROOT, 'pages/auth/login.vue'), 'utf8')
		var loginScript = loginSource.match(/<script>([\s\S]*?)<\/script>/)[1]
		loginScript = loginScript.replace(/import \* as (\w+) from '[^']+';?/g, '').replace('export default', 'var loginPage =')
		var loginTargets = []
		var realSetTimeout = global.setTimeout
		global.setTimeout = function (callback) { callback() }
		var loginPage = new Function('authApi', 'uni', loginScript + '\nreturn loginPage;')(
			realAuth,
			{ reLaunch: function (options) { loginTargets.push(options.url) }, showToast: function () {} }
		)
		loginPage.methods.goRoleHome('teacher')
		global.setTimeout = realSetTimeout
		equal(loginTargets[0], '/pages/teacher/home', '登录页将 teacher 角色 reLaunch 到教师首页')
		;['memo', 'activity', 'summary', 'conversation', 'courseware', 'schedule', 'grades', 'students', 'homework'].forEach(function (key) {
			var hasEntry = key === 'homework'
				? homePage.indexOf("key: 'homework'") >= 0 && teachingPage.indexOf('作业') >= 0
				: moduleSource.indexOf('\n\t\t' + key + ': {') >= 0
			check(hasEntry, '教师模块含入口：' + key)
		})
		var moduleScript = moduleSource.match(/<script>([\s\S]*?)<\/script>/)[1]
		moduleScript = moduleScript.replace(/import \* as (\w+) from '[^']+';?/g, '').replace(/import \{[^}]+\} from '[^']+';?/g, '').replace('export default', 'var page =')
		var page = new Function('uni', 'authApi', 'workspaceApi', 'classApi', 'taskApi', moduleScript + '\nreturn page;')(
			Object.assign({}, uni, { showToast: function () {} }),
			{ requireTeacher: function () { return true } },
			{ getTeacherRecords: function () { return Promise.resolve([]) }, saveTeacherRecord: function () { return Promise.resolve({}) }, deleteTeacherRecord: function () { return Promise.resolve(true) } },
			{ getClasses: function () { return Promise.resolve({ code: 200, data: { managedClasses: [] } }) }, getClassMembers: function () { return Promise.resolve({ code: 200, data: { members: [] } }) } },
			{ getClassTasks: function () { return Promise.resolve({ code: 200, data: { tasks: [] } }) } }
		)
		var scheduleContext = page.data()
		scheduleContext.module = 'schedule'
		scheduleContext.classes = [{ id: 'c-1', name: '一班' }]
		scheduleContext.form = page.methods.emptyForm.call(scheduleContext)
		check(typeof scheduleContext.form.weekday === 'number', '课表默认星期使用 1–7 数值')
		var validationContext = Object.assign({}, scheduleContext, {
			form: { classId: 'c-1', subject: '语文', weekday: 1, period: 1, startTime: '08:00', endTime: '08:45', effectiveFrom: '2026-10-01', effectiveTo: '' }
		})
		Object.defineProperty(validationContext, 'config', { get: function () { return page.computed.config.call(this) } })
		equal(page.methods.validateForm.call(validationContext), true, '合法周课表记录可提交')
		validationContext.form.endTime = '07:55'
		equal(page.methods.validateForm.call(validationContext), false, '结束时间早于开始时间时拦截')
		var createPage = fs.readFileSync(path.join(ROOT, 'pages/teacher/class/create.vue'), 'utf8')
		check(createPage.indexOf('authApi.setTeacherWorkspaceAccess()') >= 0, '新建班级成功后进入工作台前设置已授权空间')
		var requestOptions = null
		var liveWorkspaceApi = loadModule('api/teacher/workspace.js', {
			'@/utils/config.js': { USE_MOCK: false },
			'../request.js': { request: function (options) { requestOptions = options; return Promise.resolve({ data: { id: 'lesson-1' } }) } },
			'@/mock/teacher/workspace.js': {}
		})
		return liveWorkspaceApi.saveTeacherRecord('schedule', {
			id: 'lesson-1', classId: 'c-1', className: '一班', weekday: 1, period: 2,
			startTime: '08:00', endTime: '08:45', effectiveFrom: '2026-10-01', createdAt: 'old', updatedAt: 'old'
		}).then(function () {
			equal(requestOptions.method, 'PATCH', '課表更新使用 PATCH')
			equal(requestOptions.url, '/api/teacher/schedule/lesson-1', '課表路徑帶記錄 ID')
			equal(requestOptions.data.weekday, 1, '課表 API 傳輸數值 weekday')
			check(!('id' in requestOptions.data) && !('className' in requestOptions.data) && !('createdAt' in requestOptions.data), '課表 API 不提交冗餘展示與審計欄位')

			console.log('\n测试结果：PASS ' + pass + ' / FAIL ' + fail)
			if (fail > 0) process.exit(1)
		})
	})
}).catch(function (error) {
	console.error(error)
	process.exit(1)
})
