<template>
	<view class="page">
		<!-- 会员卡：高级但克制，颜色与金币完全不同 -->
		<view class="member-card">
			<view class="card-head">
				<view class="member-icon"><text class="member-icon-text">会</text></view>
				<text class="title">终身会员</text>
			</view>
			<view v-if="pageStatus === 'loading'" class="state-skeleton"></view>
			<view v-else-if="pageStatus === 'error'" class="state-error">
				<text class="state error">会员状态加载失败</text>
				<view class="mini-btn" @click="loadData"><text class="mini-btn-text">重新加载</text></view>
			</view>
			<text v-else-if="isMember" class="state">已开通 · 已享有长期会员权益</text>
			<text v-else class="state">未开通 · 一次购买，长期享受学习权益</text>
		</view>

		<!-- 权益说明：当前规则未确定，只做说明，不写死价格/折扣/抵扣比例 -->
		<view class="section-card">
			<text class="section-title">关于终身会员</text>
			<view class="bullet">
				<text class="bullet-dot">·</text>
				<text class="bullet-text">一次购买，长期/永久享受会员权益。</text>
			</view>
			<view class="bullet">
				<text class="bullet-dot">·</text>
				<text class="bullet-text">认真学习积累的学习金币，未来可参与终身会员相关抵扣。</text>
			</view>
			<view class="bullet">
				<text class="bullet-dot">·</text>
				<text class="bullet-text">银币不能参与终身会员抵扣。</text>
			</view>
		</view>

		<!-- 未确定规则：明确告知规则尚未确定，不擅自制定 -->
		<view class="section-card">
			<text class="section-title">规则说明</text>
			<text class="note-text">终身会员最终价格、金币抵扣比例、会员具体权益尚未最终确定。确定后会在「关于学立方」与常见问题中公布。</text>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getMembership } from '@/api/my.js'

	export default {
		data() {
			return {
				pageStatus: 'loading',  // loading / normal / error
				isMember: false
			}
		},
		onLoad() {
			this.loadData()
		},
		methods: {
			loadData() {
				this.pageStatus = 'loading'
				getMembership()
					.then((res) => {
						var m = res.data || {}
						// price / coinDeduction 未确定时为 null，前端禁止自行填写
						this.isMember = !!m.isMember
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
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

	.member-card {
		position: relative;
		overflow: hidden;
		border-radius: 36rpx;
		padding: 38rpx 32rpx;
		margin-bottom: 24rpx;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	}

	.card-head {
		display: flex;
		align-items: center;
	}

	.member-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.20);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.member-icon-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.title {
		margin-left: 16rpx;
		font-size: 36rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.state {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.86);
	}

	.state.error {
		margin-top: 0;
		color: rgba(255, 255, 255, 0.92);
	}

	.state-error {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.mini-btn {
		padding: 10rpx 24rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.18);
	}

	.mini-btn-text {
		font-size: 23rpx;
		color: #FFFFFF;
	}

	.state-skeleton {
		margin-top: 20rpx;
		width: 280rpx;
		height: 30rpx;
		border-radius: 8rpx;
		background: rgba(255, 255, 255, 0.18);
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

	.bullet {
		display: flex;
		align-items: flex-start;
		padding: 12rpx 0;
	}

	.bullet-dot {
		font-size: 30rpx;
		color: var(--app-accent);
		margin-right: 14rpx;
		line-height: 1.4;
	}

	.bullet-text {
		flex: 1;
		font-size: 26rpx;
		color: var(--app-copy);
		line-height: 1.6;
	}

	.note-text {
		font-size: 25rpx;
		color: var(--app-muted);
		line-height: 1.6;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
