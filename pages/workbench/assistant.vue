<template>
	<view class="assistant-page">
		<view class="chat-head">
			<text class="back" @click="goBack">‹</text>
			<view><text class="chat-title">小筑 AI</text><text class="chat-sub">工作台长什么样，你说了算</text></view>
		</view>

		<view class="inspiration-head"><text class="section-title">灵感库</text><text class="muted">点一句，开始描述</text></view>
		<scroll-view class="inspiration-scroll" scroll-y :scroll-into-view="scrollTarget">
			<view v-if="inspirationStatus === 'normal'" class="inspiration-grid">
				<view v-for="item in inspirations" :key="item.id" class="inspiration" @click="applyInspiration(item)">
					<text class="inspiration-icon">{{ item.icon }}</text>
					<text class="inspiration-title">{{ item.title }}</text>
					<text class="inspiration-use">用这句　→</text>
				</view>
			</view>
			<view v-else class="inspiration-state">
				<text class="inspiration-state-text">{{ inspirationStatus === 'loading' ? '灵感加载中…' : (inspirationStatus === 'empty' ? '暂无灵感，直接输入你的想法吧' : '灵感暂时加载失败') }}</text>
				<text v-if="inspirationStatus === 'error'" class="inspiration-retry" @click="loadInspirations">重新加载</text>
			</view>
			<view v-for="(message, index) in messages" :id="'message-' + index" :key="index" class="message-row" :class="message.role">
				<view v-if="message.role === 'assistant'" class="assistant-mark">AI</view>
				<view class="message-bubble">{{ message.text }}</view>
			</view>
		</scroll-view>

		<view class="quick-row"><text class="quick-label">再来点</text><text class="quick-chip" @click="quickPrompt('帮我安排每天的三件重要任务。')">每日三件事</text><text class="quick-chip" @click="quickPrompt('帮我安排一段专注学习时间。')">专注学习</text></view>

		<!-- AI 生成结果出口：一键把任务落到今日计划 -->
		<view v-if="generatedTasks.length" class="plan-panel">
			<view class="plan-head">
				<text class="plan-title">已为你整理出今日计划</text>
				<text class="plan-count">{{ generatedTasks.length }} 项</text>
			</view>
			<view v-for="t in generatedTasks" :key="t.id" class="plan-row">
				<view class="plan-check">✓</view>
				<view class="plan-main">
					<text class="plan-name">{{ t.title }}</text>
					<text class="plan-sub">{{ t.description }} · 约 {{ t.estimatedMinutes }} 分钟</text>
				</view>
			</view>
			<view class="plan-actions">
				<view class="plan-btn primary" @click="addToToday"><text>加入今日计划</text></view>
				<view class="plan-btn ghost" @click="goHome"><text>去首页看看</text></view>
			</view>
		</view>

		<view class="composer-wrap">
			<textarea v-model="description" class="composer" auto-height maxlength="1000" placeholder="说说你想要的学习工作台…" />
			<view class="send" :class="{ disabled: !hasText || sending }" @click="handleSend">↑</view>
		</view>
		<text class="integration-note">当前可以提交创建意向；AI 自动生成服务尚未接入。</text>
	</view>
</template>

