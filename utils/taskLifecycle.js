// ============================================================
// Task 生命周期判断 —— 全项目唯一权威来源（P4-FIX-1）
//
// 规则（不新增任何 Task.status 值，仍然只有 active / ended）：
//   status === 'ended'          → ended（已结束）
//   deadline 严格早于今天        → ended（已过期；deadline 当天仍算进行中）
//   其余                         → active
//
// 说明：
//   1. 本模块只做纯判断，不修改 Task 对象、不回写存储；Mock 聚合层与页面都从这里取状态。
//   2. deadline 统一为 YYYY-MM-DD（定长 10 字符，字典序比较与日期先后完全一致）。
//   3. today 参数仅用于单元测试注入确定日期，业务代码不要传。
// ============================================================

function pad(n) {
	return n < 10 ? '0' + n : '' + n
}

export function todayStr() {
	var d = new Date()
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

// 严格校验 YYYY-MM-DD：格式 + 真实日历日期（拒绝 2026-13-01 / 2026-02-31 等）
export function isValidDeadline(value) {
	if (typeof value !== 'string') return false
	var s = value.trim()
	var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
	if (!m) return false
	var y = parseInt(m[1], 10)
	var mo = parseInt(m[2], 10)
	var da = parseInt(m[3], 10)
	if (mo < 1 || mo > 12) return false
	if (da < 1 || da > 31) return false
	// 用 Date 回推校验，防止 2 月 30 日之类的非法日期
	var dt = new Date(y, mo - 1, da)
	return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === da
}

// 任务是否已结束：status==='ended' 或 deadline 严格早于今天
export function isTaskEnded(task, today) {
	if (!task) return false
	if (task.status === 'ended') return true
	var dl = task.deadline
	if (!isValidDeadline(dl)) return false
	return dl < (today || todayStr())
}

// 有效状态：'ended' / 'active'（不引入第三种状态）
export function getEffectiveTaskStatus(task, today) {
	return isTaskEnded(task, today) ? 'ended' : 'active'
}
