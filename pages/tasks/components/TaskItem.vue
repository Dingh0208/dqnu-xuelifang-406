<template>
	<!-- 单个任务项（纯展示）：checkbox 视觉唯一来源 = task.completed；
	     未完成 白底描边 / 完成 薄荷青底白 ✓，无第二套状态、无动画 -->
	<view class="task-row" :class="{ 'last-row': isLast }">
		<view class="checkbox-hit" hover-class="checkbox-hit-hover" :hover-stay-time="80" @click="onToggle">
			<view class="task-checkbox" :class="{ checked: task.completed }">
				<!-- ✓ 节点常驻 + v-show 切换（mp 端属性级更新稳定），勿改回 v-if -->
				<text v-show="task.completed" class="check-mark">✓</text>
			</view>
		</view>
		<view class="task-info">
			<text class="task-title" :class="{ 'task-done': task.completed }">{{ task.title }}</text>
			<text class="task-desc">{{ task.description }}</text>
		</view>
		<!-- 班级任务小标签（仅 source === 'class' 显示，AI 任务无标签） -->
		<class-task-badge :source="task.source" />
		<text class="task-duration">{{ task.estimatedMinutes }}分钟</text>
	</view>
</template>

<script>
	import ClassTaskBadge from '@/components/common/ClassTaskBadge.vue'

	export default {
		name: 'TaskItem',
		components: {
			ClassTaskBadge
		},
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
	.task-row {
		/* 让仍引用旧 token 的 ClassTaskBadge 在组件内也拿到 Aqua 色值 */
		--student-line: #D3E8E7;
		--student-surface-soft: #E2F3F2;
		--student-muted: #7B9AA1;
		display: flex;
		align-items: flex-start;
		padding: 20rpx 0;
		border-bottom: 1rpx solid var(--app-line, #D3E8E7);
	}

	.task-row.last-row {
		border-bottom: none;
		padding-bottom: 4rpx;
	}

	.checkbox-hit {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 88rpx;
		height: 88rpx;
		margin: -16rpx 0 -16rpx -16rpx;
		flex-shrink: 0;
	}

	.checkbox-hit-hover {
		opacity: 0.76;
	}

	.task-checkbox {
		width: 44rpx;
		height: 44rpx;
		box-sizing: border-box;
		border-radius: 14rpx;
		background: var(--app-surface-solid, #FFFFFF);
		border: 2rpx solid var(--app-line, #D3E8E7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.task-checkbox.checked {
		background: var(--app-positive, #0E9F86);
		border-color: var(--app-positive, #0E9F86);
	}

	.check-mark {
		font-size: 26rpx;
		font-weight: 700;
		line-height: 1;
		color: #FFFFFF;
	}

	.task-info {
		flex: 1;
		min-width: 0;
		padding-top: 2rpx;
	}

	.task-title {
		display: block;
		font-size: 29rpx;
		font-weight: 500;
		line-height: 42rpx;
		color: var(--app-ink, #0D2F36);
	}

	.task-title.task-done {
		color: var(--app-muted, #7B9AA1);
		text-decoration: line-through;
	}

	.task-desc {
		display: block;
		margin-top: 6rpx;
		font-size: 23rpx;
		line-height: 1.5;
		color: var(--app-muted, #7B9AA1);
	}

	.task-duration {
		flex-shrink: 0;
		margin-left: 14rpx;
		padding-top: 6rpx;
		font-size: 23rpx;
		color: var(--app-muted, #7B9AA1);
		font-variant-numeric: tabular-nums;
	}
</style>
