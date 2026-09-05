<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">主题</text>
		</view>

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
				getTheme()
					.then((res) => {
						this.form = res.data || this.form
						// 工作台主题与首页主题不一致时，才展示同步询问
						this.syncPending = isThemeSyncPending(this.form)
					})
					.catch(() => {
						uni.showToast({ title: '主题加载失败', icon: 'none' })
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

	.card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.card-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		margin-bottom: 18rpx;
	}

	.option-row {
		display: flex;
		align-items: center;
		padding: 22rpx 0;
		border-top: 1rpx solid #EFE3D0;
	}

	.option-row.static {
		justify-content: flex-start;
	}

	.radio {
		width: 36rpx;
		height: 36rpx;
		border-radius: 18rpx;
		border: 2rpx solid #D8C4A6;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.radio.on {
		border-color: #B56A3C;
	}

	.radio-dot {
		width: 18rpx;
		height: 18rpx;
		border-radius: 9rpx;
		background-color: #B56A3C;
	}

	.option-name {
		margin-left: 20rpx;
		flex: 1;
		font-size: 28rpx;
		color: #4A3520;
	}

	.option-tag {
		font-size: 22rpx;
		color: #B56A3C;
	}

	.card-note {
		display: block;
		margin-top: 18rpx;
		font-size: 23rpx;
		color: #B49D82;
		line-height: 1.6;
	}

	.wb-empty {
		display: flex;
		flex-direction: column;
		padding-top: 6rpx;
	}

	.wb-empty-text {
		font-size: 27rpx;
		color: #B49D82;
	}

	.wb-empty-sub {
		margin-top: 10rpx;
		font-size: 23rpx;
		color: #C6B092;
		line-height: 1.6;
	}

	/* 同步提示卡：克制、轻量，不做强营销视觉 */
	.sync-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 30rpx 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.sync-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.sync-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #8D7964;
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
		border: 1rpx solid #E0C8A8;
	}

	.sync-btn.primary {
		background-color: #B56A3C;
	}

	.sync-btn-text {
		font-size: 26rpx;
	}

	.ghost-text {
		color: #8D7964;
	}

	.primary-text {
		color: #FFFDF8;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
