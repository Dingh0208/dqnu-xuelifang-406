<template>
	<!-- 三分类筛选（全部 / 未完成 / 已完成）：只负责切换 currentFilter，
	     不修改任务状态、不修改顺序、不写回数据源（纯展示交互组件） -->
	<view class="filter-row">
		<view
			v-for="f in filters"
			:key="f.key"
			class="filter-pill"
			:class="{ active: current === f.key }"
			hover-class="filter-pill-hover"
			:hover-stay-time="80"
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
	.filter-row {
		display: flex;
		align-items: center;
		margin: 8rpx 4rpx 20rpx;
	}

	.filter-pill {
		flex: 1;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		background: var(--app-surface-soft, #E2F3F2);
		border: 1rpx solid var(--app-line, #D3E8E7);
	}

	.filter-pill + .filter-pill {
		margin-left: 14rpx;
	}

	.filter-pill-hover {
		opacity: 0.82;
	}

	.filter-pill.active {
		border-color: transparent;
		background: linear-gradient(135deg, var(--app-primary, #0A5C6A) 0%, var(--app-accent, #12B5A5) 100%);
		box-shadow: 0 6rpx 16rpx rgba(10, 92, 106, 0.16);
	}

	.filter-text {
		font-size: 25rpx;
		color: var(--app-copy, #44666E);
	}

	.filter-pill.active .filter-text {
		color: #FFFFFF;
		font-weight: 600;
	}
</style>
