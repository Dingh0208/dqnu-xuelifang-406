<template>
	<view class="page">
		<view class="profile-head">
			<view class="avatar">
				<image v-if="profile.avatar" :src="profile.avatar" mode="aspectFill" />
				<text v-else>{{ profile.avatarText || (profile.nickname || '同')[0] }}</text>
			</view>
			<view class="profile-copy">
			<text class="greeting">{{ greeting }}，{{ profile.nickname || '同学' }}</text>
				<text class="subline">按自己的节奏，搭建今天的学习计划</text>
			</view>
		</view>

		<view class="badge-row">
			<text class="badge">我的学习工作台</text>
			<text class="badge">今日 {{ totalTasks }} 项任务</text>
			<text class="badge badge-action" @click="editWorkbench">编辑</text>
		</view>

		<view v-if="pageStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载工作台…</text>
		</view>
		<view v-else-if="pageStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">工作台加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadData"><text>重新加载</text></view>
		</view>
		<block v-else>
		<view class="summary-card">
			<view class="summary-top">
				<view><text class="summary-label">今日学习时长</text><text class="summary-date">来自今日学习记录</text></view>
				<text class="summary-badge">今日</text>
			</view>
			<view class="summary-value">{{ studyTime || '--' }}</view>
			<view class="summary-stats">
				<view><text class="summary-num">{{ pendingTasks.length }}</text><text class="summary-small">待完成</text></view>
				<view><text class="summary-num">{{ wrongStats.reviewCount || 0 }}</text><text class="summary-small">待复习</text></view>
				<view><text class="summary-num">{{ completedTasks }}</text><text class="summary-small">已完成</text></view>
			</view>
		</view>

		<today-tasks :tasks="pendingTasks" @toggle="toggleTask" @more="goTasks" />

		<view class="chart-card">
			<view class="section-head">
				<text class="section-title">学习时长</text>
				<text class="metric-pill">今日 {{ studyTime || '--' }}</text>
			</view>
			<view class="chart">
				<view v-for="(day, index) in days" :key="day" class="chart-col">
					<view class="chart-track">
						<view v-if="index === todayIndex && studyMinutes > 0" class="chart-bar today" :style="{ height: todayBarHeight }"></view>
						<text v-else class="chart-missing">—</text>
					</view>
					<text class="chart-day">{{ day }}</text>
				</view>
			</view>
			<text class="chart-note">历史学习时长暂未同步，当前仅展示今日记录。</text>
		</view>

		<view class="review-card" @click="goReview">
			<view><text class="section-title">错题复习</text><text class="review-sub">{{ wrongStats.reviewCount || 0 }} 道待复习 · 按记录安排</text></view>
			<text class="review-action">开始复习　→</text>
		</view>

		<view class="add-card" @click="editWorkbench">
			<text class="add-icon">＋</text>
			<view class="add-copy"><text class="add-title">添加学习模块</text><text class="add-sub">告诉小筑 AI 你想怎样安排学习</text></view>
			<text class="add-link">编辑　→</text>
		</view>
		</block>

		<view class="bottom-space"></view>
		<bottom-tab-bar current="workbench" />
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import TodayTasks from '@/components/home/TodayTasks.vue'
	import * as homeApi from '@/api/home.js'
	import { getMyPage } from '@/api/my.js'
	import { getWrongBookStatistics } from '@/api/wrongbook.js'
	import { getTaskStats, getTasksByFilter, toggleTask, rollbackTask } from '@/utils/taskState.js'

	export default {
		components: { BottomTabBar, TodayTasks },
		data() {
			return {
				pageStatus: 'loading', // loading / normal / error
				profile: { avatar: '', avatarText: '学', nickname: '同学' },
				studyTime: '',
				greeting: '早上好',
				studyMinutes: 0,
				allTasks: [],
				pendingTasks: [],
				completedTasks: 0,
				totalTasks: 0,
				wrongStats: { reviewCount: 0, masteredCount: 0, total: 0 },
				days: ['一', '二', '三', '四', '五', '六', '日'],
				taskLocks: {}
			}
		},
		computed: {
			todayIndex() { return (new Date().getDay() + 6) % 7 },
			todayBarHeight() { return Math.max(8, Math.min(Math.round(this.studyMinutes / 240 * 100), 100)) + 'rpx' }
		},
		onShow() { this.loadData() },
		methods: {
			loadData() {
				this.pageStatus = 'loading'
				Promise.all([getMyPage(), homeApi.getHomeToday(), getWrongBookStatistics()])
					.then((res) => {
						this.profile = (res[0] && res[0].data && res[0].data.profile) || this.profile
						var today = res[1] && res[1].data
						this.greeting = (today && today.welcome && today.welcome.greeting) || this.greeting
						this.studyMinutes = Number(today && today.studyDuration) || 0
						var hours = Math.floor(this.studyMinutes / 60)
						var minutes = this.studyMinutes % 60
						this.studyTime = hours ? (minutes ? hours + '小时' + minutes + '分钟' : hours + '小时') : minutes + '分钟'
						this.wrongStats = (res[2] && res[2].data) || this.wrongStats
						this.refreshTasks()
						this.pageStatus = 'normal'
					})
					.catch(() => {
						this.pageStatus = 'error'
					})
			},
			refreshTasks() {
				var stats = getTaskStats()
				this.completedTasks = stats.completed
				this.totalTasks = stats.total
				this.allTasks = getTasksByFilter('all')
				this.pendingTasks = getTasksByFilter('pending')
			},
			toggleTask(task) {
				if (this.taskLocks[task.id]) return
				this.taskLocks[task.id] = true
				var result = toggleTask(task.id)
				if (!result) { this.taskLocks[task.id] = false; return }
				this.refreshTasks()
				homeApi.updateTaskCompleted(task.id, result.completed).catch(() => { rollbackTask(result.snapshot); this.refreshTasks() }).then(() => { this.taskLocks[task.id] = false }, () => { this.taskLocks[task.id] = false })
			},
			editWorkbench() { uni.navigateTo({ url: '/pages/workbench/assistant' }) },
			goTasks() { uni.navigateTo({ url: '/pages/tasks/index' }) },
			goReview() { uni.navigateTo({ url: '/pages/review/index' }) }
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

	.profile-head {
		display: flex;
		align-items: center;
		padding: 22rpx 0 16rpx;
	}

	.avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		font-size: 40rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar image {
		width: 100%;
		height: 100%;
	}

	.profile-copy {
		margin-left: 22rpx;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.greeting {
		font-size: 38rpx;
		line-height: 1.35;
		font-weight: 600;
		color: var(--app-ink);
	}

	.subline {
		margin-top: 6rpx;
		font-size: 24rpx;
		color: var(--app-muted);
	}

	.badge-row {
		display: flex;
		align-items: center;
		margin: 0 0 22rpx;
	}

	.badge {
		padding: 9rpx 20rpx;
		margin-right: 12rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
		font-size: 22rpx;
		font-weight: 500;
	}

	.badge-action {
		color: var(--app-primary);
		background: rgba(255, 255, 255, 0.92);
		border: 1rpx solid var(--app-line);
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.summary-card {
		position: relative;
		overflow: hidden;
		padding: 30rpx 32rpx;
		margin-bottom: 24rpx;
		border-radius: 36rpx;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
		color: #FFFFFF;
	}

	.summary-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.summary-label,
	.summary-date {
		display: block;
	}

	.summary-label {
		font-size: 25rpx;
		color: rgba(255, 255, 255, 0.86);
	}

	.summary-date {
		margin-top: 4rpx;
		font-size: 21rpx;
		color: rgba(255, 255, 255, 0.62);
	}

	.summary-badge,
	.metric-pill {
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
	}

	.summary-badge {
		background: rgba(255, 255, 255, 0.18);
		color: #FFFFFF;
	}

	.metric-pill {
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
	}

	.summary-value {
		margin: 10rpx 0 22rpx;
		font-size: 64rpx;
		line-height: 1.1;
		font-weight: 600;
		color: #FFFFFF;
		font-variant-numeric: tabular-nums;
	}

	.summary-stats {
		display: flex;
	}

	.summary-stats > view {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.summary-num {
		font-size: 38rpx;
		font-weight: 600;
		color: #FFFFFF;
		font-variant-numeric: tabular-nums;
	}

	.summary-small {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.62);
	}

	.chart-card,
	.review-card {
		padding: 28rpx;
		margin-bottom: 22rpx;
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		background: var(--app-surface-solid);
		box-shadow: var(--app-shadow-soft);
	}

	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.chart {
		display: flex;
		align-items: flex-end;
		margin-top: 26rpx;
	}

	.chart-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.chart-track {
		height: 114rpx;
		width: 56rpx;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
		border-radius: 12rpx 12rpx 4rpx 4rpx;
		background: var(--app-surface-soft);
	}

	.chart-bar {
		width: 100%;
		border-radius: 12rpx 12rpx 4rpx 4rpx;
		background: var(--app-line);
	}

	.chart-bar.today {
		background: linear-gradient(180deg, #17AAA1 0%, #12B5A5 100%);
	}

	.chart-missing {
		font-size: 20rpx;
		color: var(--app-hint);
	}

	.chart-day {
		margin-top: 9rpx;
		font-size: 21rpx;
		color: var(--app-muted);
	}

	.chart-note {
		display: block;
		margin-top: 18rpx;
		font-size: 21rpx;
		color: var(--app-muted);
	}

	.review-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.review-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 23rpx;
		color: var(--app-muted);
	}

	.review-action,
	.add-link {
		color: var(--app-primary);
		font-size: 24rpx;
		font-weight: 600;
	}

	.add-card {
		display: flex;
		align-items: center;
		padding: 26rpx;
		border: 1rpx dashed rgba(18, 181, 165, 0.35);
		border-radius: var(--app-radius);
		background: rgba(255, 255, 255, 0.55);
	}

	.add-icon {
		width: 54rpx;
		height: 54rpx;
		border-radius: 16rpx;
		background: rgba(18, 181, 165, 0.12);
		color: var(--app-primary);
		font-size: 32rpx;
		text-align: center;
		line-height: 54rpx;
	}

	.add-copy {
		flex: 1;
		min-width: 0;
		margin-left: 18rpx;
		display: flex;
		flex-direction: column;
	}

	.add-title {
		font-size: 27rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.add-sub {
		margin-top: 5rpx;
		font-size: 21rpx;
		color: var(--app-muted);
	}

	.bottom-space {
		height: calc(132rpx + env(safe-area-inset-bottom));
	}
</style>
