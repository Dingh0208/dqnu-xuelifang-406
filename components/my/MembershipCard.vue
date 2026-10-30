<template>
	<view class="membership-card" @click="onClick">
		<!-- 终身会员：高级但克制，颜色与金币完全不同 -->
		<view class="left">
			<text class="icon">👑</text>
			<view class="info">
				<text class="title">终身会员</text>
				<text class="desc" v-if="status === 'member'">已享有长期会员权益</text>
				<text class="desc" v-else-if="status === 'error'">会员状态加载失败</text>
				<!-- 未开通：一次购买，长期享受学习权益；不显示价格/折扣/抵扣比例 -->
				<text class="desc" v-else>一次购买，长期享受学习权益</text>
			</view>
		</view>
		<view class="right">
			<text v-if="status === 'member'" class="badge">已开通</text>
			<text class="entry">查看 ›</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'MembershipCard',
		props: {
			// 会员状态：unopened / member / error
			status: {
				type: String,
				default: 'unopened'
			}
		},
		methods: {
			onClick() {
				this.$emit('view')
			}
		}
	}
</script>

<style>
	.membership-card {
		background: linear-gradient(135deg, var(--student-surface-soft) 0%, var(--student-surface-soft) 100%);
		border-radius: 24rpx;
		padding: 30rpx 28rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 14rpx var(--student-shadow-soft);
	}

	.left {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.icon {
		font-size: 44rpx;
		line-height: 1;
	}

	.info {
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.title {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--student-ink);
	}

	.desc {
		margin-top: 8rpx;
		font-size: 23rpx;
		color: var(--student-muted);
	}

	.right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex-shrink: 0;
	}

	.badge {
		font-size: 21rpx;
		color: var(--student-dark);
		padding: 4rpx 14rpx;
		border: 1rpx solid var(--student-line);
		border-radius: 999rpx;
		margin-bottom: 8rpx;
	}

	.entry {
		font-size: 23rpx;
		color: var(--student-muted);
	}
</style>
