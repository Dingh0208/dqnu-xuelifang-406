// ============================================================
// 教师端「班级学习数据」API 封装层（P3-2-1）
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- 接口总表（未来 Spring Boot，当前 Mock 实现） ----------------
// 方法  路径                                                          用途
// GET   /api/teacher/classes/{classId}/analytics                      班级学习数据（实时聚合）
//
// 说明：
//   1. 本层不做任何业务计算，只负责 Mock / request 分流，与 student.js / task.js 完全一致。
//   2. 班级分析全部是确定性数据聚合，当前不规划 AI 接口。
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from '../request.js'
import * as mock from '@/mock/teacher/analytics.js'
import { getLoginUser } from '../auth.js'

// 与 api/teacher/student.js、api/teacher/task.js 同一身份获取方式，不建第二套登录逻辑
function currentTeacherUser() {
	var user = getLoginUser()
	if (!user || !user.account) return null
	return { userId: user.account, nickname: user.nickname }
}

// GET /api/teacher/classes/{classId}/analytics
// 返回：班级总人数/任务数/StudentTask 统计/完成率（任务口径）/学生状态（非互斥）/排行榜/任务汇总
// 权限：401 未登录 / 404 班级不存在 / 403 非该班 ACTIVE ADMIN
export function getClassAnalytics(classId) {
	if (USE_MOCK) return Promise.resolve(mock.getClassAnalytics(classId, currentTeacherUser()))
	return request({ url: '/api/teacher/classes/' + classId + '/analytics', method: 'GET' })
}
