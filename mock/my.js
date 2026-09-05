// ============================================================
// Mock 数据层：「我的」页面（个人信息 / 学习资产 / 终身会员 / 学习金币详情 / 金币流水 / 银币商城 / FAQ / 反馈）
// 当前阶段 USE_MOCK = true，由 api/my.js 调用；
// 后端（Spring Boot）接入后，页面/组件无需改动，api 层自动切到 request.js。
//
// 字段命名严格遵循产品规则（规范第二节）：
//   learningCoin   学习金币（学习奖励型资产；金色视觉；禁止与银币混用同一字段）
//   silverCoin     银币（充值型付费资产；银色视觉；与金币相互独立，不做兑换）
// 禁止使用 coin 同时代表金币和银币。
// ============================================================

function deepCopy(o) {
	return JSON.parse(JSON.stringify(o))
}

function ok(data) {
	return { code: 200, message: 'success', data: data }
}

// ---------- 个人信息（未来 GET /api/student/me 的 profile 段） ----------
// 顶部个人信息卡只放：头像 / 昵称 / 签名 / 设置入口。
// 严禁在顶部堆放学习天数、连续打卡、金币、银币、等级、经验、排名等大量信息（规范第七节）。
var userProfile = {
	avatar: '',              // 头像图片 URL；当前无资源，UI 用暖色圆形底 + 昵称首字
	avatarText: '方',        // 无头像图片时显示的兜底文字
	nickname: '学习小方',
	signature: '今天也要继续努力'
}

// ---------- 学习资产（未来 GET /api/student/me 的 assets 段） ----------
// learningCoin / silverCoin 字段完全独立；账户余额以后端结算为权威（规范第二十一节）。
// 前端不做 balance++/-- 作为最终资产；本地不单独维护最终金币余额。
var userAssets = {
	learningCoin: 128,      // 学习金币余额（学习获得）
	silverCoin: 20          // 银币余额（充值获得，永久有效）
}

// ---------- 终身会员状态（未来 GET /api/student/me 的 membership 段 / GET /api/student/membership） ----------
// 当前规则未确定：price / coinDeduction 必须为 null，禁止自行填写 ¥299/¥399 等价格（规范第二节）。
var membershipStatus = {
	isMember: false,        // 当前未开通
	type: 'lifetime',        // 会员类型：终身
	price: null,             // 价格未确定 → null（禁止硬编码）
	coinDeduction: null      // 金币抵扣比例未确定 → null（禁止硬编码）
}

// ---------- 学习金币详情（未来 GET /api/student/coins/learning） ----------
// todayEarned / todayCompletionRate / todayCompletedTasks / todayTotalTasks 均为前端实时预览，
// 真正的余额与最终入账以后端返回为准（规范第二十节）。
var learningCoinDetail = {
	balance: 128,                    // 账户余额（后端权威）
	todayEarned: 6,                  // 今日已获得金币（前端预览，由完成度派生）
	todayCompletionRate: 60,         // 今日完成度（0-100）
	todayCompletedTasks: 6,          // 今日已完成任务数
	todayTotalTasks: 10,             // 今日任务总数
	records: []                       // 最近金币流水（见下方 learningCoinRecords）
}

// ---------- 学习金币流水（未来 GET /api/student/coins/learning/records） ----------
// 支持未来分页：page / pageSize（当前 Mock 一次性返回近期记录）。
var learningCoinRecords = [
	{ id: 'r_20260904_06', date: '今天',     delta: 6,  type: 'earn',   desc: '完成今日学习任务' },
	{ id: 'r_20260903_08', date: '昨天',     delta: 8,  type: 'earn',   desc: '完成今日学习任务' },
	{ id: 'r_20260902_10', date: '9月2日',   delta: 10, type: 'earn',   desc: '完成今日学习任务' },
	{ id: 'r_20260901_05', date: '9月1日',   delta: 5,  type: 'earn',   desc: '完成今日学习任务' },
	{ id: 'r_20260831_02', date: '8月31日',  delta: -2, type: 'penalty',desc: '连续完全未完成惩罚（第1天）' }
]

// ---------- 银币商城商品（未来 GET /api/student/mall/silver/products） ----------
// 价格集中配置在数据层，禁止硬编码到 UI 组件（规范第十一节）。
// 当前已确定四档套餐：20/50/100/200 银币。
var silverProducts = [
	{ productId: 'silver_20',  silverAmount: 20,  price: 9.9,  unitPrice: 0.495, enabled: true },
	{ productId: 'silver_50',  silverAmount: 50,  price: 19.9, unitPrice: 0.398, enabled: true },
	{ productId: 'silver_100', silverAmount: 100, price: 49.9, unitPrice: 0.499, enabled: true },
	{ productId: 'silver_200', silverAmount: 200, price: 89.9, unitPrice: 0.4495, enabled: true }
]

