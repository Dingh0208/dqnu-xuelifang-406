<template>
	<view class="page">
		<!-- 会员卡：高级但克制，颜色与金币完全不同 -->
		<view class="member-card">
			<view class="card-head">
				<text class="icon">👑</text>
				<text class="title">终身会员</text>
			</view>
			<view v-if="pageStatus === 'loading'" class="state-skeleton"></view>
			<text v-else-if="pageStatus === 'error'" class="state error" @click="loadData">会员状态加载失败</text>
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
		background-color: #F7EFE3;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.member-card {
		background: linear-gradient(135deg, #FBF4E8 0%, #F3E6D0 100%);
		border-radius: 24rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(140, 90, 60, 0.08);
	}

	.card-head {
		display: flex;
		align-items: center;
	}

	.icon {
		font-size: 48rpx;
		line-height: 1;
	}

	.title {
		margin-left: 16rpx;
		font-size: 36rpx;
		font-weight: 700;
		color: #6A4A28;
	}

	.state {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		color: #8D7964;
	}

	.state.error {
		color: #B56A3C;
	}

	.state-skeleton {
		margin-top: 20rpx;
		width: 280rpx;
		height: 32rpx;
		border-radius: 8rpx;
		background-color: #EFE3D0;
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

	.bullet {
		display: flex;
		align-items: flex-start;
		padding: 12rpx 0;
	}

	.bullet-dot {
		font-size: 30rpx;
		color: #B56A3C;
		margin-right: 14rpx;
		line-height: 1.4;
	}

	.bullet-text {
		flex: 1;
		font-size: 26rpx;
		color: #4A3520;
		line-height: 1.6;
	}

	.note-text {
		font-size: 25rpx;
		color: #8D7964;
		line-height: 1.6;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
