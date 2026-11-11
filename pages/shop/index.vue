<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">银币商城</text>
		</view>

		<!-- 顶部：我的银币余额 + 永久有效 -->
		<view class="balance-card">
			<view class="balance-left">
				<view class="balance-icon"><text class="balance-icon-text">银</text></view>
				<view class="balance-info">
					<text class="balance-name">我的银币</text>
					<text class="balance-sub">充值获得 · 永久有效</text>
				</view>
			</view>
			<text class="balance-num">{{ silverCoin }}</text>
		</view>

		<view class="section-title">
			<text>金币兑换</text>
		</view>

		<!-- 金币兑换专区：让学习金币有用途出口 -->
		<view v-if="coinStatus === 'loading'" class="product-list">
			<view v-for="n in 2" :key="'ck_' + n" class="product-card product-skeleton">
				<view class="skeleton-block sk-left"></view>
				<view class="skeleton-block sk-btn"></view>
			</view>
		</view>
		<view v-else-if="coinStatus === 'empty'" class="aq-state-card">
			<text class="aq-state-text">暂无可兑换商品</text>
		</view>
		<view v-else-if="coinStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">兑换商品加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadCoinProducts"><text>重新加载</text></view>
		</view>
		<view v-else class="product-list">
			<view
				v-for="item in coinProducts"
				:key="item.productId"
				class="product-card"
			>
				<view class="product-left">
					<view class="product-icon coin-icon"><text class="product-icon-text">币</text></view>
					<view class="product-info">
						<text class="product-coins">{{ item.name }}</text>
						<text class="product-price">{{ item.description }}</text>
					</view>
				</view>
				<view
					class="buy-btn coin-btn"
					:class="{ 'buy-btn-disabled': learningCoin < item.cost }"
					@click="onRedeemCoin(item)"
				>
					<text class="buy-btn-text">{{ item.cost }} 金币</text>
				</view>
			</view>
			<text class="coin-balance-tip">当前学习金币：{{ learningCoin }}</text>
		</view>

		<view class="section-title">
			<text>选择充值套餐</text>
		</view>

		<!-- 商品列表：价格由 API 下发，UI 不硬编码 -->
		<!-- loading：轻量 skeleton -->
		<view v-if="pageStatus === 'loading'" class="product-list">
			<view v-for="n in 4" :key="'sk_' + n" class="product-card product-skeleton">
				<view class="skeleton-block sk-left"></view>
				<view class="skeleton-block sk-btn"></view>
			</view>
		</view>
		<view v-else-if="pageStatus === 'empty'" class="aq-state-card">
			<text class="aq-state-text">暂无可购买商品</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">商品加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadProducts"><text>重新加载</text></view>
		</view>
		<view v-else class="product-list">
			<view
				v-for="item in products"
				:key="item.productId"
				class="product-card"
				:class="{ disabled: !item.enabled }"
			>
				<view class="product-left">
					<view class="product-icon"><text class="product-icon-text">银</text></view>
					<view class="product-info">
						<text class="product-coins">{{ item.silverAmount }} 银币</text>
						<text class="product-price">¥ {{ item.price }}</text>
					</view>
				</view>
				<view
					class="buy-btn"
					:class="{ 'buy-btn-disabled': !item.enabled }"
					@click="onBuy(item)"
				>
					<text class="buy-btn-text">立即充值</text>
				</view>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getMyPage, getSilverProducts, createSilverOrder, getCoinProducts, redeemCoinProduct } from '@/api/my.js'

	export default {
		data() {
			return {
				silverCoin: 0,
				learningCoin: 0,
				products: [],
				coinProducts: [],
				pageStatus: 'loading',  // loading / normal / empty / error
				coinStatus: 'loading'   // loading / normal / empty / error
			}
		},
		onLoad() {
			this.loadProducts()
			this.loadCoinProducts()
		},
		onShow() {
			// 返回商城时刷新余额（充值/兑换后可能变化）
			this.loadBalance()
		},
		methods: {
			loadBalance() {
				// 通过 getMyPage 获取最新余额；账户余额以后端结算为权威
				getMyPage().then((res) => {
					var assets = (res.data && res.data.assets) || {}
					this.silverCoin = Number(assets.silverCoin) || 0
					this.learningCoin = Number(assets.learningCoin) || 0
				}).catch(() => {})
			},
			loadCoinProducts() {
				this.coinStatus = 'loading'
				getCoinProducts()
					.then((res) => {
						var list = (res.data && res.data.products) || []
						this.coinProducts = list
						this.coinStatus = list.length === 0 ? 'empty' : 'normal'
					})
					.catch(() => {
						this.coinStatus = 'error'
					})
			},
			loadProducts() {
				this.pageStatus = 'loading'
				getSilverProducts()
					.then((res) => {
						var list = (res.data && res.data.products) || []
						this.products = list
						this.pageStatus = list.length === 0 ? 'empty' : 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			// 金币兑换：余额不足给明确反馈，成功即时更新余额
			onRedeemCoin(item) {
				var that = this
				uni.showModal({
					title: '确认兑换',
					content: '\n' + item.name + '\n消耗 ' + item.cost + ' 学习金币',
					confirmText: '兑换',
					cancelText: '取消',
					success: function (res) {
						if (!res.confirm) return
						redeemCoinProduct(item.productId)
							.then(function (result) {
								that.learningCoin = Number(result.data.balance) || 0
								uni.showToast({ title: '兑换成功', icon: 'success' })
							})
							.catch(function (err) {
								uni.showToast({ title: (err && err.message) || '兑换失败', icon: 'none' })
							})
					}
				})
			},
			// 立即充值 → 先显示确认弹窗；当前阶段不接真实支付
			onBuy(item) {
				if (!item.enabled) {
					uni.showToast({ title: '该套餐暂不可购买', icon: 'none' })
					return
				}
				var that = this
				uni.showModal({
					title: '确认充值',
					content: '\n' + item.silverAmount + ' 银币\n支付金额：¥' + item.price + '\n银币永久有效',
					confirmText: '确认',
					cancelText: '取消',
					success: function (res) {
						if (res.confirm) {
							that.createOrder(item)
						}
					}
				})
			},
			// 创建订单（当前 Mock 不发起微信/支付宝支付；真实支付逻辑暂不实现）
			createOrder(item) {
				createSilverOrder(item.productId)
					.then(() => {
						// 当前阶段：订单创建成功即提示，不接真实支付
						uni.showToast({ title: '充值功能即将开放', icon: 'none' })
					})
					.catch(() => {
						uni.showToast({ title: '订单创建失败，请稍后重试', icon: 'none' })
					})
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

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
		padding: 22rpx 0 22rpx;
	}

	.balance-card {
		position: relative;
		overflow: hidden;
		border-radius: 36rpx;
		padding: 30rpx 32rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	}

	.balance-left {
		display: flex;
		align-items: center;
	}

	.balance-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.20);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.balance-icon-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.balance-info {
		margin-left: 18rpx;
		display: flex;
		flex-direction: column;
	}

	.balance-name {
		font-size: 27rpx;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.86);
	}

	.balance-sub {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.62);
	}

	.balance-num {
		font-size: 64rpx;
		font-weight: 600;
		color: #FFFFFF;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.section-title {
		padding: 6rpx 0 16rpx;
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.product-list {
		display: flex;
		flex-direction: column;
	}

	.product-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 26rpx 28rpx;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: var(--app-shadow-soft);
	}

	.product-card.disabled {
		opacity: 0.5;
	}

	.product-left {
		display: flex;
		align-items: center;
	}

	.product-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 18rpx;
		background: rgba(18, 181, 165, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.product-icon-text {
		font-size: 24rpx;
		font-weight: 600;
		color: var(--app-primary);
	}

	.product-icon.coin-icon {
		background: rgba(56, 189, 248, 0.14);
	}

	.coin-balance-tip {
		display: block;
		padding: 4rpx 4rpx 12rpx;
		font-size: 22rpx;
		color: var(--app-muted);
	}

	.product-info {
		margin-left: 18rpx;
		display: flex;
		flex-direction: column;
	}

	.product-coins {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.product-price {
		margin-top: 8rpx;
		font-size: 26rpx;
		color: var(--app-primary);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.buy-btn {
		height: 68rpx;
		padding: 0 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: 999rpx;
		box-shadow: 0 6rpx 16rpx rgba(10, 92, 106, 0.16);
	}

	.buy-btn-disabled {
		background: var(--app-hint);
		box-shadow: none;
	}

	.buy-btn-text {
		font-size: 26rpx;
		color: #FFFFFF;
	}

	.product-skeleton {
		justify-content: space-between;
	}

	.skeleton-block {
		border-radius: 12rpx;
		background: var(--app-surface-soft);
	}

	.sk-left {
		width: 220rpx;
		height: 70rpx;
	}

	.sk-btn {
		width: 140rpx;
		height: 56rpx;
	}

	.bottom-space {
		height: 60rpx;
		height: calc(60rpx + env(safe-area-inset-bottom));
	}
</style>
