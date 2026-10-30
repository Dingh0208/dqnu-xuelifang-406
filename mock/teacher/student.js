// ============================================================
// Mock 数据层：教师端「学生详情」（P3-1，当前 USE_MOCK = true）
// 后端接入后页面无需改动，api/teacher/student.js 自动切到 request.js。
//
// 【最高规则】本文件不新建任何数据模型/数据数组：
//   User            ← mock/auth.js（getMockUserById，取 nickname，不复制 users[]）
//   ClassMembership ← mock/class.js（身份/加入时间/ADMIN 权限）
//   Task            ← mock/teacher/task.js（getClassTasks，取标题/截止/状态）
//   StudentTask     ← mock/studentTask.js（getStudentTasksByClass 后按 userId 过滤）
//   学生详情 = 上述数据的实时聚合结果。
//
// 权限链（与 getClassMembers/getTaskProgress 完全一致，ClassMembership.role 判定）：
//   未登录                                   → 401
//   班级不存在                               → 404
//   查看者非该班 ACTIVE ADMIN                → 403（绝不使用 user.role==='teacher'）
//   studentId 用户不存在                     → 404
//   studentId 无该班 ACTIVE MEMBER 身份      → 404（纯 ADMIN/非成员分别给不同提示）
//   全部通过                                 → 200
//
// 双身份（ADMIN + MEMBER）：学生身份只认 ACTIVE MEMBER 记录，
//   不因成员列表 ADMIN 优先去重而丢失其 MEMBER 身份。
// ============================================================

import { classById, hasMembership, getClassMembers } from '../class.js'
import { getMockUserById } from '../auth.js'
import { getStudentTasksByClass } from '../studentTask.js'
import { getClassTasks } from './task.js'

// ---------- 工具 ----------
function ok(data) { return { code: 200, message: 'success', data: data } }

// 统一前置校验 + 取数：viewer 当前登录教师，studentId 为被查看学生 userId
// 返回 { error: 响应体 } 或 { cls, targetUser, joinedAt }
function resolveStudentContext(classId, studentId, currentUser) {
	if (!currentUser || !currentUser.userId) {
		return { error: { code: 401, message: '登录状态已失效，请重新登录', data: null } }
	}
	var cls = classById(classId)
	if (!cls) return { error: { code: 404, message: '班级不存在', data: null } }

	// 班级级管理权限：仅 ACTIVE ADMIN
	if (!hasMembership(currentUser.userId, classId, 'ADMIN')) {
		return { error: { code: 403, message: '你没有查看该学生信息的权限', data: null } }
	}

	// 学生用户必须存在于统一用户目录
	var targetUser = getMockUserById(studentId)
	if (!targetUser) return { error: { code: 404, message: '学生不存在', data: null } }

	// 学生身份：必须存在该班 ACTIVE MEMBER 记录（单独判定，不被 ADMIN 覆盖）
	if (!hasMembership(studentId, classId, 'MEMBER')) {
		// 该用户是本班 ADMIN 但没有 MEMBER 身份（纯管理员）→ 没有属于自己的学生任务
		var msg = hasMembership(studentId, classId, 'ADMIN')
			? '该成员没有学生身份或暂无学生任务数据'
			: '该学生不在此班级'
		return { error: { code: 404, message: msg, data: null } }
	}

	// joinedAt 取成员管理列表中的同一数据（ClassMembership.joinedAt，仅日期）
	var joinedAt = ''
	var membersRes = getClassMembers(classId, currentUser)
	if (membersRes.code === 200 && membersRes.data && membersRes.data.members) {
		for (var i = 0; i < membersRes.data.members.length; i++) {
			if (membersRes.data.members[i].userId === studentId) {
				joinedAt = membersRes.data.members[i].joinedAt
				break
			}
		}
	}

	return { cls: cls, targetUser: targetUser, joinedAt: joinedAt }
}

