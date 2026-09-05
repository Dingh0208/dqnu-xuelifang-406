// ============================================================
// 错题本 Mock 数据层（USE_MOCK = true 时由 api/wrongbook.js 调用）
// 数据结构与未来 Spring Boot 接口返回保持一致。
//
// 统一数据结构：
//   WrongQuestion  照片型错题
//   UploadTask    上传任务（拍照 / 文档）
//   UploadHistory 上传历史记录
// ============================================================

// ---------- 题目类型映射（前端展示用，未来可继续扩展） ----------
var QUESTION_TYPE_MAP = {
	choice: '选择题',
	fill: '填空题',
	application: '应用题',
	proof: '证明题'
}

// ---------- 照片型错题列表 ----------
// imageUrl 使用网络占位图（學生拍錯題照片的模擬），未來後端返回真實 OSS 地址
var wrongQuestions = [
	{
		id: 3001,
		imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=340&fit=crop',
		subject: '高等数学',
		title: '极限的定义与基本性质',
		knowledgePoint: '函数极限',
		knowledgePointId: 5001,
		questionType: 'choice',
		uploadedAt: '2026-08-29 10:24',
		source: 'camera',
		sourceFileId: 'cam_20260829_1024',
		status: 'review',
		needReview: true,
		aiStatus: 'success',
		aiRecognizedText: '设函数 f(x) 在 x=0 处连续，求 lim(x→0) f(x)/x ...',
		aiAnalysis: '本题考查极限定义，关键在于理解 ε-δ 语言...',
		wrongCount: 3,
		reviewLevel: 1,
		createdAt: '2026-08-29 10:24:00',
		updatedAt: '2026-08-29 10:25:00'
	},
	{
		id: 3002,
		imageUrl: 'https://images.unsplash.com/photo-1516259767581-4c94d2a4b05c?w=600&h=340&fit=crop',
		subject: '数据结构',
		title: '链表插入与删除',
		knowledgePoint: '单链表',
		knowledgePointId: 5002,
		questionType: 'application',
		uploadedAt: '2026-08-31 16:08',
		source: 'document',
		sourceFileId: 'doc_20260831_1608',
		status: 'review',
		needReview: true,
		aiStatus: 'success',
		aiRecognizedText: '已知单链表 L，写出在 p 结点后插入新结点 s 的操作...',
		aiAnalysis: '指针修改顺序：先 s->next = p->next，再 p->next = s...',
		wrongCount: 2,
		reviewLevel: 1,
		createdAt: '2026-08-31 16:08:00',
		updatedAt: '2026-08-31 16:09:00'
	},
	{
		id: 3003,
		imageUrl: 'https://images.unsplash.com/photo-1456512280520-7a8412c6b1fe?w=600&h=340&fit=crop',
		subject: '英语',
		title: '四级高频词汇辨析',
		knowledgePoint: '高频词汇',
		knowledgePointId: 5003,
		questionType: 'choice',
		uploadedAt: '2026-08-25 09:12',
		source: 'camera',
		sourceFileId: 'cam_20260825_0912',
		status: 'mastered',
		needReview: false,
		aiStatus: 'success',
		aiRecognizedText: 'The word "complement" is most similar in meaning to...',
		aiAnalysis: 'complement 与 compliment 形近义异，需区分记忆...',
		wrongCount: 5,
		reviewLevel: 3,
		createdAt: '2026-08-25 09:12:00',
		updatedAt: '2026-08-25 09:13:00'
	},
	{
		id: 3004,
		imageUrl: 'https://images.unsplash.com/photo-1497633762265-104d8d4c4d03?w=600&h=340&fit=crop',
		subject: '高等数学',
		title: '复合函数求导法则',
		knowledgePoint: '导数与微分',
		knowledgePointId: 5004,
		questionType: 'application',
		uploadedAt: '2026-09-01 08:30',
		source: 'document',
		sourceFileId: 'doc_20260901_0830',
		status: 'review',
		needReview: true,
		aiStatus: 'processing',
		aiRecognizedText: '',
		aiAnalysis: '',
		wrongCount: 2,
		reviewLevel: 0,
		createdAt: '2026-09-01 08:30:00',
		updatedAt: '2026-09-01 08:30:00'
	},
	{
		id: 3005,
		imageUrl: 'https://images.unsplash.com/photo-1543001288-f7d5a8f4b1f5?w=600&h=340&fit=crop',
		subject: '数据结构',
		title: '栈的出入序列判断',
		knowledgePoint: '栈与队列',
		knowledgePointId: 5005,
		questionType: 'choice',
		uploadedAt: '2026-08-27 14:50',
		source: 'camera',
		sourceFileId: 'cam_20260827_1450',
		status: 'mastered',
		needReview: false,
		aiStatus: 'success',
		aiRecognizedText: '设栈的输入序列为 1,2,3,4,5，下列哪个不可能是合法出栈序列...',
		aiAnalysis: '栈的特性为后进先出 LIFO，合法出栈需满足...',
		wrongCount: 4,
		reviewLevel: 2,
		createdAt: '2026-08-27 14:50:00',
		updatedAt: '2026-08-27 14:51:00'
	},
	{
		id: 3006,
		imageUrl: 'https://images.unsplash.com/photo-1434034191-1acd6c2d7f95?w=600&h=340&fit=crop',
		subject: '英语',
		title: '虚拟语气条件句',
		knowledgePoint: '语法',
		knowledgePointId: 5006,
		questionType: 'proof',
		uploadedAt: '2026-09-02 19:15',
		source: 'document',
		sourceFileId: 'doc_20260902_1915',
		status: 'review',
		needReview: true,
		aiStatus: 'failed',
		aiRecognizedText: '',
		aiAnalysis: '',
		wrongCount: 1,
		reviewLevel: 0,
		createdAt: '2026-09-02 19:15:00',
		updatedAt: '2026-09-02 19:15:00'
	}
]

