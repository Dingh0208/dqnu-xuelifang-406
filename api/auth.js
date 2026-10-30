// ============================================================
// 身份选择登录/注册 API 封装层
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- 认证 API 总表（未来 Spring Boot） ----------------
// 方法    路径                    用途
// POST    /api/auth/login         登录（后端校验账号密码并返回角色 role）
// POST    /api/auth/register      注册（必须携带 role: student/teacher/parent）
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request, setToken, clearToken } from './request.js'
import * as mock from '@/mock/auth.js'

// Token 存取统一实现在 request.js（与请求头注入同一事实来源），此处转出供业务层使用，
// 禁止再出现 teacher_token / parent_token 等第二套 token Key。
export { setToken, getToken, clearToken } from './request.js'

// 登录成功后缓存的用户信息 key（角色路由依据）
var USER_KEY = 'login_user_info'
var TEACHER_WORKSPACE_KEY = 'teacher_workspace_access'
// 登录失效后统一返回的身份选择入口（与 request.js handleUnauthorized 保持一致）
var AUTH_ENTRY_URL = '/pages/auth/select'

export var ROLE_HOME = {
	student: '/pages/index/index',
	teacher: '/pages/teacher/home',
	parent: '/pages/parent/home'
}

export function getUserRole(user) {
	var value = user || getLoginUser()
	if (!value) return ''
	if (value.role) return value.role
	if (Array.isArray(value.roles) && value.roles.length) return value.roles[0]
	return ''
}

function normalizeAuthResponse(res) {
	if (!res || !res.data) return res
	var payload = res.data
	var data = payload.user && typeof payload.user === 'object'
		? Object.assign({}, payload.user, {
			token: payload.token || payload.user.token,
			expiresAt: payload.expiresAt || payload.user.expiresAt
		})
		: payload
	if (!data.role && Array.isArray(data.roles) && data.roles.length) {
		data = Object.assign({}, data, { role: data.roles[0] })
	}
	// Login page uses code=0; the documented API uses code=200 and nests the
	// authenticated user under data.user. Flatten both at this boundary.
	if (res.code === 200) return Object.assign({}, res, { code: 0, msg: res.message || res.msg || 'ok', data: data })
	return Object.assign({}, res, { data: data })
}

// 1. 登录：后端校验账号密码并返回该账号的角色
export function login(params) {
	if (USE_MOCK) return mock.mockLogin(params)
	return request({ url: '/api/auth/login', method: 'POST', data: params }).then(normalizeAuthResponse)
}

// 2. 注册：必须携带身份 role（student / teacher / parent）
export function register(params) {
	if (USE_MOCK) return mock.mockRegister(params)
	return request({ url: '/api/auth/register', method: 'POST', data: params }).then(normalizeAuthResponse)
}

// 缓存登录用户：login_user_info 存用户信息；若返回体带 token，同步写入统一 student_token。
// 两步均为同步存储，必须在页面跳转前完成，保证首页首个业务请求即可携带 Token。
export function saveLoginUser(user) {
	var normalized = user || {}
	if (!normalized.role && Array.isArray(normalized.roles) && normalized.roles.length) {
		normalized = Object.assign({}, normalized, { role: normalized.roles[0] })
	}
	try {
		uni.setStorageSync(USER_KEY, normalized)
		uni.removeStorageSync(TEACHER_WORKSPACE_KEY)
	} catch (e) {}
	if (normalized && normalized.token) {
		setToken(normalized.token)
	}
}

export function getLoginUser() {
	try {
		return uni.getStorageSync(USER_KEY) || null
	} catch (e) {
		return null
	}
}

// 是否已登录（学生 / 教师 / 家长共用；以登录用户信息是否存在为判定）
export function isLoggedIn() {
	var user = getLoginUser()
	return !!(user && (user.account || user.id) && getUserRole(user))
}

// 页面登录守卫：已登录返回 true；未登录统一 reLaunch 到身份选择页并返回 false。
// 用法（受保护页面 onShow）：if (!requireLogin()) return
export function requireLogin() {
	if (isLoggedIn()) return true
	uni.reLaunch({ url: AUTH_ENTRY_URL })
	return false
}

export function requireTeacher() {
	if (!isLoggedIn()) {
		requireLogin()
		return false
	}
	var role = getUserRole()
	if (role === 'teacher') return true
	if (role === 'student') {
		var user = getLoginUser() || {}
		var allowedUser = ''
		try { allowedUser = uni.getStorageSync(TEACHER_WORKSPACE_KEY) || '' } catch (e) {}
		if (allowedUser && allowedUser === (user.account || user.id)) return true
		// Students can open the class-creation form from their class page; all
		// other teacher routes require the membership-checked workspace switch.
		try {
			var pages = getCurrentPages()
			var current = pages.length ? pages[pages.length - 1] : null
			if (current && current.route === 'pages/teacher/class/create') return true
		} catch (e) {}
	}
	if (role === 'parent') {
		uni.reLaunch({ url: ROLE_HOME.parent })
		return false
	}
	uni.reLaunch({ url: ROLE_HOME[role] || AUTH_ENTRY_URL })
	return false
}

// 家长页面守卫：家长身份可访问；其他已登录角色回到各自首页。
export function requireParent() {
	if (!isLoggedIn()) {
		requireLogin()
		return false
	}
	var role = getUserRole()
	if (role === 'parent') return true
	uni.reLaunch({ url: ROLE_HOME[role] || AUTH_ENTRY_URL })
	return false
}

export function setTeacherWorkspaceAccess() {
	var user = getLoginUser() || {}
	var userId = user.account || user.id || ''
	if (!userId) return false
	try { uni.setStorageSync(TEACHER_WORKSPACE_KEY, userId) } catch (e) { return false }
	return true
}

export function clearTeacherWorkspaceAccess() {
	try { uni.removeStorageSync(TEACHER_WORKSPACE_KEY) } catch (e) {}
}

// 退出登录：清用户信息 + 清统一 Token（实际请求 Token 只有 student_token 一处）
export function logout() {
	try {
		var user = getLoginUser() || {}
		if (user.account) uni.removeStorageSync('student_home_task_state:' + user.account)
		uni.removeStorageSync('student_home_task_state')
		uni.removeStorageSync(USER_KEY)
		uni.removeStorageSync(TEACHER_WORKSPACE_KEY)
	} catch (e) {}
	clearToken()
}
