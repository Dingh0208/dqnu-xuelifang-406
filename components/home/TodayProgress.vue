<template>
	<view class="progress-card">
		<view class="progress-head">
			<view class="progress-left">
				<text class="progress-title">今日学习</text>
				<text class="progress-sub">今日完成度</text>
			</view>
			<text class="progress-num">{{ percent }}</text>
		</view>

		<view class="progress-bar">
			<view class="progress-fill" :style="{ width: percent }"></view>
		</view>

		<view class="progress-stats">
			<text class="stat-item">✓ {{ completedTasks }}/{{ totalTasks }} 个任务</text>
			<text class="stat-item">🟡 {{ coins }} 金币</text>
			<text class="stat-item">学习时长 {{ studyTime }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TodayProgress',
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
		border-radius: 24rpx;
		/* 光感：同一暖棕色系内从左到右极柔和过渡（左略浅 → 右略深），色差很小 */
		background: linear-gradient(90deg, #BD7A4C 0%, #B56A3C 55%, #AE6236 100%);
		padding: 36rpx 32rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 6rpx 16rpx rgba(139, 79, 41, 0.14);
	}

	.progress-head {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.progress-left {
		padding-top: 10rpx;
	}

	.progress-title {
		display: block;
		font-size: 32rpx;
		font-weight: 500;
		color: #FFF6E6;
	}

	.progress-sub {
		display: block;
		font-size: 26rpx;
		color: rgba(255, 240, 214, 0.82);
		margin-top: 10rpx;
	}

	/* 完成度大数字：全卡视觉焦点，靠亮色 + 字重突出，不加文字发光 */
	.progress-num {
		font-size: 80rpx;
		font-weight: 700;
		color: #FFF3D6;
		line-height: 1;
	}

	.progress-bar {
		position: relative;
		height: 15rpx;
		background-color: #EAD9BF;
		border-radius: 999rpx;
		overflow: hidden;
		margin: 30rpx 4rpx 26rpx;
	}

	/* 进度条固定暖黄色，不跟随卡片背景渐变 */
	.progress-fill {
		height: 100%;
		border-radius: 999rpx;
		background: linear-gradient(90deg, #EEB048 0%, #F4C66A 100%);
		transition: width 0.3s ease;
	}

	.progress-stats {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-item {
		font-size: 26rpx;
		color: #FFF3D6;
	}
</style>
