// ============================================================
// Mock 数据层：教师首页（当前 USE_MOCK = true，由 api/teacher/home.js 调用）
// 后端（Spring Boot）接入后，页面/组件无需改动，api 层自动切到 request.js。
//
// 统一数据模型（学生端/教师端/未来统一后端共用，禁止第二套班级模型）：
//   Class            { id, name, description, goal, inviteCode, memberCount, maxMembers, status, createdAt }
//   ClassMembership  { id, userId, classId, role, status, joinedAt }   // role: ADMIN / MEMBER
//   Task             { id, title, ..., source, classId }
//   StudentTask      { studentId, taskId, completed }   // 未来后端：任务完成归属学生本人
//
// 教师首页聚合返回的是「管理视图摘要」，不是新业务模型：
//   - teacher：当前登录教师身份（后端由 token 解析，前端不显式传；不用 user.role==='teacher' 判定管理权）
//   - statistics：该教师 ADMIN 的班级/学生/待处理任务汇总
//   - classes：该教师 ADMIN 的班级摘要列表（每班含学生数/今日任务数/完成率，字段对应 Class + 聚合计算）
// 教师是否管理某班级由 ClassMembership.role = ADMIN 判定。
//
//   数据来源（Mock 阶段）：
//   班级数据统一从 mock/class.js 的 classes + memberships 实时读取（Class 是唯一班级数据源），
//   管理权判定 = ClassMembership.role === 'ADMIN'，与当前登录用户绑定，无固定教师/固定班级。
//   学生数/任务数/完成率/待完成数 全部复用 getClassAnalytics 的真实聚合口径（任务口径），
//   与 pages/teacher/class/analytics.vue 展示数据完全一致，禁止复制计算逻辑。
// ============================================================

import { getManagedClasses, getActiveMemberUserIds } from '../class.js'
import { getClassAnalytics } from './analytics.js'

// ---------- 工具函数 ----------
function ok(data) {
	return { code: 200, message: 'success', data: data }
}

function pad(n) {
	return n < 10 ? '0' + n : '' + n
}

function todayStr() {
	var d = new Date()
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function buildGreeting() {
	var h = new Date().getHours()
	if (h >= 5 && h < 12) return '早上好'
	if (h >= 12 && h < 18) return '下午好'
	return '晚上好'
}

// ---------- 模拟 API 返回体 ----------

// GET /api/teacher/home（教师首页聚合：身份 + 统计 + 管理班级摘要列表）
// currentUser 由 api/teacher/home.js 从登录缓存传入（Mock 阶段）；后端接入后由 token 解析。
// classId 可选：传入时优先筛选该班级（创建成功后进入工作台场景）；未传入时取全部 ADMIN 班级。
// 未登录不兜底任何教师数据，返回 401（与 mock/class.js 鉴权语义一致），由页面清登录态并跳登录入口。
export function fetchTeacherHome(currentUser, classId) {
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}

	var teacherId = currentUser.userId
	var teacherName = currentUser.nickname || '老师'

	// 实时查询当前用户管理的班级（Class 是唯一数据源）
	var managed = getManagedClasses(teacherId)
	var classesOut = []
	var studentSet = {}         // 学生去重集合：同一学生跨班只计一次
	var studentTotal = 0       // 在班人次（保留给需要「人次」口径的调用方）

	for (var i = 0; i < managed.length; i++) {
		var cls = managed[i]
		// 全局统计始终覆盖全部管理班级；classId 只作为前端「当前聚焦班级」的提示，
		// 不能因为从某个班级进入工作台就把其他班级从统计里删掉。
		var a = getClassAnalytics(cls.id, currentUser)
		if (!a || a.code !== 200 || !a.data) continue
		var d = a.data
		studentTotal += d.totalStudents
		var memberIds = getActiveMemberUserIds(cls.id) || []
		for (var mi = 0; mi < memberIds.length; mi++) studentSet[memberIds[mi]] = true
		var activeTasks = 0
		for (var ti = 0; ti < d.taskSummary.length; ti++) {
			if (d.taskSummary[ti].status === 'active') activeTasks++
		}
		classesOut.push({
			id: cls.id,
			name: cls.name,
			studentCount: d.totalStudents,
			activeTaskCount: activeTasks,
			completionRate: d.completionRate
		})
	}

	return ok({
		date: todayStr(),
		teacher: {
			id: teacherId,
			name: teacherName,
			greeting: buildGreeting()
		},
		statistics: {
			classCount: classesOut.length,
			studentCount: Object.keys(studentSet).length,
			studentSeatCount: studentTotal
		},
		classes: classesOut
	})
}
