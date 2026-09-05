// ============================================================
// 工作台 API 封装层
// 页面/组件只调用本文件的方法；USE_MOCK = true 时返回 Mock Promise，不发送真实请求。
//
// ---------------- 工作台 API 总表（未来 Spring Boot） ----------------
// 方法    路径                                            用途
// GET     /api/student/workbench/inspirations            工作台灵感列表
// GET     /api/student/workbench/inspirations/{id}       单个灵感详情
// POST    /api/student/workbench/create                  从零创建工作台（提交自由描述）
// POST    /api/student/workbench/{id}/generate           触发 AI 生成
// GET     /api/student/workbench/{id}                    工作台详情
// PATCH   /api/student/workbench/{id}                    修改工作台
// GET     /api/student/workbench/create-modes            获取创建模式（可选，当前前端写死）
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/workbench.js'

// 1. 工作台灵感列表
export function getInspirations() {
	if (USE_MOCK) return Promise.resolve(mock.fetchInspirations())
	return request({ url: '/api/student/workbench/inspirations', method: 'GET' })
}

// 2. 单个灵感详情
export function getInspirationDetail(id) {
	if (USE_MOCK) return Promise.resolve(mock.fetchInspirationDetail(id))
	return request({ url: '/api/student/workbench/inspirations/' + id, method: 'GET' })
}

// 3. 创建工作台（提交自由描述）
export function createWorkbench(payload) {
	if (USE_MOCK) return Promise.resolve(mock.createWorkbench(payload))
	return request({ url: '/api/student/workbench/create', method: 'POST', data: payload || {} })
}

// 4. 触发 AI 生成
export function generateWorkbench(workbenchId, options) {
	if (USE_MOCK) return Promise.resolve(mock.generateWorkbench(workbenchId, options))
	return request({
		url: '/api/student/workbench/' + workbenchId + '/generate',
		method: 'POST',
		data: options || {}
	})
}

// 5. 工作台详情
export function getWorkbenchDetail(workbenchId) {
	if (USE_MOCK) return Promise.resolve(mock.fetchWorkbenchDetail(workbenchId))
	return request({ url: '/api/student/workbench/' + workbenchId, method: 'GET' })
}

// 6. 修改工作台
export function updateWorkbench(workbenchId, patch) {
	if (USE_MOCK) return Promise.resolve(mock.updateWorkbench(workbenchId, patch))
	return request({
		url: '/api/student/workbench/' + workbenchId,
		method: 'PATCH',
		data: patch || {}
	})
}

// 7. 创建模式列表
export function getCreateModes() {
	if (USE_MOCK) return Promise.resolve(mock.fetchCreateModes())
	return request({ url: '/api/student/workbench/create-modes', method: 'GET' })
}

// 8. mode → 显示名称（纯前端工具方法，不发请求）
export function getCreateModeLabel(mode) {
	return mock.getCreateModeLabel(mode)
}

// 9. 灵感 → 默认填入输入框的用户提示（作为 AI 创作上下文起点）
export function buildInspirationPrompt(item) {
	return mock.buildInspirationPrompt(item)
}
