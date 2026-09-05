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
		background-color: #F7EFE3;
		padding: 40rpx 24rpx 24rpx;
		box-sizing: border-box;
	}

	.notice-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 60rpx 30rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
		text-align: center;
	}

	.notice-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.notice-mode {
		display: block;
		margin-top: 36rpx;
		font-size: 26rpx;
		color: #8D7964;
	}

	.notice-mode-value {
		display: block;
		margin-top: 10rpx;
		font-size: 30rpx;
		font-weight: 600;
		color: #B56A3C;
	}

	.back-btn {
		margin-top: 56rpx;
		align-self: center;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 22rpx 64rpx;
		background-color: #B56A3C;
		border-radius: 999rpx;
		margin-left: auto;
		margin-right: auto;
		width: fit-content;
	}

	.back-btn-text {
		font-size: 30rpx;
		font-weight: 600;
		color: #FFFDF8;
	}
</style>
