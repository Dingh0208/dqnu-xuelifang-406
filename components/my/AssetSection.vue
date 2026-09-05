<template>
	<view class="asset-section">
		<text class="section-title">我的学习资产</text>
		<!-- 严格等宽并排：布局 class 直接挂在组件标签上。
			 微信小程序端 class 落在组件宿主节点、H5 端 Vue 自动透传到组件根元素，
			 使宿主节点本身成为受控 flex 子项（flex:1 + width:0 + display:block）。
			 注意：不能只依赖组件内部 .coin-card 的 width:100% —— 宿主节点默认按内容收缩，
			 内部 100% 参照收缩后的宿主，会导致卡片只有内容宽度（实测仅占行宽 22%~30%）。 -->
		<view class="asset-row">
			<learning-coin-card
				class="asset-card"
				:status="coinStatus"
				:balance="learningCoin"
				@detail="$emit('coin-detail')"
				@reload="$emit('reload')"
			/>
			<silver-coin-card
				class="asset-card"
				:status="silverStatus"
				:balance="silverCoin"
				@mall="$emit('silver-mall')"
				@reload="$emit('reload')"
			/>
		</view>
	</view>
</template>

<script>
	import LearningCoinCard from './LearningCoinCard.vue'
	import SilverCoinCard from './SilverCoinCard.vue'

	export default {
		name: 'AssetSection',
		components: {
			LearningCoinCard,
			SilverCoinCard
		},
		props: {
			// 学习金币余额（learningCoin 字段；与 silverCoin 完全独立）
			learningCoin: {
				type: Number,
				default: 0
			},
			// 银币余额（silverCoin 字段；与 learningCoin 完全独立）
			silverCoin: {
				type: Number,
				default: 0
			},
			coinStatus: {
				type: String,
				default: 'normal'
			},
			silverStatus: {
				type: String,
				default: 'normal'
			}
		}
	}
</script>

<style>
	.asset-section {
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 24rpx;
	}

	.section-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		padding: 8rpx 10rpx 14rpx;
	}

	.asset-row {
		display: flex;
		align-items: stretch;
		width: 100%;
		box-sizing: border-box;
	}

	/* 组件宿主节点受控：两卡严格平分整行（flex:1 + width:0），间距用 margin 不用 gap（兼容小程序） */
	.asset-card {
		flex: 1 1 0;
		width: 0;
		min-width: 0;
		display: block;
		box-sizing: border-box;
	}

	.asset-card + .asset-card {
		margin-left: 20rpx;
	}
</style>
