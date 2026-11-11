// ============================================================
// Mock 数据层：StudentTask（任务×学生的完成归属）—— 唯一数据源
//
// 设计原因：
//   教师端创建任务时扇出 StudentTask；学生端完成任务时更新 StudentTask。
//   两端必须共享同一份数据，故将 StudentTask 从 mock/teacher/task.js
//   提取到本独立模块，避免 mock/home.js ↔ mock/teacher/task.js 循环依赖。
//
// 数据结构（与 P2-2 一致，未改动）：
//   { id, taskId, classId, userId, status: 'pending'|'completed', createdAt, completedAt }
//
// 权限：本模块不做权限校验，由调用方（teacher/task.js）校验 ADMIN 后再操作。
// ============================================================

function pad(n) { return n < 10 ? '0' + n : '' + n }

function todayStr() {
	var d = new Date()
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

var studentTasks = []
var seq = 1

// 为任务扇出 StudentTask：memberIds 为班级 ACTIVE MEMBER 的 userId 列表
// 幂等：同一 (taskId, userId) 不重复创建
// 返回实际新创建的数量
export function createStudentTasksForTask(task, memberIds) {
	var created = 0
	for (var i = 0; i < memberIds.length; i++) {
		var uid = memberIds[i]
		var exists = false
		for (var j = 0; j < studentTasks.length; j++) {
			if (studentTasks[j].taskId === task.id && studentTasks[j].userId === uid) { exists = true; break }
		}
		if (exists) continue
		studentTasks.push({
			id: 'st-' + (seq++),
			taskId: task.id,
			classId: task.classId,
			userId: uid,
			status: 'pending',
			createdAt: todayStr(),
			completedAt: null
		})
		created++
	}
	return created
}

// 学生完成任务：更新对应 StudentTask 状态
// taskId 为教师端 Task.id；userId 为完成任务的学生 userId
// 返回是否成功更新（任务不存在或已完成返回 false）
export function completeStudentTask(taskId, userId) {
	for (var i = 0; i < studentTasks.length; i++) {
		var st = studentTasks[i]
		if (st.taskId === taskId && st.userId === userId) {
			if (st.status === 'completed') return false
			st.status = 'completed'
			st.completedAt = todayStr()
			return true
		}
	}
	return false
}

// 取消完成（学生端 toggle 回退时调用）
export function uncompleteStudentTask(taskId, userId) {
	for (var i = 0; i < studentTasks.length; i++) {
		var st = studentTasks[i]
		if (st.taskId === taskId && st.userId === userId) {
			if (st.status === 'pending') return false
			st.status = 'pending'
			st.completedAt = null
			return true
		}
	}
	return false
}

// 查询某任务的全部 StudentTask
export function getStudentTasksByTask(taskId) {
	var out = []
	for (var i = 0; i < studentTasks.length; i++) {
		if (studentTasks[i].taskId === taskId) out.push(studentTasks[i])
	}
	return out
}

export function getStudentTask(taskId, userId) {
	for (var i = 0; i < studentTasks.length; i++) {
		if (studentTasks[i].taskId === taskId && studentTasks[i].userId === userId) {
			return studentTasks[i]
		}
	}
	return null
}

// 查询某班级的全部 StudentTask
export function getStudentTasksByClass(classId) {
	var out = []
	for (var i = 0; i < studentTasks.length; i++) {
		if (studentTasks[i].classId === classId) out.push(studentTasks[i])
	}
	return out
}

// 仅供测试重置（生产不使用）
export function __resetStudentTasks() {
	studentTasks = []
	seq = 1
}