// GET /api/teacher/classes/{classId}/students/{studentId}
// 返回：{ student:{userId,nickname,role,joinedAt}, classInfo:{id,name} }
export function getStudentDetail(classId, studentId, currentUser) {
	var ctx = resolveStudentContext(classId, studentId, currentUser)
	if (ctx.error) return ctx.error

	return ok({
		student: {
			userId: studentId,
			nickname: ctx.targetUser.nickname || ('用户' + studentId),
			role: 'MEMBER',           // 学生详情恒以 MEMBER 学生身份展示
			joinedAt: ctx.joinedAt
		},
		classInfo: {
			id: ctx.cls.id,
			name: ctx.cls.name
		}
	})
}

// GET /api/teacher/classes/{classId}/students/{studentId}/analytics
// 返回：{
//   stats: { total, completed, activePending, endedPending, rate },
//   tasks: [{ taskId, title, deadline, taskStatus, status, completedAt }],
//   lastCompletedAt
// }
// 统计口径（严格按现有模型实时计算，不伪造任何数字）：
//   total         该生该班 StudentTask 条数
//   completed     StudentTask.status === 'completed'
//   activePending status==='pending' 且对应 Task.status==='active'
//   endedPending  status==='pending' 且对应 Task.status==='ended'
//   rate          completed / total * 100，保留 1 位小数；total=0 时为 0（页面显示"暂无任务数据"）
//   lastCompletedAt 所有 completed 记录 completedAt 的最大值（仅日期 YYYY-MM-DD）
export function getStudentAnalytics(classId, studentId, currentUser) {
	var ctx = resolveStudentContext(classId, studentId, currentUser)
	if (ctx.error) return ctx.error

	// 该班全部 StudentTask → 过滤出该学生
	var studentTasks = getStudentTasksByClass(classId)
	var ownList = []
	for (var i = 0; i < studentTasks.length; i++) {
		if (studentTasks[i].userId === studentId) ownList.push(studentTasks[i])
	}

	// 班级任务元数据（复用教师任务查询，不复制 tasks；查看者已是 ADMIN，必然 200）
	var taskMap = {}
	var tasksRes = getClassTasks(classId, currentUser)
	if (tasksRes.code === 200 && tasksRes.data && tasksRes.data.tasks) {
		var classTasks = tasksRes.data.tasks
		for (var j = 0; j < classTasks.length; j++) {
			taskMap[classTasks[j].id] = classTasks[j]
		}
	}

	var total = ownList.length
	var completed = 0
	var activePending = 0
	var endedPending = 0
	var lastCompletedAt = null
	var taskRows = []

	for (var k = 0; k < ownList.length; k++) {
		var st = ownList[k]
		var task = taskMap[st.taskId]
		// StudentTask 必然由创建班级任务时扇出，task 理论上必存在；缺失时防御性跳过，不编造标题
		if (!task) continue

		if (st.status === 'completed') {
			completed++
			if (st.completedAt && (lastCompletedAt === null || st.completedAt > lastCompletedAt)) {
				lastCompletedAt = st.completedAt
			}
		} else if (task.status === 'ended') {
			endedPending++
		} else {
			activePending++
		}

		taskRows.push({
			taskId: st.taskId,
			title: task.title,
			deadline: task.deadline,
			taskStatus: task.status,      // active / ended（来自 Task）
			status: st.status,            // pending / completed（来自 StudentTask）
			completedAt: st.completedAt
		})
	}

	// 完成率保留 1 位小数（如 8/12 → 66.7）；total=0 → 0，由页面显示空状态而非 0%
	var rate = 0
	if (total > 0) rate = Math.round((completed / total) * 1000) / 10

	return ok({
		stats: {
			total: total,
			completed: completed,
			activePending: activePending,
			endedPending: endedPending,
			rate: rate
		},
		tasks: taskRows,
		lastCompletedAt: lastCompletedAt
	})
}
