<template>
	<view class="card">
		<view class="card-header">
			<text class="card-title">今日复习提醒</text>
			<text v-if="showMore" class="card-more" @click="onMore">根据记录 · 共 {{ reviews.length }} 项</text>
		</view>

		<view
			v-for="(item, index) in reviews"
			:key="item.id || index"
			class="review-row"
			:class="{ 'last-row': index === reviews.length - 1 }"
		>
			<view class="review-main">
				<text class="review-title">{{ item.title }}</text>
				<text class="review-sub">上次学习：{{ item.lastStudyDaysAgo }}天前</text>
			</view>
		</view>

		<view v-if="reviews.length === 0" class="review-empty">
			<text>今天没有需要复习的内容</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TodayReview',
		props: {
			reviews: {
				type: Array,
				default: function () {
					return []
				}
			},
			showMore: {
				type: Boolean,
				default: true
			}
		},
		methods: {
			onMore() {
				this.$emit('more')
			}
		}
	}
</script>

<style>
	.card {
		padding: 28rpx;
		margin-bottom: 24rpx;
		background: var(--app-surface, rgba(255, 255, 255, 0.90));
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.card-more {
		font-size: 24rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.review-row {
		display: flex;
		align-items: center;
		padding: 22rpx 0;
		border-bottom: 1rpx solid var(--app-line, #D3E8E7);
	}

	.review-row.last-row {
		border-bottom: none;
		padding-bottom: 4rpx;
	}

	.review-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.review-title {
		display: block;
		font-size: 29rpx;
		font-weight: 500;
		line-height: 42rpx;
		color: var(--app-ink, #0D2F36);
	}

	.review-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 23rpx;
		line-height: 1.5;
		color: var(--app-muted, #7B9AA1);
	}

	.review-empty {
		padding: 36rpx 0 20rpx;
		text-align: center;
	}

	.review-empty text {
		font-size: 25rpx;
		line-height: 1.6;
		color: var(--app-muted, #7B9AA1);
	}
</style>
