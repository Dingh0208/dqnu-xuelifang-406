<template>
	<view class="card">
		<view class="card-header">
			<text class="card-title">今日计划</text>
			<text v-if="showMore" class="card-more" @click="onMore">查看全部 ›</text>
		</view>

		<view class="task-list">
			<view
				v-for="(task, index) in displayTasks"
				:key="task.id"
				class="task-row"
				:class="{ 'last-row': index === displayTasks.length - 1 }"
			>
				<view class="checkbox-hit" @click="onToggle(task)">
					<view class="task-checkbox" :class="{ checked: task.completed }">
						<!-- ✓ 节点用 v-show 常驻（display 切换，mp 端属性级更新稳定）；
						     勿改回 v-if：v-if 节点增删在「v-for 内对象属性变化」场景下 diff 易丢更新，
						     曾导致 completed=true 时出现「黄底无✓」中间态 -->
						<text v-show="task.completed" class="check-mark">✓</text>
					</view>
				</view>
				<view class="task-info">
					<text class="task-title" :class="{ 'task-done': task.completed }">{{ task.title }}</text>
					<text class="task-desc">{{ task.description }}</text>
				</view>
				<text class="task-duration">{{ task.estimatedMinutes }}分钟</text>
			</view>
			<!-- 全部完成时卡片兜底提示（首页传未完成任务列表，完成后自然为空） -->
			<view v-if="displayTasks.length === 0" class="task-empty">
				<text class="task-empty-text">今日任务已全部完成</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TodayTasks',
		props: {
			tasks: {
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
		computed: {
			// 【2026-09 重写】纯展示组件：直接渲染传入的 tasks。
			// 首页传入「未完成任务新数组」（taskState.getPendingTasks()，顺序由状态源维护）；
			// 本组件不做任何分组/排序/过滤；checkbox 唯一数据源 = task.completed。
			displayTasks() {
				return this.tasks
			}
		},
		methods: {
			onToggle(task) {
				// 只上报事件；completed 的翻转统一由页面 → taskState 处理
				this.$emit('toggle', task)
			},
			onMore() {
				this.$emit('more')
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
		margin-bottom: 10rpx;
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

	/* 自定义 Checkbox：加一层点击热区 */
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

	/* 完成任务：仅降低文字强调度，与参考图一致，不加删除线 */
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

	/* 全部完成兜底提示（沿用现有配色） */
	.task-empty {
		padding: 40rpx 0 24rpx;
		text-align: center;
	}

	.task-empty-text {
		font-size: 26rpx;
		color: #8D7964;
	}
</style>
