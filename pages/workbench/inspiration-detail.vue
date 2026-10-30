<template>
	<view class="page">
		<view class="hero">
			<view class="hero-mark"><text class="hero-mark-text">灵</text></view>
			<text class="hero-title">工作台灵感</text>
			<text class="hero-sub" v-if="inspiration">
				方向：{{ inspiration.icon }} {{ inspiration.title }}
			</text>
		</view>

		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载灵感详情…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">灵感详情加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadDetail"><text>重新加载</text></view>
		</view>
		<view v-else class="notice-card">
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
				pageStatus: 'loading', // loading / normal / error
				id: '',
				inspiration: null
			}
		},
		onLoad(query) {
			this.id = (query && query.id) || ''
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				this.pageStatus = 'loading'
				getInspirationDetail(this.id)
					.then((res) => {
						this.inspiration = (res && res.data) || null
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			goBack() {
				uni.navigateBack({ delta: 1 })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 20rpx var(--app-page-padding) 24rpx;
		box-sizing: border-box;
		background: transparent;
	}

	.hero {
		padding: 32rpx 12rpx 36rpx;
		text-align: center;
	}

	.hero-mark {
		width: 108rpx;
		height: 108rpx;
		margin: 0 auto;
		border-radius: 50%;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10rpx 24rpx rgba(10, 92, 106, 0.18);
	}

	.hero-mark-text {
		font-size: 48rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.hero-title {
		display: block;
		margin-top: 24rpx;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.hero-sub {
		display: block;
		margin-top: 14rpx;
		font-size: 27rpx;
		color: var(--app-muted);
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.notice-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 56rpx 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--app-shadow-soft);
	}

	.notice-text {
		font-size: 27rpx;
		color: var(--app-muted);
		text-align: center;
		line-height: 1.6;
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
