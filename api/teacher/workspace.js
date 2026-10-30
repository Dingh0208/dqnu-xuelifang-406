// 教师工作台模块 API；Mock 阶段按账号本地持久化，后端接入时使用统一 request 封装。
import { USE_MOCK } from '@/utils/config.js'
import { request } from '../request.js'
import * as mock from '@/mock/teacher/workspace.js'

var PATHS = {
	memos: '/api/teacher/memos',
	activities: '/api/teacher/activities',
	conversations: '/api/teacher/conversations',
	courseware: '/api/teacher/courseware',
	schedule: '/api/teacher/schedule',
	grades: '/api/teacher/exams',
	studentMeta: '/api/teacher/student-profiles'
}

function pathFor(type, id) {
	if (!PATHS[type]) throw new Error('未知教师模块')
	return PATHS[type] + (id ? '/' + encodeURIComponent(id) : '')
}

function writePayload(type, record) {
	var payload = Object.assign({}, record || {})
	delete payload.id
	delete payload.createdAt
	delete payload.updatedAt
	if (type === 'schedule' || type === 'activities') delete payload.className
	return payload
}

export function getTeacherRecords(type, params) {
	if (USE_MOCK) return Promise.resolve().then(function () { return mock.getTeacherRecords(type) })
	return request({ url: pathFor(type), method: 'GET', data: params || {} }).then(function (res) {
		var data = (res && res.data) || {}
		return data.items || data.lessons || data.records || []
	})
}

export function saveTeacherRecord(type, record) {
	if (USE_MOCK) return Promise.resolve().then(function () { return mock.saveTeacherRecord(type, record) })
	var existing = record && record.id
	return request({
		url: pathFor(type, existing),
		method: existing ? 'PATCH' : 'POST',
		data: writePayload(type, record)
	}).then(function (res) { return (res && res.data) || {} })
}

export function deleteTeacherRecord(type, id) {
	if (USE_MOCK) return Promise.resolve().then(function () { return mock.deleteTeacherRecord(type, id) })
	return request({ url: pathFor(type, id), method: 'DELETE' })
}
