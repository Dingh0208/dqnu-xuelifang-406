// ============================================================
// 班级 API 封装层（学生侧）
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- 班级 API 总表（未来 Spring Boot，学生端/教师端共用同一数据模型） ----------------
// 方法    路径                                用途
// GET     /api/student/classes                我的班级（joinedClasses + managedClasses）
// GET     /api/student/classes/{classId}      班级详情（学生只读视图；后端判权，403 时提示不绕过）
// POST    /api/student/classes/join           凭邀请码加入班级 body: { inviteCode }
//
// ---------------- 未来教师端对齐（本次不实现，语义预留见 mock/class.js 尾部注释） ----------------
// POST    /api/teacher/classes                创建班级 body: { name, description, goal, joinSelf }
// 其余教师端接口（成员管理/邀请码/任务布置/进度分析）属于 dev-teacher 阶段。
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/class.js'
import { getLoginUser } from './auth.js'

// 当前登录用户在班级域的身份上下文。
// Mock 阶段 userId 取本地登录缓存的 account；后端接入后由 token 解析，
// 前端不再显式传递（本函数自动退化为不传身份，接口行为与真实后端一致）。
function currentClassUser() {
	var user = getLoginUser()
	if (!user || !user.account) return null
	return { userId: user.account, nickname: user.nickname }
}

// 1. 我的班级：{ joinedClasses: [...], managedClasses: [...] }
export function getClasses() {
	if (USE_MOCK) return Promise.resolve(mock.fetchMyClasses(currentClassUser()))
	return request({ url: '/api/student/classes', method: 'GET' })
}

// 2. 班级详情（学生只读）：{ classInfo, isMember, isAdmin }
export function getClassDetail(classId) {
	if (USE_MOCK) return Promise.resolve(mock.fetchClassDetail(classId, currentClassUser()))
	return request({ url: '/api/student/classes/' + classId, method: 'GET' })
}

// 3. 加入班级：邀请码校验由后端/mock 层负责，页面不做真实校验
export function joinClass(inviteCode) {
	if (USE_MOCK) return Promise.resolve(mock.joinClassByInviteCode(inviteCode, currentClassUser()))
	return request({ url: '/api/student/classes/join', method: 'POST', data: { inviteCode: inviteCode } })
}

// 4. 创建班级（教师/管理端流程）
//    payload: { name, description, goal, joinSelf }
//    joinSelf=true  → 创建者获得 ADMIN + MEMBER 双 membership（管理者 + 学生）
//    joinSelf=false → 仅 ADMIN membership（仅管理者）
export function createClass(payload) {
	if (USE_MOCK) return Promise.resolve(mock.createClass(payload, currentClassUser()))
	return request({ url: '/api/teacher/classes', method: 'POST', data: payload })
}

// 5. 教师端成员管理：{ classInfo, adminName, members }
//    权限：仅该班级 ACTIVE ADMIN；MEMBER / 非成员 / 未登录返回 403/401
export function getClassMembers(classId) {
	if (USE_MOCK) return Promise.resolve(mock.getClassMembers(classId, currentClassUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/members', method: 'GET' })
}
