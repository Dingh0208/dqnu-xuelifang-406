<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">历史记录</text>
		</view>

		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载上传记录…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">上传记录加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadHistory"><text>重新加载</text></view>
		</view>
		<view v-else class="list-card">
			<view
				v-for="(item, index) in list"
				:key="item.id"
				class="history-item"
				:class="{ 'last-item': index === list.length - 1 }"
			>
				<view class="history-row" @click="toggleDetail(item)">
					<view class="history-main">
						<text class="history-name">{{ item.fileName }}</text>
						<text class="history-time">{{ item.uploadTime }}</text>
					</view>
					<view class="history-meta">
						<text class="history-count">{{ item.resultCount }} 道错题</text>
						<view class="history-badge" :class="item.status">
							<text class="badge-text">{{ statusLabel(item.status) }}</text>
						</view>
					</view>
				</view>

				<!-- 批次详情：成功批展示识别出的题目；失败批给出原因 -->
				<view v-if="expandedId === item.id" class="history-detail">
					<view v-if="item.status === 'failed'" class="detail-failed">
						<text>本次识别失败，文件可能模糊或格式不支持，请重新上传。</text>
					</view>
					<template v-else-if="item.questions && item.questions.length">
						<view
							v-for="q in item.questions"
							:key="q.id"
							class="detail-row"
						>
							<view class="detail-main">
								<text class="detail-title">{{ q.title }}</text>
								<text class="detail-sub">{{ q.subject }}</text>
							</view>
							<text class="detail-status" :class="q.status === 'mastered' ? 'mastered' : ''">
								{{ q.status === 'mastered' ? '已掌握' : '待复习' }}
							</text>
						</view>
						<view class="detail-cta" @click="goWrongBook">
							<text>去错题本查看 →</text>
						</view>
					</template>
				</view>
			</view>

			<view v-if="list.length === 0" class="empty-state">
				<text class="empty-text">暂无上传记录</text>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getUploadHistory } from '@/api/wrongbook.js'

	export default {
		data() {
			return {
				pageStatus: 'loading', // loading / normal / error
				list: [],
				expandedId: ''        // 当前展开的批次 id
			}
		},
		onLoad() {
			this.loadHistory()
		},
		methods: {
			loadHistory() {
				this.pageStatus = 'loading'
				getUploadHistory()
					.then((res) => {
						this.list = (res && res.data && res.data.list) || []
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			statusLabel(status) {
				var map = { processing: '处理中', success: '已完成', failed: '失败' }
				return map[status] || '处理中'
			},
			// 点击历史记录：展开/收起该批次详情
			toggleDetail(item) {
				this.expandedId = this.expandedId === item.id ? '' : item.id
			},
			// 去错题本：跳回错题列表，用户在那里继续复习
			goWrongBook() {
				uni.navigateTo({ url: '/pages/wrongbook/index' })
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

	.list-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 4rpx 28rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.history-item {
		border-bottom: 1rpx solid var(--app-line);
	}

	.history-item.last-item {
		border-bottom: none;
	}

	.history-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 26rpx 0;
	}

	.history-main {
		flex: 1;
		min-width: 0;
		padding-right: 20rpx;
	}

	.history-name {
		display: block;
		font-size: 28rpx;
		color: var(--app-ink);
		font-weight: 500;
	}

	.history-time {
		display: block;
		font-size: 22rpx;
		color: var(--app-hint);
		margin-top: 8rpx;
	}

	.history-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.history-count {
		font-size: 22rpx;
		color: var(--app-muted);
		margin-bottom: 10rpx;
	}

	.history-badge {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
	}

	.history-badge.success {
		background: var(--app-positive-bg);
	}

	.history-badge.failed {
		background: var(--app-negative-bg);
	}

	.history-badge.processing {
		background: var(--app-warning-bg);
	}

	.badge-text {
		font-size: 22rpx;
		color: #0A6B63;
	}

	.history-badge.success .badge-text {
		color: var(--app-positive);
	}

	.history-badge.failed .badge-text {
		color: var(--app-negative);
	}

	.history-badge.processing .badge-text {
		color: var(--app-warning);
	}

	.history-detail {
		padding: 4rpx 0 24rpx;
	}

	.detail-failed {
		padding: 16rpx 20rpx;
		border-radius: 16rpx;
		background: var(--app-negative-bg, #FCECEA);
		color: var(--app-negative, #D56157);
		font-size: 23rpx;
		line-height: 1.6;
	}

	.detail-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14rpx 20rpx;
		margin-bottom: 10rpx;
		border-radius: 16rpx;
		background: var(--app-surface-soft, #E2F3F2);
	}

	.detail-main {
		flex: 1;
		min-width: 0;
		padding-right: 16rpx;
	}

	.detail-title {
		display: block;
		font-size: 25rpx;
		font-weight: 500;
		color: var(--app-ink, #0D2F36);
	}

	.detail-sub {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.detail-status {
		flex-shrink: 0;
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background: var(--app-warning-bg, #FFF5E2);
		color: var(--app-warning, #C48A2A);
		font-size: 21rpx;
		font-weight: 600;
	}

	.detail-status.mastered {
		background: var(--app-positive-bg, #E2F7F1);
		color: var(--app-positive, #0E9F86);
	}

	.detail-cta {
		padding: 16rpx 0 4rpx;
		text-align: center;
	}

	.detail-cta text {
		font-size: 24rpx;
		font-weight: 600;
		color: var(--app-primary, #0A5C6A);
	}

	.empty-state {
		padding: 72rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 26rpx;
		color: var(--app-muted);
	}

	.bottom-space {
		height: 60rpx;
		height: calc(60rpx + env(safe-area-inset-bottom));
	}
</style>
