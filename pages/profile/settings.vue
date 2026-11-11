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
					confirmColor: '#0A5C6A',
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

	.list-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 0 28rpx;
		margin-bottom: 22rpx;
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
		font-size: 28rpx;
		color: var(--app-ink);
	}

	.row-arrow {
		font-size: 34rpx;
		color: var(--app-hint);
	}

	.logout-label {
		color: var(--app-negative);
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
