<template>
	<view class="page">
		<!-- ① 顶部 Logo 预留：只留品牌空间，不渲染占位框/文字/图标/返回按钮 -->
		<view class="top-logo-area"></view>

		<!-- ② AI 创作区域：占据中间留白（flex:1）；composer 变高时它自动收缩，页面不产生空白 -->
		<view class="ai-zone">
			<text class="ai-intro-title">想创造一个怎样的工作台？</text>
			<text class="ai-intro-sub">在下方输入框告诉 AI 你的想法，或点一个灵感作为起点。</text>
		</view>

		<!-- ③ 工作台灵感标题（固定，不参与滚动） -->
		<view class="drawer-head">
			<text class="drawer-title">工作台灵感</text>
			<text class="drawer-hint">还有更多灵感，向上滑 ↑</text>
			<text class="drawer-sub">点一个灵感，把它变成你的想法。</text>
		</view>

		<!-- ④ 灵感滚动区域：可视高度恰好约「一行卡片」，首屏只完整露出第一行；
		     手指在该区域内向上滑，依次看到第二、三、四行；滚到第四行 + 30rpx 小间距即到底。
		     该区域是页面唯一的业务滚动区（textarea 长文本内部滚动不算页面滚动）。 -->
		<scroll-view
			scroll-y="true"
			class="insp-scroll"
			:scroll-top="inspScrollTop"
			:scroll-with-animation="true"
			@scroll="onInspScroll"
		>
			<view class="insp-scroll-inner">
				<view class="grid">
					<view
						v-for="item in inspirations"
						:key="item.id"
						class="grid-item"
						@click="applyInspiration(item)"
					>
						<view class="insp-card">
							<text class="insp-icon">{{ item.icon }}</text>
							<text class="insp-title">{{ item.title }}</text>
							<text class="insp-desc">{{ item.description }}</text>
						</view>
					</view>
				</view>
				<!-- 末行下方唯一的合理小间距（30rpx，区间 20–40rpx）；
				     没有大 spacer / 大 margin-bottom / 大占位 view。 -->
				<view class="grid-tail"></view>
			</view>
		</scroll-view>

		<!-- ⑤ AI 输入区域：正常文档流（不 fixed），高度 = textarea 实际高度，
		     auto-height 增长时把上方 flex:1 的 AI 创作区压缩，页面整体 100vh 不变、不产生空白；
		     textarea 到达 max-height 后内部滚动。 -->
		<view class="composer-wrap">
			<view class="composer">
				<textarea
					class="composer-textarea"
					v-model="description"
					placeholder="告诉 AI 你想创建什么……"
					placeholder-class="composer-placeholder"
					auto-height
					:maxlength="-1"
					:adjust-position="true"
				/>
				<view
					class="send-btn"
					:class="{ disabled: !hasText }"
					@click="handleSend"
				>
					<text class="send-btn-text">➤</text>
				</view>
			</view>
		</view>

		<!-- ⑥ TabBar 占位：高度与公共 BottomTabBar 实际厚度一致，
		     BottomTabBar 自身 fixed bottom:0 会正好覆盖在这块区域上。
		     本页不修改公共 TabBar，四项导航（首页/错题本/工作台/我的）保持原样。 -->
		<view class="tabbar-holder"></view>
		<bottom-tab-bar current="workbench" />
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import {
		getInspirations,
		createWorkbench,
		buildInspirationPrompt
	} from '@/api/workbench.js'

	export default {
		components: {
			BottomTabBar
		},
		data() {
			return {
				description: '',
				inspirations: [],
				// 灵感滚动区位置（点击灵感后回到第一行 = 回到 AI 创作上下文）
				inspScrollTop: 0,
				currentInspScrollTop: 0
			}
		},
		computed: {
			hasText() {
				return (this.description || '').trim().length > 0
			}
		},
		onShow() {
			this.loadData()
		},
		methods: {
			loadData() {
				getInspirations().then((res) => {
					this.inspirations = (res && res.data && res.data.list) || []
				})
			},
			onInspScroll(e) {
				this.currentInspScrollTop = e.detail.scrollTop
			},
			// 点击灵感后让灵感区回到第一行（回到 AI 创作上下文）
			scrollInspToTop() {
				this.inspScrollTop = this.currentInspScrollTop
				this.$nextTick(() => {
					this.inspScrollTop = 0
					this.currentInspScrollTop = 0
				})
			},
			// 点击灵感：回填到同一个 AI 输入框，不进入 inspiration-detail / 传统表单
			applyInspiration(item) {
				var prompt = buildInspirationPrompt(item)
				var current = (this.description || '').trim()
				if (current) {
					this.description = current + '\n' + prompt
				} else {
					this.description = prompt
				}
				this.scrollInspToTop()
				this.$nextTick(() => {
					uni.showToast({
						title: '已填入灵感，可继续修改',
						icon: 'none',
						duration: 1400
					})
				})
			},
			// 发送：V0.5 仍走 Mock，不接真实 AI / 后端
			handleSend() {
				var text = (this.description || '').trim()
				if (!text) {
					uni.showToast({ title: '先描述一下你想要的工作台吧', icon: 'none' })
					return
				}
				createWorkbench({ description: text }).then(() => {
					uni.showToast({ title: 'AI 工作台创建功能即将接入', icon: 'none' })
				})
			}
		}
	}
