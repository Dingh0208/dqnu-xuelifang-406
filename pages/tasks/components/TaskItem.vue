<template>
	<!-- 单个任务项（纯展示）：checkbox 视觉唯一来源 = task.completed；
	     未完成 □ / 完成 黄底白 ✓，无第二套状态、无动画、无强制刷新 -->
	<view class="task-row" :class="{ 'last-row': isLast }">
		<view class="checkbox-hit" @click="onToggle">
			<view class="task-checkbox" :class="{ checked: task.completed }">
				<!-- ✓ 节点常驻 + v-show 切换（mp 端属性级更新稳定），勿改回 v-if -->
				<text v-show="task.completed" class="check-mark">✓</text>
			</view>
		</view>
		<view class="task-info">
			<text class="task-title" :class="{ 'task-done': task.completed }">{{ task.title }}</text>
			<text class="task-desc">{{ task.description }}</text>
		</view>
		<text class="task-duration">{{ task.estimatedMinutes }}分钟</text>
	</view>
</template>

<script>
	export default {
		name: 'TaskItem',
		props: {
			task: {
				type: Object,
				required: true
			},
			isLast: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			onToggle() {
				// 只上报事件；completed 的翻转统一由页面 → taskState 处理
				this.$emit('toggle', this.task)
			}
		}
	}
</script>

<style>
	/* 视觉沿用首页 TodayTasks 任务行：暖棕系卡片行样式，保持一致 */
	.task-row {
		display: flex;
		align-items: flex-start;
		padding: 26rpx 0;
		border-bottom: 1rpx solid #EFE3D0;
	}

	.task-row.last-row {
		border-bottom: none;
		padding-bottom: 8rpx;
	}

	.checkbox-hit {
		padding: 6rpx 16rpx 6rpx 0;
		flex-shrink: 0;
	}

	.task-checkbox {
		width: 44rpx;
		height: 44rpx;
		border-radius: 12rpx;
		box-sizing: border-box;
		background-color: #FFF9EE;
		border: 2rpx solid #E0C9A6;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.task-checkbox.checked {
		background-color: #E8A340;
		border-color: #E8A340;
	}

	.check-mark {
		font-size: 26rpx;
		font-weight: 700;
		color: #FFFFFF;
		line-height: 1;
	}

	.task-info {
		flex: 1;
		min-width: 0;
	}

	.task-title {
		display: block;
		font-size: 30rpx;
		color: #4A3520;
		font-weight: 500;
		line-height: 44rpx;
	}

	.task-title.task-done {
		color: #9C8874;
	}

	.task-desc {
		display: block;
		font-size: 24rpx;
		color: #8D7964;
		margin-top: 8rpx;
	}

	.task-duration {
		flex-shrink: 0;
		margin-left: 16rpx;
		padding-top: 8rpx;
		font-size: 26rpx;
		color: #8D7964;
	}
</style>
