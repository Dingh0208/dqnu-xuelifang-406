<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">设置</text>
		</view>

		<!-- 当前阶段只预留页面入口；不为了本次任务自行增加大量设置功能 -->
		<view class="list-card">
			<view class="row" @click="onComingSoon('个人资料')">
				<text class="row-label">个人资料</text>
				<text class="row-arrow">›</text>
			</view>
			<view class="row" @click="onComingSoon('通知设置')">
				<text class="row-label">通知设置</text>
				<text class="row-arrow">›</text>
			</view>
			<view class="row last-row" @click="onComingSoon('缓存清理')">
				<text class="row-label">缓存清理</text>
				<text class="row-arrow">›</text>
			</view>
		</view>

		<!-- 退出登录：清除登录态并回到身份选择页 -->
		<view class="list-card">
			<view class="row last-row logout-row" @click="onLogout">
				<text class="row-label logout-label">退出登录</text>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import * as authApi from '@/api/auth.js'

	export default {
		methods: {
			onComingSoon(name) {
				uni.showToast({ title: name + ' 即将开放', icon: 'none' })
			},
			onLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定要退出当前账号吗？',
					confirmColor: '#E8A340',
					success: (res) => {
						if (!res.confirm) return
						authApi.logout()
						// reLaunch 清空页面栈，返回键不会回到学生端页面
						uni.reLaunch({ url: '/pages/auth/select' })
					}
				})
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
		font-size: 29rpx;
		color: #4A3520;
	}

	.row-arrow {
		font-size: 34rpx;
		color: #C6B092;
	}

	.logout-label {
		color: #C0563C;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
