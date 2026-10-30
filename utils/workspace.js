// ============================================================
// 工作空间（Workspace）切换辅助 —— 纯前端轻量模块
//
// 设计原则（与项目架构约束保持一致）：
//   1. User 只是账号；登录时选择的学生/教师/家长入口是「本次进入的 Workspace」，
//      不修改 user.role，不复制账号，不建立第二套登录/token 体系。
//   2. 教师管理权限唯一来源：ClassMembership.role === 'ADMIN' && status === 'ACTIVE'，
//      绑定具体 classId；本模块只读取，不做权限判定之外的任何业务。
//   3. 判断 ADMIN 必须走 API 层（api/class.getClasses → USE_MOCK → mock/class.js），
//      页面与本模块都不直接 import mock，保持 page → api → mock/request 分层。
//   4. 工作空间是平级关系，跨空间切换统一用 reLaunch 清栈，避免学生/教师页面栈互嵌。
// ============================================================

import * as authApi from '@/api/auth.js'
import { getClasses } from '@/api/class.js'

// 两个工作空间首页（唯一事实来源，禁止在页面里散落硬编码路径）
export var STUDENT_HOME_URL = '/pages/index/index'
export var TEACHER_HOME_URL = '/pages/teacher/home'

// 查询当前登录用户拥有管理权（ACTIVE ADMIN）的班级列表。
// 未登录返回空数组；请求异常必须抛出，不能伪装成「没有管理班级」。
export function fetchManagedClasses() {
	if (!authApi.isLoggedIn()) return Promise.resolve([])
	return getClasses()
		.then(function (res) {
			if (res && res.code === 200 && res.data) return res.data.managedClasses || []
			throw new Error((res && res.message) || '管理班级加载失败')
		})
}

// 进入教师工作空间。
//   classId 可选：从「我管理的班级 → 进入管理」等明确班级入口传入时聚焦该班；
//   从「我的 → 进入教师工作台」泛入口调用时不传，教师首页展示全部管理班级。
// 返回 Promise<boolean>：true=已切换；false=未登录（已跳登录）或没有可管理班级（调用方引导创建）。
export function enterTeacherWorkspace(classId) {
	if (!authApi.isLoggedIn()) {
		authApi.requireLogin()
		return Promise.resolve(false)
	}
	return fetchManagedClasses().then(function (list) {
		if (!list || list.length === 0) return false
		var target = classId || ''
		// 若指定了 classId，必须确认当前用户确实拥有该班 ADMIN，防止越权进入
		if (target) {
			var allowed = false
			for (var i = 0; i < list.length; i++) {
				if (list[i].id === target) { allowed = true; break }
			}
			if (!allowed) return false
		}
		if (typeof authApi.setTeacherWorkspaceAccess === 'function') authApi.setTeacherWorkspaceAccess()
		uni.reLaunch({ url: TEACHER_HOME_URL + (target ? '?classId=' + target : '') })
		return true
	})
}

// 进入学生学习空间。不重新登录、不修改 User/role，登录态自然保持。
export function enterStudentWorkspace() {
	if (!authApi.isLoggedIn()) {
		authApi.requireLogin()
		return
	}
	if (typeof authApi.clearTeacherWorkspaceAccess === 'function') authApi.clearTeacherWorkspaceAccess()
	uni.reLaunch({ url: STUDENT_HOME_URL })
}

// 根据当前用户管理的班级列表，解析「布置任务」的目标班级（导航决策纯函数，便于单测）：
//   none  → 无管理班（应引导创建班级）
//   single→ 唯一管理班（可直接进入其任务创建页，无需选择）
//   multi → 多个管理班（必须进入班级中心让用户选择，禁止替用户瞎选某个班）
export function resolveAssignTargetClass(managedList) {
	var list = managedList || []
	if (list.length === 0) return { type: 'none', classId: '' }
	if (list.length === 1) return { type: 'single', classId: list[0].id }
	return { type: 'multi', classId: '' }
}

// 进入「任务管理」的统一导航（教师端任务 Tab 与首页任务统计卡共用，确保决策一致）：
//   none  → 无管理班：提示并引导创建班级
//   single→ 唯一管理班：直接进入该班任务列表（携带真实 classId）
//   multi → 多管理班：进入班级中心并标记 from=task，由用户选择后进入任务列表（不替用户瞎选）
// 返回 Promise<{type, classId}>：解析结果，便于单测断言；导航副作用通过 uni 触发。
export function goTaskCenter() {
	if (!authApi.isLoggedIn()) {
		// 未登录：交给统一登录守卫处理（会 reLaunch 到身份选择页）
		authApi.requireLogin()
		return Promise.resolve({ type: 'none', classId: '', navigated: false })
	}
	return fetchManagedClasses().then(function (list) {
		var r = resolveAssignTargetClass(list)
		if (r.type === 'none') {
			uni.showToast({ title: '还没有管理的班级，请先创建', icon: 'none' })
			setTimeout(function () {
				uni.navigateTo({ url: '/pages/teacher/class/create' })
			}, 1200)
		} else if (r.type === 'single') {
			uni.navigateTo({ url: '/pages/teacher/task/index?classId=' + r.classId })
		} else {
			uni.navigateTo({ url: '/pages/teacher/class/index?from=task' })
		}
		return r
	}).catch(function () {
		uni.showToast({ title: '班级信息加载失败，请重试', icon: 'none' })
		return { type: 'error', classId: '' }
	})
}

// 进入「布置任务」的统一导航（首页快捷操作与教学模块共用，确保决策一致）：
//   none  → 无管理班：提示并引导创建班级
//   single→ 唯一管理班：直接进入其任务创建页（携带真实 classId）
//   multi → 多管理班：进入班级中心并标记 from=assign，由用户选择（不替用户瞎选）
// 返回 Promise<{type, classId}>：解析结果，便于单测断言；导航副作用通过 uni 触发。
export function goAssignTask() {
	if (!authApi.isLoggedIn()) {
		authApi.requireLogin()
		return Promise.resolve({ type: 'none', classId: '', navigated: false })
	}
	return fetchManagedClasses().then(function (list) {
		var r = resolveAssignTargetClass(list)
		if (r.type === 'none') {
			uni.showToast({ title: '还没有管理的班级，请先创建', icon: 'none' })
			setTimeout(function () {
				uni.navigateTo({ url: '/pages/teacher/class/create' })
			}, 1200)
		} else if (r.type === 'single') {
			uni.navigateTo({ url: '/pages/teacher/task/create?classId=' + r.classId })
		} else {
			uni.navigateTo({ url: '/pages/teacher/class/index?from=assign' })
		}
		return r
	}).catch(function () {
		uni.showToast({ title: '班级信息加载失败，请重试', icon: 'none' })
		return { type: 'error', classId: '' }
	})
}
