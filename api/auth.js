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
import { request } from './request.js'
import * as mock from '@/mock/auth.js'

// 登录成功后缓存的用户信息 key（角色路由依据）
var USER_KEY = 'login_user_info'

export var ROLE_HOME = {
	student: '/pages/index/index',
	teacher: '/pages/teacher/home',
	parent: '/pages/parent/home'
}

// 1. 登录：后端校验账号密码并返回该账号的角色
export function login(params) {
	if (USE_MOCK) return mock.mockLogin(params)
	return request({ url: '/api/auth/login', method: 'POST', data: params })
}

// 2. 注册：必须携带身份 role（student / teacher / parent）
export function register(params) {
	if (USE_MOCK) return mock.mockRegister(params)
	return request({ url: '/api/auth/register', method: 'POST', data: params })
}

// 缓存/读取登录用户（供后续页面判断角色）
export function saveLoginUser(user) {
	try {
		uni.setStorageSync(USER_KEY, user || {})
	} catch (e) {}
}

export function getLoginUser() {
	try {
		return uni.getStorageSync(USER_KEY) || null
	} catch (e) {
		return null
	}
}

export function logout() {
	try {
		uni.removeStorageSync(USER_KEY)
		uni.removeStorageSync('student_token')
	} catch (e) {}
}
