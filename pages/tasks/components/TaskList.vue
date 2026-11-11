<template>
	<!-- 任务列表（纯展示）：只渲染传入的 tasks（已是页面按 filter 过滤后的结果）；
	     不排序、不修改 completed、不写回数据源 -->
	<view class="task-list">
		<task-item
			v-for="(task, index) in tasks"
			:key="task.id"
			:task="task"
			:is-last="index === tasks.length - 1"
			@toggle="onToggle"
		/>
		<view v-if="tasks.length === 0 && emptyText" class="list-empty">
			<text class="list-empty-text">{{ emptyText }}</text>
		</view>
	</view>
</template>

<script>
	import TaskItem from './TaskItem.vue'

	export default {
		name: 'TaskList',
		components: {
			TaskItem
		},
		props: {
			tasks: {
				type: Array,
				default: function () {
					return []
				}
			},
			// 空列表提示文案（如「当前筛选下暂无任务」）
			emptyText: {
				type: String,
				default: ''
			}
		},
		methods: {
			onToggle(task) {
				this.$emit('toggle', task)
			}
		}
	}
</script>

<style>
	.list-empty {
		padding: 56rpx 0 28rpx;
		text-align: center;
	}

	.list-empty-text {
		font-size: 25rpx;
		line-height: 1.6;
		color: var(--app-muted, #7B9AA1);
	}
</style>
