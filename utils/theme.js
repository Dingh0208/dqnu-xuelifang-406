// ============================================================
// 主题系统 —— 纯配置与纯函数（视觉层）
//
// 重要边界：
//   - 主题只影响「视觉表现」，绝不修改任何业务数据
//     （学习金币 / 银币 / 每日任务 / 完成度 / 会员 / 错题本 / 工作台数据等均与主题无关）；
//   - 主题最终状态以后端返回为权威，前端不把 localStorage / storage 作为最终数据；
//   - 当前阶段只内置「默认主题」，不擅自新增紫/绿/粉/黑金等主题（无数据不造假）。
//
// 两个独立概念：
//   homeTheme       首页视觉主题（默认 'default'）
//   workbenchTheme  工作台视觉主题（用户创建带主题的工作台后存在；null 表示暂无）
//   两者不一致时，系统可询问用户是否将工作台主题同步到首页（同步只改视觉）。
// ============================================================

// 当前可用的主题预设；新增主题必须先有产品/数据来源，禁止前端自行编造
var THEME_PRESETS = [
	{ id: 'default', name: '默认主题' }
]

// 主题 id → 展示名；未知 id 兜底为「默认主题」
export function themeDisplayName(id) {
	if (!id) return '默认主题'
	for (var i = 0; i < THEME_PRESETS.length; i++) {
		if (THEME_PRESETS[i].id === id) return THEME_PRESETS[i].name
	}
	return id
}

export function getThemePresets() {
	return THEME_PRESETS.slice()
}

// 是否存在工作台主题（workbenchTheme 为 null 表示暂无）
export function hasWorkbenchTheme(theme) {
	return !!(theme && theme.workbenchTheme)
}

// 是否处于「待同步」状态：工作台主题存在，且与首页主题不一致
export function isThemeSyncPending(theme) {
	return hasWorkbenchTheme(theme) && theme.workbenchTheme !== theme.homeTheme
}

// 「同步到首页」：homeTheme = workbenchTheme；仅视觉变化
// 返回新对象，不修改入参
export function buildSyncedTheme(theme) {
	var t = theme || {}
	return {
		currentTheme: t.workbenchTheme,
		homeTheme: t.workbenchTheme,
		workbenchTheme: t.workbenchTheme,
		syncWorkbenchTheme: true
	}
}

// 「暂不同步」：homeTheme 保持当前主题不变，仅记录用户本次不同步
export function buildDismissSyncTheme(theme) {
	var t = theme || {}
	return {
		currentTheme: t.currentTheme || t.homeTheme || 'default',
		homeTheme: t.homeTheme || 'default',
		workbenchTheme: t.workbenchTheme || null,
		syncWorkbenchTheme: false
	}
}

// 手动切换首页主题（用户在主题页选择某个主题）
export function buildSelectHomeTheme(theme, themeId) {
	var t = theme || {}
	return {
		currentTheme: themeId,
		homeTheme: themeId,
		workbenchTheme: t.workbenchTheme || null,
		syncWorkbenchTheme: false
	}
}
