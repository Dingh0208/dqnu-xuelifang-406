<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">主题</text>
		</view>

		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载主题设置…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">主题设置加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadTheme"><text>重新加载</text></view>
		</view>
		<block v-else>
		<!-- 当前使用（首页视觉主题） -->
		<view class="card">
			<text class="card-title">首页主题</text>
			<view
				v-for="opt in themeOptions"
				:key="opt.id"
				class="option-row"
				:class="{ active: form.homeTheme === opt.id }"
				@click="onSelect(opt.id)"
			>
				<view class="radio" :class="{ on: form.homeTheme === opt.id }">
					<view v-if="form.homeTheme === opt.id" class="radio-dot"></view>
				</view>
				<text class="option-name">{{ opt.name }}</text>
				<text v-if="form.homeTheme === opt.id" class="option-tag">当前使用</text>
			</view>
			<text class="card-note">主题只影响视觉表现，不影响学习内容、每日任务、金币、银币等任何数据。</text>
		</view>

		<!-- 工作台主题：暂无则显示占位，不造假数据 -->
		<view class="card">
			<text class="card-title">工作台主题</text>
			<view v-if="!workbenchTheme" class="wb-empty">
				<text class="wb-empty-text">暂无工作台主题</text>
				<text class="wb-empty-sub">创建带有主题的工作台后，可在这里把它同步到首页</text>
			</view>
			<view v-else class="option-row static">
				<text class="option-name">{{ workbenchName }}</text>
			</view>
		</view>

		<!-- 同步提示：仅当工作台主题存在且与首页主题不一致时出现 -->
		<view v-if="syncPending" class="sync-card">
			<text class="sync-title">检测到你的工作台使用了新主题</text>
			<text class="sync-desc">是否将工作台主题同步到首页？同步仅改变首页的视觉主题。</text>
			<view class="sync-actions">
				<view class="sync-btn ghost" @click="onDismissSync">
					<text class="sync-btn-text ghost-text">暂不同步</text>
				</view>
				<view class="sync-btn primary" @click="onSync">
					<text class="sync-btn-text primary-text">同步到首页</text>
				</view>
			</view>
		</view>
		</block>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getTheme, updateTheme } from '@/api/theme.js'
	import {
		getThemePresets,
		themeDisplayName,
		isThemeSyncPending,
		buildSyncedTheme,
		buildDismissSyncTheme,
		buildSelectHomeTheme
	} from '@/utils/theme.js'

	export default {
		data() {
			return {
				pageStatus: 'loading', // loading / normal / error
				// 主题状态：currentTheme / homeTheme / workbenchTheme / syncWorkbenchTheme
				form: {
					currentTheme: 'default',
					homeTheme: 'default',
					workbenchTheme: null,
					syncWorkbenchTheme: false
				},
				themeOptions: getThemePresets(),
				syncPending: false
			}
		},
		computed: {
			workbenchTheme() {
				return this.form.workbenchTheme
			},
			workbenchName() {
				return themeDisplayName(this.form.workbenchTheme)
			}
		},
		onLoad() {
			this.loadTheme()
		},
		methods: {
			loadTheme() {
				this.pageStatus = 'loading'
				getTheme()
					.then((res) => {
						this.form = res.data || this.form
						// 工作台主题与首页主题不一致时，才展示同步询问
						this.syncPending = isThemeSyncPending(this.form)
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			// 切换首页主题（当前仅默认主题可选；后续新增主题无需改页面结构）
			onSelect(themeId) {
				if (this.form.homeTheme === themeId) return
				updateTheme(buildSelectHomeTheme(this.form, themeId))
					.then((res) => {
						this.form = res.data || this.form
						this.syncPending = isThemeSyncPending(this.form)
						uni.showToast({ title: '已切换主题', icon: 'success' })
					})
					.catch(() => {
						uni.showToast({ title: '切换失败，请稍后重试', icon: 'none' })
					})
			},
			// 同步到首页：homeTheme = workbenchTheme（仅视觉）
			onSync() {
				updateTheme(buildSyncedTheme(this.form))
					.then((res) => {
						this.form = res.data || this.form
						this.syncPending = isThemeSyncPending(this.form)
						uni.showToast({ title: '已同步到首页', icon: 'success' })
					})
					.catch(() => {
						uni.showToast({ title: '同步失败，请稍后重试', icon: 'none' })
					})
			},
			// 暂不同步：homeTheme 保持不变
			onDismissSync() {
				updateTheme(buildDismissSyncTheme(this.form))
					.then((res) => {
						this.form = res.data || this.form
						this.syncPending = isThemeSyncPending(this.form)
					})
					.catch(() => {
						// 仅关闭提示，不改变首页主题
						this.syncPending = false
					})
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
		padding: 22rpx 0 22rpx;
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 28rpx;
		margin-bottom: 22rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.card-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-ink);
		margin-bottom: 16rpx;
	}

	.option-row {
		display: flex;
		align-items: center;
		padding: 22rpx 0;
		border-top: 1rpx solid var(--app-line);
	}

	.option-row.static {
		justify-content: flex-start;
	}

	.radio {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		border: 2rpx solid var(--app-line);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.radio.on {
		border-color: var(--app-accent);
	}

	.radio-dot {
		width: 18rpx;
		height: 18rpx;
		border-radius: 50%;
		background: var(--app-accent);
	}

	.option-name {
		margin-left: 20rpx;
		flex: 1;
		font-size: 28rpx;
		color: var(--app-ink);
	}

	.option-tag {
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		font-size: 22rpx;
		color: #0A6B63;
	}

	.card-note {
		display: block;
		margin-top: 16rpx;
		font-size: 23rpx;
		color: var(--app-hint);
		line-height: 1.6;
	}

	.wb-empty {
		display: flex;
		flex-direction: column;
		padding-top: 6rpx;
	}

	.wb-empty-text {
		font-size: 27rpx;
		color: var(--app-hint);
	}

	.wb-empty-sub {
		margin-top: 10rpx;
		font-size: 23rpx;
		color: var(--app-hint);
		line-height: 1.6;
	}

	/* 同步提示卡：克制、轻量，不做强营销视觉 */
	.sync-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 28rpx;
		margin-bottom: 22rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.sync-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.sync-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: var(--app-muted);
		line-height: 1.6;
	}

	.sync-actions {
		margin-top: 24rpx;
		display: flex;
		justify-content: flex-end;
	}

	.sync-btn {
		border-radius: 999rpx;
		padding: 14rpx 34rpx;
		margin-left: 20rpx;
	}

	.sync-btn.ghost {
		border: 1rpx solid var(--app-line);
		background: var(--app-surface-solid);
	}

	.sync-btn.primary {
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.sync-btn-text {
		font-size: 26rpx;
	}

	.ghost-text {
		color: var(--app-primary);
	}

	.primary-text {
		color: #FFFFFF;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
