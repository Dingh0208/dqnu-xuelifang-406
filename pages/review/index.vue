<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">复习安排</text>
		</view>

		<!-- 当前展示 Mock；未来切换为 GET /api/student/home/reviews（遗忘曲线由后端计算），组件无需修改 -->
		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载复习安排…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">复习安排加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadReviews"><text>重新加载</text></view>
		</view>
		<view v-else-if="reviews.length === 0" class="aq-state-card">
			<text class="aq-state-text">今天暂无复习安排</text>
		</view>
		<today-review v-else :reviews="reviews" :show-more="false" />

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import TodayReview from '@/components/home/TodayReview.vue'
	import { getReviews } from '@/api/home.js'

	export default {
		components: {
			TodayReview
		},
		data() {
			return {
				pageStatus: 'loading', // loading / normal / error
				reviews: []
			}
		},
		onLoad() {
			this.loadReviews()
		},
		methods: {
			loadReviews() {
				this.pageStatus = 'loading'
				getReviews()
					.then((res) => {
						this.reviews = (res && res.data && res.data.reviews) || []
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
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

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.bottom-space {
		height: 60rpx;
		height: calc(60rpx + env(safe-area-inset-bottom));
	}
</style>
