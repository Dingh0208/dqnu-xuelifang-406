<template>
	<view class="tab-bar">
		<view
			v-for="tab in tabs"
			:key="tab.key"
			class="tab-item"
			:class="{ active: tab.key === current }"
			@click="switchTab(tab)"
		>
			<text class="tab-text">{{ tab.label }}</text>
			<view class="tab-line"></view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'BottomTabBar',
		props: {
			// 当前页面标识：index / wrongbook / workbench / profile
			current: {
				type: String,
				default: 'index'
			}
		},
		data() {
			return {
				tabs: [
					{ key: 'index', label: '首页', url: '/pages/index/index' },
					{ key: 'wrongbook', label: '错题本', url: '/pages/wrongbook/index' },
					{ key: 'workbench', label: '工作台', url: '/pages/workbench/index' },
					{ key: 'profile', label: '我的', url: '/pages/profile/index' }
				]
			}
		},
		methods: {
			switchTab(tab) {
				if (tab.key === this.current) return
				// 主页面切换用 redirectTo：关闭当前页再打开目标页，页面栈始终为 1，不堆叠
				uni.redirectTo({ url: tab.url })
			}
		}
	}
</script>

<style>
	.tab-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
		display: flex;
		background-color: #FFFDF8;
		border-top: 1rpx solid #EFE3D0;
		padding: 18rpx 0;
		padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tab-text {
		font-size: 28rpx;
		color: #B49D82;
	}

	.tab-item.active .tab-text {
		color: #4A3520;
		font-weight: 600;
	}

	.tab-line {
		width: 32rpx;
		height: 6rpx;
		border-radius: 3rpx;
		background-color: #E8A340;
		margin-top: 8rpx;
		opacity: 0;
	}

	.tab-item.active .tab-line {
		opacity: 1;
	}
</style>
