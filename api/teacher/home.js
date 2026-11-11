// ============================================================
// 教师端首页 API 封装层
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- 教师首页 API 总表（未来 Spring Boot） ----------------
// 方法    路径                    用途
// GET     /api/teacher/home        教师首页聚合（teacher + statistics + classes）
//
// ---------------- 其他教师端接口（本次不实现，后续阶段开发，语义见 mock/teacher/home.js） ----------------
// POST    /api/teacher/classes                          创建班级 body: { name, description, goal, joinSelf }
// GET     /api/teacher/classes                          我的班级（管理列表）
// GET     /api/teacher/classes/{classId}                班级详情（管理视图）
// GET     /api/teacher/classes/{classId}/members        成员管理
// POST    /api/teacher/classes/{classId}/invite-code    重置邀请码
// POST    /api/teacher/classes/{classId}/tasks          布置班级任务（Task.source='class'）
// GET     /api/teacher/classes/{classId}/tasks/{taskId}/progress   完成进度（读 StudentTask）
// GET     /api/teacher/analytics                        数据分析
// GET     /api/teacher/profile                          教师个人中心
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from '../request.js'
import * as mock from '@/mock/teacher/home.js'
import { getLoginUser } from '../auth.js'

// 当前登录教师身份上下文（Mock 阶段从本地缓存取；后端接入后由 token 解析，前端不再显式传）
function currentTeacherUser() {
	var user = getLoginUser()
	if (!user || !user.account) return null
	return { userId: user.account, nickname: user.nickname }
}

// 1. 教师首页聚合数据：{ teacher, statistics, classes }
// classId 可选：传入时 Mock 聚焦该班级（创建成功后进入工作台场景）；不传则返回全部 ADMIN 班级。
// 真实后端可用可选 classId 聚焦工作台；不传则返回教师全部管理班级。
export function getTeacherHome(classId) {
	if (USE_MOCK) return Promise.resolve(mock.fetchTeacherHome(currentTeacherUser(), classId || ''))
	return request({ url: '/api/teacher/home', method: 'GET', data: classId ? { classId: classId } : {} })
}
