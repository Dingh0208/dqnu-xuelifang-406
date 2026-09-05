// ============================================================
// Mock 数据层（当前阶段唯一数据来源，USE_MOCK = true 时由 api/home.js 调用）
// 数据结构与未来 Spring Boot 接口返回完全一致，后端接入后页面无需改动。
//
// 统一数据结构：
//   Task    { id, title, description, type, estimatedMinutes, weight, completed }
//   Schedule{ id, startTime, endTime, title, type, status, taskId }
//   Review  { id, knowledgePointId, title, lastStudyDaysAgo, reviewLevel, due }
//   Welcome { greeting, message, todayTaskCount, estimatedStudyMinutes }
//   Reward  { completionRate, todayRewardCoins, dailyLimit }
// ============================================================

import { completionRateByCount, todayRewardCoins } from '@/utils/reward.js'
// 任务状态单一来源（Bug-1）：种子任务注册到共享状态，fetch 直接返回同一引用
// patchTask 直接调用共享状态的 set/get，避免 completed 值与 toggle 不同步
import { initTaskState } from '@/utils/taskState.js'

// ---------- 今日任务（weight 字段保留在数据结构中；学习金币奖励按「任务数等权」计算，见 utils/reward.js） ----------
var tasks = [
	{
		id: 2001,
		title: '英语四级词汇',
		description: '新学40个高频词汇',
		type: 'study',
		estimatedMinutes: 40,
		weight: 20,
		completed: true
	},
	{
		id: 2002,
		title: '数据结构 · 链表',
		description: '掌握单链表基本操作',
		type: 'study',
		estimatedMinutes: 50,
		weight: 30,
		completed: false
	},
	{
		id: 2003,
		title: '高等数学 · 极限',
		description: '复习函数极限基础',
		type: 'review',
		estimatedMinutes: 30,
		weight: 30,
		completed: false
	},
	{
		id: 2004,
		title: '错题复习',
		description: '复习5道历史错题',
		type: 'review',
		estimatedMinutes: 30,
		weight: 20,
		completed: false
	}
]

// 注册到共享任务状态（Bug-1 单一来源：此后 tasks 即共享数组本身，patch 真正写回；
// 当天 storage 状态在此一次性恢复，跨天残留直接忽略）
initTaskState(tasks)

// ---------- 今日学习安排（Schedule；type: class/study/review，status: completed/current/upcoming） ----------
var schedule = [
	{ id: 1001, startTime: '09:00', endTime: '10:40', title: '高等数学', type: 'class', status: 'completed', taskId: null },
	{ id: 1002, startTime: '16:00', endTime: '16:50', title: '数据结构 · 链表', type: 'study', status: 'upcoming', taskId: 2002 },
	{ id: 1003, startTime: '19:00', endTime: '20:00', title: '高等数学 · 极限', type: 'review', status: 'upcoming', taskId: 2003 }
]

// ---------- 今天该复习什么（Review；due/reviewLevel 为未来遗忘曲线预留，当前不做算法） ----------
var reviews = [
	{ id: 3001, knowledgePointId: 5001, title: '高等数学 · 函数极限', lastStudyDaysAgo: 5, reviewLevel: 1, due: true },
	{ id: 3002, knowledgePointId: 5002, title: '数据结构 · 单链表', lastStudyDaysAgo: 3, reviewLevel: 1, due: true },
	{ id: 3003, knowledgePointId: 5003, title: '英语四级 · 高频词汇复习建议', lastStudyDaysAgo: 7, reviewLevel: 2, due: false }
]

// ---------- 欢迎语 Mock 文案（未来由后端/AI 个性化返回） ----------
var welcomeMessages = [
	'今天也向自己的目标靠近一点吧。',
	'不用一次完成所有事情，先做好眼前这一件。',
	'今天也不用急，按自己的节奏，一点一点来。',
	'昨天的努力已经留下痕迹，今天继续就好。',
	'慢一点没关系，重要的是没有停下来。'
]

// 今日学习时长（分钟）；当前无真实计时，Mock 展示值
var studyDurationMinutes = 80

// ---------- 工具函数 ----------
function deepCopy(o) {
	return JSON.parse(JSON.stringify(o))
}

function pad(n) {
	return n < 10 ? '0' + n : '' + n
}

function todayStr() {
	var d = new Date()
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function ok(data) {
	return { code: 200, message: 'success', data: data }
}

function buildGreeting() {
	var h = new Date().getHours()
	if (h >= 5 && h < 12) return '早上好'
	if (h >= 12 && h < 18) return '下午好'
	return '晚上好'
}

// 同一天内欢迎语固定（按日期确定性取一条）
function pickMessage() {
	var d = new Date()
	var idx = (d.getFullYear() + d.getMonth() + d.getDate()) % welcomeMessages.length
	return welcomeMessages[idx]
}

function buildWelcome() {
	var totalMinutes = tasks.reduce(function (sum, t) {
		return sum + (t.estimatedMinutes || 0)
	}, 0)
	return {
		greeting: buildGreeting(),
		message: pickMessage(),
		todayTaskCount: tasks.length,
		estimatedStudyMinutes: totalMinutes
	}
}

// 完成度：已完成任务数量 ÷ 今日任务总数量（所有任务等权；任务完成状态是唯一源数据，完成度/金币均为计算结果）
function calcCompletionRate() {
	var completed = tasks.filter(function (t) {
		return t.completed === true
	}).length
	return completionRateByCount(completed, tasks.length)
}

// ---------- 以下函数模拟各 API 的返回体（{ code, message, data }） ----------

// GET /api/student/home/today（首页聚合接口）
export function fetchHomeToday() {
	return ok({
		date: todayStr(),
		welcome: buildWelcome(),
		// 种子数组即 taskState 持有的同一引用（initTaskState 注册后顺序/完成态统一由 taskState 维护）
		tasks: tasks,
		schedule: deepCopy(schedule),
		reviews: deepCopy(reviews),
		studyDuration: studyDurationMinutes
	})
}

// GET /api/student/home/welcome
export function fetchWelcome() {
	return ok(buildWelcome())
}

// GET /api/student/home/today/tasks
export function fetchTasks() {
	return ok({ date: todayStr(), tasks: tasks })
}

// PATCH /api/student/home/today/tasks/{taskId}
// Mock 阶段：taskState.toggleTask 已完成状态与顺序变更（页面先调用），
// 此处仅回显确认（completed 与当前状态一致）；未来真实后端以接口返回为权威。
export function patchTask(taskId, completed) {
	for (var i = 0; i < tasks.length; i++) {
		if (tasks[i].id === taskId) {
			tasks[i].completed = completed
			break
		}
	}
	return ok({ taskId: taskId, completed: completed })
}

// GET /api/student/home/schedule
export function fetchSchedule() {
	return ok({ date: todayStr(), schedule: deepCopy(schedule) })
}

// GET /api/student/home/reviews
export function fetchReviews() {
	return ok({ date: todayStr(), reviews: deepCopy(reviews) })
}

// GET /api/student/rewards/today（今日预计学习金币为完成度派生值，实时计算、不做累加计数；
// 账户真实金币余额以后端结算为权威，见 api/assets.js 的 coins）
export function fetchRewards() {
	var completed = tasks.filter(function (t) {
		return t.completed === true
	}).length
	var rate = calcCompletionRate()
	return ok({
		completionRate: rate,
		todayRewardCoins: todayRewardCoins(completed, tasks.length),
		dailyLimit: 10
	})
}

// GET /api/student/home/today/study-duration
export function fetchStudyDuration() {
	return ok({ date: todayStr(), studyDurationMinutes: studyDurationMinutes })
}
