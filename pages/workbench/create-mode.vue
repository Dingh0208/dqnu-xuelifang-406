<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">从零开始设计 AI 工作台</text>
			<text class="page-subtitle">通过一系列问题，让 AI 更了解你想创建的工作台。</text>
		</view>

		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载创建方式…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">创建方式加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadModes"><text>重新加载</text></view>
		</view>
		<view v-else-if="modes.length === 0" class="aq-state-card">
			<text class="aq-state-text">暂无可用的创建方式</text>
		</view>
		<block v-else>
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
		</block>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getCreateModes } from '@/api/workbench.js'

	export default {
		data() {
			return {
				pageStatus: 'loading', // loading / normal / error
				modes: []
			}
		},
		onShow() {
			this.loadModes()
		},
		methods: {
			loadModes() {
				this.pageStatus = 'loading'
				getCreateModes()
					.then((res) => {
						this.modes = (res && res.data && res.data.list) || []
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			goQuestionnaire(item) {
				uni.navigateTo({ url: '/pages/workbench/questionnaire?mode=' + item.id })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.page-header {
		padding: 22rpx 0 26rpx;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
		line-height: 1.4;
	}

	.page-subtitle {
		display: block;
		margin-top: 12rpx;
		font-size: 25rpx;
		color: var(--app-muted);
		line-height: 1.6;
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.mode-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 30rpx 28rpx;
		margin-bottom: 24rpx;
		box-shadow: var(--app-shadow-soft);
	}

	/* 通过左侧薄荷色描边做层级差异，不使用两套卡片风格 */
	.mode-level-1 {
		border-left: 6rpx solid rgba(18, 181, 165, 0.28);
	}

	.mode-level-2 {
		border-left: 6rpx solid rgba(18, 181, 165, 0.52);
	}

	.mode-level-3 {
		border-left: 6rpx solid var(--app-accent);
	}

	.mode-top {
		display: flex;
		align-items: center;
	}

	.mode-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		background: rgba(18, 181, 165, 0.12);
		color: var(--app-primary);
		font-size: 32rpx;
		line-height: 64rpx;
		text-align: center;
	}

	.mode-top-text {
		flex: 1;
		margin-left: 20rpx;
	}

	.mode-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
		line-height: 1.4;
	}

	.mode-count {
		display: block;
		margin-top: 6rpx;
		font-size: 23rpx;
		color: #0A6B63;
		font-weight: 500;
	}

	.mode-summary {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		color: var(--app-muted);
		line-height: 1.6;
	}

	.mode-btn {
		margin-top: 26rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 80rpx;
		padding: 0 48rpx;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: 999rpx;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.mode-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.bottom-space {
		height: 80rpx;
		height: calc(80rpx + env(safe-area-inset-bottom));
	}
</style>
