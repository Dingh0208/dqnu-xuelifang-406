<template>
	<view class="page">
		<view class="bg-layer">
			<view class="blob blob-mint"></view>
		</view>

		<!-- 顶部导航 -->
		<view class="top-bar" :style="teacherTopBarStyle">
			<view class="top-bar-side">
				<view class="back-hit" hover-class="back-hit-hover" :hover-stay-time="80" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
			</view>
			<text class="top-title">完成进度</text>
			<view class="top-bar-side top-bar-right"></view>
		</view>

		<scroll-view class="content" scroll-y="true" :show-scrollbar="false">
			<view class="content-inner">
				<!-- 加载中 -->
				<view v-if="loading" class="state-card">
					<text class="state-text">加载中…</text>
				</view>

				<!-- 错误/无权限 -->
				<view v-else-if="loadError" class="state-card">
					<text class="state-text">{{ errorMessage }}</text>
					<view v-if="retryable" class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="loadProgress">
						<text class="state-btn-text">重试</text>
					</view>
					<view class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="goBack">
						<text class="state-btn-text">返回</text>
					</view>
				</view>

				<template v-else-if="task">
					<!-- 任务概览卡 -->
					<view class="overview-card">
						<text class="task-title">{{ task.title }}</text>
						<text class="task-deadline">截止 {{ task.deadline }}</text>
						<view class="rate-row">
							<text class="rate-num">{{ completionRate }}%</text>
							<text class="rate-label">总体完成率</text>
						</view>
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: completionRate + '%' }"></view>
						</view>
						<view class="stats-row">
							<view class="stat-cell">
								<text class="stat-num">{{ stats.completed }}</text>
								<text class="stat-label">已完成</text>
							</view>
							<view class="stat-cell">
								<text class="stat-num stat-pending">{{ stats.pendingActive }}</text>
								<text class="stat-label">未完成</text>
							</view>
							<view class="stat-cell">
								<text class="stat-num stat-ended">{{ stats.ended }}</text>
								<text class="stat-label">已过期</text>
							</view>
							<view class="stat-cell">
								<text class="stat-num">{{ stats.total }}</text>
								<text class="stat-label">总人数</text>
							</view>
						</view>
					</view>

					<!-- 学生列表 -->
					<view class="section-title">学生完成情况</view>
					<view v-if="members.length > 0" class="member-list">
						<view v-for="m in members" :key="m.userId" class="member-item">
							<view class="avatar">
								<text class="avatar-text">{{ m.nickname.charAt(0) }}</text>
							</view>
							<view class="member-info">
								<text class="member-name">{{ m.nickname }}</text>
								<text v-if="m.completedAt" class="member-time">完成于 {{ m.completedAt }}</text>
								<text v-else class="member-time pending">未完成</text>
							</view>
							<text class="member-status" :class="m.status === 'completed' ? 'status-done' : 'status-pending'">
								{{ memberStatusText(m) }}
							</text>
						</view>
					</view>
					<view v-else class="empty-tip">
						<text class="empty-text">暂无学生数据</text>
					</view>
				</template>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getTaskProgress } from '@/api/teacher/task.js'
	import * as authApi from '@/api/auth.js'
	import { isTaskEnded } from '@/utils/taskLifecycle.js'

	export default {
		data() {
			return {
				classId: '',
				taskId: '',
				loading: true,
				loadError: false,
				retryable: true,
				errorMessage: '',
				task: null,
				stats: { total: 0, completed: 0, pending: 0, pendingActive: 0, ended: 0 },
				members: []
			}
		},
		computed: {
			completionRate() {
				if (!this.stats.total) return 0
				return Math.round((this.stats.completed / this.stats.total) * 100)
			}
		},
		onLoad(options) {
			this.classId = (options && options.classId) || ''
			this.taskId = (options && options.taskId) || ''
		},
		onShow() {
			if (!authApi.requireTeacher()) return
			this.loadProgress()
		},
		methods: {
			// 学生任务状态文案（与学生详情/班级分析口径一致）：
			// completed → 已完成；pending + 任务已结束 → 已过期；pending + 进行中 → 进行中
			memberStatusText(m) {
				if (m.status === 'completed') return '已完成'
				return isTaskEnded(this.task) ? '已过期' : '进行中'
			},
			goBack() {
				uni.navigateBack()
			},
			loadProgress() {
				var self = this
				if (!this.classId || !this.taskId) {
					this.loading = false
					this.loadError = true
					this.retryable = false
					this.errorMessage = '任务信息不存在'
					return
				}
				this.loading = true
				this.loadError = false
				getTaskProgress(this.classId, this.taskId)
					.then(function (res) {
						if (!res || res.code !== 200) {
							if (res && res.code === 401) {
								authApi.logout()
								uni.reLaunch({ url: '/pages/auth/select' })
								return
							}
							self.loading = false
							self.loadError = true
							self.retryable = !res || (res.code !== 403 && res.code !== 404)
							self.errorMessage = (res && res.message) || '加载失败，请稍后重试'
							return
						}
						var d = res.data || {}
						var statsData = d.stats || {}
						if (typeof statsData.pendingActive !== 'number') {
							statsData.pendingActive = Math.max(Number(statsData.pending || 0) - Number(statsData.ended || 0), 0)
						}
						self.task = d.task
						self.stats = Object.assign({ total: 0, completed: 0, pending: 0, pendingActive: 0, ended: 0 }, statsData)
						self.members = d.members || []
						self.loading = false
					})
					.catch(function () {
						self.loading = false
						self.loadError = true
						self.retryable = true
						self.errorMessage = '网络异常，请稍后重试'
					})
			}
		}
	}
