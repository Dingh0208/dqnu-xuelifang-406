// 教师模块 Mock 持久化：按登录账号隔离，正式服务端接入前可完整演练各模块流程。
var KEY_PREFIX = 'teacher_workspace_v1:'
var TYPES = ['memos', 'activities', 'conversations', 'courseware', 'schedule', 'grades', 'studentMeta']

function accountKey() {
	try {
		var user = uni.getStorageSync('login_user_info') || {}
		return user.account || user.id || ''
	} catch (e) {
		return ''
	}
}

function emptyState() {
	return { memos: [], activities: [], conversations: [], courseware: [], schedule: [], grades: [], studentMeta: [] }
}

function normalizeRecord(type, record) {
	var item = Object.assign({}, record || {})
	if (type === 'memos') {
		if (item.starred === undefined) item.starred = !!item.pinned
		if (item.category === '教学') item.category = 'TEACHING'
		if (item.category === '班级') item.category = 'CLASS'
		if (item.category === '学生') item.category = 'STUDENT'
		if (item.category === '会议') item.category = 'MEETING'
		if (item.category === '个人') item.category = 'PERSONAL'
		if (item.priority === '普通') item.priority = 'NORMAL'
		if (item.priority === '紧急') item.priority = 'URGENT'
		delete item.pinned
	}
	return item
}

function readState() {
	var key = accountKey()
	if (!key) return emptyState()
	try {
		var saved = uni.getStorageSync(KEY_PREFIX + key) || {}
		var state = emptyState()
		TYPES.forEach(function (type) { state[type] = Array.isArray(saved[type]) ? saved[type].map(function (item) { return normalizeRecord(type, item) }) : [] })
		return state
	} catch (e) {
		return emptyState()
	}
}

function writeState(state) {
	var key = accountKey()
	if (!key) throw new Error('登录状态已失效，请重新登录')
	uni.setStorageSync(KEY_PREFIX + key, state)
}

function ensureType(type) {
	if (TYPES.indexOf(type) < 0) throw new Error('未知教师模块')
}

export function getTeacherRecords(type) {
	ensureType(type)
	return readState()[type]
}

export function saveTeacherRecord(type, record) {
	ensureType(type)
	if (!record || typeof record !== 'object') throw new Error('记录内容无效')
	var state = readState()
	var now = new Date().toISOString()
	var index = state[type].findIndex(function (item) { return item.id === record.id })
	var normalized = normalizeRecord(type, record)
	var saved = Object.assign({}, index >= 0 ? state[type][index] : {}, normalized, {
		id: record.id || ('tw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
		createdAt: (index >= 0 && state[type][index].createdAt) || record.createdAt || now,
		updatedAt: now
	})
	if (index >= 0) state[type].splice(index, 1, saved)
	else state[type].unshift(saved)
	writeState(state)
	return saved
}

export function deleteTeacherRecord(type, id) {
	ensureType(type)
	var state = readState()
	var before = state[type].length
	state[type] = state[type].filter(function (item) { return item.id !== id })
	if (before !== state[type].length) writeState(state)
	return before !== state[type].length
}