</script>

<style>
	/* ==================== 页面整体：固定一屏 flex 列，页面本身不滚动 ====================
	   高度分配（自上而下）：
	   Logo 预留（固定）
	   AI 创作区（flex:1，吸收多余空间；composer 变高时它自动收缩）
	   灵感标题（固定）
	   灵感滚动区（固定可视高度 ≈ 一行卡片；内部独立滚动）
	   AI 输入区（正常流，高度随 textarea 实际内容；max-height 后内部滚动）
	   TabBar 占位（= 公共 TabBar 厚度，被 fixed 的 BottomTabBar 覆盖）
	   全页始终 100vh，无大 spacer / 大 padding-bottom / 无人为空白。 */
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #F7EFE3;
		box-sizing: border-box;
	}

	/* ① Logo 预留 */
	.top-logo-area {
		flex-shrink: 0;
		height: calc(130rpx + env(safe-area-inset-top));
	}

	/* ② AI 创作区域：吸收中间剩余空间；composer 增高时从此处扣减，不产生空白 */
	.ai-zone {
		flex: 1;
		min-height: 80rpx;
		padding: 0 32rpx;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.ai-intro-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #4A3520;
		line-height: 1.35;
	}
	.ai-intro-sub {
		margin-top: 6rpx;
		font-size: 25rpx;
		color: #8D7964;
		line-height: 1.5;
	}

	/* ③ 灵感标题区：固定 */
	.drawer-head {
		flex-shrink: 0;
		padding: 10rpx 32rpx 4rpx;
	}
	.drawer-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		margin-right: 16rpx;
	}
	.drawer-hint {
		font-size: 22rpx;
		color: #C0A88A;
	}
	.drawer-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 23rpx;
		color: #8D7964;
		line-height: 1.5;
	}

	/* ④ 灵感滚动区：可视高度恰好约一行卡片（rpx 等比缩放，各机型表现一致）。
	   第二行卡片顶部（卡片高 ~218rpx + 行间距 22rpx + 顶部内边距 10rpx ≈ 250rpx）
	   被裁在可视区外 → 首屏只完整露出第一行，不露出成长养成/太空探索。
	   flex-shrink:1 + min-height:0：极小屏且 composer 撑到最高时允许再压缩，页面不溢出。 */
	.insp-scroll {
		flex: 0 1 auto;
		min-height: 0;
		height: 248rpx;
		width: 100%;
		box-sizing: border-box;
	}
	.insp-scroll-inner {
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 20rpx;
		row-gap: 22rpx;
	}
	.grid-item {
		min-width: 0;
	}
	.insp-card {
		height: 100%;
		background-color: #FFFDF8;
		border-radius: 22rpx;
		border: 1rpx solid #F0E1C4;
		padding: 22rpx 22rpx 20rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		box-shadow: 0 2rpx 10rpx rgba(181, 106, 60, 0.04);
	}
	.insp-icon {
		font-size: 44rpx;
		line-height: 1;
	}
	.insp-title {
		margin-top: 12rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		line-height: 1.4;
	}
	.insp-desc {
		margin-top: 10rpx;
		font-size: 23rpx;
		color: #8D7964;
		line-height: 1.5;
		flex: 1;
	}

	/* 末行下方唯一合理小间距（30rpx），滚到底即结束 */
	.grid-tail {
		height: 30rpx;
	}

	/* ⑤ AI 输入区：正常流，高度跟随 textarea 实际高度（不提前预留最大高度） */
	.composer-wrap {
		flex-shrink: 0;
		padding: 10rpx 20rpx 12rpx;
		box-sizing: border-box;
	}
	.composer {
		display: flex;
		align-items: flex-end;
		background-color: #FFFDF8;
		border-radius: 999rpx;
		padding: 12rpx 12rpx 12rpx 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(181, 106, 60, 0.10);
	}

	.composer-textarea {
		flex: 1;
		min-width: 0;
		/* 初始：约一行（80 + 上下 padding 40 ≈ 120rpx，落在 90–120rpx 区间） */
		height: 80rpx;
		/* 最大高度：达到后停止增高，超出内容在 textarea 内部滚动（项目已确定） */
		max-height: 228rpx;
		padding: 20rpx 12rpx;
		font-size: 28rpx;
		line-height: 1.6;
		color: #4A3520;
		box-sizing: border-box;
	}
	.composer-placeholder {
		color: #C6B092;
	}

	.send-btn {
		flex-shrink: 0;
		margin-left: 10rpx;
		width: 80rpx;
		height: 80rpx;
		border-radius: 40rpx;
		background-color: #B56A3C;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.send-btn-text {
		font-size: 34rpx;
		color: #FFFDF8;
		line-height: 1;
		margin-left: 2rpx;
	}
	.send-btn.disabled {
		background-color: #D5B997;
	}

	/* ⑥ TabBar 占位：高度 = 公共 BottomTabBar 厚度 + 安全区；
	     实际渲染的 fixed BottomTabBar（不透明暖白底）正好覆盖此区域，
	     因此视觉上不会露出米色空白。 */
	.tabbar-holder {
		flex-shrink: 0;
		height: calc(110rpx + env(safe-area-inset-bottom));
	}
</style>
