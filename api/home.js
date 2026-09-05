// ============================================================
// 学生端首页 API 封装层
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- 首页 API 总表（未来 Spring Boot） ----------------
// 方法    路径                                      用途
// GET     /api/student/home/today                   首页聚合数据（welcome+tasks+schedule+reviews+studyDuration）
// GET     /api/student/home/welcome                 每日欢迎（问候语 + 个性化欢迎语）
// GET     /api/student/home/today/tasks             今日任务列表
// PATCH   /api/student/home/today/tasks/{taskId}    修改任务完成状态  body: { completed: true }
// GET     /api/student/home/schedule                今日学习安排（时间轴）
// GET     /api/student/home/reviews                 今天该复习什么
// GET     /api/student/rewards/today                今日奖励（完成度 / 今日预计学习金币 / 每日上限）
// GET     /api/student/home/today/study-duration    今日学习时长（分钟）
//
// ---------------- 其他模块 API 预留（当前仅设计，不开发） ----------------
// GET     /api/student/wrongbook                    错题本列表
// GET     /api/student/wrongbook/{id}               错题详情
// GET     /api/student/workbench                    工作台数据
// PUT     /api/student/workbench                    更新工作台配置
// GET     /api/student/profile                      个人中心
// PUT     /api/student/profile                      更新个人资料
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/home.js'

// 1. 首页聚合数据
export function getHomeToday() {
	if (USE_MOCK) return Promise.resolve(mock.fetchHomeToday())
	return request({ url: '/api/student/home/today', method: 'GET' })
}

// 2. 每日欢迎
export function getWelcome() {
	if (USE_MOCK) return Promise.resolve(mock.fetchWelcome())
	return request({ url: '/api/student/home/welcome', method: 'GET' })
}

// 3. 今日任务列表
export function getTodayTasks() {
	if (USE_MOCK) return Promise.resolve(mock.fetchTasks())
	return request({ url: '/api/student/home/today/tasks', method: 'GET' })
}

// 4. 修改任务完成状态（当前 Checkbox 只改本地状态；后端接入后此方法即真实 PATCH）
export function updateTaskCompleted(taskId, completed) {
	if (USE_MOCK) return Promise.resolve(mock.patchTask(taskId, completed))
	return request({
		url: '/api/student/home/today/tasks/' + taskId,
		method: 'PATCH',
		data: { completed: completed }
	})
}

// 5. 今日学习安排
export function getSchedule() {
	if (USE_MOCK) return Promise.resolve(mock.fetchSchedule())
	return request({ url: '/api/student/home/schedule', method: 'GET' })
}

// 6. 今天该复习什么
export function getReviews() {
	if (USE_MOCK) return Promise.resolve(mock.fetchReviews())
	return request({ url: '/api/student/home/reviews', method: 'GET' })
}

// 7. 今日奖励（完成度 / 今日预计学习金币）
export function getTodayRewards() {
	if (USE_MOCK) return Promise.resolve(mock.fetchRewards())
	return request({ url: '/api/student/rewards/today', method: 'GET' })
}

// 8. 今日学习时长
export function getStudyDuration() {
	if (USE_MOCK) return Promise.resolve(mock.fetchStudyDuration())
	return request({ url: '/api/student/home/today/study-duration', method: 'GET' })
}