</script>

<style>
page {
		font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
		background-color: var(--teacher-page-bg-color);
		background-image: var(--teacher-page-bg-image);
		background-repeat: no-repeat;
		background-attachment: fixed;
	}

	.page {
		height: 100vh;
		max-width: 860rpx;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		background: var(--teacher-transparent);
		overflow: hidden;
		position: relative;
	}

	.bg-layer { position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 0; overflow: hidden; pointer-events: none; }
	.blob { position: absolute; border-radius: 50%; filter: none; }
	.blob-mint {
		width: 600rpx; height: 600rpx; top: -260rpx; left: -220rpx;
		background: radial-gradient(circle at center, var(--teacher-glow-soft) 0%, var(--teacher-glow-transparent) 70%);
	}

	.top-bar {
		position: relative; z-index: 2; flex-shrink: 0;
		padding-top: var(--teacher-safe-top);
		height: calc(88rpx + var(--teacher-safe-top));
		padding-left: var(--teacher-page-padding); padding-right: var(--teacher-page-padding);
		display: flex; align-items: center; box-sizing: border-box;
	}
	.top-bar-side { width: 160rpx; display: flex; align-items: center; }
	.top-bar-right { justify-content: flex-end; }
	.back-hit { height: 88rpx; display: flex; align-items: center; }
	.back-hit-hover { opacity: var(--teacher-hover-opacity); }
	.back-icon { font-size: 56rpx; color: var(--teacher-text); line-height: 1; }
	.top-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 500; color: var(--teacher-text); line-height: 48rpx; }

	.content { flex: 1; min-height: 0; position: relative; z-index: 1; background: var(--teacher-transparent); }
	/* 子页面无底部导航：内容底部自行预留 Home Indicator 安全区（原设计留白 48rpx 保留） */
	.content-inner { padding: 32rpx var(--teacher-page-padding) calc(48rpx + env(safe-area-inset-bottom)); background: var(--teacher-transparent); }

	.state-card {
		background-color: var(--teacher-card-bg); border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border); box-shadow: var(--teacher-card-shadow);
		padding: 72rpx 32rpx; display: flex; flex-direction: column; align-items: center;
	}
	.state-text { font-size: 28rpx; color: var(--teacher-text-secondary); line-height: 40rpx; text-align: center; }
	.state-btn {
		margin-top: 32rpx; height: 72rpx; padding: 0 56rpx;
		border-radius: var(--teacher-btn-radius); background: var(--teacher-btn-primary-bg);
		display: flex; align-items: center; justify-content: center;
	}
	.state-btn-hover { opacity: var(--teacher-hover-opacity); }
	.state-btn-text { font-size: 28rpx; font-weight: 600; color: var(--teacher-btn-primary-text); }

	/* 概览卡 */
	.overview-card {
		background-color: var(--teacher-card-bg); border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border); box-shadow: var(--teacher-card-shadow);
		padding: 32rpx;
	}
	.task-title { font-size: 32rpx; font-weight: 600; color: var(--teacher-text); line-height: 44rpx; }
	.task-deadline { display: block; margin-top: 8rpx; font-size: 24rpx; color: var(--teacher-text-muted); }
	.rate-row { margin-top: 24rpx; display: flex; align-items: baseline; }
	.rate-num { font-size: 56rpx; font-weight: 700; color: var(--teacher-accent); line-height: 1; }
	.rate-label { margin-left: 12rpx; font-size: 24rpx; color: var(--teacher-text-secondary); }
	.progress-bar {
		margin-top: 16rpx; height: 12rpx; background-color: var(--teacher-track);
		border-radius: 100rpx; overflow: hidden;
	}
	.progress-fill { height: 100%; background-color: var(--teacher-accent); border-radius: 100rpx; transition: width 0.6s ease; }
	.stats-row { margin-top: 28rpx; display: flex; justify-content: space-around; }
	.stat-cell { display: flex; flex-direction: column; align-items: center; }
	.stat-num { font-size: 36rpx; font-weight: 600; color: var(--teacher-text); }
	.stat-pending { color: var(--teacher-text-secondary); }
	.stat-ended { color: var(--teacher-text-muted); }
	.stat-label { margin-top: 4rpx; font-size: 22rpx; color: var(--teacher-text-muted); }

	/* 学生列表 */
	.section-title { margin: 32rpx 8rpx 16rpx; font-size: 28rpx; font-weight: 600; color: var(--teacher-text); }
	.member-list {
		background-color: var(--teacher-card-bg); border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border); box-shadow: var(--teacher-card-shadow);
		overflow: hidden;
	}
	.member-item {
		display: flex; align-items: center; padding: 24rpx 32rpx;
		border-bottom: 1rpx solid var(--teacher-divider);
	}
	.member-item:last-child { border-bottom: none; }
	.avatar {
		width: 72rpx; height: 72rpx; border-radius: 50%;
		background-color: var(--teacher-tint-bg); display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
	}
	.avatar-text { font-size: 30rpx; font-weight: 600; color: var(--teacher-secondary); }
	.member-info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; }
	.member-name { font-size: 28rpx; font-weight: 500; color: var(--teacher-text); }
	.member-time { margin-top: 4rpx; font-size: 22rpx; color: var(--teacher-text-muted); }
	.member-time.pending { color: var(--teacher-text-secondary); }
	.member-status {
		flex-shrink: 0; font-size: 24rpx; font-weight: 500; padding: 4rpx 16rpx; border-radius: 100rpx;
	}
	.status-done { color: var(--teacher-accent); background-color: var(--teacher-tint-bg); }
	.status-pending { color: var(--teacher-text-muted); background-color: var(--teacher-track); }

	.empty-tip { padding: 60rpx 32rpx; text-align: center; }
	.empty-text { font-size: 26rpx; color: var(--teacher-text-muted); }


