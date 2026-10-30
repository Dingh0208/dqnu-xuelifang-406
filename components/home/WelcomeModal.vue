<template>
	<view v-if="visible" class="welcome-mask" @touchmove.stop.prevent="blockMove">
		<view class="welcome-card">
			<view class="welcome-close" hover-class="welcome-close-hover" :hover-stay-time="80" @click="onClose">
				<text class="close-icon">×</text>
			</view>

			<view class="welcome-badge"><text>今天也要好好开始</text></view>
			<text class="welcome-greeting">{{ greeting }}</text>
			<text class="welcome-message">{{ message }}</text>

			<view class="welcome-divider"></view>

			<view class="welcome-info">
				<view class="info-row">
					<text class="info-label">今日任务</text>
					<text class="info-value">{{ taskCount }}项</text>
				</view>
				<view class="info-row">
					<text class="info-label">预计学习</text>
					<text class="info-value">{{ estimatedText }}</text>
				</view>
			</view>

			<view class="welcome-btn" hover-class="welcome-btn-hover" :hover-stay-time="80" @click="onClose">
				<text class="btn-text">开始今天</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'WelcomeModal',
		props: {
			visible: { type: Boolean, default: false },
			greeting: { type: String, default: '' },
			message: { type: String, default: '' },
			taskCount: { type: Number, default: 0 },
			estimatedText: { type: String, default: '' }
		},
		methods: {
			onClose() {
				this.$emit('close')
			},
			blockMove() {}
		}
	}
</script>

<style>
	.welcome-mask {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 56rpx;
		background: var(--student-mask, rgba(8, 42, 48, 0.46));
	}

	.welcome-card {
		position: relative;
		width: 100%;
		padding: 44rpx 32rpx 32rpx;
		box-sizing: border-box;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: 0 18rpx 48rpx rgba(10, 80, 90, 0.18);
		animation: welcomeFadeIn 0.25s ease;
	}

	@keyframes welcomeFadeIn {
		from { opacity: 0; transform: translateY(16rpx); }
		to { opacity: 1; transform: translateY(0); }
	}

	.welcome-close {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		background: var(--app-surface-soft, #E2F3F2);
	}

	.welcome-close-hover {
		opacity: 0.72;
	}

	.close-icon {
		font-size: 36rpx;
		line-height: 1;
		color: var(--app-muted, #7B9AA1);
	}

	.welcome-badge {
		display: flex;
		justify-content: center;
	}

	.welcome-badge text {
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		background: var(--app-positive-bg, #E2F7F1);
		font-size: 21rpx;
		color: var(--app-primary, #0A5C6A);
	}

	.welcome-greeting {
		display: block;
		margin-top: 18rpx;
		font-size: 36rpx;
		font-weight: 600;
		line-height: 1.4;
		text-align: center;
		color: var(--app-ink, #0D2F36);
	}

	.welcome-message {
		display: block;
		margin-top: 12rpx;
		padding: 0 16rpx;
		font-size: 25rpx;
		line-height: 1.7;
		text-align: center;
		color: var(--app-copy, #44666E);
	}

	.welcome-divider {
		height: 1rpx;
		margin: 28rpx 0 20rpx;
		background: var(--app-line, #D3E8E7);
	}

	.welcome-info {
		margin-bottom: 30rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10rpx 8rpx;
	}

	.info-label {
		font-size: 25rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.info-value {
		font-size: 26rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
		font-variant-numeric: tabular-nums;
	}

	.welcome-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 88rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, var(--app-primary, #0A5C6A) 0%, var(--app-accent, #12B5A5) 100%);
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.welcome-btn-hover {
		opacity: 0.88;
	}

	.btn-text {
		font-size: 28rpx;
		font-weight: 600;
		letter-spacing: 2rpx;
		color: #FFFFFF;
	}
</style>
