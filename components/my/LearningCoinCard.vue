<template>
	<view class="coin-card" @click="onClick">
		<!-- 学习金币：金色视觉，与银币卡片必须明显区分（颜色+图标+名称+数字共同区分） -->
		<view class="card-head">
			<text class="icon">🟡</text>
			<text class="name">学习金币</text>
		</view>

		<!-- loading：轻量 skeleton，不闪烁 -->
		<view v-if="status === 'loading'" class="num-skeleton"></view>
		<!-- error：不让整个页面崩溃，显示 -- 并支持重新加载 -->
		<text v-else-if="status === 'error'" class="num error-num" @click.stop="onReload">--</text>
		<!-- normal / zero：0 是有效资产状态，正常显示 0，不隐藏卡片 -->
		<text v-else class="num">{{ balance }}</text>

		<view class="entry">
			<text class="entry-text">金币明细 ›</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'LearningCoinCard',
		props: {
			// 资产状态：loading / normal / zero / error
			status: {
				type: String,
				default: 'normal'
			},
			// 学习金币余额（learningCoin 字段，独立于银币）
			balance: {
				type: Number,
				default: 0
			}
		},
		methods: {
			onClick() {
				// error 状态下点击只重试，不跳转
				if (this.status === 'error') return
				this.$emit('detail')
			},
			onReload() {
				this.$emit('reload')
			}
		}
	}
</script>

<style>
	.coin-card {
		flex: 1;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		background: linear-gradient(135deg, #FFF6E0 0%, #FCEAC0 100%);
		border-radius: 24rpx;
		padding: 18rpx 22rpx;
		box-shadow: 0 4rpx 14rpx rgba(216, 144, 31, 0.10);
		display: flex;
		flex-direction: column;
	}

	.card-head {
		display: flex;
		align-items: center;
	}

	.icon {
		font-size: 32rpx;
		line-height: 1;
	}

	.name {
		margin-left: 10rpx;
		font-size: 25rpx;
		font-weight: 600;
		color: #8C5A0F;
	}

	.num {
		margin-top: 12rpx;
		font-size: 44rpx;
		font-weight: 700;
		color: #D8901F;
		line-height: 1.1;
	}

	.error-num {
		color: #C0A488;
	}

	.num-skeleton {
		margin-top: 12rpx;
		width: 110rpx;
		height: 44rpx;
		border-radius: 12rpx;
		background-color: #F0E3C6;
	}

	.entry {
		margin-top: 12rpx;
	}

	.entry-text {
		font-size: 23rpx;
		color: #A8791C;
	}
</style>
