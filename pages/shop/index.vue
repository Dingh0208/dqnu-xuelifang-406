<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">银币商城</text>
		</view>

		<!-- 顶部：我的银币余额 + 永久有效 -->
		<view class="balance-card">
			<view class="balance-left">
				<text class="balance-icon">🥈</text>
				<view class="balance-info">
					<text class="balance-name">我的银币</text>
					<text class="balance-sub">充值获得 · 永久有效</text>
				</view>
			</view>
			<text class="balance-num">{{ silverCoin }}</text>
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
		<!-- empty：暂无商品 -->
		<view v-else-if="pageStatus === 'empty'" class="empty-state">
			<text class="empty-text">暂无可购买商品</text>
		</view>
		<!-- error：支持重新加载 -->
		<view v-else-if="pageStatus === 'error'" class="empty-state">
			<text class="empty-text">商品加载失败</text>
			<view class="retry-btn" @click="loadProducts"><text class="retry-text">重新加载</text></view>
		</view>
		<!-- normal：四档商品 -->
		<view v-else class="product-list">
			<view
				v-for="item in products"
				:key="item.productId"
				class="product-card"
				:class="{ disabled: !item.enabled }"
			>
				<view class="product-left">
					<text class="product-icon">🥈</text>
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

		<bottom-tab-bar current="profile" />
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import { getMyPage, getSilverProducts, createSilverOrder } from '@/api/my.js'

	export default {
		components: {
			BottomTabBar
		},
		data() {
			return {
				silverCoin: 0,
				products: [],
				pageStatus: 'loading'  // loading / normal / empty / error
			}
		},
		onLoad() {
			this.loadProducts()
		},
		onShow() {
			// 返回商城时刷新银币余额（充值后可能变化）
			this.loadBalance()
		},
		methods: {
			loadBalance() {
				// 通过 getMyPage 获取最新银币余额；账户余额以后端结算为权威
				getMyPage().then((res) => {
					var assets = (res.data && res.data.assets) || {}
					this.silverCoin = Number(assets.silverCoin) || 0
				}).catch(() => {})
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
		background-color: #F7EFE3;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.page-title {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
		padding: 28rpx 8rpx 26rpx;
	}

	.balance-card {
		background: linear-gradient(135deg, #F6F5F2 0%, #E8EAE6 100%);
		border-radius: 24rpx;
		padding: 32rpx 30rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 14rpx rgba(140, 144, 138, 0.10);
	}

	.balance-left {
		display: flex;
		align-items: center;
	}

	.balance-icon {
		font-size: 48rpx;
		line-height: 1;
	}

	.balance-info {
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.balance-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #5F6560;
	}

	.balance-sub {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #9CA098;
	}

	.balance-num {
		font-size: 56rpx;
		font-weight: 700;
		color: #8A8F88;
		line-height: 1.1;
	}

	.section-title {
		padding: 8rpx 10rpx 16rpx;
	}

	.product-list {
		display: flex;
		flex-direction: column;
	}

	.product-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 22rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.product-card.disabled {
		opacity: 0.5;
	}

	.product-left {
		display: flex;
		align-items: center;
	}

	.product-icon {
		font-size: 48rpx;
		line-height: 1;
	}

	.product-info {
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.product-coins {
		font-size: 32rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.product-price {
		margin-top: 8rpx;
		font-size: 26rpx;
		color: #B56A3C;
		font-weight: 600;
	}

	.buy-btn {
		background-color: #B56A3C;
		border-radius: 999rpx;
		padding: 14rpx 32rpx;
	}

	.buy-btn-disabled {
		background-color: #C6B092;
	}

	.buy-btn-text {
		font-size: 27rpx;
		color: #FFFDF8;
	}

	.product-skeleton {
		justify-content: space-between;
	}

	.skeleton-block {
		border-radius: 12rpx;
		background-color: #EFE3D0;
	}

	.sk-left {
		width: 220rpx;
		height: 70rpx;
	}

	.sk-btn {
		width: 140rpx;
		height: 56rpx;
	}

	.empty-state {
		padding: 80rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.empty-text {
		font-size: 27rpx;
		color: #8D7964;
	}

	.retry-btn {
		margin-top: 24rpx;
		padding: 14rpx 40rpx;
		border: 1rpx solid #E0B489;
		border-radius: 999rpx;
	}

	.retry-text {
		font-size: 26rpx;
		color: #B56A3C;
	}

	.bottom-space {
		height: 160rpx;
		height: calc(160rpx + env(safe-area-inset-bottom));
	}
</style>