// ---------- FAQ（未来 GET /api/student/faq） ----------
// 包含：学习金币 / 银币 / 完成度 / 连续未完成 / 资产扣除 / 终身会员 / 工作台 / 错题本 / 账号（规范第十四节）。
var faqList = [
	{
		category: '关于学习金币',
		items: [
			{ id: 'faq_coin_1', q: '学习金币怎么获得？', a: '完成每日学习任务，按今日完成度获得学习金币。每完成约 10% 的任务获得 1 枚，每日最多 10 枚。' },
			{ id: 'faq_coin_2', q: '学习金币可以兑换银币吗？', a: '不可以。学习金币与银币是两套独立资产，禁止互相兑换。' }
		]
	},
	{
		category: '关于银币',
		items: [
			{ id: 'faq_silver_1', q: '银币怎么获得？', a: '银币通过充值购买获得，不会通过普通学习任务获得。银币永久有效。' }
		]
	},
	{
		category: '关于每日完成度',
		items: [
			{ id: 'faq_rate_1', q: '完成度怎么计算？', a: '今日完成度 = 已完成任务数量 ÷ 今日任务总数量。所有任务权重完全相同，不区分重点任务、学科等。' }
		]
	},
	{
		category: '关于连续未完成',
		items: [
			{ id: 'faq_streak_1', q: '连续未完成会怎样？', a: '当天完成任务数为 0 才触发连续完全未完成惩罚：第1天 -2、第2天 -4、第3天 -8、第4天起每天 -10。完成至少 1 个任务即归零。' }
		]
	},
	{
		category: '关于资产扣除',
		items: [
			{ id: 'faq_deduct_1', q: '惩罚扣哪个资产？', a: '银币优先扣除，银币不足再扣学习金币。资产最低为 0，不会出现负数。' }
		]
	},
	{
		category: '关于终身会员',
		items: [
			{ id: 'faq_member_1', q: '终身会员价格多少？', a: '终身会员最终价格、金币抵扣比例、具体权益尚未最终确定，确定后会公布。当前仅预留入口。' }
		]
	},
	{
		category: '关于工作台',
		items: [
			{ id: 'faq_wb_1', q: '工作台生成的计划在哪里查看？', a: '工作台生成的学习/生活计划继续在首页已有内容中查看，不在「我的」新增「我的工作台」入口。' }
		]
	},
	{
		category: '关于错题本',
		items: [
			{ id: 'faq_wrong_1', q: '错题本在哪里？', a: '错题本是底部 TabBar 的独立入口，可在底部导航直接切换。' }
		]
	},
	{
		category: '关于账号',
		items: [
			{ id: 'faq_acc_1', q: '如何修改个人资料？', a: '当前阶段个人资料修改入口已预留，后续开放。' }
		]
	}
]

// ---------- 以下函数模拟各 API 的返回体（{ code, message, data }） ----------

// GET /api/student/me（「我的」首页聚合：profile + assets + membership）
export function fetchMyPage() {
	return ok({
		profile: deepCopy(userProfile),
		assets: deepCopy(userAssets),
		membership: deepCopy(membershipStatus)
	})
}

// GET /api/student/coins/learning（学习金币详情：余额 / 今日获得 / 今日完成度 / 今日任务情况 / 最近流水）
export function fetchLearningCoinDetail() {
	var detail = deepCopy(learningCoinDetail)
	detail.records = deepCopy(learningCoinRecords)
	return ok(detail)
}

// GET /api/student/coins/learning/records（金币流水；支持未来分页 page/pageSize）
export function fetchLearningCoinRecords() {
	return ok({ records: deepCopy(learningCoinRecords) })
}

// GET /api/student/mall/silver/products（银币商城商品；价格由数据层下发，UI 不硬编码）
export function fetchSilverProducts() {
	return ok({ products: deepCopy(silverProducts) })
}

// POST /api/student/mall/orders（创建银币充值订单；当前 Mock 不发起微信/支付宝支付）
// 真实支付逻辑暂不实现（规范第二十七节）。
export function createSilverOrder(productId) {
	return ok({
		productId: productId,
		orderId: 'mock_' + productId + '_' + Date.now(),
		status: 'pending',       // 订单状态：待支付（当前不接真实支付）
		amount: null             // 金额由后端根据 productId 计算下发
	})
}

// GET /api/student/membership（会员状态；price/coinDeduction 未确定时为 null）
export function fetchMembership() {
	return ok(deepCopy(membershipStatus))
}

// GET /api/student/faq（常见问题；支持 loading/empty/error 状态）
export function fetchFaq() {
	return ok({ categories: deepCopy(faqList) })
}

// POST /api/student/feedback（提交用户建议；当前 Mock 仅返回成功占位）
// 请求结构预留：{ type, content, images, contact }
export function submitFeedback(payload) {
	return ok({
		received: true,
		type: payload && payload.type,
		content: payload && payload.content
	})
}
