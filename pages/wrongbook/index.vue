<template>
	<view class="page">
		<!-- 固定顶部区域：标题 / 上传入口 / 历史记录 / 我的错题 / 分类筛选，均不参与滚动 -->
		<view class="fixed-top">
			<!-- 顶部标题 + 历史记录入口 -->
			<view class="page-header">
				<text class="page-title">错题本</text>
				<text class="history-link" @click="goHistory">历史记录</text>
			</view>

			<!-- 错题统计卡片 -->
			<view class="stats-card">
				<view class="stats-head">
					<text class="stats-title">我的错题</text>
					<text class="stats-total">共 {{ statistics.total }} 道错题</text>
				</view>
				<view class="stats-row">
					<view class="stats-item">
						<text class="stats-num review">{{ statistics.reviewCount }}</text>
						<text class="stats-label">待复习</text>
					</view>
					<view class="stats-divider"></view>
					<view class="stats-item">
						<text class="stats-num mastered">{{ statistics.masteredCount }}</text>
						<text class="stats-label">已掌握</text>
					</view>
				</view>
			</view>

			<!-- 顶部上传区域（拍照 / 文档，并列占满一行） -->
			<wrong-book-upload @camera="handleCameraUpload" @document="handleDocumentImport" />

			<!-- 分类筛选 -->
			<view class="filter-row">
				<view
					v-for="f in filters"
					:key="f.key"
					class="filter-pill"
					:class="{ active: activeFilter === f.key }"
					@click="switchFilter(f.key)"
				>
					<text class="filter-text">{{ f.label }}</text>
				</view>
			</view>
		</view>

		<!-- 唯一滚动区域：只有错题卡片列表滚动；
		     sticky 卡片堆叠与 700rpx 底部缓冲均在 WrongQuestionStack 内部，保持不变 -->
		<scroll-view
			scroll-y="true"
			class="list-scroll"
			:scroll-top="listScrollTop"
			:scroll-with-animation="false"
			@scroll="onListScroll"
		>
			<view class="list-content">
				<wrong-question-stack :list="filteredList" @click="handleWrongBookItemClick" />
			</view>
		</scroll-view>

		<!-- 固定底部 TabBar 独立层：不在 scroll-view 内，不参与滚动，始终固定在视口底部 -->
		<view class="tabbar-holder">
			<bottom-tab-bar current="wrongbook" />
		</view>
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import WrongBookUpload from '@/components/wrongbook/WrongBookUpload.vue'
	import WrongQuestionStack from '@/components/wrongbook/WrongQuestionStack.vue'
	import {
		getWrongBookList,
		getWrongBookStatistics,
		uploadImage,
		uploadDocument
	} from '@/api/wrongbook.js'

	export default {
		components: {
			BottomTabBar,
			WrongBookUpload,
			WrongQuestionStack
		},
		data() {
			return {
				activeFilter: 'all',
				filters: [
					{ key: 'all', label: '全部' },
					{ key: 'review', label: '待复习' },
					{ key: 'mastered', label: '已掌握' }
				],
				list: [],
				// list-scroll 的滚动位置：绑定到 scroll-view 的 scroll-top，
				// 切换筛选时通过 resetListScroll() 重置为 0
				listScrollTop: 0,
				// 记录用户实际滚动的位置（不绑定到视图），用于重置时制造一次真实变化
				currentScrollTop: 0,
				statistics: {
					total: 0,
					reviewCount: 0,
					masteredCount: 0
				}
			}
		},
		computed: {
			// 前端过滤：按状态筛选（拍照上传后可加 keyword 搜索）
			filteredList() {
				var status = this.activeFilter
				return this.list.filter(function (item) {
					if (status !== 'all' && item.status !== status) return false
					return true
				})
			}
		},
		onShow() {
			this.loadData()
		},
		methods: {
			// 切换筛选 Tab：更新筛选条件，并把列表滚动位置重置回顶部
			switchFilter(key) {
				if (this.activeFilter === key) return
				this.activeFilter = key
				this.resetListScroll()
			},
			// 记录 list-scroll 实际滚动位置，用于切换筛选时重置
			onListScroll(e) {
				this.currentScrollTop = e.detail.scrollTop
			},
			// 重置 list-scroll 滚动到顶部：
			// 先把绑定的 scroll-top 设为当前真实位置，制造一次响应式变化，
			// 再于 nextTick 回到 0，确保每次切换都能真正触发回到顶部（避免连续 0 不触发）
			resetListScroll() {
				this.listScrollTop = this.currentScrollTop
				this.$nextTick(() => {
					this.listScrollTop = 0
				})
			},
			// 数据层：当前走 Mock（USE_MOCK=true），未来同一切换为真实 API，模板无需改动
			loadData() {
				getWrongBookList().then((res) => {
					this.list = res.data.list
				})
				getWrongBookStatistics().then((res) => {
					this.statistics = res.data
				})
			},
			// 拍照上传：未来 wx.chooseMedia → uploadImage(filePath)
			handleCameraUpload() {
				// 预留真实能力（当前 Mock 阶段直接走 api 层模拟）
				// uni.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera', 'album'] })
				//   .then(res => uploadImage(res.tempFiles[0].tempFilePath))
				uploadImage('').then(() => {
					uni.showToast({ title: '已提交识别', icon: 'none' })
					this.loadData()
				})
			},
			// 文档导入：未来 wx.chooseMessageFile → uploadDocument(filePath)
			handleDocumentImport() {
				// uni.chooseMessageFile({ count: 1, type: 'file' })
				//   .then(res => uploadDocument(res.tempFiles[0].path))
				uploadDocument('').then(() => {
					uni.showToast({ title: '已提交识别', icon: 'none' })
					this.loadData()
				})
			},
			// 点击错题卡片 → 进入详情
			handleWrongBookItemClick(item) {
				uni.navigateTo({ url: '/pages/wrongbook/detail?id=' + item.id })
			},
			goHistory() {
				uni.navigateTo({ url: '/pages/wrongbook/history' })
			}
		}
	}
