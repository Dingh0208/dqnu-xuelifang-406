// 家长端接口契约层。
// Mock 开启时只返回本地数据；切换 USE_MOCK 后页面无需改动即可接入后端。
//
// GET  /api/parent/home?childId=                 家长总览
// GET  /api/parent/reports/weekly?childId=&weekOffset=  学习周报
// GET  /api/parent/children                      已绑定孩子
// GET  /api/parent/children/{childId}/dashboard  孩子成长数据
// GET  /api/parent/profile                       家长资料及服务入口
// POST /api/parent/reminders                     创建提醒
// POST /api/parent/children/bind                 绑定孩子

import { USE_MOCK } from '@/utils/config.js'
import { request } from '@/api/request.js'
import * as mock from '@/mock/parent/dashboard.js'

function run(mockFn, options) {
	if (USE_MOCK) return Promise.resolve(mockFn((options && options.data) || {}))
	return request(options)
}

export function getParentHome(childId) {
	return run(mock.fetchHome, {
		url: '/api/parent/home',
		method: 'GET',
		data: childId ? { childId: childId } : {}
	})
}

export function getWeeklyReport(childId, weekOffset) {
	return run(mock.fetchWeeklyReport, {
		url: '/api/parent/reports/weekly',
		method: 'GET',
		data: { childId: childId, weekOffset: Number(weekOffset || 0) }
	})
}

export function getChildren() {
	return run(mock.fetchChildren, { url: '/api/parent/children', method: 'GET' })
}

export function getChildDashboard(childId) {
	return run(mock.fetchChildDashboard, {
		url: '/api/parent/children/' + encodeURIComponent(childId || '') + '/dashboard',
		method: 'GET',
		data: { childId: childId }
	})
}

export function getParentProfile() {
	return run(mock.fetchParentProfile, { url: '/api/parent/profile', method: 'GET' })
}

export function createReminder(payload) {
	if (USE_MOCK) return Promise.resolve(mock.createReminder(payload || {}))
	return request({ url: '/api/parent/reminders', method: 'POST', data: payload || {} })
}

export function bindChild(payload) {
	if (USE_MOCK) return Promise.resolve(mock.bindChild(payload || {}))
	return request({ url: '/api/parent/children/bind', method: 'POST', data: payload || {} })
}