/* ===== 海盐薄荷 · 教师端共享皮肤 ===== */
page {
	background-color: var(--app-bg);
	background-image:
		radial-gradient(circle at 12% 0%, rgba(56, 189, 248, 0.18), transparent 52%),
		radial-gradient(circle at 88% 4%, rgba(18, 181, 165, 0.16), transparent 46%),
		linear-gradient(180deg, #EDF8F7 0%, #F8FCFB 100%);
	background-repeat: no-repeat;
	background-size: cover;
	background-attachment: scroll;
	color: var(--app-ink);
}

.page {
	position: relative;
	height: 100vh;
	max-width: 860rpx;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: transparent;
}

.bg-layer {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 0;
	overflow: hidden;
	pointer-events: none;
}

.blob {
	position: absolute;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(18, 181, 165, 0.14) 0%, rgba(18, 181, 165, 0) 70%);
}

.blob-mint {
	width: 600rpx;
	height: 600rpx;
	top: -260rpx;
	left: -220rpx;
}

.top-bar {
	position: relative;
	z-index: 2;
	flex-shrink: 0;
	height: calc(88rpx + var(--teacher-safe-top));
	padding: var(--teacher-safe-top) var(--teacher-page-padding) 0;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.72);
	border-bottom: 1rpx solid var(--app-line);
}