</script>

<style>
	.page {
		/* 整页固定为一屏、纵向 flex：上为固定顶部，中为唯一滚动区，下为固定 TabBar */
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #F7EFE3;
		box-sizing: border-box;
	}

	/* 固定顶部：标题 / 上传 / 历史 / 我的错题 / 筛选，高度自然撑开，不参与滚动 */
	.fixed-top {
		flex-shrink: 0;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	/* 唯一滚动区域：flex:1 + min-height:0 占据顶部与 TabBar 之间的全部剩余空间，
	   只有错题卡片列表在此滚动；页面整体与顶部内容均不滚动 */
	.list-scroll {
		flex: 1;
		min-height: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.list-content {
		padding: 0 24rpx;
		box-sizing: border-box;
	}

	/* TabBar 固定层占位：不参与滚动，高度与实际 TabBar 一致（含底部安全区） */
	.tabbar-holder {
		flex-shrink: 0;
		position: relative;
		z-index: 20;
		height: 100rpx;
		height: calc(100rpx + env(safe-area-inset-bottom));
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 8rpx 26rpx;
	}

	.page-title {
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.history-link {
		font-size: 26rpx;
		color: #B56A3C;
	}

	/* 错题统计卡片 */
	.stats-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 32rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.stats-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 28rpx;
	}

	.stats-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.stats-total {
		font-size: 26rpx;
		color: #8D7964;
	}

	.stats-row {
		display: flex;
		align-items: center;
	}

	.stats-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stats-num {
		font-size: 44rpx;
		font-weight: 700;
		line-height: 1.2;
	}

	.stats-num.review {
		color: #B56A3C;
	}

	.stats-num.mastered {
		color: #8D7964;
	}

	.stats-label {
		font-size: 24rpx;
		color: #8D7964;
		margin-top: 8rpx;
	}

	.stats-divider {
		width: 1rpx;
		height: 60rpx;
		background-color: #EFE3D0;
	}

	/* 分类筛选 */
	.filter-row {
		display: flex;
		margin-bottom: 24rpx;
	}

	.filter-pill {
		padding: 12rpx 36rpx;
		border-radius: 999rpx;
		background-color: #F3E9DA;
		margin-right: 20rpx;
	}

	.filter-pill.active {
		background-color: #B56A3C;
	}

	.filter-text {
		font-size: 26rpx;
		color: #8D7964;
	}

	.filter-pill.active .filter-text {
		color: #FFFDF8;
		font-weight: 600;
	}
</style>
