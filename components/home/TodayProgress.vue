<template>
	<view class="progress-card">
		<view class="hero-orb hero-orb-top"></view>
		<view class="hero-orb hero-orb-bottom"></view>

		<view class="progress-head">
			<view class="progress-heading">
				<text class="progress-title">今日任务完成度</text>
				<text class="progress-chip">学立方 · 智能学习规划</text>
			</view>
			<text class="progress-num">{{ percent }}</text>
		</view>

		<view class="progress-summary">
			<view class="progress-copy">
				<text>今日 {{ totalTasks }} 项任务</text>
				<text>已完成 {{ completedTasks }} 项 · 还差 {{ pendingCount }} 项</text>
			</view>
		</view>

		<view class="progress-bar">
			<view class="progress-fill" :style="{ width: percent }"></view>
		</view>

		<view class="progress-stats">
			<view class="stat-item"><text class="stat-value">{{ pendingCount }}</text><text>待完成</text></view>
			<view class="stat-item"><text class="stat-value">{{ coins }}</text><text>预计金币</text></view>
			<view class="stat-item"><text class="stat-value">{{ studyTime || '--' }}</text><text>今日学习</text></view>
		</view>

		<view class="progress-link" hover-class="progress-link-hover" :hover-stay-time="80" @click="$emit('more')">
			<text>查看全部任务　→</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TodayProgress',
		computed: {
			pendingCount() { return Math.max(this.totalTasks - this.completedTasks, 0) }
		},
		props: {
			completedTasks: { type: Number, default: 0 },
			totalTasks: { type: Number, default: 0 },
			percent: { type: String, default: '0%' },
			// 今日预计学习金币（由首页按任务完成数实时派生，0～10）
			coins: { type: Number, default: 0 },
			studyTime: { type: String, default: '' }
		}
	}
</script>

<style>
	.progress-card {
		position: relative;
		overflow: hidden;
		padding: 32rpx 32rpx 28rpx;
		margin-bottom: 24rpx;
		border-radius: 36rpx;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 92, 106, 0.22);
	}

	.hero-orb {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
	}

	.hero-orb-top {
		top: -150rpx;
		right: -110rpx;
		width: 300rpx;
		height: 300rpx;
		background: radial-gradient(circle, rgba(143, 227, 216, 0.30) 0%, rgba(143, 227, 216, 0) 70%);
	}

	.hero-orb-bottom {
		left: -100rpx;
		bottom: -170rpx;
		width: 320rpx;
		height: 320rpx;
		background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0) 70%);
	}

	.progress-head {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.progress-heading {
		display: flex;
		flex-direction: column;
	}

	.progress-title {
		font-size: 25rpx;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.64);
		letter-spacing: 2rpx;
	}

	.progress-chip {
		align-self: flex-start;
		margin-top: 12rpx;
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.14);
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.86);
	}

	.progress-num {
		font-size: 64rpx;
		font-weight: 700;
		line-height: 1;
		color: #FFFFFF;
		font-variant-numeric: tabular-nums;
	}

	.progress-summary {
		position: relative;
		z-index: 1;
		margin-top: 22rpx;
	}

	.progress-copy {
		display: flex;
		flex-direction: column;
		font-size: 24rpx;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.86);
	}

	.progress-bar {
		position: relative;
		z-index: 1;
		height: 12rpx;
		margin: 28rpx 0 24rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.20);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 999rpx;
		background: linear-gradient(90deg, #8FE3D8 0%, #FFFFFF 100%);
		transition: width 0.3s ease;
	}

	.progress-stats {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.62);
	}

	.stat-value {
		margin-bottom: 4rpx;
		font-size: 36rpx;
		font-weight: 700;
		color: #FFFFFF;
		font-variant-numeric: tabular-nums;
	}

	.progress-link {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 250rpx;
		height: 64rpx;
		margin-top: 24rpx;
		border-radius: 999rpx;
		background: #FFFFFF;
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.10);
	}

	.progress-link text {
		font-size: 24rpx;
		font-weight: 600;
		color: var(--app-primary, #0A5C6A);
	}

	.progress-link-hover {
		opacity: 0.86;
	}
</style>