.top-bar-side {
	width: 160rpx;
	display: flex;
	align-items: center;
}

.top-bar-right {
	justify-content: flex-end;
}

.back-hit {
	width: 88rpx;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	font-size: 52rpx;
	color: var(--app-primary);
}

.back-hit-hover {
	background: rgba(18, 181, 165, 0.10);
}

.back-icon {
	font-size: 52rpx;
	line-height: 1;
	color: var(--app-primary);
}

.top-title {
	flex: 1;
	text-align: center;
	font-size: 34rpx;
	font-weight: 600;
	color: var(--app-ink);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.logout-hit {
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.90);
	border: 1rpx solid var(--app-line);
	color: var(--app-muted);
	font-size: 23rpx;
}

.logout-hit-hover {
	opacity: var(--teacher-hover-opacity);
}

.content {
	flex: 1;
	min-height: 0;
	position: relative;
	z-index: 1;
	background: transparent;
}

.content-inner {
	padding: 24rpx var(--teacher-page-padding) calc(48rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.state-card {
	margin: 20rpx 0;
	padding: 56rpx 28rpx;
	border-radius: var(--app-radius);
	background: var(--app-surface-solid);
	border: 1rpx solid var(--app-line);
	box-shadow: var(--app-shadow-soft);
	display: flex;
	flex-direction: column;
	align-items: center;
	box-sizing: border-box;
}

.state-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--app-ink);
	line-height: 1.4;
}

.state-text {
	font-size: 26rpx;
	line-height: 1.6;
	color: var(--app-muted);
	text-align: center;
}

.state-btn,
.dark-button,
.empty-btn,
.create-btn,
.copy-btn,
.submit-btn,
.save-btn,
.progress-entry,
.locked-btn,
.add-hit,
.dialog-btn-primary,
.filter-chip.selected,
.teacher-btn--primary {
	background: var(--teacher-btn-primary-bg);
	color: #FFFFFF;
	box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
}

.ghost-button,
.dialog-btn-secondary,
.teacher-btn--secondary {
	background: rgba(255, 255, 255, 0.92);
	border: 1rpx solid var(--app-line);
	color: var(--app-primary);
	box-shadow: none;
}

.state-btn-text,
.dialog-btn-text-primary,
.create-btn-text,
.copy-btn-text,
.empty-btn-text,
.locked-btn-text,
.submit-btn-text,
.save-btn,
.add-text {
	color: #FFFFFF;
}

.dialog-btn-text-secondary {
	color: var(--app-primary);
}

.state-btn-hover,
.dark-button-hover,
.empty-btn-hover,
.create-btn-hover,
.copy-btn-hover,
.submit-btn-hover,
.progress-entry-hover,
.locked-btn-hover,
.add-hit-hover {
	opacity: var(--teacher-hover-opacity);
}

.section-head {
	margin: 28rpx 4rpx 16rpx;
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--app-ink);
	line-height: 1.4;
}

.section-note {
	font-size: 24rpx;
	color: var(--app-muted);
}

.section-link {
	font-size: 24rpx;
	color: var(--app-accent);
}

.retry-link {
	display: block;
	margin-top: 16rpx;
	color: var(--app-accent);
	font-size: 25rpx;
}

.bottom-space {
	height: 32rpx;
}

