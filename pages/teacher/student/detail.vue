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
			<text class="top-title">学生详情</text>
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
					<view v-if="retryable" class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="loadAll">
						<text class="state-btn-text">重试</text>
					</view>
					<view class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="goBack">
						<text class="state-btn-text">返回</text>
					</view>
				</view>

				<template v-else-if="student">
					<!-- 学生基本信息卡 -->
					<view class="profile-card">
						<view class="avatar">
							<text class="avatar-text">{{ avatarText }}</text>
						</view>
						<view class="profile-info">
							<view class="name-row">
								<text class="student-name">{{ student.nickname }}</text>
								<text class="role-badge">{{ roleText }}</text>
							</view>
							<text class="joined-text">加入班级：{{ student.joinedAt || '—' }}</text>
						</view>
					</view>

					<!-- 任务统计卡 -->
					<view class="stats-card">
						<text class="section-title">班级任务完成情况</text>
						<view class="stats-grid">
							<view class="stat-cell">
								<text class="stat-num">{{ stats.total }}</text>
								<text class="stat-label">任务总数</text>
							</view>
							<view class="stat-cell">
								<text class="stat-num stat-done">{{ stats.completed }}</text>
								<text class="stat-label">已完成</text>
							</view>
							<view class="stat-cell">
								<text class="stat-num stat-active">{{ stats.activePending }}</text>
								<text class="stat-label">进行中</text>
							</view>
							<view class="stat-cell">
								<text class="stat-num stat-ended">{{ stats.endedPending }}</text>
								<text class="stat-label">已过期</text>
							</view>
						</view>

						<!-- 有任务：完成率；无任务：空状态（不显示虚假 0%） -->
						<template v-if="stats.total > 0">
							<view class="rate-line">
								<text class="rate-label">完成率</text>
								<text class="rate-num">{{ stats.rate }}%</text>
							</view>
							<view class="progress-bar">
								<view class="progress-fill" :style="{ width: stats.rate + '%' }"></view>
							</view>
							<text v-if="lastCompletedAt" class="last-time">最近完成：{{ lastCompletedAt }}</text>
						</template>
						<view v-else class="empty-block">
							<text class="empty-text">暂无任务数据</text>
						</view>
					</view>

					<!-- 任务明细 -->
					<template v-if="taskList.length > 0">
						<text class="list-title">任务明细</text>
						<view class="task-card">
							<view
								v-for="(t, idx) in taskList"
								:key="t.taskId"
								class="task-row"
								:class="{ 'task-row-last': idx === taskList.length - 1 }"
							>
								<view class="task-main">
									<text class="task-name">{{ t.title }}</text>
									<text class="task-deadline">截止：{{ t.deadline }}</text>
								</view>
								<view class="task-side">
									<text
										class="task-status"
										:class="t.status === 'completed'
											? 'status-done'
											: (t.taskStatus === 'ended' ? 'status-ended' : 'status-active')"
									>{{ statusText(t) }}</text>
									<text v-if="t.status === 'completed' && t.completedAt" class="task-time">{{ t.completedAt }}</text>
								</view>
							</view>
						</view>
					</template>
				</template>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getStudentDetail, getStudentAnalytics } from '@/api/teacher/student.js'
	import * as authApi from '@/api/auth.js'

	export default {
		data() {
			return {
				classId: '',
				studentId: '',
				loading: true,
				loadError: false,
				retryable: true,
				errorMessage: '',
				student: null,
				classInfo: {},
				stats: { total: 0, completed: 0, activePending: 0, endedPending: 0, rate: 0 },
				taskList: [],
				lastCompletedAt: null
			}
		},
		computed: {
			avatarText() {
				return this.student && this.student.nickname ? this.student.nickname.charAt(0) : '?'
			},
			roleText() {
				// 学生详情恒为班级 MEMBER 学生身份（双身份用户进入此页也按学生身份展示）
				return this.student && this.student.role === 'MEMBER' ? '学生' : '成员'
			}
		},
		onLoad(options) {
			this.classId = (options && options.classId) || ''
			this.studentId = (options && options.studentId) || ''
		},
		onShow() {
			if (!authApi.requireTeacher()) return
			this.loadAll()
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			statusText(t) {
				// 学生完成状态来自 StudentTask；任务状态来自 Task，均为接口真实数据
				if (t.status === 'completed') return '已完成'
				return t.taskStatus === 'ended' ? '已截止 · 未完成' : '进行中 · 未完成'
			},
			handleError(res, fallbackMsg) {
				if (res && res.code === 401) {
					authApi.logout()
					uni.reLaunch({ url: '/pages/auth/select' })
					return true
				}
				this.retryable = !res || (res.code !== 403 && res.code !== 404)
				this.loadError = true
				this.errorMessage = (res && res.message) || fallbackMsg
				this.loading = false
				return true
			},
			loadAll() {
				var self = this
				if (!this.classId || !this.studentId) {
					this.loading = false
					this.loadError = true
					this.retryable = false
					this.errorMessage = '学生信息不存在'
					return
				}
				this.loading = true
				this.loadError = false

				Promise.all([
					getStudentDetail(this.classId, this.studentId),
					getStudentAnalytics(this.classId, this.studentId)
				]).then(function (results) {
					var detailRes = results[0]
					var analyticsRes = results[1]
					if (!detailRes || detailRes.code !== 200) {
						self.handleError(detailRes, '加载失败，请稍后重试')
						return
					}
					if (!analyticsRes || analyticsRes.code !== 200) {
						self.handleError(analyticsRes, '加载失败，请稍后重试')
						return
					}
					var d = detailRes.data || {}
					var a = analyticsRes.data || {}
					self.student = d.student || null
					self.classInfo = d.classInfo || {}
					self.stats = a.stats || { total: 0, completed: 0, activePending: 0, endedPending: 0, rate: 0 }
					self.taskList = a.tasks || []
					self.lastCompletedAt = a.lastCompletedAt || null
					self.loading = false
				}).catch(function () {
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

	/* 学生基本信息卡 */
	.profile-card {
		background-color: var(--teacher-card-bg); border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border); box-shadow: var(--teacher-card-shadow);
		padding: 32rpx; display: flex; align-items: center;
	}
	.avatar {
		width: 96rpx; height: 96rpx; border-radius: 50%;
		background-color: var(--teacher-tint-bg);
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}
	.avatar-text { font-size: 40rpx; font-weight: 600; color: var(--teacher-secondary); }
	.profile-info { flex: 1; margin-left: 24rpx; display: flex; flex-direction: column; }
	.name-row { display: flex; align-items: center; }
	.student-name { font-size: 34rpx; font-weight: 600; color: var(--teacher-text); line-height: 48rpx; }
	.role-badge {
		margin-left: 16rpx; font-size: 22rpx; color: var(--teacher-accent);
		background-color: var(--teacher-tint-bg); border-radius: 100rpx;
		padding: 4rpx 16rpx;
	}
	.joined-text { margin-top: 8rpx; font-size: 24rpx; color: var(--teacher-text-muted); }

	/* 统计卡 */
	.stats-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg); border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border); box-shadow: var(--teacher-card-shadow);
		padding: 32rpx;
	}
	.section-title { font-size: 28rpx; font-weight: 600; color: var(--teacher-text); }
	.stats-grid { margin-top: 24rpx; display: flex; justify-content: space-between; }
	.stat-cell { display: flex; flex-direction: column; align-items: center; }
	.stat-num { font-size: 40rpx; font-weight: 600; color: var(--teacher-text); line-height: 56rpx; }
	.stat-done { color: var(--teacher-accent); }
	.stat-active { color: var(--teacher-text); }
	.stat-ended { color: var(--teacher-text-muted); }
	.stat-label { margin-top: 4rpx; font-size: 22rpx; color: var(--teacher-text-muted); }

	.rate-line { margin-top: 28rpx; display: flex; align-items: baseline; justify-content: space-between; }
	.rate-label { font-size: 26rpx; color: var(--teacher-text-secondary); }
	.rate-num { font-size: 36rpx; font-weight: 700; color: var(--teacher-accent); line-height: 1; }
	.progress-bar {
		margin-top: 16rpx; height: 12rpx; background-color: var(--teacher-track);
		border-radius: 100rpx; overflow: hidden;
	}
	.progress-fill { height: 100%; background-color: var(--teacher-accent); border-radius: 100rpx; transition: width 0.6s ease; }
	.last-time { display: block; margin-top: 16rpx; font-size: 22rpx; color: var(--teacher-text-muted); text-align: right; }

	.empty-block { margin-top: 28rpx; padding: 24rpx 0; display: flex; justify-content: center; }
	.empty-text { font-size: 26rpx; color: var(--teacher-text-muted); }

	/* 任务明细 */
	.list-title { display: block; margin: 32rpx 8rpx 16rpx; font-size: 28rpx; font-weight: 600; color: var(--teacher-text); }
	.task-card {
		background-color: var(--teacher-card-bg); border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border); box-shadow: var(--teacher-card-shadow);
		padding: 8rpx 32rpx;
	}
	.task-row {
		display: flex; align-items: center; justify-content: space-between;
		padding: 24rpx 0; border-bottom: 1rpx solid var(--teacher-divider);
	}
	.task-row-last { border-bottom: none; }
	.task-main { flex: 1; display: flex; flex-direction: column; padding-right: 24rpx; }
	.task-name { font-size: 28rpx; font-weight: 500; color: var(--teacher-text); line-height: 40rpx; }
	.task-deadline { margin-top: 6rpx; font-size: 22rpx; color: var(--teacher-text-muted); }
	.task-side { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; }
	.task-status { font-size: 24rpx; font-weight: 500; padding: 4rpx 16rpx; border-radius: 100rpx; }
	.status-done { color: var(--teacher-accent); background-color: var(--teacher-tint-bg); }
	.status-active { color: var(--teacher-text-secondary); background-color: var(--teacher-track); }
	.status-ended { color: var(--teacher-text-muted); background-color: var(--teacher-track); }
	.task-time { margin-top: 8rpx; font-size: 22rpx; color: var(--teacher-text-muted); }


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


