<template>
	<view class="card">
		<view class="card-header">
			<text class="card-title">今日待办任务</text>
			<text v-if="showMore" class="card-more" @click="onMore">{{ displayTasks.length }} 项</text>
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
						<!-- ✓ 节点常驻 + v-show 切换（mp 端属性级更新稳定），勿改回 v-if -->
						<text v-show="task.completed" class="check-mark">✓</text>
					</view>
				</view>
				<view class="task-info" @click="toggleExpand(task)">
					<text class="task-title" :class="{ 'task-done': task.completed }">{{ task.title }}</text>
					<text class="task-desc">{{ task.description }}</text>
					<view v-if="expandedId === task.id" class="task-actions">
						<text class="task-estimate">预计 {{ task.estimatedMinutes || 25 }} 分钟</text>
						<view class="task-start-btn" @click.stop="onStart(task)">
							<text>开始专注</text>
						</view>
					</view>
				</view>
				<!-- 班级任务小标签（仅 source === 'class' 显示，AI 任务无标签） -->
				<class-task-badge :source="task.source" />
				<text class="task-status" :class="{ done: task.completed }">{{ task.completed ? '已完成' : '待完成' }}</text>
			</view>
			<view v-if="displayTasks.length === 0" class="task-empty">
				<text class="task-empty-text">{{ emptyText }}</text>
				<view v-if="emptyActionText" class="task-empty-action" @click="onEmptyAction">
					<text>{{ emptyActionText }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import ClassTaskBadge from '@/components/common/ClassTaskBadge.vue'

	export default {
		name: 'TodayTasks',
		components: {
			ClassTaskBadge
		},
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
			},
			emptyText: {
				type: String,
				default: '今日任务已全部完成'
			},
			emptyActionText: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				expandedId: ''   // 当前展开的任务 id；只做展开展示，不影响任务状态
			}
		},
		computed: {
			// 纯展示组件：直接渲染传入的 tasks（首页传入 getPendingTasks()）
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
			},
			toggleExpand(task) {
				this.expandedId = this.expandedId === task.id ? '' : task.id
			},
			onStart(task) {
				this.$emit('start', task)
			},
			onEmptyAction() {
				this.$emit('empty-action')
			}
		}
	}
</script>

<style>
	.card {
		/* 让仍引用旧 token 的 ClassTaskBadge 在组件内也拿到 Aqua 色值 */
		--student-line: #D3E8E7;
		--student-surface-soft: #E2F3F2;
		--student-muted: #7B9AA1;
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
		margin-bottom: 10rpx;
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

	.task-row {
		display: flex;
		align-items: flex-start;
		padding: 22rpx 0;
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
		margin: -18rpx 0 -18rpx -18rpx;
		flex-shrink: 0;
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

	.task-status {
		flex-shrink: 0;
		margin-left: 14rpx;
		padding: 8rpx 16rpx;
		border-radius: 999rpx;
		font-size: 21rpx;
		font-weight: 600;
		color: var(--app-warning, #C48A2A);
		background: var(--app-warning-bg, #FFF5E2);
	}

	.task-status.done {
		color: var(--app-positive, #0E9F86);
		background: var(--app-positive-bg, #E2F7F1);
	}

	.task-actions {
		margin-top: 14rpx;
		display: flex;
		align-items: center;
	}

	.task-estimate {
		font-size: 22rpx;
		color: var(--app-muted, #7B9AA1);
		margin-right: 16rpx;
	}

	.task-start-btn {
		height: 56rpx;
		padding: 0 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(18, 181, 165, 0.12);
		border-radius: 999rpx;
	}

	.task-start-btn text {
		font-size: 23rpx;
		font-weight: 600;
		color: #0A6B63;
	}

	.task-empty {
		padding: 44rpx 0 24rpx;
		text-align: center;
	}

	.task-empty-text {
		font-size: 25rpx;
		line-height: 1.6;
		color: var(--app-muted, #7B9AA1);
	}

	.task-empty-action {
		margin: 22rpx auto 0;
		height: 68rpx;
		padding: 0 32rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: 999rpx;
		box-shadow: 0 6rpx 16rpx rgba(10, 92, 106, 0.16);
	}

	.task-empty-action text {
		font-size: 25rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

</style>
