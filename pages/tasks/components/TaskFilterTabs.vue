<template>
	<!-- 三分类筛选（全部 / 未完成 / 已完成）：只负责切换 currentFilter，
	     不修改任务状态、不修改顺序、不写回数据源（纯展示交互组件） -->
	<view class="filter-row">
		<view
			v-for="f in filters"
			:key="f.key"
			class="filter-pill"
			:class="{ active: current === f.key }"
			@click="onSelect(f.key)"
		>
			<text class="filter-text">{{ f.label }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TaskFilterTabs',
		props: {
			// 当前筛选：'all' | 'pending' | 'completed'
			current: {
				type: String,
				default: 'all'
			}
		},
		data() {
			return {
				filters: [
					{ key: 'all', label: '全部' },
					{ key: 'completed', label: '已完成' },
					{ key: 'pending', label: '未完成' }
				]
			}
		},
		methods: {
			onSelect(key) {
				if (key === this.current) return
				this.$emit('change', key)
			}
		}
	}
</script>

<style>
	/* 视觉沿用错题本三分类（filter-pill）语言：暖棕系，选中 #B56A3C 底白字 */
	.filter-row {
		display: flex;
		align-items: center;
		margin: 8rpx 8rpx 20rpx;
	}

	.filter-pill {
		flex: 1;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		background-color: #FFF9EE;
		border: 1rpx solid #E0C9A6;
		margin-right: 16rpx;
	}

	.filter-pill:last-child {
		margin-right: 0;
	}

	.filter-pill.active {
		background-color: #B56A3C;
		border-color: #B56A3C;
	}

	.filter-text {
		font-size: 26rpx;
		color: #8D7964;
	}

	.filter-pill.active .filter-text {
		color: #FFFFFF;
		font-weight: 500;
	}
</style>
