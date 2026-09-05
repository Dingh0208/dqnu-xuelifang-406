<template>
	<view class="coin-card" @click="onClick">
		<!-- 银币：银灰色视觉，与学习金币卡片必须明显区分 -->
		<view class="card-head">
			<text class="icon">🥈</text>
			<text class="name">银币</text>
		</view>

		<view v-if="status === 'loading'" class="num-skeleton"></view>
		<text v-else-if="status === 'error'" class="num error-num" @click.stop="onReload">--</text>
		<text v-else class="num">{{ balance }}</text>

		<!-- 弱化说明：充值获得 · 永久有效；不写复杂规则 -->
		<view class="entry">
			<text class="entry-text">去商城 ›</text>
			<text class="entry-sub">充值获得 · 永久有效</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'SilverCoinCard',
		props: {
			status: {
				type: String,
				default: 'normal'
			},
			// 银币余额（silverCoin 字段，与学习金币独立）
			balance: {
				type: Number,
				default: 0
			}
		},
		methods: {
			onClick() {
				if (this.status === 'error') return
				this.$emit('mall')
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
		background: linear-gradient(135deg, #F6F5F2 0%, #E8EAE6 100%);
		border-radius: 24rpx;
		padding: 18rpx 22rpx;
		box-shadow: 0 4rpx 14rpx rgba(140, 144, 138, 0.10);
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
		color: #5F6560;
	}

	.num {
		margin-top: 12rpx;
		font-size: 44rpx;
		font-weight: 700;
		color: #8A8F88;
		line-height: 1.1;
	}

	.error-num {
		color: #B0B4AE;
	}

	.num-skeleton {
		margin-top: 12rpx;
		width: 110rpx;
		height: 44rpx;
		border-radius: 12rpx;
		background-color: #DCDED9;
	}

	.entry {
		margin-top: 12rpx;
		display: flex;
		flex-direction: column;
	}

	.entry-text {
		font-size: 23rpx;
		color: #6B7068;
	}

	.entry-sub {
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #9CA098;
	}
</style>
