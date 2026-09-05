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
	/* 两列普通 Grid：每行两张卡片，无堆叠、无 sticky、无重叠、无 stack-spacer */
	.stack {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 20rpx;
		row-gap: 24rpx;
		padding: 8rpx 0 40rpx;
	}

	/* 普通 Grid item：min-width:0 防止内容撑破列宽；卡片内部自行撑满单元格 */
	.stack-item {
		min-width: 0;
	}

	/* 空状态：横跨两列，居中提示 */
	.empty-state {
		grid-column: 1 / -1;
		padding: 80rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #FFFDF8;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.empty-text {
		font-size: 26rpx;
		color: #B49D82;
	}
</style>
