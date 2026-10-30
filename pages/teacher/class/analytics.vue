<template>
  <view class="page">
    <view class="top-bar" :style="teacherTopBarStyle">
      <view class="top-side"><view class="back-hit" @tap="goBack"><text>‹</text></view></view>
      <text class="top-title">学情看板</text>
      <view class="top-side"></view>
    </view>
    <scroll-view class="content" scroll-y :show-scrollbar="false" refresher-enabled @refresherrefresh="refresh">
      <view class="content-inner">
        <view class="identity-line"><view class="mini-avatar">{{ avatarText }}</view><view><text class="teacher-name">{{ teacherName }}</text><text class="class-name">{{ className || '请选择一个管理班级' }}</text></view></view>
        <view v-if="!classId" class="state-card"><text class="state-title">请选择管理班级</text><text class="state-text">学情数据按班级实时计算</text><view class="dark-button" @tap="chooseClass"><text>选择班级</text></view></view>
        <view v-else-if="loading" class="state-card"><text class="state-text">正在加载学习数据…</text></view>
        <view v-else-if="error" class="state-card"><text class="state-text">{{ error }}</text><view v-if="showRetry" class="dark-button" @tap="loadAnalytics"><text>重新加载</text></view><view class="ghost-button" @tap="goBack"><text>返回</text></view></view>
        <template v-else-if="analytics">
          <view class="insight-card">
            <view class="insight-head"><text class="eyebrow">学情看板</text><text class="insight-chip">任务完成分析</text></view>
            <view class="insight-main"><text v-if="analytics.completionRate !== null" class="insight-number">{{ analytics.completionRate }}<text class="insight-unit">%</text></text><text v-else class="insight-number insight-na">—</text><view class="insight-copy"><text>班级任务完成率</text><text>{{ analytics.completionRate === null ? '暂无学生任务数据' : analytics.totalStudentTasks + ' 条学生任务记录' }}</text></view></view>
            <view class="insight-foot"><text>{{ analytics.studentsCompleted }} 人完成过任务</text><text>{{ analytics.studentsActivePending }} 人有待完成任务</text></view>
          </view>

          <view class="section-head"><text class="section-title">学习概览</text><text class="section-note">{{ analytics.totalStudents }} 名学生</text></view>
          <view class="metric-grid"><view class="metric-card"><text class="metric-number">{{ analytics.totalTasks }}</text><text>班级任务</text></view><view class="metric-card"><text class="metric-number">{{ analytics.completedStudentTasks }}</text><text>已完成任务</text></view><view class="metric-card"><text class="metric-number">{{ analytics.activePendingStudentTasks }}</text><text>进行中待完成</text></view></view>

          <view class="section-head"><text class="section-title">任务完成情况</text><text class="section-note">点击查看进度</text></view>
          <view v-if="analytics.taskSummary.length" class="list-card"><view v-for="(task, index) in analytics.taskSummary" :key="task.taskId" class="task-row" :class="{ last: index === analytics.taskSummary.length - 1 }" @tap="goTaskProgress(task)"><view class="task-copy"><text class="task-title">{{ task.title }}</text><text class="task-meta">{{ task.completed }} / {{ task.total }} 人完成 · {{ task.status === 'active' ? '进行中' : '已截止' }}</text><view class="progress-track"><view v-if="task.completionRate !== null" class="progress-fill" :style="{ width: task.completionRate + '%' }"></view></view></view><text v-if="task.completionRate !== null" class="task-rate">{{ task.completionRate }}%</text><text v-else class="task-rate na">—</text></view></view><view v-else class="empty-inline">当前班级还没有任务</view>

          <view class="section-head"><text class="section-title">学生学习状态</text><text class="section-note">状态可重复计入</text></view>
          <view class="status-card"><view class="status-cell"><text>{{ analytics.studentsWithTasks }}</text><label>有任务</label></view><view class="status-cell"><text class="green">{{ analytics.studentsCompleted }}</text><label>已完成</label></view><view class="status-cell"><text>{{ analytics.studentsActivePending }}</text><label>待完成</label></view><view class="status-cell"><text class="muted">{{ analytics.studentsEndedPending }}</text><label>已逾期</label></view></view>

          <view class="section-head"><text class="section-title">学生完成排行</text><text class="section-note">按完成率</text></view>
          <view v-if="analytics.studentRanking.length" class="list-card rank-card"><view v-for="(student, index) in analytics.studentRanking" :key="student.userId" class="rank-row" :class="{ last: index === analytics.studentRanking.length - 1 }" @tap="goStudentDetail(student)"><text class="rank-no">{{ formatRank(index) }}</text><view class="rank-copy"><text>{{ student.nickname }}</text><text>{{ student.completed }} / {{ student.total }} 已完成</text></view><text class="rank-rate">{{ student.rate === null ? '—' : student.rate + '%' }}</text></view></view><view v-else class="empty-inline">暂无学生数据</view>
        </template>
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
    <teacher-tab-bar current="class" :class-id="classId" />
  </view>
