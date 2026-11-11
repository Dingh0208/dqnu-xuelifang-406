// ============================================================
// 「我的」页面 API 封装层
// 页面/组件只调用本文件的方法，不直接拼 URL、不直接 uni.request。
// USE_MOCK = true 时返回 Mock 数据（Promise）；后端接入后改为 false 即走 request.js。
//
// ---------------- API 总表（未来 Spring Boot，路径遵循后端规范） ----------------
// 方法    路径                                       用途
// GET     /api/student/me                            「我的」首页聚合（profile + assets + membership）
// GET     /api/student/coins/learning               学习金币详情（余额/今日获得/今日完成度/任务情况/流水）
// GET     /api/student/coins/learning/records       学习金币流水（支持未来分页 page/pageSize）
// GET     /api/student/mall/silver/products          银币商城商品（价格由后端下发，UI 不硬编码）
// POST    /api/student/mall/orders                   创建银币充值订单（当前 Mock，不接真实支付）
// GET     /api/student/membership                    会员状态（price/coinDeduction 未确定时为 null）
// GET     /api/student/faq                           常见问题列表
// POST    /api/student/feedback                      提交用户建议（type/content/images/contact）
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/my.js'

// 1. 「我的」首页聚合数据：{ profile, assets:{ learningCoin, silverCoin }, membership }
export function getMyPage() {
	if (USE_MOCK) return Promise.resolve(mock.fetchMyPage())
	return request({ url: '/api/student/me', method: 'GET' })
}

// 2. 学习金币详情：余额、今日获得、今日完成度、今日任务完成情况、最近流水
//    余额以后端结算为权威，前端 todayEarned 为实时预览，不做最终入账。
export function getLearningCoinDetail() {
	if (USE_MOCK) return Promise.resolve(mock.fetchLearningCoinDetail())
	return request({ url: '/api/student/coins/learning', method: 'GET' })
}

// 3. 学习金币流水（预留分页）
export function getLearningCoinRecords(page, pageSize) {
	if (USE_MOCK) return Promise.resolve(mock.fetchLearningCoinRecords())
	return request({
		url: '/api/student/coins/learning/records',
		method: 'GET',
		data: { page: page || 1, pageSize: pageSize || 20 }
	})
}

// 4. 银币商城商品：价格集中在数据层下发，UI 不硬编码价格
export function getSilverProducts() {
	if (USE_MOCK) return Promise.resolve(mock.fetchSilverProducts())
	return request({ url: '/api/student/mall/silver/products', method: 'GET' })
}

// 4b. 金币兑换商品（学习金币的用途出口）
export function getCoinProducts() {
	if (USE_MOCK) return Promise.resolve(mock.fetchCoinProducts())
	return request({ url: '/api/student/mall/coin/products', method: 'GET' })
}

// 4c. 金币兑换权益（余额不足时后端返回业务错误）
export function redeemCoinProduct(productId) {
	if (USE_MOCK) {
		return Promise.resolve(mock.redeemCoinProduct(productId)).then(function (res) {
			if (!res || res.code !== 200) throw res || new Error('兑换失败')
			return res
		})
	}
	return request({
		url: '/api/student/mall/coin/redeem',
		method: 'POST',
		data: { productId: productId }
	})
}

// 5. 创建银币充值订单（当前 Mock 不发起微信/支付宝支付；真实支付逻辑暂不实现）
export function createSilverOrder(productId) {
	if (USE_MOCK) return Promise.resolve(mock.createSilverOrder(productId))
	return request({
		url: '/api/student/mall/orders',
		method: 'POST',
		data: { productId: productId }
	})
}

// 6. 会员状态：price / coinDeduction 未确定时为 null，禁止前端自行填写
export function getMembership() {
	if (USE_MOCK) return Promise.resolve(mock.fetchMembership())
	return request({ url: '/api/student/membership', method: 'GET' })
}

// 7. 常见问题列表
export function getFaq() {
	if (USE_MOCK) return Promise.resolve(mock.fetchFaq())
	return request({ url: '/api/student/faq', method: 'GET' })
}

// 8. 提交用户建议：{ type, content, images, contact }
export function submitFeedback(payload) {
	if (USE_MOCK) return Promise.resolve(mock.submitFeedback(payload))
	return request({
		url: '/api/student/feedback',
		method: 'POST',
		data: payload
	})
}
