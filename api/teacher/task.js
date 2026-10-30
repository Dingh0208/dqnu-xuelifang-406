// ============================================================
// 教师端任务 API 封装层
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// 当前接口：
// GET     /api/teacher/classes/{classId}/tasks     班级任务列表
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from '../request.js'
import * as mock from '@/mock/teacher/task.js'
import { getLoginUser } from '../auth.js'

function currentTeacherUser() {
	var user = getLoginUser()
	if (!user || !user.account) return null
	return { userId: user.account, nickname: user.nickname }
}

// GET /api/teacher/classes/{classId}/tasks
// 返回：{ classInfo, tasks }
// 权限：仅该班级 ADMIN 可查看；未登录 401 / 不存在 404 / 非 ADMIN 403
export function getClassTasks(classId) {
	if (USE_MOCK) return Promise.resolve(mock.getClassTasks(classId, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/tasks', method: 'GET' })
}

// POST /api/teacher/classes/{classId}/tasks
// payload: { classId, title, description, deadline }
// 返回：{ task, assignedCount }
export function createTask(payload) {
	if (USE_MOCK) return Promise.resolve(mock.createTask(payload, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + payload.classId + '/tasks', method: 'POST', data: payload })
}

// GET /api/teacher/classes/{classId}/tasks/{taskId}
// 返回：{ task, progress: { total, completed, pending, ended } }
export function getTaskDetail(classId, taskId) {
	if (USE_MOCK) return Promise.resolve(mock.getTaskDetail(classId, taskId, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/tasks/' + taskId, method: 'GET' })
}

// GET /api/teacher/classes/{classId}/tasks/{taskId}/progress
// 返回：{ task, stats:{total,completed,pending,ended}, members:[{userId,nickname,status,completedAt}] }
export function getTaskProgress(classId, taskId) {
	if (USE_MOCK) return Promise.resolve(mock.getTaskProgress(classId, taskId, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/tasks/' + taskId + '/progress', method: 'GET' })
}