</template>

<script>
import TeacherTabBar from '@/components/teacher/TeacherTabBar.vue'
import { getClassAnalytics } from '@/api/teacher/analytics.js'
import * as authApi from '@/api/auth.js'

export default {
  components: { TeacherTabBar },
  data() { return { classId: '', className: '', teacherName: '老师', loading: false, error: '', showRetry: false, analytics: null, loadSeq: 0 } },
  computed: { avatarText() { return (this.teacherName || '老').charAt(0) } },
  onLoad(options) { this.classId = options && options.classId || '' },
  onShow() {
    if (!authApi.requireTeacher()) return
    var user = authApi.getLoginUser() || {}; this.teacherName = user.nickname || '老师'
    if (this.classId) this.loadAnalytics()
  },
  methods: {
    goBack() { if (getCurrentPages().length > 1) uni.navigateBack(); else uni.reLaunch({ url: '/pages/teacher/home' }) },
    chooseClass() { uni.navigateTo({ url: '/pages/teacher/class/index?from=analytics' }) },
    refresh() { var self = this; if (this.classId) this.loadAnalytics(); setTimeout(function () { if (uni.stopPullDownRefresh) uni.stopPullDownRefresh() }, 300); self },
    formatRank(index) { var n = index + 1; return n < 10 ? '0' + n : '' + n },
    goTaskProgress(task) { if (task && task.taskId) uni.navigateTo({ url: '/pages/teacher/task/progress?classId=' + this.classId + '&taskId=' + task.taskId }) },
    goStudentDetail(student) { if (student && student.userId) uni.navigateTo({ url: '/pages/teacher/student/detail?classId=' + this.classId + '&studentId=' + student.userId }) },
    loadAnalytics() {
      var self = this; var seq = ++this.loadSeq; this.loading = true; this.error = ''; this.showRetry = false
      getClassAnalytics(this.classId).then(function (res) {
        if (seq !== self.loadSeq) return
        if (!res || res.code !== 200) { if (res && res.code === 401) { authApi.logout(); uni.reLaunch({ url: '/pages/auth/select' }); return } self.analytics = null; self.error = res && res.message || '学习数据加载失败，请稍后重试'; self.showRetry = !(res && (res.code === 403 || res.code === 404)); self.loading = false; return }
        self.analytics = res.data || null; self.className = self.analytics && self.analytics.classInfo ? self.analytics.classInfo.name : ''; self.loading = false
      }).catch(function () { if (seq !== self.loadSeq) return; self.analytics = null; self.error = '学习数据加载失败，请稍后重试'; self.showRetry = true; self.loading = false })
    }
  }
}
</script>

<style>
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


