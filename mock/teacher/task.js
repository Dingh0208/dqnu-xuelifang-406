// ============================================================
// Mock 数据层：教师端任务列表（当前 USE_MOCK = true）
// 后端接入后页面无需改动，api/teacher/task.js 自动切到 request.js。
//
// 数据模型：
//   Task  { id, classId, title, description, createdAt, deadline, status }
//   status: 'active'（进行中）/ 'ended'（已截止）—— 当前无草稿/创建流程，种子均为 active
//
// 权限：ClassMembership.role === 'ADMIN'（与 user.role 无关）
// 完成情况：当前无 StudentTask 模型，不伪造完成数字；卡片仅展示状态。
//
// 注意：本文件是教师视角的「班级任务」数据源。
//   学生端今日任务（mock/home.js，设备级完成态）与本数据源暂不共享；
//   学生端班级任务对接在后续阶段统一改造（见 P2-0 审计报告）。
// ============================================================

import { classById, hasMembership, getActiveMemberUserIds } from '../class.js'
import { addClassTask } from '../home.js'
import { createStudentTasksForTask, getStudentTasksByTask } from '../studentTask.js'
import { getMockUserById } from '../auth.js'
import { isValidDeadline, isTaskEnded, getEffectiveTaskStatus } from '../../utils/taskLifecycle.js'

// ---------- 工具 ----------
function ok(data) { return { code: 200, message: 'success', data: data } }

function pad(n) { return n < 10 ? '0' + n : '' + n }

