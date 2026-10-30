<template>
	<view class="page">
		<view class="notice-card">
			<text class="notice-title">正在准备问答系统</text>
			<text class="notice-mode">当前模式：</text>
			<text class="notice-mode-value">{{ modeLabel }}</text>
		</view>

		<view class="back-btn" @click="goBack">
			<text class="back-btn-text">返回</text>
		</view>
	</view>
</template>

<script>
	import { getCreateModeLabel } from '@/api/workbench.js'

	export default {
		data() {
			return {
				mode: '',
				modeLabel: '快速创建'
			}
		},
		onLoad(query) {
			this.mode = (query && query.mode) || 'quick'
			this.modeLabel = getCreateModeLabel(this.mode)
		},
		methods: {
			goBack() {
				uni.navigateBack({ delta: 1 })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 24rpx var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.notice-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 56rpx 28rpx;
		box-shadow: var(--app-shadow-soft);
		text-align: center;
	}

	.notice-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.notice-mode {
		display: block;
		margin-top: 32rpx;
		font-size: 25rpx;
		color: var(--app-muted);
	}

	.notice-mode-value {
		display: inline-block;
		margin-top: 14rpx;
		padding: 10rpx 24rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
		font-size: 27rpx;
		font-weight: 600;
	}

	.back-btn {
		margin-top: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 88rpx;
		padding: 0 56rpx;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: 999rpx;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
		margin-left: auto;
		margin-right: auto;
		width: 360rpx;
	}

	.back-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #FFFFFF;
	}
</style>
