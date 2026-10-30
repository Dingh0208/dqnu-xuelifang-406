// ============================================================
// Mock 数据层：教师端「班级学习数据」（P3-2-1，当前 USE_MOCK = true）
// 后端接入后页面无需改动，api/teacher/analytics.js 自动切到 request.js。
//
// 【最高规则】本文件是纯聚合层，禁止定义任何数据数组：
//   没有 ClassAnalytics / StudentAnalytics / ClassStats / StudentStats 等第二套模型。
//   所有数据实时来自现有四个模型：
//     Class            ← mock/class.js（classById）
//     ClassMembership  ← mock/class.js（hasMembership / getActiveMemberUserIds）
//     Task             ← mock/teacher/task.js（getClassTasks，不复制 tasks）
//     StudentTask      ← mock/studentTask.js（getStudentTasksByClass，先按 classId 隔离）
//
// 【人数口径】班级总人数 = ACTIVE MEMBER 去重数量（getActiveMemberUserIds）。
//   绝对不使用 Class.memberCount（历史 Mock 冗余字段，如 class-001=48 与真实成员不符）。
//   ADMIN-only 不计学生；ADMIN + MEMBER 双身份计 1 名学生，不重复。
//
// 【完成率口径】completionRate = completed StudentTask / 全部 StudentTask（任务口径，1 位小数）；
//   totalStudentTasks = 0 时为 null（页面显示"暂无任务数据"，不显示 0%）。
//
// 【学生状态口径】studentsWithTasks / studentsCompleted / studentsActivePending /
//   studentsEndedPending 为【非互斥统计】：同一学生可同时命中多个计数，
//   四者不可相加，相加无业务含义，更不等于班级总人数。
//
// 【权限】与 getClassTasks / getStudentAnalytics 完全一致（ClassMembership.role，与 user.role 无关）：
//   401 未登录 → 404 班级不存在 → 403 非该班 ACTIVE ADMIN → 200。
// ============================================================

import { classById, hasMembership, getActiveMemberUserIds } from '../class.js'
import { getMockUserById } from '../auth.js'
import { getStudentTasksByClass } from '../studentTask.js'
import { getClassTasks } from './task.js'

function ok(data) { return { code: 200, message: 'success', data: data } }

// 比例（0~1）→ 百分比保留 1 位小数，与 P3-1 / 用户口径一致：
// Math.round(completed / total * 1000) / 10，如 2/3 → 66.7
function round1(ratio) { return Math.round(ratio * 1000) / 10 }

