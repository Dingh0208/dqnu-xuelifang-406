<template>
	<view class="q-card" @click="onClick">
		<view class="q-info">
			<view class="q-main">
				<text class="q-title">{{ item.title }}</text>
				<text class="q-point">{{ item.subject }} · {{ item.knowledgePoint }}</text>
				<text class="q-meta">{{ item.status === 'review' ? '待复习' : '已掌握' }} · {{ item.source === 'camera' ? '拍照' : (item.source === 'text' ? '粘贴' : '文档') }} · {{ item.uploadedAt }}</text>
			</view>
			<text class="q-action" :class="{ mastered: item.status === 'mastered' }">{{ item.status === 'review' ? '去复习' : '看变式' }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'WrongQuestionCard',
		props: {
			item: {
				type: Object,
				default: function () {
					return {}
				}
			}
		},
		methods: {
			onClick() {
				this.$emit('click', this.item)
			}
		}
	}
</script>

<style>
	.q-info {
		background: var(--student-surface);
		border: 1rpx solid var(--student-line);
		border-radius: 28rpx;
		padding: 24rpx 24rpx;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.q-main {
		flex: 1;
		min-width: 0;
	}

	.q-title {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 29rpx;
		color: var(--student-ink);
		font-weight: 600;
		margin-top: 2rpx;
		line-height: 1.4;
	}

	.q-point {
		display: block;
		font-size: 23rpx;
		color: var(--student-muted);
		margin-top: 6rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.q-meta {
		display: block;
		font-size: 21rpx;
		color: var(--student-hint);
		margin-top: 8rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.q-action {
		flex-shrink: 0;
		margin-left: 16rpx;
		padding: 12rpx 22rpx;
		border-radius: 999rpx;
		background: var(--student-dark);
		color: var(--student-white);
		font-size: 23rpx;
		font-weight: 600;
	}

	.q-action.mastered {
		background: var(--student-positive);
	}
</style>
