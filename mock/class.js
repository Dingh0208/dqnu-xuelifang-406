// ============================================================
// Mock 数据层：班级（学生侧，当前 USE_MOCK = true，由 api/class.js 调用）
// 后端（Spring Boot）接入后，页面/组件无需改动，api 层自动切到 request.js。
//
// 统一数据模型（学生端/教师端/未来统一后端共用，禁止第二套班级模型）：
//   Class            { id, name, description, goal, inviteCode, memberCount, maxMembers, status, createdAt }
//   ClassMembership  { id, userId, classId, role, status, joinedAt }   // role: ADMIN / MEMBER
//
// 关键规则：
//   1. 一个用户可加入/管理多个班级（多对多 ClassMembership），
//      禁止 student.classId 这类单班级设计。
//   2. ADMIN ≠ MEMBER：管理员是否同时是成员由创建时的 joinSelf 决定
//      （joinSelf=true → ADMIN + MEMBER 双身份；joinSelf=false → 仅 ADMIN，
//      该班级布置任务时管理员自己的学生端不会收到任务）。
//   3. 邀请码校验属于后端职责，本层只模拟校验结果，页面不做真实校验。
//   4. inviteCode 属于管理端信息，学生视图（toClassView）不下发。
//   5. 任务完成状态属于学生本人（未来后端为 StudentTask.studentId + completed，
//      不在共享 Task 上存统一 completed）；当前 Mock 阶段完成态仍由
//      utils/taskState.js 统一管理（单一事实来源），本层不记录任务状态。
//
// 默认测试数据（与 mock/auth.js 预置账号对应，当前登录账号 student01）：
//   class-001 高一（3）班（管理员：王老师，48人）→ 测试账号已加入（MEMBER）
//   class-002 Java算法学习小组（管理员：测试账号本人，16人）→ 测试账号仅管理（ADMIN，未加入）
// ============================================================

// 班级（Mock 内存数据，重启后复位；未来由后端持久化）
var classes = [
	{
		id: 'class-001',
		name: '高一（3）班',
		description: '高一（3）班学习空间',
		goal: '完成本阶段课程学习',
		inviteCode: 'A8K29D',
		memberCount: 48,
		maxMembers: 60,
		status: 'ACTIVE',
		createdAt: '2026-09-01'
	},
	{
		id: 'class-002',
		name: 'Java算法学习小组',
		description: 'Java与算法学习小组',
		goal: '提升算法与编程能力',
		inviteCode: 'J7K2QD',
		memberCount: 16,
		maxMembers: 30,
		status: 'ACTIVE',
		createdAt: '2026-09-03'
	}
]

