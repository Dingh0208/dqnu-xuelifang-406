<template>
	<view class="page">
		<!-- 固定顶部区域：标题 / 上传入口 / 历史记录 / 我的错题 / 分类筛选，均不参与滚动 -->
		<view class="fixed-top">
			<!-- 顶部标题 + 历史记录入口 -->
			<view class="page-header">
				<text class="page-title">错题银行</text>
				<text class="history-link" @click="goHistory">历史记录</text>
			</view>

			<text class="stats-line">错题 {{ statistics.total }} · 已掌握 {{ statistics.masteredCount }} · 待复习 {{ statistics.reviewCount }}</text>

			<!-- 顶部上传区域（拍照 / 文档，并列占满一行） -->
			<view class="entry-card">
				<view class="entry-head">
					<text class="entry-title">＋　录入一道错题</text>
					<text class="entry-hint">{{ uploading ? '上传中…' : '录入后整理复习' }}</text>
				</view>
				<wrong-book-upload @camera="handleCameraUpload" @document="handleDocumentImport" @paste="handlePasteInput" />
			</view>

			<!-- 分类筛选 -->
			<view class="filter-row">
				<view
					v-for="f in filters"
					:key="f.key"
					class="filter-pill"
					:class="{ active: activeFilter === f.key }"
					@click="switchFilter(f.key)"
				>
					<text class="filter-text">{{ f.label }} <text class="filter-count">{{ filterCount(f.key) }}</text></text>
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
				<view v-if="pageStatus === 'loading'" class="aq-state-card">
					<text class="aq-state-text">正在加载错题…</text>
				</view>
				<view v-else-if="pageStatus === 'error'" class="aq-state-card">
					<text class="aq-state-text">错题加载失败，请稍后重试</text>
					<view class="aq-btn aq-btn-ghost state-btn" @click="loadData"><text>重新加载</text></view>
				</view>
				<view v-else-if="filteredList.length === 0" class="aq-state-card">
					<text class="aq-state-text">这里还没有错题，先录入一道吧</text>
				</view>
				<wrong-question-stack v-else :list="filteredList" @click="handleWrongBookItemClick" />
			</view>
		</scroll-view>

		<!-- 固定底部 TabBar 独立层：不在 scroll-view 内，不参与滚动，始终固定在视口底部 -->
		<view class="tabbar-holder">
			<bottom-tab-bar current="wrongbook" />
		</view>
		<view v-if="pasteVisible" class="paste-mask" @click.self="pasteVisible = false">
			<view class="paste-dialog">
				<text class="paste-title">粘贴文字</text>
				<textarea v-model="pastedText" class="paste-input" placeholder="剪贴板内容会显示在这里" />
				<text class="paste-note">文字识别接口尚未接入，此内容暂时不会加入错题列表。</text>
				<view class="paste-actions"><text @click="pasteVisible = false">关闭</text><text class="paste-confirm" @click="confirmPaste">读取剪贴板</text></view>
			</view>
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
				pageStatus: 'loading', // loading / normal / error
				activeFilter: 'all',
				uploading: false,
				pasteVisible: false,
				pastedText: '',
				filters: [
					{ key: 'all', label: '全部' },
					{ key: 'review', label: '待复习' },
					{ key: 'week', label: '本周新增' },
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
					if (status === 'week') return isAddedThisWeek(item)
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
			filterCount(key) {
				if (key === 'all') return this.statistics.total
				if (key === 'review') return this.statistics.reviewCount
				if (key === 'mastered') return this.statistics.masteredCount
				return this.list.filter(isAddedThisWeek).length
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
				this.pageStatus = 'loading'
				Promise.all([getWrongBookList(), getWrongBookStatistics()])
					.then((res) => {
						this.list = res[0].data.list || []
						this.statistics = res[1].data || this.statistics
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			// 拍照上传：先选图取临时路径，再上传；uploading 锁防止重复提交
			handleCameraUpload() {
				if (this.uploading) return
				var self = this
				var onPicked = function (filePath) {
					if (!filePath) {
						uni.showToast({ title: '未获取到图片', icon: 'none' })
						return
					}
					self.uploadFile(filePath, 'image')
				}
				if (typeof uni.chooseMedia === 'function') {
					uni.chooseMedia({
						count: 1,
						mediaType: ['image'],
						sourceType: ['camera', 'album'],
						success: function (res) {
							var file = res && res.tempFiles && res.tempFiles[0]
							onPicked(file && file.tempFilePath)
						}
					})
					return
				}
				if (typeof uni.chooseImage === 'function') {
					uni.chooseImage({
						count: 1,
						sourceType: ['camera', 'album'],
						success: function (res) {
							onPicked(res && res.tempFilePaths && res.tempFilePaths[0])
						}
					})
					return
				}
				uni.showToast({ title: '当前平台暂不支持拍照上传', icon: 'none' })
			},
			// 文档导入：先选择文件取临时路径，再上传
			handleDocumentImport() {
				if (this.uploading) return
				var self = this
				if (typeof uni.chooseMessageFile !== 'function') {
					uni.showToast({ title: '当前平台暂不支持文档导入', icon: 'none' })
					return
				}
				uni.chooseMessageFile({
					count: 1,
					type: 'file',
					success: function (res) {
						var file = res && res.tempFiles && res.tempFiles[0]
						var filePath = file && (file.path || file.tempFilePath)
						if (!filePath) {
							uni.showToast({ title: '未获取到文件', icon: 'none' })
							return
						}
						self.uploadFile(filePath, 'document')
					}
				})
			},
			// 统一上传：持锁 → 调 API → 成功后刷新列表，失败提示并解锁
			uploadFile(filePath, kind) {
				var self = this
				if (this.uploading) return
				this.uploading = true
				var request = kind === 'image' ? uploadImage(filePath) : uploadDocument(filePath)
				request
					.then(function () {
						uni.showToast({ title: '已提交识别', icon: 'none' })
						self.loadData()
					})
					.catch(function () {
						uni.showToast({ title: '上传失败，请稍后重试', icon: 'none' })
					})
					.then(function () {
						self.uploading = false
					}, function () {
						self.uploading = false
					})
			},
			handlePasteInput() {
				this.pastedText = ''
				this.pasteVisible = true
				if (typeof uni.getClipboardData !== 'function') return
				uni.getClipboardData({ success: (res) => { this.pastedText = (res && res.data) || '' } })
			},
			confirmPaste() {
				if (!this.pastedText.trim()) {
					uni.showToast({ title: '剪贴板没有文字', icon: 'none' })
					return
				}
				uni.showToast({ title: '文字识别接口尚未接入', icon: 'none' })
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

	function isAddedThisWeek(item) {
		var raw = String(item.createdAt || item.uploadedAt || '').slice(0, 10)
		var parts = raw.split('-')
		if (parts.length !== 3) return false
		var added = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
		if (isNaN(added.getTime())) return false
		var today = new Date()
		today.setHours(0, 0, 0, 0)
		var start = new Date(today)
		var day = (start.getDay() + 6) % 7
		start.setDate(start.getDate() - day)
		return added >= start && added <= today
	}
</script>

<style>
	.page {
		/* 整页固定为一屏、纵向 flex：上为固定顶部，中为唯一滚动区，下为固定 TabBar */
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: transparent;
		box-sizing: border-box;
	}

	/* 固定顶部：标题 / 上传 / 历史 / 我的错题 / 筛选，高度自然撑开，不参与滚动 */
	.fixed-top {
		flex-shrink: 0;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
	}

	/* 唯一滚动区域：flex:1 + min-height:0 占据顶部与 TabBar 之间的全部剩余空间 */
	.list-scroll {
		flex: 1;
		min-height: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.list-content {
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
	}

	/* TabBar 固定层占位：不参与滚动，高度与实际 TabBar 一致（含底部安全区） */
	.tabbar-holder {
		flex-shrink: 0;
		position: relative;
		z-index: 20;
		height: calc(124rpx + env(safe-area-inset-bottom));
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 22rpx 0 12rpx;
	}

	.page-title {
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.history-link {
		display: inline-flex;
		align-items: center;
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
		font-size: 23rpx;
		font-weight: 500;
	}

	.stats-line {
		display: block;
		font-size: 24rpx;
		color: var(--app-muted);
		padding: 0 0 20rpx;
	}

	.entry-card {
		position: relative;
		overflow: hidden;
		padding: 28rpx;
		margin-bottom: 24rpx;
		border-radius: 36rpx;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	}

	.entry-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 22rpx;
	}

	.entry-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.entry-hint {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.62);
	}

	/* 分类筛选 */
	.filter-row {
		display: flex;
		margin-bottom: 22rpx;
	}

	.filter-pill {
		flex: 1;
		min-width: 0;
		padding: 13rpx 6rpx;
		border-radius: 999rpx;
		background-color: rgba(255, 255, 255, 0.92);
		border: 1rpx solid var(--app-line);
		margin-right: 10rpx;
		text-align: center;
	}

	.filter-pill:last-child {
		margin-right: 0;
	}

	.filter-pill.active {
		background: rgba(18, 181, 165, 0.10);
		border-color: rgba(18, 181, 165, 0.35);
	}

	.filter-text {
		font-size: 23rpx;
		color: var(--app-copy);
	}

	.filter-count {
		color: var(--app-muted);
		font-size: 21rpx;
	}

	.filter-pill.active .filter-text {
		color: #0A6B63;
		font-weight: 600;
	}

	.filter-pill.active .filter-count {
		color: #0A6B63;
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.paste-mask {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 80;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 36rpx;
		background: var(--student-mask);
	}

	.paste-dialog {
		width: 100%;
		padding: 30rpx;
		border-radius: var(--app-radius);
		background: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		box-shadow: var(--app-shadow);
		box-sizing: border-box;
	}

	.paste-title {
		font-size: 31rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.paste-input {
		width: 100%;
		min-height: 190rpx;
		margin-top: 18rpx;
		padding: 18rpx;
		border: 1rpx solid var(--app-line);
		border-radius: 20rpx;
		background: #FFFFFF;
		box-sizing: border-box;
		font-size: 25rpx;
		color: var(--app-copy);
	}

	.paste-note {
		display: block;
		margin-top: 14rpx;
		font-size: 21rpx;
		line-height: 1.5;
		color: var(--app-muted);
	}

	.paste-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-top: 24rpx;
		color: var(--app-muted);
		font-size: 25rpx;
	}

	.paste-confirm {
		margin-left: 30rpx;
		color: var(--app-primary);
		font-weight: 600;
	}
</style>
