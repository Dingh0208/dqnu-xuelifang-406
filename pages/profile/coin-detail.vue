<template>
	<view class="page">
		<!-- 余额卡：金色视觉 -->
		<view class="balance-card">
			<view class="balance-head">
				<text class="balance-icon">🟡</text>
				<text class="balance-name">学习金币</text>
			</view>
			<view v-if="pageStatus === 'loading'" class="num-skeleton"></view>
			<text v-else-if="pageStatus === 'error'" class="balance-num error-num" @click="loadDetail">--</text>
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

	.balance-card {
		background: linear-gradient(135deg, #FFF6E0 0%, #FCEAC0 100%);
		border-radius: 24rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 24rpx;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4rpx 14rpx rgba(216, 144, 31, 0.10);
	}

	.balance-head {
		display: flex;
		align-items: center;
	}

	.balance-icon {
		font-size: 40rpx;
		line-height: 1;
	}

	.balance-name {
		margin-left: 14rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #8C5A0F;
	}

	.balance-num {
		margin-top: 18rpx;
		font-size: 72rpx;
		font-weight: 700;
		color: #D8901F;
		line-height: 1.1;
	}

	.error-num {
		color: #C0A488;
	}

	.num-skeleton {
		margin-top: 18rpx;
		width: 180rpx;
		height: 72rpx;
		border-radius: 12rpx;
		background-color: #F0E3C6;
	}

	.today-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.today-label {
		font-size: 28rpx;
		color: #4A3520;
	}

	.today-value {
		font-size: 36rpx;
		font-weight: 700;
		color: #D8901F;
	}

	.section-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.section-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		margin-bottom: 16rpx;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18rpx 0;
		border-top: 1rpx solid #EFE3D0;
	}

	.row-label {
		font-size: 27rpx;
		color: #8D7964;
	}

	.row-value {
		font-size: 27rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.empty-text {
		font-size: 25rpx;
		color: #B49D82;
		padding: 20rpx 0;
	}

	.record-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22rpx 0;
		border-top: 1rpx solid #EFE3D0;
	}

	.record-left {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.record-date {
		font-size: 27rpx;
		color: #4A3520;
	}

	.record-desc {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #B49D82;
	}

	.record-delta {
		font-size: 30rpx;
		font-weight: 700;
		color: #D8901F;
	}

	.record-delta.penalty {
		color: #B56A3C;
	}

	.rules-entry {
		padding: 28rpx 30rpx;
		background-color: #FFFDF8;
		border-radius: 24rpx;
		display: flex;
		justify-content: center;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.rules-text {
		font-size: 27rpx;
		color: #A8791C;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