function todayStr() {
	var d = new Date()
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function offsetDate(days) {
	var d = new Date()
	d.setDate(d.getDate() + days)
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

// ---------- 数据（Mock 内存态） ----------
// 种子与 mock/home.js 中 class-001 的班级任务（2101/2102）语义对齐，但为独立教师视角数据源
var tasks = [
	{
		id: 't-3001', classId: 'class-001',
		title: '完成二分查找专项练习',
		description: '完成课程配套的二分查找练习题，掌握基本二分查找算法实现与边界处理。',
		createdAt: offsetDate(-2), deadline: offsetDate(3), status: 'active'
	},
	{
		id: 't-3002', classId: 'class-001',
		title: '完成英语阅读理解',
		description: '完成一篇英语阅读理解练习，提交答案并查看解析。',
		createdAt: offsetDate(-5), deadline: offsetDate(-1), status: 'ended'
	},
	{
		id: 't-3003', classId: 'class-002',
		title: '高等数学极限预习',
		description: '预习教材第 2 章极限部分，完成课后基础题。',
		createdAt: offsetDate(-1), deadline: offsetDate(5), status: 'active'
	}
]

// ---------- StudentTask 扇出由 mock/studentTask.js 统一管理（避免循环依赖） ----------

var taskSeq = 3004

// ---------- Mock API ----------

// GET /api/teacher/classes/{classId}/tasks
// 返回：{ classInfo: {id, name}, tasks: [...] }
// 权限：401 未登录 / 404 班级不存在 / 403 非该班 ADMIN
export function getClassTasks(classId, currentUser) {
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}
	var cls = classById(classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	if (!hasMembership(currentUser.userId, classId, 'ADMIN')) {
		return { code: 403, message: '你没有该班级的管理权限', data: null }
	}

	var out = []
	for (var i = 0; i < tasks.length; i++) {
		var t = tasks[i]
		if (t.classId !== classId) continue
		out.push({
			id: t.id,
			classId: t.classId,
			title: t.title,
			description: t.description,
			createdAt: t.createdAt,
			deadline: t.deadline,
			// 有效状态统一由 taskLifecycle 决定（status==='ended' 或 deadline 已过）
			status: getEffectiveTaskStatus(t)
		})
	}

	return ok({
		classInfo: { id: cls.id, name: cls.name },
		tasks: out
	})
}

// POST /api/teacher/classes/{classId}/tasks
// payload: { classId, title, description, deadline }
// 返回：{ task, assignedCount }（assignedCount = 新生成的 StudentTask 数）
// 权限：401 未登录 / 404 班级不存在 / 403 非该班 ADMIN / 400 标题为空 / 400 deadline 非法
export function createTask(payload, currentUser) {
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}
	var cls = classById(payload && payload.classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	if (!hasMembership(currentUser.userId, cls.id, 'ADMIN')) {
		return { code: 403, message: '你没有该班级的管理权限', data: null }
	}
	var title = ((payload && payload.title) || '').trim()
	if (!title) return { code: 400, message: '请输入任务标题', data: null }

	// deadline：为空沿用既有语义（默认当天）；非空必须是合法 YYYY-MM-DD
	var deadline = ((payload && payload.deadline) || '').trim()
	if (!deadline) {
		deadline = todayStr()
	} else if (!isValidDeadline(deadline)) {
		return { code: 400, message: '截止时间格式不正确，请使用 YYYY-MM-DD（如 2026-10-10）', data: null }
	}

	var task = {
		id: 't-' + (taskSeq++),
		classId: cls.id,
		title: title,
		description: ((payload && payload.description) || '').trim(),
		createdAt: todayStr(),
		deadline: deadline,
		status: 'active'
	}
	tasks.push(task)
	var memberIds = getActiveMemberUserIds(task.classId)
	var assigned = createStudentTasksForTask(task, memberIds)
	// 同步到学生端今日任务（Mock 设备级共享；幂等），并把教师端 taskId 透传给学生端以便完成回写
	addClassTask({ id: task.id, title: task.title, description: task.description, classId: task.classId })

	return ok({ task: task, assignedCount: assigned })
}

// GET /api/teacher/classes/{classId}/tasks/{taskId}
// 返回：{ task, progress: { total, completed, pending, ended } }
// 权限：401 未登录 / 404 班级或任务不存在 / 403 非该班 ADMIN
export function getTaskDetail(classId, taskId, currentUser) {
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}
	var cls = classById(classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	if (!hasMembership(currentUser.userId, classId, 'ADMIN')) {
		return { code: 403, message: '你没有该班级的管理权限', data: null }
	}

	var task = null
	for (var i = 0; i < tasks.length; i++) {
		if (tasks[i].id === taskId && tasks[i].classId === classId) { task = tasks[i]; break }
	}
	if (!task) return { code: 404, message: '任务不存在', data: null }

	// 完成情况统计（基于 StudentTask 真实状态：pending / completed）
	// 兼容旧契约：pending 统计全部未完成；ended 是「未完成且任务已结束」的子集。
	// 页面展示时使用 pendingActive（= pending - ended）避免「未完成 + 已过期」重复计数。
	var taskStudentTasks = getStudentTasksByTask(taskId)
	var total = taskStudentTasks.length
	var completed = 0, pending = 0, endedPending = 0
	var isEnded = isTaskEnded(task)
	for (var i = 0; i < taskStudentTasks.length; i++) {
		if (taskStudentTasks[i].status === 'completed') {
			completed++
		} else {
			pending++
			if (isEnded) endedPending++
		}
	}
	var pendingActive = Math.max(pending - endedPending, 0)

	return ok({
		task: {
			id: task.id,
			classId: task.classId,
			title: task.title,
			description: task.description,
			createdAt: task.createdAt,
			deadline: task.deadline,
			status: getEffectiveTaskStatus(task)
		},
		progress: { total: total, completed: completed, pending: pending, pendingActive: pendingActive, ended: endedPending }
	})
}

// GET /api/teacher/classes/{classId}/tasks/{taskId}/progress
// 返回：{ task, stats:{total,completed,pending,ended}, members:[{userId,nickname,status,completedAt}] }
// 权限：401 / 404 / 403
export function getTaskProgress(classId, taskId, currentUser) {
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}
	var cls = classById(classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	if (!hasMembership(currentUser.userId, classId, 'ADMIN')) {
		return { code: 403, message: '你没有该班级的管理权限', data: null }
	}

	var task = null
	for (var i = 0; i < tasks.length; i++) {
		if (tasks[i].id === taskId && tasks[i].classId === classId) { task = tasks[i]; break }
	}
	if (!task) return { code: 404, message: '任务不存在', data: null }

	var list = getStudentTasksByTask(taskId)
	var total = list.length, completed = 0, pending = 0, endedPending = 0
	var isEnded = isTaskEnded(task)
	var members = []
	for (var i = 0; i < list.length; i++) {
		var st = list[i]
		if (st.status === 'completed') {
			completed++
		} else {
			pending++
			if (isEnded) endedPending++
		}
		var u = getMockUserById(st.userId)
		members.push({
			userId: st.userId,
			nickname: (u && u.nickname) || ('用户' + st.userId),
			status: st.status,
			completedAt: st.completedAt
		})
	}
	// 已完成排前，未完成排后
	members.sort(function (a, b) {
		if (a.status === b.status) return 0
		return a.status === 'completed' ? -1 : 1
	})

	return ok({
		task: { id: task.id, classId: task.classId, title: task.title, deadline: task.deadline, status: getEffectiveTaskStatus(task) },
		stats: { total: total, completed: completed, pending: pending, pendingActive: Math.max(pending - endedPending, 0), ended: endedPending },
		members: members
	})
}
