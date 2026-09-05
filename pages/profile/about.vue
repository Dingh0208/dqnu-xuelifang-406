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
		background-color: #F7EFE3;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.page-title {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
		padding: 28rpx 8rpx 26rpx;
	}

	.brand-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 48rpx 30rpx;
		margin-bottom: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.logo {
		width: 120rpx;
		height: 120rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #EEB048 0%, #E8A340 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo-text {
		font-size: 56rpx;
		font-weight: 700;
		color: #FFFDF8;
	}

	.brand-name {
		margin-top: 22rpx;
		font-size: 34rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.brand-version {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #8D7964;
	}

	.list-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 0 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #EFE3D0;
	}

	.row.last-row {
		border-bottom: none;
	}

	.row-label {
		font-size: 27rpx;
		color: #8D7964;
	}

	.row-value {
		font-size: 27rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.row-arrow {
		font-size: 34rpx;
		color: #C6B092;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
