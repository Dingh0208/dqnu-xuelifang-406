<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">关于学立方</text>
		</view>

		<!-- 产品标识 -->
		<view class="brand-card">
			<view class="logo">
				<text class="logo-text">学</text>
			</view>
			<text class="brand-name">学立方</text>
			<text class="brand-version">版本 {{ version }}</text>
		</view>

		<!-- 基础产品信息 -->
		<view class="list-card">
			<view class="row">
				<text class="row-label">产品名称</text>
				<text class="row-value">学立方学生端</text>
			</view>
			<view class="row">
				<text class="row-label">产品定位</text>
				<text class="row-value">学生个人学习中心</text>
			</view>
			<view class="row last-row">
				<text class="row-label">当前阶段</text>
				<text class="row-value">第一阶段</text>
			</view>
		</view>

		<!-- 帮助入口 -->
		<view class="list-card">
			<view class="row last-row" @click="goFaq">
				<text class="row-label">常见问题</text>
				<text class="row-arrow">›</text>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 版本号：当前阶段固定值；未来可由后端下发
				version: '1.0.0'
			}
		},
		methods: {
			goFaq() {
				uni.navigateTo({ url: '/pages/profile/faq' })
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

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
		padding: 22rpx 0 22rpx;
	}

	.brand-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 48rpx 28rpx;
		margin-bottom: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: var(--app-shadow-soft);
	}

	.logo {
		width: 120rpx;
		height: 120rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10rpx 24rpx rgba(10, 92, 106, 0.18);
	}

	.logo-text {
		font-size: 54rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.brand-name {
		margin-top: 22rpx;
		font-size: 34rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.brand-version {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: var(--app-muted);
	}

	.list-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 0 28rpx;
		margin-bottom: 24rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 26rpx 0;
		border-bottom: 1rpx solid var(--app-line);
	}

	.row.last-row {
		border-bottom: none;
	}

	.row-label {
		font-size: 27rpx;
		color: var(--app-muted);
	}

	.row-value {
		font-size: 27rpx;
		font-weight: 500;
		color: var(--app-ink);
	}

	.row-arrow {
		font-size: 34rpx;
		color: var(--app-hint);
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
