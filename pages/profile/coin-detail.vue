<template>
	<view class="page">
		<view v-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">金币明细加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadDetail"><text>重新加载</text></view>
		</view>
		<block v-else>
		<!-- 余额卡：海盐薄荷主视觉 -->
		<view class="balance-card">
			<view class="balance-head">
				<view class="balance-icon"><text class="balance-icon-text">币</text></view>
				<text class="balance-name">学习金币</text>
			</view>
			<view v-if="pageStatus === 'loading'" class="num-skeleton"></view>
			<text v-else class="balance-num">{{ balance }}</text>
		</view>

		<!-- 今日获得 -->
		<view class="today-card" v-if="pageStatus === 'normal'">
			<text class="today-label">今日获得</text>
			<text class="today-value">+{{ todayEarned }}</text>
		</view>

		<!-- 今日学习 -->
		<view class="section-card" v-if="pageStatus === 'normal'">
			<text class="section-title">今日学习</text>
			<view class="row">
				<text class="row-label">完成任务</text>
				<text class="row-value">{{ todayCompletedTasks }} / {{ todayTotalTasks }}</text>
			</view>
			<view class="row">
				<text class="row-label">完成度</text>
				<text class="row-value">{{ todayCompletionRate }}%</text>
			</view>
			<view class="row">
				<text class="row-label">今日获得金币</text>
				<text class="row-value">+{{ todayEarned }}</text>
			</view>
		</view>

		<!-- 金币记录 -->
		<view class="section-card" v-if="pageStatus === 'normal'">
			<text class="section-title">金币记录</text>
			<view v-if="records.length === 0" class="empty-text">暂无记录</view>
			<view v-for="item in records" :key="item.id" class="record-row">
				<view class="record-left">
					<text class="record-date">{{ item.date }}</text>
					<text class="record-desc">{{ item.desc }}</text>
				</view>
				<text class="record-delta" :class="{ penalty: item.type === 'penalty' }">
					{{ item.type === 'penalty' ? '' : '+' }}{{ item.delta }}
				</text>
			</view>
		</view>

		<!-- 金币规则入口 -->
		<view class="rules-entry" v-if="pageStatus === 'normal'" @click="goRules">
			<text class="rules-text">金币规则 ›</text>
		</view>

		<!-- 金币用途出口：去商城兑换 -->
		<view class="redeem-entry" v-if="pageStatus === 'normal'" @click="goShop">
			<text class="redeem-text">金币能换什么？去商城兑换 →</text>
		</view>
		</block>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getLearningCoinDetail } from '@/api/my.js'

	export default {
		data() {
			return {
				pageStatus: 'loading',  // loading / normal / error
				balance: 0,
				todayEarned: 0,
				todayCompletionRate: 0,
				todayCompletedTasks: 0,
				todayTotalTasks: 0,
				records: []
			}
		},
		onLoad() {
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				this.pageStatus = 'loading'
				getLearningCoinDetail()
					.then((res) => {
						var d = res.data || {}
						// 余额以后端结算为权威，前端不做最终入账
						this.balance = Number(d.balance) || 0
						this.todayEarned = Number(d.todayEarned) || 0
						this.todayCompletionRate = Number(d.todayCompletionRate) || 0
						this.todayCompletedTasks = Number(d.todayCompletedTasks) || 0
						this.todayTotalTasks = Number(d.todayTotalTasks) || 0
						this.records = d.records || []
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			goRules() {
				// 金币规则复用 FAQ 中的「关于学习金币」分类
				uni.navigateTo({ url: '/pages/profile/faq' })
			},
			goShop() {
				uni.navigateTo({ url: '/pages/shop/index' })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 20rpx var(--app-page-padding) 0;
		box-sizing: border-box;
		background: transparent;
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.balance-card {
		position: relative;
		overflow: hidden;
		border-radius: 36rpx;
		padding: 38rpx 32rpx;
		margin-bottom: 24rpx;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	}

	.balance-head {
		display: flex;
		align-items: center;
	}

	.balance-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.20);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.balance-icon-text {
		font-size: 24rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.balance-name {
		margin-left: 14rpx;
		font-size: 27rpx;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.86);
	}

	.balance-num {
		margin-top: 18rpx;
		font-size: 64rpx;
		font-weight: 600;
		color: #FFFFFF;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.error-num {
		color: var(--app-hint);
	}

	.num-skeleton {
		margin-top: 18rpx;
		width: 180rpx;
		height: 64rpx;
		border-radius: 12rpx;
		background: rgba(255, 255, 255, 0.18);
	}

	.today-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 26rpx 28rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: var(--app-shadow-soft);
	}

	.today-label {
		font-size: 27rpx;
		color: var(--app-ink);
	}

	.today-value {
		font-size: 36rpx;
		font-weight: 600;
		color: var(--app-positive);
		font-variant-numeric: tabular-nums;
	}

	.section-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 28rpx;
		margin-bottom: 24rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-ink);
		margin-bottom: 14rpx;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18rpx 0;
		border-top: 1rpx solid var(--app-line);
	}

	.row-label {
		font-size: 27rpx;
		color: var(--app-muted);
	}

	.row-value {
		font-size: 27rpx;
		font-weight: 500;
		color: var(--app-ink);
		font-variant-numeric: tabular-nums;
	}

	.empty-text {
		font-size: 25rpx;
		color: var(--app-hint);
		padding: 20rpx 0;
	}

	.record-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22rpx 0;
		border-top: 1rpx solid var(--app-line);
	}

	.record-left {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.record-date {
		font-size: 27rpx;
		color: var(--app-ink);
	}

	.record-desc {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: var(--app-hint);
	}

	.record-delta {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-positive);
		font-variant-numeric: tabular-nums;
	}

	.record-delta.penalty {
		color: var(--app-negative);
	}

	.rules-entry {
		padding: 26rpx 28rpx;
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		display: flex;
		justify-content: center;
		box-shadow: var(--app-shadow-soft);
	}

	.rules-text {
		font-size: 27rpx;
		color: var(--app-primary);
	}

	.redeem-entry {
		margin-top: 18rpx;
		padding: 22rpx 28rpx;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: var(--app-radius);
		display: flex;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.redeem-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