.class-card,
.empty-card,
.state-card,
.info-card,
.meta-card,
.admin-card,
.invite-card,
.entry-card,
.member-preview-card,
.member-card,
.invite-bar,
.title-card,
.progress-card,
.overview-card,
.form-card,
.locked-card,
.profile-card,
.stats-card,
.record-list,
.summary-list,
.schedule-strip,
.work-card,
.core-card,
.metric-card,
.summary-card,
.list-card,
.status-card,
.member-list,
.dialog {
	background: var(--app-surface-solid);
	border: 1rpx solid var(--app-line);
	border-radius: var(--app-radius);
	box-shadow: var(--app-shadow-soft);
	box-sizing: border-box;
}

.task-status,
.status-active,
.status-ended,
.member-status,
.role-badge,
.badge,
.pin-mark,
.focus-mark,
.class-status {
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 500;
	line-height: 1.35;
}

.task-status {
	padding: 4rpx 16rpx;
	flex-shrink: 0;
}

.status-active,
.status-done,
.class-status {
	color: var(--app-positive);
	background: var(--app-positive-bg);
}

.status-ended,
.status-pending,
.class-status-off {
	color: var(--app-muted);
	background: var(--teacher-track);
}

.pin-mark {
	color: var(--app-warning);
	background: var(--app-warning-bg);
}

.focus-mark {
	color: var(--app-negative);
	background: var(--app-negative-bg);
}

.badge {
	padding: 8rpx 18rpx;
	background: var(--app-surface-soft);
	color: var(--app-copy);
}

.role-badge {
	padding: 4rpx 14rpx;
	background: var(--app-surface-soft);
	color: var(--app-primary);
}

.progress-bar,
.progress-track {
	height: 12rpx;
	border-radius: 999rpx;
	background: var(--teacher-track);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #0A5C6A 0%, #12B5A5 100%);
	transition: width 0.5s ease;
}

.avatar {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
	color: #FFFFFF;
}

.avatar-text {
	font-size: 34rpx;
	font-weight: 600;
	color: #FFFFFF;
}

.empty-text,
.empty-inline,
.empty-tip {
	font-size: 25rpx;
	color: var(--app-muted);
}

.insight-number,
.work-number,
.work-value,
.summary-number,
.metric-number,
.stat-num,
.stat-value,
.rate-num,
.task-rate,
.rank-rate,
.class-count,
.member-count {
	font-variant-numeric: tabular-nums;
}


.task-title { font-size: 32rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; }
.task-deadline { display: block; margin-top: 6rpx; font-size: 23rpx; color: var(--app-muted); }
.rate-num { font-size: 48rpx; font-weight: 600; color: var(--app-primary); line-height: 1; }
.rate-label { margin-left: 10rpx; font-size: 23rpx; color: var(--app-muted); }
.stat-num { font-size: 40rpx; font-weight: 600; color: var(--app-ink); }
.stat-pending { color: var(--app-copy); }
.stat-ended { color: var(--app-muted); }
.stat-label { margin-top: 4rpx; font-size: 22rpx; color: var(--app-muted); }
.member-list { overflow: hidden; }
.member-item { display: flex; align-items: center; padding: 20rpx 24rpx; border-bottom: 1rpx solid var(--app-line); }
.member-item:last-child { border-bottom: 0; }
.avatar { width: 72rpx; height: 72rpx; }
.avatar-text { font-size: 28rpx; }
.member-info { flex: 1; margin-left: 18rpx; display: flex; flex-direction: column; }
.member-name { font-size: 27rpx; font-weight: 500; color: var(--app-ink); }
.member-time { margin-top: 4rpx; font-size: 22rpx; color: var(--app-muted); }
.member-time.pending { color: var(--app-copy); }
.member-status { flex-shrink: 0; padding: 4rpx 14rpx; font-size: 22rpx; font-weight: 500; }
.status-done { color: var(--app-positive); background: var(--app-positive-bg); }
.status-pending { color: var(--app-muted); background: var(--teacher-track); }
.empty-tip { padding: 52rpx 24rpx; text-align: center; }
.empty-text { font-size: 25rpx; color: var(--app-muted); }
.state-btn { height: 80rpx; padding: 0 48rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.state-btn-text { font-size: 27rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
