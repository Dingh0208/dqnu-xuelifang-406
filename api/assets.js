// ============================================================
// 学生资产 / 个人信息 / 银币商城 API 封装层
// 页面/组件只调用本文件的方法。USE_MOCK = true 时返回 Mock 数据（Promise）；
// 后端接入后改为 false 即走 request.js，页面无需改动。
//
// ---------------- API 总表（未来 Spring Boot，语义参考，路径遵循后端规范） ----------------
// 方法    路径                                   用途
// GET     /api/student/assets                    学生账户资产（学习金币 coins / 银币 silverCoins）
// GET     /api/student/profile                   学生个人信息
// GET     /api/student/assets/incomplete-streak  连续完全未完成计数与当日惩罚（前端预览/预留）
// GET     /api/student/shop/products             银币商城商品配置
// POST    /api/student/shop/orders               创建银币充值订单（当前 Mock，不接支付）
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/assets.js'

// 1. 学生账户资产：{ coins（学习金币，后端权威余额）, silverCoins（银币，充值获得） }
export function getAssets() {
	if (USE_MOCK) return Promise.resolve(mock.fetchAssets())
	return request({ url: '/api/student/assets', method: 'GET' })
}

// 2. 学生个人信息
export function getProfile() {
	if (USE_MOCK) return Promise.resolve(mock.fetchProfile())
	return request({ url: '/api/student/profile', method: 'GET' })
}

// 3. 连续完全未完成计数 / 当日惩罚（结构预留；真实结算由后端每日执行）
export function getIncompleteStreak() {
	if (USE_MOCK) return Promise.resolve(mock.fetchIncompleteStreak())
	return request({ url: '/api/student/assets/incomplete-streak', method: 'GET' })
}

// 4. 银币商城商品
export function getShopProducts() {
	if (USE_MOCK) return Promise.resolve(mock.fetchShopProducts())
	return request({ url: '/api/student/shop/products', method: 'GET' })
}

// 5. 创建充值订单（当前 Mock：不发起微信/支付宝支付）
export function createShopOrder(productId) {
	if (USE_MOCK) return Promise.resolve(mock.createShopOrder(productId))
	return request({
		url: '/api/student/shop/orders',
		method: 'POST',
		data: { productId: productId }
	})
}
