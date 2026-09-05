<template>
	<view class="card">
		<view class="card-header">
			<text class="card-title">今日学习安排</text>
			<text v-if="showMore" class="card-more" @click="onMore">查看全部 ›</text>
		</view>

		<view class="timeline">
			<view
				v-for="(item, index) in schedule"
				:key="item.id || index"
				class="timeline-row"
				:class="{ 'last-row': index === schedule.length - 1 }"
			>
				<text class="timeline-time">{{ item.startTime }}</text>
				<view class="timeline-middle">
					<view class="timeline-dot"></view>
					<view v-if="index !== schedule.length - 1" class="timeline-line"></view>
				</view>
				<view class="timeline-content">
					<text class="timeline-title">{{ item.title }}</text>
					<text class="timeline-sub">{{ formatSub(item) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TodaySchedule',
		props: {
			schedule: {
				type: Array,
				default: function () {
					return []
				}
			},
			showMore: {
				type: Boolean,
				default: true
			}
		},
		methods: {
			onMore() {
				this.$emit('more')
			},
			// 由 Schedule 统一字段派生副标题：class → 课程 · 起止时间；study/review → 学习/复习 · 时长
			formatSub(item) {
				if (item.type === 'class') {
					return '课程 · ' + item.startTime + '-' + item.endTime
				}
				var label = item.type === 'review' ? '复习' : '学习'
				return label + ' · ' + this.minutesBetween(item.startTime, item.endTime) + '分钟'
			},
			minutesBetween(start, end) {
				function toMin(t) {
					var parts = (t || '').split(':')
					return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0)
				}
				return Math.max(0, toMin(end) - toMin(start))
			}
		}
	}
</script>

<style>
	.card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 32rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.card-more {
		font-size: 26rpx;
		color: #8D7964;
	}

	.timeline-row {
		display: flex;
	}

	.timeline-time {
		width: 96rpx;
		flex-shrink: 0;
		font-size: 28rpx;
		color: #4A3520;
		font-weight: 500;
		line-height: 42rpx;
	}

	.timeline-middle {
		width: 44rpx;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.timeline-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background-color: #E8A340;
		margin-top: 13rpx;
		flex-shrink: 0;
	}

	/* 时间线：非常浅的暖色 */
	.timeline-line {
		width: 2rpx;
		flex: 1;
		background-color: #F1E4CC;
		margin: 6rpx 0;
	}

	.timeline-content {
		flex: 1;
		padding-bottom: 36rpx;
	}

	.timeline-row.last-row .timeline-content {
		padding-bottom: 4rpx;
	}

	.timeline-title {
		display: block;
		font-size: 30rpx;
		color: #4A3520;
		font-weight: 500;
		line-height: 42rpx;
	}

	.timeline-sub {
		display: block;
		font-size: 24rpx;
		color: #8D7964;
		margin-top: 8rpx;
	}
</style>
