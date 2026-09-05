<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">✨ 从零开始设计 AI 工作台</text>
			<text class="page-subtitle">通过一系列问题，让 AI 更了解你想创建的工作台。</text>
		</view>

		<!-- 三个创建模式卡片：纵向排列，视觉有层级差异 -->
		<view
			v-for="(item, index) in modes"
			:key="item.id"
			class="mode-card"
			:class="['mode-level-' + (index + 1)]"
		>
			<view class="mode-top">
				<text class="mode-icon">{{ item.icon }}</text>
				<view class="mode-top-text">
					<text class="mode-title">{{ item.title }}</text>
					<text class="mode-count">{{ item.questionCount }} 个问题</text>
				</view>
			</view>
			<text class="mode-summary">{{ item.summary }}</text>
			<view class="mode-btn" @click="goQuestionnaire(item)">
				<text class="mode-btn-text">{{ item.buttonText }}</text>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getCreateModes } from '@/api/workbench.js'

	export default {
		data() {
			return {
				modes: []
			}
		},
		onShow() {
			getCreateModes().then((res) => {
				this.modes = (res && res.data && res.data.list) || []
			})
		},
		methods: {
			goQuestionnaire(item) {
				uni.navigateTo({ url: '/pages/workbench/questionnaire?mode=' + item.id })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		background-color: #F7EFE3;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.page-header {
		padding: 28rpx 8rpx 30rpx;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: #4A3520;
		line-height: 1.4;
	}

	.page-subtitle {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #8D7964;
		line-height: 1.6;
	}

	.mode-card {
		background-color: #FFFDF8;
		border-radius: 28rpx;
		padding: 32rpx 28rpx 30rpx;
		margin-bottom: 28rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	/* 三个创建模式层级差异：通过背景色与边框做轻微强化，不过度设计 */
	.mode-level-1 {
		border: 2rpx solid #EFE3D0;
	}
	.mode-level-2 {
		border: 2rpx solid #F0CBA0;
		background-color: #FFFBF2;
	}
	.mode-level-3 {
		border: 2rpx solid #E8A340;
		background-color: #FFF6E7;
	}

	.mode-top {
		display: flex;
		align-items: center;
	}

	.mode-icon {
		font-size: 60rpx;
		line-height: 1;
	}

	.mode-top-text {
		flex: 1;
		margin-left: 22rpx;
	}

	.mode-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: #4A3520;
		line-height: 1.4;
	}

	.mode-count {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
		color: #B56A3C;
		font-weight: 500;
	}

	.mode-summary {
		display: block;
		margin-top: 22rpx;
		font-size: 26rpx;
		color: #8D7964;
		line-height: 1.6;
	}

	.mode-btn {
		margin-top: 28rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 20rpx 54rpx;
		background-color: #B56A3C;
		border-radius: 999rpx;
	}

	.mode-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #FFFDF8;
	}

	.bottom-space {
		height: 80rpx;
		height: calc(80rpx + env(safe-area-inset-bottom));
	}
</style>
