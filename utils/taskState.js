// ============================================================
// 今日任务共享状态（Mock 阶段的「单一事实来源」）
//
// 2026-09 重写版产品规则：
//   1. 首页「今日计划」只显示未完成任务；完成任务从首页列表消失（不删除数据）。
//   2. 「查看全部」进入 pages/tasks 完整页面，三个 Tab：全部 / 已完成 / 未完成。
//      - 全部：未完成任务在前、已完成任务在后；
//      - 已完成：按「完成先后顺序」稳定排列；
//      - 未完成：按稳定顺序排列；取消完成的任务追加到「未完成列表末尾」。
//   3. 【排序是状态，筛选是视图】：顺序统一由本模块维护（pendingOrder /
//      completionOrder），页面与组件只允许 filter/读取，不允许 sort/splice 重排。
//   4. 所有 getter 都返回「全新数组 + 浅拷贝对象」，页面以 this.tasks = newTasks
//      方式整体替换（Vue3 响应式），不对渲染中的 task 对象做原地 mutation。
//   5. 原子操作 toggleTask()：快照 → 翻转 → 调整两个顺序数组 → 持久化 → 返回快照；
//      API 失败可用快照回滚。
//
// storage 结构（student_home_task_state，仅当天有效，跨天忽略）：
//   { date, order: [全部id展示序], completedIds: [已完成id], completionOrder: [完成先后序] }
//   兼容历史结构 { date, ids: [已完成id] }（视为 completionOrder，未完成按种子序）。
//
// 未来接入 Spring Boot：initTaskState(服务端任务) 重建；toggleTask 乐观更新 +
// 回滚结构不变；storage 永不参与金币余额等资产数据（资产权威在后端）。
// ============================================================

var TASK_STATE_KEY = 'student_home_task_state'

var state = {
	tasks: [],            // 任务对象（唯一一份；completed 字段与两个 order 数组保持一致）
	pendingOrder: [],     // 未完成任务 id 的稳定展示顺序（取消完成的任务追加到末尾）
	completionOrder: [],  // 已完成任务 id，按完成先后顺序（先完成在前）
	ready: false
}

function todayStr() {
	var d = new Date()
	var m = d.getMonth() + 1
	var day = d.getDate()
	return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}

function readStorage() {
	try {
		return uni.getStorageSync(TASK_STATE_KEY) || null
	} catch (e) {
		return null
	}
}

function writeStorage(payload) {
	try {
		uni.setStorageSync(TASK_STATE_KEY, payload)
	} catch (e) {}
}

function findTaskIndex(taskId) {
	for (var i = 0; i < state.tasks.length; i++) {
		if (state.tasks[i].id === taskId) return i
	}
	return -1
}

function removeFrom(arr, id) {
	var i = arr.indexOf(id)
	if (i !== -1) arr.splice(i, 1)
}

// 校验 id 数组：无重复、且每个 id 都存在于今日任务
function isValidIdList(list) {
	if (!Array.isArray(list)) return false
	var seen = {}
	for (var i = 0; i < list.length; i++) {
		var id = list[i]
		if (seen[id]) return false
		if (findTaskIndex(id) === -1) return false
		seen[id] = true
	}
	return true
}

// 按 id 顺序数组生成「全新数组 + 浅拷贝对象」（页面直接整体替换 this.tasks）
function pickTasks(idList) {
	var result = []
	for (var i = 0; i < idList.length; i++) {
		var idx = findTaskIndex(idList[i])
		if (idx !== -1) result.push(Object.assign({}, state.tasks[idx]))
	}
	return result
}

// 由两个顺序数组回写 task.completed 字段（保持对象字段与顺序状态一致）
function syncCompletedFlags() {
	for (var i = 0; i < state.tasks.length; i++) {
		state.tasks[i].completed = state.completionOrder.indexOf(state.tasks[i].id) !== -1
	}
}

// 初始化顺序状态：优先用当天 storage；否则用种子任务自带的 completed 构建
function buildOrdersFromSeed() {
	state.completionOrder = []
	state.pendingOrder = []
	for (var i = 0; i < state.tasks.length; i++) {
		var t = state.tasks[i]
		if (t.completed === true) state.completionOrder.push(t.id)
		else state.pendingOrder.push(t.id)
	}
}

