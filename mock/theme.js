// ============================================================
// Mock 数据层：主题设置（USE_MOCK = true 时由 api/theme.js 调用）
// 数据结构与未来 Spring Boot 接口返回保持一致，后端接入后页面无需改动。
//
// 统一数据结构 ThemeState：
//   currentTheme       当前生效的视觉主题 id
//   homeTheme          首页视觉主题 id（默认 'default'）
//   workbenchTheme     工作台视觉主题 id（null = 暂无工作台主题；工作台接入后由后端下发）
//   syncWorkbenchTheme 本次是否选择把工作台主题同步到首页
//
// 注意：主题是纯视觉层，不承载任何业务数据；前端不以本地缓存作为最终主题状态。
// ============================================================

function deepCopy(o) {
	return JSON.parse(JSON.stringify(o))
}

function ok(data) {
	return { code: 200, message: 'success', data: data }
}

// ---------- 主题状态（未来 GET /api/student/theme 的返回体） ----------
// 当前阶段：首页默认主题，暂无工作台主题，待工作台主题接入后 workbenchTheme 由后端下发真实值。
var themeState = {
	currentTheme: 'default',
	homeTheme: 'default',
	workbenchTheme: null,
	syncWorkbenchTheme: false
}

// GET /api/student/theme
export function fetchTheme() {
	return ok(deepCopy(themeState))
}

// PATCH /api/student/theme（局部更新：homeTheme / workbenchTheme / syncWorkbenchTheme 等）
export function updateTheme(patch) {
	themeState = Object.assign({}, themeState, patch || {})
	return ok(deepCopy(themeState))
}