.profile-card { padding: 28rpx; display: flex; align-items: center; }
.avatar { width: 96rpx; height: 96rpx; }
.avatar-text { font-size: 38rpx; }
.profile-info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; }
.student-name { font-size: 34rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; }
.joined-text { margin-top: 6rpx; font-size: 23rpx; color: var(--app-muted); }
.stats-card { padding: 28rpx; }
.stats-grid { margin-top: 20rpx; display: flex; justify-content: space-between; }
.stat-num { font-size: 40rpx; font-weight: 600; color: var(--app-ink); line-height: 1.2; }
.stat-done { color: var(--app-accent); }
.stat-active { color: var(--app-ink); }
.stat-ended { color: var(--app-muted); }
.stat-label { margin-top: 4rpx; font-size: 22rpx; color: var(--app-muted); }
.rate-line { margin-top: 22rpx; display: flex; align-items: baseline; justify-content: space-between; }
.rate-label { font-size: 25rpx; color: var(--app-muted); }
.rate-num { font-size: 44rpx; font-weight: 600; color: var(--app-primary); line-height: 1; }
.last-time { display: block; margin-top: 10rpx; font-size: 22rpx; color: var(--app-muted); text-align: right; }
.empty-block { margin-top: 22rpx; padding: 20rpx 0; display: flex; justify-content: center; }
.list-title { display: block; margin: 28rpx 4rpx 12rpx; font-size: 30rpx; font-weight: 600; color: var(--app-ink); }
.task-card { padding: 8rpx 24rpx; }
.task-row { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid var(--app-line); }
.task-row:last-child { border-bottom: 0; }
.task-name { font-size: 27rpx; font-weight: 500; color: var(--app-ink); line-height: 1.4; }
.task-deadline { margin-top: 4rpx; font-size: 22rpx; color: var(--app-muted); }
.task-status { font-size: 22rpx; font-weight: 500; padding: 4rpx 14rpx; border-radius: 999rpx; }
.status-done { color: var(--app-positive); background: var(--app-positive-bg); }
.status-active { color: var(--app-copy); background: var(--teacher-track); }
.status-ended { color: var(--app-muted); background: var(--teacher-track); }
.task-time { margin-top: 6rpx; font-size: 22rpx; color: var(--app-muted); }
.state-btn { height: 80rpx; padding: 0 48rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.state-btn-text { font-size: 27rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
