// 家长端 Mock：结构与 api/parent/dashboard.js 的接口契约一致。

var children = [
	{ id: 'child-001', name: '林小满', shortName: '林', grade: '初三', className: '初三(2)班', studentNo: '20240312', relation: '哥哥', isPrimary: true },
	{ id: 'child-002', name: '林小禾', shortName: '禾', grade: '初二', className: '初二(4)班', studentNo: '20240408', relation: '妹妹', isPrimary: false }
]

var reminderSeq = 1
var reminders = []

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function ok(data) {
	return { code: 200, message: 'success', data: clone(data) }
}

function childOf(id) {
	for (var i = 0; i < children.length; i++) {
		if (children[i].id === id) return children[i]
	}
	return children[0]
}

function homeData(childId) {
	var child = childOf(childId)
	return {
		child: child,
		children: children,
		stats: { studyHours: 4.5, studyDelta: '+0.8h', newWrong: 12, wrongDelta: '较上周 -3', masteredWrong: 8, masteryRate: 67 },
		weeklyReport: { weekLabel: '第 8 周学习周报', masteryDelta: '+3.2%', reviewProgress: '复习完成 9/10', syncText: '已自动同步至家长端 · 支持月报与趋势', chart: [22, 30, 26, 42, 38, 56, 52, 72] },
		wrongDistribution: [
			{ subject: '数学', count: 54, percent: 45 },
			{ subject: '物理', count: 36, percent: 30 },
			{ subject: '英语', count: 30, percent: 25 }
		],
		advice: { title: 'AI 陪伴建议', focus: '二次函数图象平移', text: '孩子当前薄弱点为二次函数图象平移，近两周 3 次复习均未达标。建议本周末陪同完成 1 次变式训练（约 25 分钟），并给予正向鼓励。' },
		reminder: reminders.length ? reminders[reminders.length - 1] : null
	}
}

export function fetchHome(options) {
	return ok(homeData(options.childId))
}

export function fetchWeeklyReport(options) {
	var home = homeData(options.childId)
	return ok({
		child: home.child,
		week: { label: '第 8 周', dateRange: '10.19 - 10.25' },
		stats: { studyHours: 4.5, studyDelta: '+0.8h', targetRate: 90, homeworkRate: 92, knowledgeDelta: '+3.2%', wrongCount: 8, averageDaily: 45, streakDays: 6 },
		chart: [22, 30, 26, 42, 38, 56, 52, 72],
		subjects: [
			{ name: '数学', score: 78, classAverage: 74 },
			{ name: '物理', score: 82, classAverage: 77 },
			{ name: '英语', score: 86, classAverage: 80 }
		],
		knowledge: [
			{ name: '二次函数图象平移', before: 61, after: 73, detail: '复习 3 次', change: '+12%', positive: true },
			{ name: '圆的切线判定', before: 68, after: 64, detail: '步骤遗漏', change: '-4%', positive: false }
		],
		advice: home.advice,
		reminder: home.reminder
	})
}

export function fetchChildren() {
	return ok({ children: children })
}

export function fetchChildDashboard(options) {
	var child = childOf(options.childId)
	return ok({
		child: child,
		progress: { completed: 18, total: 22, percent: 82, dailyHours: 1.6, streakDays: 46, pendingWrong: 27 },
		grades: { labels: ['月考一', '期中', '月考二', '一模', '月考三'], values: [84, 87, 86, 89, 91], latest: 91, latestName: '第二次月考', delta: '+3' },
		wrong: { total: 120, mastered: 89, items: [{ subject: '数学', count: 54, percent: 45 }, { subject: '物理', count: 36, percent: 30 }, { subject: '英语', count: 30, percent: 25 }] },
		school: { tags: [{ label: '出勤 100%', tone: 'neutral' }, { label: '作业按时率 96%', tone: 'positive' }, { label: '课堂表现 优', tone: 'neutral' }], comment: '李老师：本周课堂专注度提升明显，二次函数专题还需加强，建议周末完成 1 次变式训练。' }
	})
}

export function fetchParentProfile() {
	var user = {}
	try { user = uni.getStorageSync('login_user_info') || {} } catch (e) {}
	return ok({
		parent: { name: user.account === 'parent01' ? '王女士' : (user.nickname || '王女士'), relation: '妈妈', school: '明德中学家长', membership: '成长陪伴会员至 2027.03' },
		children: children,
		sections: [
			{ title: '孩子与成长', items: [
				{ key: 'archive', icon: '▱', label: '成长档案', detail: '46 天记录 · 12 张证书' },
				{ key: 'classroom', icon: '▤', label: '家长课堂', detail: '本周 3 节新课程' },
				{ key: 'notice', icon: '♧', label: '消息通知', detail: '周报已更新 · 2 条未读' },
				{ key: 'settings', icon: '◉', label: '设置', detail: '周报推送 · 隐私' }
			]},
			{ title: '服务与支持', items: [
				{ key: 'help', icon: '?', label: '帮助与反馈', detail: '常见问题 · 联系客服' },
				{ key: 'orders', icon: '▤', label: '会员与订单', detail: '会员剩余 156 天' }
			] }
		],
		recommendation: { title: '初三冲刺期，如何帮孩子稳住心态', meta: '李明 · 家庭教育指导师 · 28 分钟 · 1.2 万人学过' }
	})
}

export function createReminder(payload) {
	var reminder = { id: 'reminder-' + reminderSeq++, childId: payload.childId || children[0].id, text: payload.text || '周六 15:00', createdAt: Date.now() }
	reminders.push(reminder)
	return ok(reminder)
}

export function bindChild(payload) {
	var code = String(payload.code || '').trim()
	if (!code) return { code: 400, message: '请输入孩子的邀请码', data: null }
	if (code === '20240408' || code.toLowerCase() === 'linhe') {
		if (!children.some(function (item) { return item.id === 'child-002' })) children.push({ id: 'child-002', name: '林小禾', shortName: '禾', grade: '初二', className: '初二(4)班', studentNo: '20240408', relation: '妹妹', isPrimary: false })
		return ok({ child: childOf('child-002'), children: children })
	}
	return { code: 404, message: '未找到匹配的孩子，请核对邀请码', data: null }
}