// ---------- 上传历史记录 ----------
var uploadHistories = [
	{
		id: 'h_001',
		fileName: '高数随堂错题.jpg',
		source: 'camera',
		uploadTime: '2026-09-02 19:15',
		status: 'success',
		resultCount: 1
	},
	{
		id: 'h_002',
		fileName: '数据结构错题集.pdf',
		source: 'document',
		uploadTime: '2026-09-01 08:30',
		status: 'success',
		resultCount: 2
	},
	{
		id: 'h_003',
		fileName: '英语真题错题.docx',
		source: 'document',
		uploadTime: '2026-08-31 10:00',
		status: 'failed',
		resultCount: 0
	},
	{
		id: 'h_004',
		fileName: '高数期中错题.jpg',
		source: 'camera',
		uploadTime: '2026-08-29 10:24',
		status: 'success',
		resultCount: 1
	}
]

// ---------- 工具函数 ----------
function deepCopy(o) {
	return JSON.parse(JSON.stringify(o))
}

function ok(data) {
	return { code: 200, message: 'success', data: data }
}

function findQuestion(id) {
	var target = null
	wrongQuestions.forEach(function (q) {
		if (q.id === id) target = q
	})
	return target
}

// 题目类型中文映射（导出供组件复用，避免硬编码）
export function getQuestionTypeLabel(type) {
	return QUESTION_TYPE_MAP[type] || '其他'
}

// ---------- Mock 接口实现（模拟后端 { code, message, data } 响应体） ----------

// GET /api/student/wrongbook（错题列表；当前 Mock 返回全量，前端过滤）
export function fetchWrongBookList(/* params */) {
	return ok({ list: deepCopy(wrongQuestions) })
}

// GET /api/student/wrongbook/statistics（错题统计）
export function fetchWrongBookStatistics() {
	var reviewCount = wrongQuestions.filter(function (q) {
		return q.status === 'review'
	}).length
	var masteredCount = wrongQuestions.filter(function (q) {
		return q.status === 'mastered'
	}).length
	return ok({
		total: wrongQuestions.length,
		reviewCount: reviewCount,
		masteredCount: masteredCount
	})
}

// GET /api/student/wrongbook/{id}（错题详情）
export function fetchWrongBookDetail(id) {
	var target = findQuestion(id)
	return ok(target ? deepCopy(target) : null)
}

// POST /api/student/wrongbook/upload/image（拍照上传，返回上传任务）
export function uploadImageMock(/* filePath */) {
	var uploadId = 'up_cam_' + Date.now()
	return ok({
		uploadId: uploadId,
		source: 'camera',
		fileName: '错题照片.jpg',
		filePath: '',
		fileSize: 0,
		status: 'processing',
		progress: 0,
		createdAt: new Date().toISOString(),
		// 模拟识别完成后的错题 ID 列表（前端可据此刷新列表）
		wrongQuestionIds: [3007]
	})
}

// POST /api/student/wrongbook/upload/document（文档导入）
export function uploadDocumentMock(/* filePath */) {
	var uploadId = 'up_doc_' + Date.now()
	return ok({
		uploadId: uploadId,
		source: 'document',
		fileName: '错题文档.pdf',
		filePath: '',
		fileSize: 0,
		status: 'processing',
		progress: 0,
		createdAt: new Date().toISOString(),
		wrongQuestionIds: [3008, 3009]
	})
}

// GET /api/student/wrongbook/history（上传历史列表）
export function fetchUploadHistory() {
	return ok({ list: deepCopy(uploadHistories) })
}

// GET /api/student/wrongbook/history/{id}（某次上传记录详情）
export function fetchUploadHistoryDetail(id) {
	var target = null
	uploadHistories.forEach(function (h) {
		if (h.id === id) target = h
	})
	return ok(target ? deepCopy(target) : null)
}

// DELETE /api/student/wrongbook/{id}（删除错题）
export function deleteWrongBook(id) {
	return ok({ id: id, deleted: true })
}

// PATCH /api/student/wrongbook/{id}（修改错题信息，如 status / needReview）
export function patchWrongBook(id, patch) {
	return ok({ id: id, patch: patch })
}

// POST /api/student/wrongbook/{id}/reanalyze（重新发起 AI 分析）
export function reanalyzeWrongBook(id) {
	return ok({ id: id, aiStatus: 'processing' })
}

// GET /api/student/wrongbook/{id}/analysis（获取 AI 分析结果）
export function fetchWrongBookAnalysis(id) {
	var target = findQuestion(id)
	if (!target) return ok(null)
	return ok({
		id: id,
		aiStatus: target.aiStatus,
		aiRecognizedText: target.aiRecognizedText,
		aiAnalysis: target.aiAnalysis
	})
}
