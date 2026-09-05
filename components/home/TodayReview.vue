<template>
	<view class="card">
		<view class="card-header">
			<text class="card-title">今天该复习什么</text>
			<text v-if="showMore" class="card-more" @click="onMore">查看全部 ›</text>
		</view>

		<view
			v-for="(item, index) in reviews"
			:key="item.id || index"
			class="review-row"
			:class="{ 'last-row': index === reviews.length - 1 }"
		>
			<text class="review-title">{{ item.title }}</text>
			<text class="review-sub">上次学习：{{ item.lastStudyDaysAgo }}天前</text>
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
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 32rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
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
		color: #4A3520;
	}

	.card-more {
		font-size: 26rpx;
		color: #8D7964;
	}

	.review-row {
		padding: 26rpx 0;
		border-bottom: 1rpx solid #EFE3D0;
	}

	.review-row.last-row {
		border-bottom: none;
		padding-bottom: 8rpx;
	}

	.review-title {
		display: block;
		font-size: 30rpx;
		color: #4A3520;
		font-weight: 500;
	}

	.review-sub {
		display: block;
		font-size: 24rpx;
		color: #8D7964;
		margin-top: 8rpx;
	}
</style>
