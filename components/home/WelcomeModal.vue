<template>
	<view v-if="visible" class="welcome-mask">
		<view class="welcome-card">
			<view class="welcome-close" @click="onClose">
				<text class="close-icon">×</text>
			</view>

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

			<view class="welcome-btn" @click="onClose">
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
			}
		}
	}
</script>

<style>
	.welcome-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 100;
		background-color: rgba(74, 53, 32, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 64rpx;
	}

	.welcome-card {
		position: relative;
		width: 100%;
		background-color: #FFFDF8;
		border-radius: 28rpx;
		padding: 56rpx 44rpx 44rpx;
		box-shadow: 0 10rpx 30rpx rgba(74, 53, 32, 0.18);
		animation: welcomeFadeIn 0.25s ease;
	}

	@keyframes welcomeFadeIn {
		from { opacity: 0; transform: translateY(16rpx); }
		to { opacity: 1; transform: translateY(0); }
	}

	.welcome-close {
		position: absolute;
		top: 20rpx;
		right: 24rpx;
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-icon {
		font-size: 40rpx;
		color: #B49D82;
		line-height: 1;
	}

	.welcome-greeting {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
		text-align: center;
	}

	.welcome-message {
		display: block;
		font-size: 28rpx;
		color: #8D7964;
		text-align: center;
		line-height: 44rpx;
		margin-top: 20rpx;
		padding: 0 20rpx;
	}

	.welcome-divider {
		height: 1rpx;
		background-color: #EFE3D0;
		margin: 36rpx 0 28rpx;
	}

	.welcome-info {
		margin-bottom: 40rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12rpx 8rpx;
	}

	.info-label {
		font-size: 28rpx;
		color: #8D7964;
	}

	.info-value {
		font-size: 28rpx;
		color: #4A3520;
		font-weight: 500;
	}

	.welcome-btn {
		background-color: #B56A3C;
		border-radius: 999rpx;
		padding: 22rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-text {
		font-size: 30rpx;
		font-weight: 600;
		color: #FFFDF8;
		letter-spacing: 2rpx;
	}
</style>
