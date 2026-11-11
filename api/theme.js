// ============================================================
// 主题设置 API 封装层（视觉层）
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- API 总表（未来 Spring Boot） ----------------
// 方法    路径                     用途
// GET     /api/student/theme       获取主题状态（currentTheme/homeTheme/workbenchTheme/syncWorkbenchTheme）
// PATCH   /api/student/theme       局部更新主题（如切换首页主题、同步工作台主题）
//
// 说明：主题只影响视觉表现，不涉及金币/银币/任务等任何业务数据；
//       最终主题状态以后端返回为权威，前端不使用 localStorage 作为最终数据。
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/theme.js'

// 1. 获取主题状态
export function getTheme() {
	if (USE_MOCK) return Promise.resolve(mock.fetchTheme())
	return request({ url: '/api/student/theme', method: 'GET' })
}

// 2. 局部更新主题状态（PATCH 语义，只传需要修改的字段）
export function updateTheme(patch) {
	if (USE_MOCK) return Promise.resolve(mock.updateTheme(patch))
	return request({
		url: '/api/student/theme',
		method: 'PATCH',
		data: patch
	})
}
