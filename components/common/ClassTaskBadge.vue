<template>
	<!-- 班级任务小标签：仅 source === 'class' 时显示（source 是明确的数据语义，
	     不根据 title / classId 判断）。纯视觉标识，不参与排序/完成度/金币/任务状态 -->
	<text v-if="visible" class="class-task-badge">班级任务</text>
</template>

<script>
	export default {
		name: 'ClassTaskBadge',
		props: {
			source: {
				type: String,
				default: ''
			}
		},
		computed: {
			visible() {
				return this.source === 'class'
			}
		}
	}
</script>

<style>
.class-task-badge { flex-shrink: 0; margin-top: 6rpx; margin-left: 12rpx; padding: 0 10rpx; border: 1rpx solid var(--app-line); border-radius: 8rpx; background: rgba(18, 181, 165, 0.10); font-size: 20rpx; line-height: 32rpx; color: #0A6B63; white-space: nowrap; }
</style>
