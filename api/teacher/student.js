// ============================================================
// 教师端「学生详情」API 封装层（P3-1）
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// 说明：
//   路径中的 {studentId} 只是接口参数命名，项目内部数据一律继续使用 userId，
//   不新增 studentId 字段、不新建 Student 模型。
//
// ---------------- 接口总表（未来 Spring Boot，当前 Mock 实现） ----------------
// 方法    路径                                                                   用途
// GET     /api/teacher/classes/{classId}/students/{studentId}                    学生基本信息（班级视图）
// GET     /api/teacher/classes/{classId}/students/{studentId}/analytics          学生在该班级的任务统计与明细
//
// ---------------- 未来 AI 能力（本阶段仅规划，不实现、不 Mock 假结论） ----------------
// POST    /api/teacher/classes/{classId}/students/{studentId}/ai-analysis        AI 学生分析（由后端调用大模型）
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from '../request.js'
import * as mock from '@/mock/teacher/student.js'
import { getLoginUser } from '../auth.js'

function currentTeacherUser() {
	var user = getLoginUser()
	if (!user || !user.account) return null
	return { userId: user.account, nickname: user.nickname }
}

// GET /api/teacher/classes/{classId}/students/{studentId}
// 返回：{ student:{userId,nickname,role,joinedAt}, classInfo:{id,name} }
// 权限：仅该班级 ACTIVE ADMIN 可查看；401 未登录 / 404 班级或学生不存在 / 403 非 ADMIN
export function getStudentDetail(classId, studentId) {
	if (USE_MOCK) return Promise.resolve(mock.getStudentDetail(classId, studentId, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/students/' + studentId, method: 'GET' })
}

// GET /api/teacher/classes/{classId}/students/{studentId}/analytics
// 返回：{ stats:{total,completed,activePending,endedPending,rate}, tasks:[...], lastCompletedAt }
// 权限：401 / 404 / 403 与 getStudentDetail 完全一致
export function getStudentAnalytics(classId, studentId) {
	if (USE_MOCK) return Promise.resolve(mock.getStudentAnalytics(classId, studentId, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/students/' + studentId + '/analytics', method: 'GET' })
}
