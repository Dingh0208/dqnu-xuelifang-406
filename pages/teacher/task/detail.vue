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
			<text class="top-title">任务详情</text>
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
					<view v-if="retryable" class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="loadDetail">
						<text class="state-btn-text">重试</text>
					</view>
					<view class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="goBack">
						<text class="state-btn-text">返回</text>
					</view>
				</view>

				<template v-else-if="task">
					<!-- 任务标题卡 -->
					<view class="title-card">
						<view class="title-row">
							<text class="task-title">{{ task.title }}</text>
							<text class="task-status" :class="effectiveStatus === 'active' ? 'status-active' : 'status-ended'">
								{{ effectiveStatus === 'active' ? '进行中' : '已截止' }}
							</text>
						</view>
						<text v-if="task.description" class="task-desc">{{ task.description }}</text>
					</view>

					<!-- 任务信息卡 -->
					<view class="info-card">
						<view class="info-row">
							<text class="info-label">创建时间</text>
							<text class="info-value">{{ task.createdAt }}</text>
						</view>
						<view class="info-row">
							<text class="info-label">截止时间</text>
							<text class="info-value">{{ task.deadline }}</text>
						</view>
					</view>

					<!-- 完成情况卡 -->
					<view class="progress-card">
						<text class="section-title">完成情况</text>
						<view class="progress-stats">
							<view class="stat-item">
								<text class="stat-num stat-completed">{{ progress.completed }}</text>
								<text class="stat-label">已完成</text>
							</view>
							<view class="stat-item">
								<text class="stat-num stat-pending">{{ progress.pendingActive }}</text>
								<text class="stat-label">未完成</text>
							</view>
							<view class="stat-item">
								<text class="stat-num stat-ended">{{ progress.ended }}</text>
								<text class="stat-label">已过期</text>
							</view>
							<view class="stat-item">
								<text class="stat-num">{{ progress.total }}</text>
								<text class="stat-label">总人数</text>
							</view>
						</view>
						<view v-if="progress.total > 0" class="progress-bar">
							<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
						</view>
						<text v-if="progress.total > 0" class="progress-text">
							完成率 {{ progressPercent }}%
						</text>
						<text v-else class="progress-text muted">暂无学生完成数据</text>

						<!-- 查看完成进度入口 -->
						<view class="progress-entry" hover-class="progress-entry-hover" :hover-stay-time="80" @tap="goProgress">
							<text class="progress-entry-text">查看完成进度</text>
							<text class="progress-entry-arrow">›</text>
						</view>
					</view>
				</template>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getTaskDetail } from '@/api/teacher/task.js'
	import * as authApi from '@/api/auth.js'
	import { getEffectiveTaskStatus } from '@/utils/taskLifecycle.js'

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
				progress: { total: 0, completed: 0, pending: 0, pendingActive: 0, ended: 0 }
			}
		},
		computed: {
			// 有效状态统一走 taskLifecycle（status + deadline），页面不自行判断
			effectiveStatus() {
				return this.task ? getEffectiveTaskStatus(this.task) : 'active'
			},
			progressPercent() {
				if (!this.progress.total) return 0
				return Math.round((this.progress.completed / this.progress.total) * 100)
			}
		},
		onLoad(options) {
			this.classId = (options && options.classId) || ''
			this.taskId = (options && options.taskId) || ''
		},
		onShow() {
			if (!authApi.requireTeacher()) return
			this.loadDetail()
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			goProgress() {
				if (!this.classId || !this.taskId) return
				uni.navigateTo({
					url: '/pages/teacher/task/progress?classId=' + this.classId + '&taskId=' + this.taskId
				})
			},
			loadDetail() {
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
				getTaskDetail(this.classId, this.taskId)
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
						var progressData = d.progress || {}
						if (typeof progressData.pendingActive !== 'number') {
							progressData.pendingActive = Math.max(Number(progressData.pending || 0) - Number(progressData.ended || 0), 0)
						}
						self.task = d.task
						self.progress = Object.assign({ total: 0, completed: 0, pending: 0, pendingActive: 0, ended: 0 }, progressData)
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

	.bg-layer {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: none;
	}

	.blob-mint {
		width: 600rpx;
		height: 600rpx;
		top: -260rpx;
		left: -220rpx;
		background: radial-gradient(circle at center, var(--teacher-glow-soft) 0%, var(--teacher-glow-transparent) 70%);
	}

	/* 顶部导航 */
	.top-bar {
		position: relative;
		z-index: 2;
		flex-shrink: 0;
		padding-top: var(--teacher-safe-top);
		height: calc(88rpx + var(--teacher-safe-top));
		padding-left: var(--teacher-page-padding);
		padding-right: var(--teacher-page-padding);
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.top-bar-side { width: 160rpx; display: flex; align-items: center; }
	.top-bar-right { justify-content: flex-end; }
	.back-hit { height: 88rpx; display: flex; align-items: center; }
	.back-hit-hover { opacity: var(--teacher-hover-opacity); }
	.back-icon { font-size: 56rpx; color: var(--teacher-text); line-height: 1; }
	.top-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: 500; color: var(--teacher-text); line-height: 48rpx; }

	/* 内容区 */
	.content { flex: 1; min-height: 0; position: relative; z-index: 1; background: var(--teacher-transparent); }
	/* 子页面无底部导航：内容底部自行预留 Home Indicator 安全区（原设计留白 48rpx 保留） */
	.content-inner { padding: 32rpx var(--teacher-page-padding) calc(48rpx + env(safe-area-inset-bottom)); background: var(--teacher-transparent); }

	.state-card {
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 72rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.state-text { font-size: 28rpx; color: var(--teacher-text-secondary); line-height: 40rpx; text-align: center; }
	.state-btn {
		margin-top: 32rpx; height: 72rpx; padding: 0 56rpx;
		border-radius: var(--teacher-btn-radius); background: var(--teacher-btn-primary-bg);
		display: flex; align-items: center; justify-content: center;
	}
	.state-btn-hover { opacity: var(--teacher-hover-opacity); }
	.state-btn-text { font-size: 28rpx; font-weight: 600; color: var(--teacher-btn-primary-text); }

	/* 任务标题卡 */
	.title-card {
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 32rpx;
	}
	.title-row { display: flex; align-items: center; justify-content: space-between; }
	.task-title { flex: 1; font-size: 34rpx; font-weight: 600; color: var(--teacher-text); line-height: 48rpx; }
	.task-status {
		flex-shrink: 0; margin-left: 16rpx; font-size: 22rpx; font-weight: 500;
		padding: 4rpx 16rpx; border-radius: 100rpx;
	}
	.status-active { color: var(--teacher-accent); background-color: var(--teacher-tint-bg); }
	.status-ended { color: var(--teacher-text-muted); background-color: var(--teacher-track); }
	.task-desc { display: block; margin-top: 16rpx; font-size: 26rpx; color: var(--teacher-text-secondary); line-height: 40rpx; }

	/* 信息卡 */
	.info-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 8rpx 32rpx;
	}
	.info-row {
		display: flex; align-items: center; justify-content: space-between;
		padding: 24rpx 0;
		border-bottom: 1rpx solid var(--teacher-divider);
	}
	.info-row:last-child { border-bottom: none; }
	.info-label { font-size: 26rpx; color: var(--teacher-text-secondary); }
	.info-value { font-size: 26rpx; color: var(--teacher-text); }

	/* 完成情况卡 */
	.progress-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 32rpx;
	}
	.section-title { font-size: 28rpx; font-weight: 600; color: var(--teacher-text); line-height: 40rpx; }
	.progress-stats {
		margin-top: 24rpx;
		display: flex; justify-content: space-around;
	}
	.stat-item { display: flex; flex-direction: column; align-items: center; }
	.stat-num { font-size: 40rpx; font-weight: 600; color: var(--teacher-text); line-height: 56rpx; }
	.stat-completed { color: var(--teacher-accent); }
	.stat-pending { color: var(--teacher-text-secondary); }
	.stat-ended { color: var(--teacher-text-muted); }
	.stat-label { margin-top: 4rpx; font-size: 22rpx; color: var(--teacher-text-muted); }
	.progress-bar {
		margin-top: 28rpx;
		height: 12rpx;
		background-color: var(--teacher-track);
		border-radius: 100rpx;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background-color: var(--teacher-accent);
		border-radius: 100rpx;
		transition: width 0.6s ease;
	}
	.progress-text {
		display: block;
		margin-top: 16rpx;
		font-size: 24rpx;
		color: var(--teacher-text-secondary);
		text-align: center;
	}
	.progress-text.muted { color: var(--teacher-text-muted); }

	/* 查看完成进度入口 */
	.progress-entry {
		margin-top: 28rpx;
		height: 80rpx;
		border-radius: var(--teacher-btn-radius);
		background: var(--teacher-btn-primary-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.progress-entry-hover { opacity: var(--teacher-hover-opacity); }
	.progress-entry-text { font-size: 28rpx; font-weight: 600; color: var(--teacher-btn-primary-text); }
	.progress-entry-arrow { margin-left: 8rpx; font-size: 32rpx; color: var(--teacher-btn-primary-text); line-height: 1; }


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
.task-desc { display: block; margin-top: 12rpx; font-size: 25rpx; color: var(--app-muted); line-height: 1.5; }
.info-row { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid var(--app-line); }
.info-label { font-size: 25rpx; color: var(--app-muted); }
.info-value { font-size: 25rpx; color: var(--app-ink); }
.stat-num { font-size: 40rpx; font-weight: 600; color: var(--app-ink); line-height: 1.2; }
.stat-completed { color: var(--app-accent); }
.stat-pending { color: var(--app-copy); }
.stat-ended { color: var(--app-muted); }
.stat-label { margin-top: 4rpx; font-size: 22rpx; color: var(--app-muted); }
.progress-text { display: block; margin-top: 12rpx; font-size: 23rpx; color: var(--app-muted); text-align: center; }
.progress-entry { margin-top: 24rpx; height: 80rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.progress-entry-text { font-size: 27rpx; font-weight: 600; }
.progress-entry-arrow { margin-left: 8rpx; font-size: 30rpx; }
.state-btn { height: 80rpx; padding: 0 48rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.state-btn-text { font-size: 27rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
