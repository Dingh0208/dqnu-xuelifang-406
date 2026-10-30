<template>
	<view class="stack">
		<view
			v-for="item in list"
			:key="item.id"
			class="stack-item"
			@click="onItemClick(item)"
		>
			<wrong-question-card :item="item" @click="onItemClick" />
		</view>

		<!-- 空状态 -->
		<view v-if="list.length === 0" class="empty-state">
			<text class="empty-text">暂无相关错题</text>
		</view>
	</view>
</template>

<script>
	import WrongQuestionCard from './WrongQuestionCard.vue'

	export default {
		name: 'WrongQuestionStack',
		components: {
			WrongQuestionCard
		},
		props: {
			list: {
				type: Array,
				default: function () {
					return []
				}
			}
		},
		methods: {
			onItemClick(item) {
				this.$emit('click', item)
			}
		}
	}
</script>

<style>
	/* 错题列表采用整行信息卡，保留原详情点击 */
	.stack {
		display: flex;
		flex-direction: column;
		padding: 8rpx 0 36rpx;
	}

	/* 普通 Grid item：min-width:0 防止内容撑破列宽；卡片内部自行撑满单元格 */
	.stack-item {
		min-width: 0;
		margin-bottom: 14rpx;
	}

	/* 空状态：横跨两列，居中提示 */
	.empty-state {
		padding: 70rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--student-surface);
		border: 1rpx solid var(--student-line);
		border-radius: 28rpx;
	}

	.empty-text {
		font-size: 26rpx;
		color: var(--student-muted);
	}
</style>