// GET /api/teacher/classes/{classId}/analytics
// 返回结构见 api/teacher/analytics.js 注释；所有计数实时计算，不缓存。
export function getClassAnalytics(classId, currentUser) {
	// ---------- 权限链（顺序与其他教师接口一致） ----------
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}
	var cls = classById(classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	if (!hasMembership(currentUser.userId, classId, 'ADMIN')) {
		return { code: 403, message: '你没有该班级的管理权限', data: null }
	}

	// ---------- 学生范围：ACTIVE MEMBER 去重 ----------
	var memberIds = getActiveMemberUserIds(classId)
	var perUser = {}
	for (var mi = 0; mi < memberIds.length; mi++) {
		perUser[memberIds[mi]] = { total: 0, completed: 0, activePending: 0, endedPending: 0, lastCompletedAt: null }
	}

	// ---------- 班级任务（复用查询，不复制 Task 数组；查看者已通过 ADMIN 校验，必然 200） ----------
	var tasksRes = getClassTasks(classId, currentUser)
	var tasks = (tasksRes.code === 200 && tasksRes.data && tasksRes.data.tasks) || []
	var taskMap = {}
	var taskSummary = []
	for (var ti = 0; ti < tasks.length; ti++) {
		var t = tasks[ti]
		taskMap[t.id] = t
		taskSummary.push({
			taskId: t.id,
			title: t.title,
			deadline: t.deadline,
			status: t.status,           // 仅 active / ended，不新增状态
			total: 0,
			completed: 0,
			pending: 0,                 // 全部未完成（含已截止）
			endedPending: 0,            // 其中 Task.status === ended 的部分
			completionRate: null        // total=0 时为 null
		})
	}
	var summaryMap = {}
	for (var si = 0; si < taskSummary.length; si++) summaryMap[taskSummary[si].taskId] = taskSummary[si]

	// ---------- StudentTask：先按 classId 隔离，再按 taskId / userId 聚合 ----------
	var totalStudentTasks = 0
	var completedStudentTasks = 0
	var activePendingStudentTasks = 0
	var endedPendingStudentTasks = 0

	var studentTasks = getStudentTasksByClass(classId)
	for (var k = 0; k < studentTasks.length; k++) {
		var st = studentTasks[k]
		var task = taskMap[st.taskId]
		// 防御：找不到对应 Task 的异常 StudentTask 直接跳过，不崩溃、不制造默认 Task
		if (!task) continue

		// 任务级统计
		totalStudentTasks++
		var row = summaryMap[st.taskId]
		if (st.status === 'completed') {
			completedStudentTasks++
			row.completed++
		} else {
			row.pending++
			if (task.status === 'ended') {
				endedPendingStudentTasks++
				row.endedPending++
			} else {
				activePendingStudentTasks++
			}
		}
		row.total++

		// 学生级统计：仅统计 ACTIVE MEMBER（防御已退班等孤儿 StudentTask 被计入个人数据）
		var u = perUser[st.userId]
		if (!u) continue
		u.total++
		if (st.status === 'completed') {
			u.completed++
			if (st.completedAt && (u.lastCompletedAt === null || st.completedAt > u.lastCompletedAt)) {
				u.lastCompletedAt = st.completedAt
			}
		} else if (task.status === 'ended') {
			u.endedPending++
		} else {
			u.activePending++
		}
	}

	// 任务汇总完成率
	for (var q = 0; q < taskSummary.length; q++) {
		var r = taskSummary[q]
		if (r.total > 0) r.completionRate = round1(r.completed / r.total)
	}

	// ---------- 学生状态（非互斥）+ 排行榜 ----------
	var studentsWithTasks = 0
	var studentsCompleted = 0
	var studentsActivePending = 0
	var studentsEndedPending = 0
	var studentRanking = []

	for (var d = 0; d < memberIds.length; d++) {
		var uid = memberIds[d]
		var s = perUser[uid]
		if (s.total > 0) studentsWithTasks++
		if (s.completed > 0) studentsCompleted++
		if (s.activePending > 0) studentsActivePending++
		if (s.endedPending > 0) studentsEndedPending++

		var user = getMockUserById(uid)
		studentRanking.push({
			userId: uid,
			nickname: (user && user.nickname) || ('用户' + uid),
			total: s.total,
			completed: s.completed,
			activePending: s.activePending,
			endedPending: s.endedPending,
			rate: s.total === 0 ? null : round1(s.completed / s.total),
			lastCompletedAt: s.lastCompletedAt
		})
	}

	// 排序：rate 降序（null 最后）→ completed 降序 → userId 升序（completedAt 仅日期，不作为排序键）
	studentRanking.sort(function (a, b) {
		if (a.rate !== null || b.rate !== null) {
			if (a.rate === null) return 1
			if (b.rate === null) return -1
			if (b.rate !== a.rate) return b.rate - a.rate
		}
		if (b.completed !== a.completed) return b.completed - a.completed
		if (a.userId < b.userId) return -1
		if (a.userId > b.userId) return 1
		return 0
	})

	return ok({
		classId: classId,
		classInfo: { id: cls.id, name: cls.name },
		totalStudents: memberIds.length,
		totalTasks: tasks.length,
		totalStudentTasks: totalStudentTasks,
		completedStudentTasks: completedStudentTasks,
		activePendingStudentTasks: activePendingStudentTasks,
		endedPendingStudentTasks: endedPendingStudentTasks,
		completionRate: totalStudentTasks === 0 ? null : round1(completedStudentTasks / totalStudentTasks),
		// 以下四项为【非互斥】学生状态计数，禁止相加当作总人数
		studentsWithTasks: studentsWithTasks,
		studentsCompleted: studentsCompleted,
		studentsActivePending: studentsActivePending,
		studentsEndedPending: studentsEndedPending,
		studentRanking: studentRanking,
		taskSummary: taskSummary
	})
}
