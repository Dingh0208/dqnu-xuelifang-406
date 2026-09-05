<template>
	<view class="page">
		<view class="card">
			<text class="icon">👩‍🏫</text>
			<text class="title">老师主页</text>
			<text class="desc">老师端功能建设中（班级管理、作业批改等），敬请期待</text>
		</view>
		<view class="logout" @tap="doLogout">
			<text>退出登录</text>
		</view>
	</view>
</template>

<script>
	import * as authApi from '@/api/auth.js'

	export default {
		methods: {
			doLogout() {
				authApi.logout()
				uni.reLaunch({ url: '/pages/auth/select' })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		background-color: #F7EFE3;
		padding: 160rpx 48rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #FFFDF8;
		border: 1rpx solid #EFE3D0;
		border-radius: 24rpx;
		padding: 80rpx 40rpx;
	}

	.icon {
		font-size: 96rpx;
	}

	.title {
		margin-top: 28rpx;
		font-size: 40rpx;
		font-weight: 700;
		color: #4A3520;
	}

	.desc {
		margin-top: 20rpx;
		font-size: 26rpx;
		color: #B49D82;
		text-align: center;
	}

	.logout {
		margin-top: 60rpx;
		text-align: center;
		padding: 24rpx 0;
		border: 1rpx solid #EFE3D0;
		border-radius: 44rpx;
		background-color: #FFFDF8;
	}

	.logout text {
		font-size: 30rpx;
		color: #7A6448;
	}
</style>
