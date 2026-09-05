// ============================================================
// 错题本 API 封装层
// 页面/组件只调用本文件的方法；USE_MOCK = true 时返回 Mock Promise，不发送真实请求。
//
// ---------------- 错题本 API 总表（未来 Spring Boot） ----------------
// 方法    路径                                       用途
// GET     /api/student/wrongbook                     错题列表（可选参数 keyword / status）
// GET     /api/student/wrongbook/statistics          错题统计（总数/待复习/已掌握）
// GET     /api/student/wrongbook/{id}                错题详情
// DELETE  /api/student/wrongbook/{id}                删除错题
// PATCH   /api/student/wrongbook/{id}                修改错题信息（status / needReview 等）
// POST    /api/student/wrongbook/upload/image        拍照上传错题
// POST    /api/student/wrongbook/upload/document     文档导入错题
// GET     /api/student/wrongbook/history             上传历史列表
// GET     /api/student/wrongbook/history/{id}        某次上传记录详情
// POST    /api/student/wrongbook/{id}/reanalyze      重新进行 AI 分析
// GET     /api/student/wrongbook/{id}/analysis       获取 AI 分析结果
// ============================================================

import { USE_MOCK } from '@/utils/config.js'
import { request } from './request.js'
import * as mock from '@/mock/wrongbook.js'

// 1. 错题列表
export function getWrongBookList(params) {
	if (USE_MOCK) return Promise.resolve(mock.fetchWrongBookList(params))
	return request({ url: '/api/student/wrongbook', method: 'GET', data: params || {} })
}

// 2. 错题统计
export function getWrongBookStatistics() {
	if (USE_MOCK) return Promise.resolve(mock.fetchWrongBookStatistics())
	return request({ url: '/api/student/wrongbook/statistics', method: 'GET' })
}

// 3. 错题详情
export function getWrongBookDetail(id) {
	if (USE_MOCK) return Promise.resolve(mock.fetchWrongBookDetail(id))
	return request({ url: '/api/student/wrongbook/' + id, method: 'GET' })
}

// 4. 删除错题
export function deleteWrongBook(id) {
	if (USE_MOCK) return Promise.resolve(mock.deleteWrongBook(id))
	return request({ url: '/api/student/wrongbook/' + id, method: 'DELETE' })
}

// 5. 修改错题信息
export function updateWrongBook(id, patch) {
	if (USE_MOCK) return Promise.resolve(mock.patchWrongBook(id, patch))
	return request({ url: '/api/student/wrongbook/' + id, method: 'PATCH', data: patch })
}

// 6. 拍照上传（未来调用 wx.chooseMedia 后，把临时 filePath 通过 uploadFile 发到后端）
export function uploadImage(filePath) {
	if (USE_MOCK) return Promise.resolve(mock.uploadImageMock(filePath))
	// 真实环境示例（不在当前阶段执行）：
	// return new Promise((resolve, reject) => {
	//   uni.uploadFile({
	//     url: BASE_URL + '/api/student/wrongbook/upload/image',
	//     filePath: filePath,
	//     name: 'file',
	//     header: { Authorization: 'Bearer ' + token },
	//     success: res => resolve(JSON.parse(res.data)),
	//     fail: reject
	//   })
	// })
	return request({ url: '/api/student/wrongbook/upload/image', method: 'POST', data: { filePath: filePath } })
}

// 7. 文档导入（未来调用 wx.chooseMessageFile 后上传）
export function uploadDocument(filePath) {
	if (USE_MOCK) return Promise.resolve(mock.uploadDocumentMock(filePath))
	return request({ url: '/api/student/wrongbook/upload/document', method: 'POST', data: { filePath: filePath } })
}

// 8. 上传历史列表
export function getUploadHistory() {
	if (USE_MOCK) return Promise.resolve(mock.fetchUploadHistory())
	return request({ url: '/api/student/wrongbook/history', method: 'GET' })
}

// 9. 某次上传记录详情
export function getUploadHistoryDetail(id) {
	if (USE_MOCK) return Promise.resolve(mock.fetchUploadHistoryDetail(id))
	return request({ url: '/api/student/wrongbook/history/' + id, method: 'GET' })
}

// 10. 重新发起 AI 分析
export function reanalyzeWrongBook(id) {
	if (USE_MOCK) return Promise.resolve(mock.reanalyzeWrongBook(id))
	return request({ url: '/api/student/wrongbook/' + id + '/reanalyze', method: 'POST' })
}

// 11. 获取 AI 分析结果
export function getWrongBookAnalysis(id) {
	if (USE_MOCK) return Promise.resolve(mock.fetchWrongBookAnalysis(id))
	return request({ url: '/api/student/wrongbook/' + id + '/analysis', method: 'GET' })
}

// 题目类型中文标签（与 Mock 一致，未来后端也可直接返回中文）
export function getQuestionTypeLabel(type) {
	return mock.getQuestionTypeLabel(type)
}