<script>
	import { getInspirations, createWorkbench, buildInspirationPrompt } from '@/api/workbench.js'
	import { addTask } from '@/utils/taskState.js'

	export default {
		data() {
			return {
				inspirationStatus: 'loading', // loading / normal / error
				inspirations: [],
				description: '',
				sending: false,
				scrollTarget: '',
				messages: [{ role: 'assistant', text: '早上好！告诉我你想怎样安排学习，我可以先帮你整理工作台的想法。' }],
				generatedTasks: []   // AI 派生出的今日任务（可一键加入首页）
			}
		},
		computed: { hasText() { return !!(this.description || '').trim() } },
		onLoad() {
			this.loadInspirations()
		},
		methods: {
			loadInspirations() {
				this.inspirationStatus = 'loading'
				getInspirations()
					.then((res) => {
						this.inspirations = (res && res.data && res.data.list || []).slice(0, 3)
						this.inspirationStatus = this.inspirations.length ? 'normal' : 'empty'
					})
					.catch(() => { this.inspirationStatus = 'error' })
			},
			goBack() { uni.navigateBack() },
			applyInspiration(item) { this.description = buildInspirationPrompt(item) },
			quickPrompt(text) { this.description = text },
			scrollToLast() {
				this.$nextTick(() => { this.scrollTarget = 'message-' + (this.messages.length - 1) })
			},
			handleSend() {
				var text = (this.description || '').trim()
				if (!text || this.sending) return
				this.sending = true
				this.messages.push({ role: 'user', text: text })
				this.scrollToLast()
				createWorkbench({ description: text }).then((res) => {
					var data = (res && res.data) || {}
					var tasks = Array.isArray(data.tasks) ? data.tasks : []
					this.generatedTasks = tasks
					this.messages.push({
						role: 'assistant',
						text: tasks.length
							? '我根据你的描述整理出 ' + tasks.length + ' 件可以马上开始的事，确认后加入今日计划即可。'
							: '创建意向已提交，AI 自动生成服务尚未接入。'
					})
					this.description = ''
					this.scrollToLast()
				}).catch(() => {
					this.messages.pop()
					uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
				}).then(() => { this.sending = false }, () => { this.sending = false })
			},
			// 一键把 AI 派生任务写入今日计划（taskState 统一持久化，首页立即可见）
			addToToday() {
				if (!this.generatedTasks.length) return
				var added = 0
				for (var i = 0; i < this.generatedTasks.length; i++) {
					if (addTask(this.generatedTasks[i])) added++
				}
				this.generatedTasks = []
				uni.showToast({ title: added > 0 ? '已加入今日计划' : '任务已存在，无需重复添加', icon: 'none' })
			},
			goHome() {
				uni.reLaunch({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style>
	.assistant-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: transparent;
		padding: calc(12rpx + env(safe-area-inset-top)) var(--app-page-padding) calc(16rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.chat-head {
		display: flex;
		align-items: center;
		padding: 12rpx 0 24rpx;
		flex-shrink: 0;
	}

	.back {
		width: 56rpx;
		font-size: 52rpx;
		line-height: 1;
		color: var(--app-ink);
	}

	.chat-title,
	.chat-sub {
		display: block;
	}

	.chat-title {
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.chat-sub {
		margin-top: 4rpx;
		font-size: 23rpx;
		color: var(--app-muted);
	}

	.inspiration-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
		padding: 4rpx 0 14rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.muted {
		font-size: 23rpx;
		color: var(--app-muted);
	}

	.inspiration-scroll {
		flex: 1;
		min-height: 0;
	}

	.inspiration-grid {
		display: flex;
		margin: 0 -6rpx 18rpx;
	}

	.inspiration {
		flex: 1;
		min-width: 0;
		margin: 0 6rpx;
		padding: 20rpx 16rpx;
		background: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		box-shadow: var(--app-shadow-soft);
		display: flex;
		flex-direction: column;
	}

	.inspiration-icon {
		width: 48rpx;
		height: 48rpx;
		border-radius: 15rpx;
		line-height: 48rpx;
		text-align: center;
		font-size: 27rpx;
		background: rgba(18, 181, 165, 0.12);
		color: var(--app-primary);
	}

	.inspiration-title {
		margin-top: 14rpx;
		font-size: 23rpx;
		line-height: 1.4;
		font-weight: 600;
		color: var(--app-ink);
	}

	.inspiration-use {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: var(--app-primary);
	}

	.inspiration-state {
		padding: 30rpx 0;
		text-align: center;
	}

	.inspiration-state-text {
		font-size: 23rpx;
		color: var(--app-muted);
	}

	.inspiration-retry {
		margin-left: 16rpx;
		font-size: 23rpx;
		color: var(--app-primary);
	}

	.message-row {
		display: flex;
		align-items: flex-start;
		margin: 16rpx 0;
	}

	.message-row.user {
		justify-content: flex-end;
	}

	.assistant-mark {
		flex-shrink: 0;
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		margin: 2rpx 12rpx 0 0;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		font-size: 22rpx;
		line-height: 48rpx;
		text-align: center;
	}

	.message-bubble {
		max-width: 82%;
		padding: 22rpx 24rpx;
		border: 1rpx solid var(--app-line);
		border-radius: 24rpx;
		background: var(--app-surface-solid);
		color: var(--app-copy);
		font-size: 27rpx;
		line-height: 1.6;
	}

	.user .message-bubble {
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		border-color: transparent;
	}

	.quick-row {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		padding: 14rpx 0;
		overflow: hidden;
	}

	.quick-label {
		color: var(--app-muted);
		font-size: 22rpx;
		flex-shrink: 0;
		margin-right: 8rpx;
	}

	.quick-chip {
		flex-shrink: 0;
		padding: 10rpx 18rpx;
		margin-right: 10rpx;
		border-radius: 999rpx;
		border: 1rpx solid var(--app-line);
		background: var(--app-surface-solid);
		color: #0A6B63;
		font-size: 21rpx;
	}

	.plan-panel {
		flex-shrink: 0;
		margin: 6rpx 0 14rpx;
		padding: 22rpx 22rpx 18rpx;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
	}

	.plan-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6rpx;
	}

	.plan-title {
		font-size: 27rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.plan-count {
		font-size: 22rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.plan-row {
		display: flex;
		align-items: flex-start;
		padding: 14rpx 0;
		border-top: 1rpx solid var(--app-line, #D3E8E7);
	}

	.plan-check {
		flex-shrink: 0;
		width: 36rpx;
		height: 36rpx;
		margin-top: 2rpx;
		border-radius: 50%;
		background: rgba(18, 181, 165, 0.14);
		color: var(--app-positive, #0E9F86);
		font-size: 22rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.plan-main {
		flex: 1;
		min-width: 0;
		margin-left: 14rpx;
	}

	.plan-name {
		display: block;
		font-size: 25rpx;
		font-weight: 500;
		color: var(--app-ink, #0D2F36);
	}

	.plan-sub {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		line-height: 1.5;
		color: var(--app-muted, #7B9AA1);
	}

	.plan-actions {
		display: flex;
		margin-top: 10rpx;
	}

	.plan-btn {
		flex: 1;
		height: 76rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		font-size: 26rpx;
		font-weight: 600;
	}

	.plan-btn.primary {
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		box-shadow: 0 6rpx 16rpx rgba(10, 92, 106, 0.16);
	}

	.plan-btn.ghost {
		margin-left: 16rpx;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		color: var(--app-primary, #0A5C6A);
	}

	.composer-wrap {
		flex-shrink: 0;
		display: flex;
		align-items: flex-end;
		padding: 10rpx 0;
	}

	.composer {
		flex: 1;
		min-height: 84rpx;
		max-height: 190rpx;
		padding: 20rpx 24rpx;
		border-radius: 28rpx;
		background: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		box-sizing: border-box;
		color: var(--app-ink);
		font-size: 27rpx;
	}

	.send {
		width: 78rpx;
		height: 78rpx;
		margin-left: 12rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		font-size: 40rpx;
		line-height: 78rpx;
		text-align: center;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.send.disabled {
		opacity: 0.45;
	}

	.integration-note {
		flex-shrink: 0;
		text-align: center;
		color: var(--app-hint);
		font-size: 20rpx;
		padding-top: 5rpx;
	}
</style>
