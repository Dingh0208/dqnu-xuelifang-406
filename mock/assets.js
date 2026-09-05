// ============================================================
// Mock 数据层：学生资产 / 个人信息 / 银币商城
// 当前阶段 USE_MOCK = true，由 api/assets.js 调用；
// 后端（Spring Boot）接入后，页面/组件无需改动，api 层自动切到 request.js。
//
// 统一数据结构：
//   UserAssets { coins, silverCoins }
//     coins       学习金币：完成学习任务获得（账户余额以后端结算为权威）
//     silverCoins 银币：用户充值购买获得；与金币相互独立，当前不做兑换
//   UserProfile { id, nickname, avatarText, studyDays }
//   ShopProduct { id, silverCoins, priceYuan }
// ============================================================

function deepCopy(o) {
	return JSON.parse(JSON.stringify(o))
}

function ok(data) {
	return { code: 200, message: 'success', data: data }
}

// ---------- 学生账户资产（未来 GET /api/student/assets 的返回体） ----------
// 注意：coins 是账户真实余额（后端权威），与首页「今日预计金币 todayRewardCoins」是两个字段。
var userAssets = {
	coins: 126,
	silverCoins: 0
}

// ---------- 学生个人信息（未来 GET /api/student/profile） ----------
var userProfile = {
	id: 10001,
	nickname: '学习小方',
	// 当前无头像图片资源，使用暖色圆形底 + 昵称首字头像（UI 层渲染）
	avatarText: '方',
	studyDays: 28
}

// ---------- 连续完全未完成计数（仅预留结构 + Mock 值） ----------
// 真实「连续天数判定 / 每日结算 / 惩罚扣减」由后端每日执行，前端不做权威计算。
var incompleteStreak = {
	// 连续完全未完成天数（0 表示当前没有连续未完成）
	consecutiveIncompleteDays: 0,
	// 今日预计扣减金币（前端预览用；完成至少 1 个任务即为 0 并归零计数）
	penaltyToday: 0
}

// ---------- 银币商城商品配置（未来 GET /api/student/shop/products 下发） ----------
// 价格集中配置在数据层，不硬编码到 UI 组件中；当前不接支付。
var shopProducts = [
	{ id: 'silver_20', silverCoins: 20, priceYuan: 9.9 },
	{ id: 'silver_50', silverCoins: 50, priceYuan: 19.9 },
	{ id: 'silver_100', silverCoins: 100, priceYuan: 49.9 },
	{ id: 'silver_200', silverCoins: 200, priceYuan: 89.9 }
]

// ---------- 以下函数模拟各 API 返回体 ----------

// GET /api/student/assets
export function fetchAssets() {
	return ok(deepCopy(userAssets))
}

// GET /api/student/profile
export function fetchProfile() {
	return ok(deepCopy(userProfile))
}

// GET /api/student/assets/incomplete-streak（连续未完成惩罚预览，预留）
export function fetchIncompleteStreak() {
	return ok(deepCopy(incompleteStreak))
}

// GET /api/student/shop/products
export function fetchShopProducts() {
	return ok({ products: deepCopy(shopProducts) })
}

// POST /api/student/shop/orders（未来：创建充值订单；当前 Mock 不发起支付）
export function createShopOrder(productId) {
	return ok({ productId: productId, orderId: null, status: 'mock_pending' })
}
