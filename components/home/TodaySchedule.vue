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
			<view v-if="schedule.length === 0" class="schedule-empty">
				<text>今天没有学习安排</text>
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
		padding: 28rpx;
		margin-bottom: 24rpx;
		background: var(--app-surface, rgba(255, 255, 255, 0.90));
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 26rpx;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.card-more {
		font-size: 24rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.timeline-row {
		display: flex;
	}

	.timeline-time {
		width: 92rpx;
		flex-shrink: 0;
		font-size: 26rpx;
		font-weight: 500;
		line-height: 40rpx;
		color: var(--app-primary, #0A5C6A);
		font-variant-numeric: tabular-nums;
	}

	.timeline-middle {
		width: 40rpx;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.timeline-dot {
		width: 14rpx;
		height: 14rpx;
		margin-top: 13rpx;
		border-radius: 50%;
		background: var(--app-accent, #12B5A5);
		box-shadow: 0 0 0 6rpx rgba(18, 181, 165, 0.12);
		flex-shrink: 0;
	}

	.timeline-line {
		width: 2rpx;
		flex: 1;
		margin: 8rpx 0;
		background: var(--app-line, #D3E8E7);
	}

	.timeline-content {
		flex: 1;
		min-width: 0;
		padding-bottom: 32rpx;
	}

	.timeline-row.last-row .timeline-content {
		padding-bottom: 4rpx;
	}

	.timeline-title {
		display: block;
		font-size: 29rpx;
		font-weight: 500;
		line-height: 40rpx;
		color: var(--app-ink, #0D2F36);
	}

	.timeline-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 23rpx;
		line-height: 1.5;
		color: var(--app-muted, #7B9AA1);
	}

	.schedule-empty {
		padding: 36rpx 0 20rpx;
		text-align: center;
	}

	.schedule-empty text {
		font-size: 25rpx;
		line-height: 1.6;
		color: var(--app-muted, #7B9AA1);
	}
</style>
