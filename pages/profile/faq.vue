<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">常见问题</text>
		</view>

		<!-- loading：轻量 skeleton -->
		<view v-if="pageStatus === 'loading'" class="list">
			<view v-for="n in 3" :key="'sk_' + n" class="cat-skeleton">
				<view class="skeleton-block sk-title"></view>
				<view class="skeleton-block sk-item"></view>
				<view class="skeleton-block sk-item"></view>
			</view>
		</view>
		<!-- empty -->
		<view v-else-if="pageStatus === 'empty'" class="empty-state">
			<text class="empty-text">暂无常见问题</text>
		</view>
		<!-- error：支持重新加载 -->
		<view v-else-if="pageStatus === 'error'" class="empty-state">
			<text class="empty-text">加载失败</text>
			<view class="retry-btn" @click="loadFaq"><text class="retry-text">重新加载</text></view>
		</view>
		<!-- normal -->
		<view v-else class="list">
			<view v-for="(cat, idx) in categories" :key="idx" class="cat-card">
				<text class="cat-title">{{ cat.category }}</text>
				<view v-for="item in cat.items" :key="item.id" class="qa-item">
					<view class="qa-q" @click="toggle(item.id)">
						<text class="q-text">{{ item.q }}</text>
						<text class="q-arrow" :class="{ open: openSet[item.id] }">›</text>
					</view>
					<text v-if="openSet[item.id]" class="qa-a">{{ item.a }}</text>
				</view>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getFaq } from '@/api/my.js'

	export default {
		data() {
			return {
				pageStatus: 'loading',  // loading / normal / empty / error
				categories: [],
				openSet: {}
			}
		},
		onLoad() {
			this.loadFaq()
		},
		methods: {
			loadFaq() {
				this.pageStatus = 'loading'
				getFaq()
					.then((res) => {
						var list = (res.data && res.data.categories) || []
						this.categories = list
						this.pageStatus = list.length === 0 ? 'empty' : 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			toggle(id) {
				this.openSet = Object.assign({}, this.openSet, {
					[id]: !this.openSet[id]
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

	.list {
		display: flex;
		flex-direction: column;
	}

	.cat-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.cat-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		margin-bottom: 12rpx;
	}

	.qa-item {
		padding: 20rpx 0;
		border-top: 1rpx solid #EFE3D0;
	}

	.qa-q {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.q-text {
		flex: 1;
		font-size: 27rpx;
		color: #4A3520;
	}

	.q-arrow {
		font-size: 32rpx;
		color: #C6B092;
		transition: transform 0.2s;
	}

	.q-arrow.open {
		transform: rotate(90deg);
	}

	.qa-a {
		display: block;
		margin-top: 14rpx;
		font-size: 25rpx;
		color: #8D7964;
		line-height: 1.6;
	}

	.cat-skeleton {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 24rpx;
	}

	.skeleton-block {
		border-radius: 8rpx;
		background-color: #EFE3D0;
	}

	.sk-title {
		width: 200rpx;
		height: 32rpx;
		margin-bottom: 20rpx;
	}

	.sk-item {
		width: 100%;
		height: 28rpx;
		margin-top: 18rpx;
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
		height: 60rpx;
	}
</style>
