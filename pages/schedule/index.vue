<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">学习安排</text>
		</view>

		<!-- 当前展示 Mock；未来切换为 GET /api/student/home/schedule，组件无需修改 -->
		<today-schedule :schedule="schedule" :show-more="false" />

		<view class="bottom-space"></view>

		<bottom-tab-bar current="index" />
	</view>
</template>

<script>
	import TodaySchedule from '@/components/home/TodaySchedule.vue'
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import { getSchedule } from '@/api/home.js'

	export default {
		components: {
			TodaySchedule,
			BottomTabBar
		},
		data() {
			return {
				schedule: []
			}
		},
		onLoad() {
			getSchedule().then((res) => {
				this.schedule = res.data.schedule
			})
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

	.bottom-space {
		height: 160rpx;
		height: calc(160rpx + env(safe-area-inset-bottom));
	}
</style>
