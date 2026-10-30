<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">学习安排</text>
		</view>

		<!-- 当前展示 Mock；未来切换为 GET /api/student/home/schedule，组件无需修改 -->
		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载学习安排…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">学习安排加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadSchedule"><text>重新加载</text></view>
		</view>
		<view v-else-if="schedule.length === 0" class="aq-state-card">
			<text class="aq-state-text">今天暂无学习安排</text>
		</view>
		<today-schedule v-else :schedule="schedule" :show-more="false" />

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import TodaySchedule from '@/components/home/TodaySchedule.vue'
	import { getSchedule } from '@/api/home.js'

	export default {
		components: {
			TodaySchedule
		},
		data() {
			return {
				pageStatus: 'loading', // loading / normal / error
				schedule: []
			}
		},
		onLoad() {
			this.loadSchedule()
		},
		methods: {
			loadSchedule() {
				this.pageStatus = 'loading'
				getSchedule()
					.then((res) => {
						this.schedule = (res && res.data && res.data.schedule) || []
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