.top-title { font-size: 34rpx; }
.top-side { width: 160rpx; display: flex; align-items: center; }
.identity-line { display: flex; align-items: center; margin: 8rpx 8rpx 24rpx; }
.mini-avatar { width: 76rpx; height: 76rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%); color: #FFFFFF; font-weight: 600; font-size: 32rpx; }
.identity-line > view:last-child { margin-left: 18rpx; display: flex; flex-direction: column; }
.teacher-name { font-size: 30rpx; font-weight: 600; color: var(--app-ink); }
.class-name { margin-top: 4rpx; color: var(--app-muted); font-size: 23rpx; }
.insight-card {
	position: relative;
	overflow: hidden;
	padding: 32rpx;
	border-radius: var(--app-radius-lg);
	background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
	box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	color: #FFFFFF;
}
.insight-card::before {
	content: '';
	position: absolute;
	left: -10%;
	right: -10%;
	top: -45%;
	height: 80%;
	background: radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, 0.30), rgba(255, 255, 255, 0) 70%);
	pointer-events: none;
}
.insight-card::after {
	content: '';
	position: absolute;
	width: 360rpx;
	height: 360rpx;
	right: -150rpx;
	bottom: -190rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(143, 227, 216, 0.35) 0%, rgba(143, 227, 216, 0) 70%);
	pointer-events: none;
}
.insight-head, .insight-main, .insight-foot { position: relative; z-index: 1; }
.insight-head, .insight-foot { display: flex; align-items: center; justify-content: space-between; }
.eyebrow { color: rgba(255, 255, 255, 0.72); font-size: 25rpx; letter-spacing: 8rpx; }
.insight-chip { padding: 10rpx 20rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.16); border: 1rpx solid rgba(255, 255, 255, 0.22); color: #FFFFFF; font-size: 22rpx; }
.insight-main { margin-top: 24rpx; display: flex; align-items: baseline; }
.insight-number { font-size: 64rpx; font-weight: 600; line-height: 1; }
.insight-unit { font-size: 28rpx; margin-left: 4rpx; }
.insight-na { color: rgba(255, 255, 255, 0.62); }
.insight-copy { margin-left: 20rpx; display: flex; flex-direction: column; color: rgba(255, 255, 255, 0.86); font-size: 26rpx; line-height: 1.5; }
.insight-copy text:last-child { color: rgba(255, 255, 255, 0.62); font-size: 22rpx; }
.insight-foot { margin-top: 24rpx; color: rgba(255, 255, 255, 0.66); font-size: 23rpx; }
.metric-grid { display: flex; }
.metric-card { flex: 1; min-height: 118rpx; margin-right: 16rpx; padding: 18rpx 10rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--app-muted); font-size: 22rpx; }
.metric-card:last-child { margin-right: 0; }
.metric-number { color: var(--app-ink); font-size: 40rpx; line-height: 1.2; font-weight: 600; }
.list-card, .status-card { overflow: hidden; }
.task-row { display: flex; align-items: center; padding: 22rpx 24rpx; border-bottom: 1rpx solid var(--app-line); }
.task-row:last-child { border-bottom: 0; }
.task-copy { flex: 1; min-width: 0; }
.task-title { display: block; font-size: 28rpx; font-weight: 600; line-height: 1.4; color: var(--app-ink); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.task-meta { display: block; margin-top: 4rpx; color: var(--app-muted); font-size: 22rpx; }
.progress-track { height: 10rpx; margin-top: 12rpx; }
.task-rate { width: 88rpx; margin-left: 16rpx; text-align: right; font-size: 24rpx; font-weight: 600; color: var(--app-primary); }
.task-rate.na { color: var(--app-hint); }
.status-card { display: flex; padding: 22rpx 10rpx; }
.status-cell { flex: 1; text-align: center; border-right: 1rpx solid var(--app-line); }
.status-cell:last-child { border-right: 0; }
.status-cell text { display: block; font-size: 36rpx; font-weight: 600; line-height: 1.3; color: var(--app-ink); }
.status-cell label { color: var(--app-muted); font-size: 21rpx; }
.status-cell .green { color: var(--app-positive); }
.status-cell .muted { color: var(--app-hint); }
.rank-row { display: flex; align-items: center; padding: 22rpx 24rpx; border-bottom: 1rpx solid var(--app-line); }
.rank-row:last-child { border-bottom: 0; }
.rank-no { width: 52rpx; color: var(--app-muted); font-size: 25rpx; font-weight: 600; }
.rank-copy { flex: 1; display: flex; flex-direction: column; }
.rank-copy text:first-child { font-size: 28rpx; font-weight: 600; color: var(--app-ink); }
.rank-copy text:last-child { margin-top: 4rpx; color: var(--app-muted); font-size: 22rpx; }
.rank-rate { font-size: 28rpx; font-weight: 600; color: var(--app-primary); }
.empty-inline { padding: 40rpx 20rpx; border-radius: var(--app-radius); background: var(--app-surface-solid); border: 1rpx solid var(--app-line); text-align: center; font-size: 25rpx; color: var(--app-muted); }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