function restoreTodayState() {
	var saved = readStorage()
	if (!saved || saved.date !== todayStr()) return
	var completion = null
	var pending = null

	if (Array.isArray(saved.completionOrder)) {
		// 新结构：{ date, order, completedIds, completionOrder }
		var comp = saved.completionOrder
		var order = Array.isArray(saved.order) ? saved.order : null
		if (isValidIdList(comp)) {
			completion = comp.slice()
			// 未完成顺序：优先取 order 中不属于已完成的部分；否则按种子序
			if (order && isValidIdList(order) && order.length === state.tasks.length) {
				pending = order.filter(function (id) { return comp.indexOf(id) === -1 })
			} else {
				pending = state.tasks.map(function (t) { return t.id })
					.filter(function (id) { return comp.indexOf(id) === -1 })
			}
		}
	} else if (Array.isArray(saved.ids)) {
		// 历史结构：{ date, ids } —— ids 视为完成先后顺序，未完成按种子序
		if (isValidIdList(saved.ids)) {
			completion = saved.ids.slice()
			pending = state.tasks.map(function (t) { return t.id })
				.filter(function (id) { return saved.ids.indexOf(id) === -1 })
		}
	}

	if (completion && pending) {
		state.completionOrder = completion
		state.pendingOrder = pending
		syncCompletedFlags()
	}
}

function persistState() {
	writeStorage({
		date: todayStr(),
		order: state.pendingOrder.concat(state.completionOrder),
		completedIds: state.completionOrder.slice(),
		completionOrder: state.completionOrder.slice()
	})
}

// 初始化：由 mock/home.js 在模块加载时用种子数据调用（仅一次）
export function initTaskState(seedTasks) {
	if (state.ready) return state.tasks
	state.tasks = seedTasks
	buildOrdersFromSeed()
	restoreTodayState() // 当天 storage 有效则覆盖顺序/完成态；跨天或损坏则保持种子序
	state.ready = true
	return state.tasks
}

export function isTaskStateReady() {
	return state.ready
}

// 统计：{ total, completed }（完成度/金币均由页面按此实时派生）
export function getTaskStats() {
	return { total: state.tasks.length, completed: state.completionOrder.length }
}

// 按筛选获取展示任务（全新数组 + 浅拷贝对象；顺序由本模块统一维护）
//   filter: 'all'（未完成在前+已完成在后） | 'pending' | 'completed'
export function getTasksByFilter(filter) {
	if (filter === 'completed') return pickTasks(state.completionOrder)
	if (filter === 'pending') return pickTasks(state.pendingOrder)
	return pickTasks(state.pendingOrder.concat(state.completionOrder))
}

// 首页用：未完成任务（= getTasksByFilter('pending')，语义化别名）
export function getPendingTasks() {
	return pickTasks(state.pendingOrder)
}

// 原子操作：翻转完成状态 + 维护顺序 + 持久化。
//   false → true：从未完成顺序移除，追加到完成先后顺序末尾；
//   true  → false：从完成先后顺序移除，追加到未完成顺序末尾。
// 返回 { snapshot, completed }；任务不存在返回 null。
export function toggleTask(taskId) {
	var idx = findTaskIndex(taskId)
	if (idx === -1) return null
	var task = state.tasks[idx]
	var snapshot = {
		taskId: taskId,
		completed: task.completed,
		pendingOrder: state.pendingOrder.slice(),
		completionOrder: state.completionOrder.slice()
	}
	var nowCompleted = !task.completed
	task.completed = nowCompleted
	if (nowCompleted) {
		removeFrom(state.pendingOrder, taskId)
		if (state.completionOrder.indexOf(taskId) === -1) state.completionOrder.push(taskId)
	} else {
		removeFrom(state.completionOrder, taskId)
		if (state.pendingOrder.indexOf(taskId) === -1) state.pendingOrder.push(taskId)
	}
	persistState()
	return { snapshot: snapshot, completed: nowCompleted }
}

// 回滚：用 toggleTask 返回的快照恢复（API 失败时调用）
export function rollbackTask(snapshot) {
	if (!snapshot || findTaskIndex(snapshot.taskId) === -1) return
	state.pendingOrder = snapshot.pendingOrder.slice()
	state.completionOrder = snapshot.completionOrder.slice()
	syncCompletedFlags()
	persistState()
}

// ------------------------------------------------------------
// 开发环境诊断（仅 Mock/开发阶段；正式打包前可整段删除）
//   uni.__DEV_TASK_TOOLS__.snapshot()        查看状态
//   uni.__DEV_TASK_TOOLS__.reset([id...])    设置当天已完成 id 集（完成先后=传入顺序）
// 仅改写 student_home_task_state，不影响金币/银币/主题/用户信息。
// ------------------------------------------------------------
function devSnapshot() {
	return {
		date: todayStr(),
		storage: readStorage(),
		pendingOrder: state.pendingOrder.slice(),
		completionOrder: state.completionOrder.slice()
	}
}

function devReset(completedIds) {
	var comp = Array.isArray(completedIds) ? completedIds : []
	state.completionOrder = comp.filter(function (id) { return findTaskIndex(id) !== -1 })
	state.pendingOrder = state.tasks
		.map(function (t) { return t.id })
		.filter(function (id) { return state.completionOrder.indexOf(id) === -1 })
	syncCompletedFlags()
	persistState()
	return devSnapshot()
}

if (typeof uni !== 'undefined') {
	uni.__DEV_TASK_TOOLS__ = {
		snapshot: devSnapshot,
		reset: devReset
	}
}
