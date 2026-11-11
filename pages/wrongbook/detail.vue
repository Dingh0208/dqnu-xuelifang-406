<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">错题详情</text>
		</view>

		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载错题详情…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">错题详情加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadDetail"><text>重新加载</text></view>
		</view>
		<view v-else-if="!detail.title" class="aq-state-card">
			<text class="aq-state-text">错题不存在或已被删除</text>
		</view>
		<view v-else class="detail-body">
		<!-- 原始错题照片 -->
		<view class="detail-card">
			<view class="image-wrap">
				<image class="q-image" :src="detail.imageUrl" mode="aspectFill" />
				<view class="q-type-badge">
					<text class="q-type-text">{{ typeLabel }}</text>
				</view>
			</view>
		</view>

		<!-- 错题基本信息 -->
		<view class="info-card">
			<view class="info-row">
				<text class="info-label">学科</text>
				<text class="info-value">{{ detail.subject }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">题目类型</text>
				<text class="info-value">{{ typeLabel }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">题目标题</text>
				<text class="info-value">{{ detail.title }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">知识点</text>
				<text class="info-value">{{ detail.knowledgePoint }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">上传时间</text>
				<text class="info-value">{{ detail.uploadedAt }}</text>
			</view>
			<view class="info-row last-row">
				<text class="info-label">来源</text>
				<text class="info-value">{{ detail.source === 'camera' ? '拍照上传' : '文档导入' }}</text>
			</view>
		</view>

		<!-- AI 识别内容（预留） -->
		<view class="ai-card">
			<view class="ai-head">
				<text class="ai-title">AI识别内容</text>
				<text class="ai-status" :class="detail.aiStatus">{{ aiStatusLabel }}</text>
			</view>
			<view v-if="detail.aiStatus === 'success' && detail.aiRecognizedText" class="ai-body">
				<text class="ai-text">{{ detail.aiRecognizedText }}</text>
			</view>
			<view v-else class="ai-pending">
				<text class="ai-pending-text">AI分析功能建设中</text>
			</view>
		</view>

		<!-- 错题解析（预留） -->
		<view class="ai-card">
			<view class="ai-head">
				<text class="ai-title">错题解析</text>
			</view>
			<view v-if="detail.aiStatus === 'success' && detail.aiAnalysis" class="ai-body">
				<text class="ai-text">{{ detail.aiAnalysis }}</text>
			</view>
			<view v-else class="ai-pending">
				<text class="ai-pending-text">AI分析功能建设中</text>
			</view>
		</view>

		<!-- 后续预留模块（错误原因 / 知识点分析 / 推荐复习） -->
		<view class="ai-card">
			<view class="ai-head">
				<text class="ai-title">错误原因</text>
			</view>
			<view class="ai-pending">
				<text class="ai-pending-text">AI分析功能建设中</text>
			</view>
		</view>

		<view class="ai-card">
			<view class="ai-head">
				<text class="ai-title">知识点分析</text>
			</view>
			<view class="ai-pending">
				<text class="ai-pending-text">AI分析功能建设中</text>
			</view>
		</view>

		<view class="ai-card">
			<view class="ai-head">
				<text class="ai-title">推荐复习</text>
			</view>
			<view class="ai-pending">
				<text class="ai-pending-text">AI分析功能建设中</text>
			</view>
		</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getWrongBookDetail, getQuestionTypeLabel } from '@/api/wrongbook.js'

	export default {
		data() {
			return {
				id: null,
				pageStatus: 'loading', // loading / normal / error
				detail: {}
			}
		},
		computed: {
			typeLabel() {
				return getQuestionTypeLabel(this.detail.questionType)
			},
			aiStatusLabel() {
				var map = { pending: '等待中', processing: '识别中', success: '已完成', failed: '识别失败' }
				return map[this.detail.aiStatus] || '等待中'
			}
		},
		onLoad(options) {
			// 按 id 获取错题数据：当前走 Mock，未来 GET /api/student/wrongbook/{id}
			this.id = options.id ? parseInt(options.id, 10) : 0
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				this.pageStatus = 'loading'
				getWrongBookDetail(this.id)
					.then((res) => {
						this.detail = (res && res.data) || {}
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.page-header {
		padding: 22rpx 0 20rpx;
	}

	.page-title {
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.detail-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		overflow: hidden;
		box-shadow: var(--app-shadow-soft);
		margin-bottom: 24rpx;
	}

	.image-wrap {
		position: relative;
		width: 100%;
		padding-top: 56.25%;
		overflow: hidden;
	}

	.q-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.q-type-badge {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.92);
	}

	.q-type-text {
		font-size: 22rpx;
		color: #FFFFFF;
	}

	/* 基本信息卡片 */
	.info-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 8rpx 28rpx;
		box-shadow: var(--app-shadow-soft);
		margin-bottom: 24rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 26rpx 0;
		border-bottom: 1rpx solid var(--app-line);
	}

	.info-row.last-row {
		border-bottom: none;
	}

	.info-label {
		font-size: 27rpx;
		color: var(--app-muted);
	}

	.info-value {
		font-size: 27rpx;
		color: var(--app-ink);
		font-weight: 500;
		max-width: 60%;
		text-align: right;
	}

	/* AI 预留模块 */
	.ai-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 28rpx;
		box-shadow: var(--app-shadow-soft);
		margin-bottom: 24rpx;
	}

	.ai-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 18rpx;
	}

	.ai-title {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.ai-status {
		font-size: 22rpx;
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
	}

	.ai-status.success {
		background: var(--app-positive-bg);
		color: var(--app-positive);
	}

	.ai-status.processing {
		background: var(--app-warning-bg);
		color: var(--app-warning);
	}

	.ai-status.failed {
		background: var(--app-negative-bg);
		color: var(--app-negative);
	}

	.ai-body {
		padding: 6rpx 0;
	}

	.ai-text {
		font-size: 26rpx;
		color: var(--app-copy);
		line-height: 44rpx;
	}

	.ai-pending {
		padding: 20rpx 0;
	}

	.ai-pending-text {
		font-size: 24rpx;
		color: var(--app-hint);
	}

	.bottom-space {
		height: 60rpx;
		height: calc(60rpx + env(safe-area-inset-bottom));
	}
</style>
