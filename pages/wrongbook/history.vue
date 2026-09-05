<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">历史记录</text>
		</view>

		<view class="list-card">
			<view
				v-for="(item, index) in list"
				:key="item.id"
				class="history-row"
				:class="{ 'last-row': index === list.length - 1 }"
				@click="handleHistoryClick(item)"
			>
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
				list: []
			}
		},
		onLoad() {
			getUploadHistory().then((res) => {
				this.list = res.data.list
			})
		},
		methods: {
			statusLabel(status) {
				var map = { processing: '处理中', success: '已完成', failed: '失败' }
				return map[status] || '处理中'
			},
			// 预留：点击历史记录可查看该批次上传详情
			handleHistoryClick(item) {
				uni.showToast({ title: '上传详情建设中', icon: 'none' })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		background-color: #F7EFE3;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.page-header {
		padding: 28rpx 8rpx 26rpx;
	}

	.page-title {
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.list-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 10rpx 30rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.history-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #EFE3D0;
	}

	.history-row.last-row {
		border-bottom: none;
	}

	.history-main {
		flex: 1;
		min-width: 0;
		padding-right: 20rpx;
	}

	.history-name {
		display: block;
		font-size: 28rpx;
		color: #4A3520;
		font-weight: 500;
	}

	.history-time {
		display: block;
		font-size: 22rpx;
		color: #B49D82;
		margin-top: 8rpx;
	}

	.history-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.history-count {
		font-size: 22rpx;
		color: #8D7964;
		margin-bottom: 10rpx;
	}

	.history-badge {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		background-color: #EFE7DB;
	}

	.history-badge.success {
		background-color: #F6E3C8;
	}

	.badge-text {
		font-size: 22rpx;
		color: #8D7964;
	}

	.history-badge.success .badge-text {
		color: #B56A3C;
	}

	.empty-state {
		padding: 80rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 26rpx;
		color: #B49D82;
	}

	.bottom-space {
		height: 60rpx;
		height: calc(60rpx + env(safe-area-inset-bottom));
	}
</style>
