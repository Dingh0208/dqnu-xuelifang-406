<template>
	<view class="page">
		<view class="hero">
			<text class="hero-emoji">🎨</text>
			<text class="hero-title">工作台灵感</text>
			<text class="hero-sub" v-if="inspiration">
				方向：{{ inspiration.icon }} {{ inspiration.title }}
			</text>
		</view>

		<view class="notice-card">
			<text class="notice-text">正在准备这个工作台的详细定制功能</text>
		</view>

		<view class="back-btn" @click="goBack">
			<text class="back-btn-text">返回工作台</text>
		</view>
	</view>
</template>

<script>
	import { getInspirationDetail } from '@/api/workbench.js'

	export default {
		data() {
			return {
				inspiration: null
			}
		},
		onLoad(query) {
			var id = (query && query.id) || ''
			getInspirationDetail(id).then((res) => {
				this.inspiration = (res && res.data) || null
			})
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

	.hero {
		padding: 32rpx 12rpx 40rpx;
		text-align: center;
	}

	.hero-emoji {
		display: block;
		font-size: 96rpx;
		line-height: 1;
	}

	.hero-title {
		display: block;
		margin-top: 24rpx;
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.hero-sub {
		display: block;
		margin-top: 14rpx;
		font-size: 28rpx;
		color: #8D7964;
	}

	.notice-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 60rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.notice-text {
		font-size: 28rpx;
		color: #8D7964;
		text-align: center;
		line-height: 1.6;
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