// 班级成员关系（多对多；真实后端按 userId/token 关联用户表）
var memberships = [
	// class-001：王老师管理，测试账号已加入为成员
	{ id: 'm-0001', userId: 'teacher01', classId: 'class-001', role: 'ADMIN', status: 'ACTIVE', joinedAt: '2026-09-01' },
	{ id: 'm-0002', userId: 'student01', classId: 'class-001', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-09-02' },
	// class-002：测试账号创建时 joinSelf=false → 仅 ADMIN，未加入为成员
	{ id: 'm-0003', userId: 'student01', classId: 'class-002', role: 'ADMIN', status: 'ACTIVE', joinedAt: '2026-09-03' }
]

// 非当前登录用户的展示名：统一从 mock/auth.js 的用户数据源查询（预置账号 + 注册用户）
import { getMockUserById } from './auth.js'

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

function displayName(userId, currentUser) {
	if (currentUser && currentUser.userId === userId) return currentUser.nickname || '我'
	var u = getMockUserById(userId)
	return (u && u.nickname) || ('用户' + userId)
}

export function classById(classId) {
	for (var i = 0; i < classes.length; i++) {
		if (classes[i].id === classId) return classes[i]
	}
	return null
}

// 导出给教师端任务模块复用：返回班级全部 ACTIVE MEMBER 的 userId 列表
// （仅 MEMBER 记录；ADMIN-only 不在内；ADMIN+MEMBER 双身份用户在内）
export function getActiveMemberUserIds(classId) {
	var ids = []
	for (var i = 0; i < memberships.length; i++) {
		var m = memberships[i]
		if (m.classId === classId && m.role === 'MEMBER' && m.status === 'ACTIVE') {
			if (ids.indexOf(m.userId) === -1) ids.push(m.userId)
		}
	}
	return ids
}

// 导出给教师端任务等模块复用（班级级权限唯一判定：ClassMembership.role + ACTIVE）
export function hasMembership(userId, classId, role) {
	for (var i = 0; i < memberships.length; i++) {
		var m = memberships[i]
		if (m.userId === userId && m.classId === classId && m.role === role && m.status === 'ACTIVE') return true
	}
	return false
}

// 查询班级管理员（ADMIN）的展示名；字段与未来后端返回保持一致：adminName
function adminNameOf(classId, currentUser) {
	for (var i = 0; i < memberships.length; i++) {
		var m = memberships[i]
		if (m.classId === classId && m.role === 'ADMIN' && m.status === 'ACTIVE') {
			return displayName(m.userId, currentUser)
		}
	}
	return '—'
}

// 学生视图对象（不下发 inviteCode；字段结构对齐未来 GET /api/student/classes 返回体）
function toClassView(cls, currentUser) {
	return {
		id: cls.id,
		name: cls.name,
		description: cls.description,
		goal: cls.goal,
		memberCount: cls.memberCount,
		maxMembers: cls.maxMembers,
		status: cls.status,
		adminName: adminNameOf(cls.id, currentUser)
	}
}

// ---------- 模拟 API 返回体 ----------

// GET /api/student/classes（我的班级：joinedClasses + managedClasses）
export function fetchMyClasses(currentUser) {
	var joined = []   // 我是 MEMBER 的班级（若同时是 ADMIN，role 返回 ADMIN 供卡片标注）
	var managed = []  // 我是 ADMIN 的班级
	if (!currentUser) return ok({ joinedClasses: joined, managedClasses: managed })

	for (var i = 0; i < memberships.length; i++) {
		var m = memberships[i]
		if (m.userId !== currentUser.userId || m.status !== 'ACTIVE') continue
		var cls = classById(m.classId)
		if (!cls) continue
		if (m.role === 'MEMBER') {
			joined.push(Object.assign(toClassView(cls, currentUser), {
				role: hasMembership(currentUser.userId, cls.id, 'ADMIN') ? 'ADMIN' : 'MEMBER'
			}))
		} else if (m.role === 'ADMIN') {
			managed.push(Object.assign(toClassView(cls, currentUser), { role: 'ADMIN' }))
		}
	}
	return ok({ joinedClasses: joined, managedClasses: managed })
}

// GET /api/student/classes/{classId}（班级详情：学生只读视图）
// 非本班成员且非管理员 → 403（真实权限由后端判定，前端只提示不绕过）
export function fetchClassDetail(classId, currentUser) {
	var cls = classById(classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	if (!currentUser) return { code: 401, message: '登录状态已失效，请重新登录', data: null }

	var isMember = hasMembership(currentUser.userId, classId, 'MEMBER')
	var isAdmin = hasMembership(currentUser.userId, classId, 'ADMIN')
	if (!isMember && !isAdmin) return { code: 403, message: '无权限访问该班级', data: null }

	return ok({
		classInfo: toClassView(cls, currentUser),
		isMember: isMember,
		isAdmin: isAdmin
	})
}

// POST /api/student/classes/join（凭邀请码加入班级，body: { inviteCode }）
// 校验规则模拟后端：空码 / 不存在 / 已解散 / 已加入 / 已满；成功写入 membership
export function joinClassByInviteCode(inviteCode, currentUser) {
	var code = (inviteCode || '').trim()
	if (!code) return { code: 400, message: '请输入班级邀请码' }
	if (!currentUser || !currentUser.userId) return { code: 401, message: '登录状态已失效，请重新登录' }

	var cls = null
	for (var i = 0; i < classes.length; i++) {
		if (classes[i].inviteCode.toUpperCase() === code.toUpperCase()) {
			cls = classes[i]
			break
		}
	}
	if (!cls) return { code: 404, message: '邀请码不存在，请检查后重试' }
	if (cls.status !== 'ACTIVE') return { code: 409, message: '该班级已解散，无法加入' }
	if (hasMembership(currentUser.userId, cls.id, 'MEMBER')) return { code: 409, message: '你已加入该班级' }
	if (cls.memberCount >= cls.maxMembers) return { code: 409, message: '班级人数已满，无法加入' }

	memberships.push({
		id: 'm-' + Date.now(),
		userId: currentUser.userId,
		classId: cls.id,
		role: 'MEMBER',
		status: 'ACTIVE',
		joinedAt: todayStr()
	})
	cls.memberCount += 1
	return ok({ classId: cls.id, name: cls.name })
}

// 生成不重复邀请码：6 位大写字母+数字（排除易混淆字符），冲突时重试
function genInviteCode() {
	var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
	for (var attempt = 0; attempt < 20; attempt++) {
		var code = ''
		for (var i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
		var exists = false
		for (var j = 0; j < classes.length; j++) {
			if (classes[j].inviteCode === code) { exists = true; break }
		}
		if (!exists) return code
	}
	return 'X' + Date.now().toString(36).toUpperCase()
}

// 查询某用户拥有管理权（role=ADMIN 且 ACTIVE）的全部 Class 对象
// 供教师端 Mock 复用：Class 是唯一班级数据源，禁止第二份班级数据逻辑
export function getManagedClasses(userId) {
	var list = []
	if (!userId) return list
	for (var i = 0; i < memberships.length; i++) {
		var m = memberships[i]
		if (m.userId !== userId || m.role !== 'ADMIN' || m.status !== 'ACTIVE') continue
		var cls = classById(m.classId)
		if (cls) list.push(cls)
	}
	return list
}

// POST /api/teacher/classes  创建班级 body: { name, description, goal, joinSelf }
//   joinSelf=true  → 创建者获得 ADMIN + MEMBER 双 membership（管理者 + 学生）
//   joinSelf=false → 仅 ADMIN membership（不自动加入为成员）
export function createClass(payload, currentUser) {
	if (!currentUser || !currentUser.userId) return { code: 401, message: '登录状态已失效，请重新登录' }
	var name = (payload && payload.name || '').trim()
	if (!name) return { code: 400, message: '请输入班级名称' }

	var joinSelf = !!(payload && payload.joinSelf)
	var now = Date.now()
	// 防同毫秒冲突：classId 追加随机后缀，确保多次创建 ID 唯一
	var uniqueSuffix = Math.random().toString(36).slice(2, 6)
	var newClass = {
		id: 'class-' + now + '-' + uniqueSuffix,
		name: name,
		description: (payload && payload.description || '').trim(),
		goal: (payload && payload.goal || '').trim(),
		inviteCode: genInviteCode(),
		memberCount: joinSelf ? 1 : 0,
		maxMembers: 60,
		status: 'ACTIVE',
		createdAt: todayStr()
	}
	classes.push(newClass)

	// 无论 joinSelf 与否，创建者都获得 ADMIN 身份
	memberships.push({
		id: 'm-' + now + '-' + uniqueSuffix + '-a',
		userId: currentUser.userId,
		classId: newClass.id,
		role: 'ADMIN',
		status: 'ACTIVE',
		joinedAt: todayStr()
	})
	// joinSelf=true → 再补一条 MEMBER 身份（管理者 + 学生）
	if (joinSelf) {
		memberships.push({
			id: 'm-' + now + '-' + uniqueSuffix + '-m',
			userId: currentUser.userId,
			classId: newClass.id,
			role: 'MEMBER',
			status: 'ACTIVE',
			joinedAt: todayStr()
		})
	}

	return ok({
		classId: newClass.id,
		name: newClass.name,
		joinSelf: joinSelf
	})
}

// GET /api/teacher/classes/{classId}/members（教师端成员管理列表）
// 权限：仅该班级 ACTIVE ADMIN 可查看；MEMBER / 非成员 / 未登录一律拒绝。
// 成员去重：同一 userId 同时拥有 ADMIN + MEMBER 时只显示一次，身份取 ADMIN。
// 昵称来源：getMockUserById（预置 + 注册用户统一查询），不复制用户表。
// 成员总数：以 ACTIVE MEMBER membership 实时计数为准（不使用 Class.memberCount，
//           后者是加入时维护的冗余字段，可能与实际 membership 不一致）。
export function getClassMembers(classId, currentUser) {
	if (!currentUser || !currentUser.userId) {
		return { code: 401, message: '登录状态已失效，请重新登录', data: null }
	}
	var cls = classById(classId)
	if (!cls) return { code: 404, message: '班级不存在', data: null }
	// 班级级权限：ClassMembership.role === 'ADMIN'（与全局 user.role 无关）
	if (!hasMembership(currentUser.userId, classId, 'ADMIN')) {
		return { code: 403, message: '你没有该班级的管理权限', data: null }
	}

	// 收集该班全部 ACTIVE membership，按 userId 去重（ADMIN 优先于 MEMBER）
	var seen = {}
	var ordered = []
	for (var i = 0; i < memberships.length; i++) {
		var m = memberships[i]
		if (m.classId !== classId || m.status !== 'ACTIVE') continue
		if (!seen[m.userId]) {
			// isMember：是否拥有 ACTIVE MEMBER 身份（双身份用户为 true，纯 ADMIN 为 false）
			seen[m.userId] = { userId: m.userId, role: m.role, joinedAt: m.joinedAt, isMember: m.role === 'MEMBER' }
			ordered.push(m.userId)
		} else if (m.role === 'ADMIN') {
			seen[m.userId].role = 'ADMIN'
		} else if (m.role === 'MEMBER') {
			seen[m.userId].isMember = true
		}
	}

	var list = []
	var studentCount = 0
	for (var j = 0; j < ordered.length; j++) {
		var uid = ordered[j]
		var item = seen[uid]
		var user = getMockUserById(uid)
		var nickname = (currentUser.userId === uid && currentUser.nickname)
			? currentUser.nickname
			: ((user && user.nickname) || ('用户' + uid))
		list.push({
			userId: uid,
			nickname: nickname,
			role: item.role,           // ADMIN / MEMBER（班级内身份，ADMIN 优先显示）
			isMember: !!item.isMember, // 是否拥有 ACTIVE MEMBER 身份（前端据此判断能否进学生详情）
			joinedAt: item.joinedAt
		})
		// 真实学生数 = 拥有 ACTIVE MEMBER 身份的人数（role 取 ADMIN 优先，
		// 故双身份用户 role=ADMIN 但仍计入学生数，必须以 isMember 判定）
		if (item.isMember) studentCount++
	}

	return ok({
		classInfo: {
			id: cls.id,
			name: cls.name,
			description: cls.description,
			goal: cls.goal,
			inviteCode: cls.inviteCode,
			status: cls.status,
			createdAt: cls.createdAt,
			maxMembers: cls.maxMembers,
			memberCount: studentCount   // 以 ACTIVE MEMBER 实时计数为准
		},
		adminName: adminNameOf(classId, currentUser),
		members: list
	})
}

// ------------------------------------------------------------
// 其余教师端接口（本次不实现，仅对齐数据模型语义，见 dev-teacher）：
//   POST   /api/teacher/classes/{classId}/invite-code    重置邀请码
//   POST   /api/teacher/classes/{classId}/tasks          布置班级任务（Task.source='class'）
//   GET    /api/teacher/classes/{classId}/tasks/{taskId}/progress   完成进度（读 StudentTask）
// ------------------------------------------------------------
