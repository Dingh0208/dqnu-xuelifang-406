// ============================================================
// 工作台 Mock 数据层（USE_MOCK = true 时由 api/workbench.js 调用）
// 数据结构与未来 Spring Boot 接口返回保持一致。
//
// 统一数据结构：
//   WorkbenchInspiration  工作台灵感（预置 8 个方向，供用户挑选开始）
//   Workbench            用户实际创建的工作台实例（本次仅结构，无真实生成）
//   CreateMode           创建模式（快速 / 深度 / 极致）
//
// 当前只实现 8 个灵感卡片所需的最小字段，其余字段为未来扩展预留。
// ============================================================

// ---------- 工作台灵感列表 ----------
// icon 使用 Emoji，避免引入额外图片资源。
// 未来可能扩展：prompt / theme / features / aiRole / layout / difficulty 等。
var inspirations = [
	{
		id: 'rpg',
		icon: '🎮',
		title: 'RPG 冒险工作台',
		description: '把目标、任务和成长变成一场冒险'
		// TODO 未来字段（当前不使用，仅占位）：
		// prompt: '',
		// theme: { primary: '', accent: '' },
		// features: [],
		// aiRole: '',
		// layout: 'adventure'
	},
	{
		id: 'pet',
		icon: '🐾',
		title: 'AI 宠物陪伴工作台',
		description: '让 AI 宠物陪伴你的学习与生活'
	},
	{
		id: 'grow',
		icon: '🌱',
		title: '成长养成工作台',
		description: '用成长、等级和阶段记录自己的进步'
	},
	{
		id: 'space',
		icon: '🚀',
		title: '太空探索工作台',
		description: '把长期目标变成一场持续推进的星际探索'
	},
	{
		id: 'campus',
		icon: '🏫',
		title: '校园生活工作台',
		description: '管理学习、作业和校园日常生活'
	},
	{
		id: 'study',
		icon: '📚',
		title: '沉浸式学习工作台',
		description: '专注学习、复习、任务和知识积累'
	},
	{
		id: 'life',
		icon: '🏢',
		title: '人生经营工作台',
		description: '像经营一个长期项目一样管理自己的生活'
	},
	{
		id: 'efficiency',
		icon: '⏱️',
		title: '效率管理工作台',
		description: '统一管理时间、任务、习惯和目标'
	}
]

// ---------- 创建模式：仅供前端 UI 使用（当前不与后端对齐） ----------
var createModes = [
	{
		id: 'quick',
		icon: '⚡',
		title: '快速创建',
		questionCount: 20,
		summary: '用最少的时间告诉 AI，你大概想要什么。',
		buttonText: '开始快速创建'
	},
	{
		id: 'deep',
		icon: '🧠',
		title: '深度创建',
		questionCount: 50,
		summary: '更全面地定制你的工作台，适合已经有明确想法的用户。',
		buttonText: '开始深度创建'
	},
	{
		id: 'custom',
		icon: '🎨',
		title: '极致定制',
		questionCount: 100,
		summary: '从视觉、功能、AI角色到交互方式，尽可能控制工作台的每一个细节。',
		buttonText: '开始极致定制'
	}
]

// ==================================================
// 对外 Mock 方法（与 api/workbench.js 一一对应）
// ==================================================

// 1. 拉取工作台灵感列表
export function fetchInspirations() {
	return {
		code: 0,
		msg: 'ok',
		data: {
			list: inspirations.slice()
		}
	}
}

// 2. 单个灵感详情（点击卡片后进入定制页使用；当前只按 id 返回原对象）
export function fetchInspirationDetail(id) {
	var item = inspirations.find(function (i) { return i.id === id }) || null
	return {
		code: 0,
		msg: 'ok',
		data: item
	}
}

// 3. 创建工作台（提交自由描述；当前不真正生成，仅返回成功占位）
export function createWorkbench(payload) {
	return {
		code: 0,
		msg: 'ok',
		data: {
			workbenchId: 'wb_' + Date.now(),
			status: 'pending'
		}
	}
}

// 4. 触发 AI 生成工作台（当前占位）
export function generateWorkbench(workbenchId, options) {
	return {
		code: 0,
		msg: 'ok',
		data: {
			workbenchId: workbenchId,
			progress: 0
		}
	}
}

// 5. 拉取工作台详情（当前占位）
export function fetchWorkbenchDetail(workbenchId) {
	return {
		code: 0,
		msg: 'ok',
		data: null
	}
}

// 6. 修改工作台（当前占位）
export function updateWorkbench(workbenchId, patch) {
	return {
		code: 0,
		msg: 'ok',
		data: {}
	}
}

// 7. 获取创建模式（前端使用，当前不走后端，返回三模式）
export function fetchCreateModes() {
	return {
		code: 0,
		msg: 'ok',
		data: {
			list: createModes.slice()
		}
	}
}

// 8. 根据 mode 获取创建模式名称（questionnaire 占位页使用）
export function getCreateModeLabel(mode) {
	var mapping = {
		quick: '快速创建',
		deep: '深度创建',
		custom: '极致定制'
	}
	return mapping[mode] || '未知模式'
}

// 9. 把一个灵感对象转为「AI 创作上下文」默认提示：
//    用户点击灵感后作为输入框的建议起点，可继续自由修改后提交。
export function buildInspirationPrompt(item) {
	if (!item) return ''
	return '我想创建一个 ' + (item.title || '') + '，' + (item.description || '') + '。'
}
