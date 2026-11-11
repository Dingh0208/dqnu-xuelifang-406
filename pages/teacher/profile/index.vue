<template>
  <view class="page">
    <view class="top-bar" :style="teacherTopBarStyle"><text class="top-title">我的</text><view class="top-action" hover-class="top-action-hover" @tap="confirmLogout"><text>退出登录</text></view></view>
    <scroll-view class="content logout-spaced-content" scroll-y :show-scrollbar="false" refresher-enabled @refresherrefresh="refresh">
      <view class="content-inner">
        <view class="profile-head"><view class="avatar">{{ avatarText }}</view><view class="profile-copy"><text class="profile-name">{{ nickname }}</text><text class="profile-meta">教师工作空间 · 账号 {{ account || '—' }}</text></view></view>
        <view class="badge-row"><text class="badge">教师端</text><text class="badge" v-if="classCount">{{ classCount }} 个管理班级</text><text class="badge" v-else>尚未管理班级</text></view>

        <view v-if="loading" class="state-card"><text>正在加载工作概况…</text></view>
        <view v-else-if="loadError" class="state-card"><text>{{ errorMessage }}</text><text class="retry-link" @tap="loadProfile">重新加载</text></view>
        <template v-else>
          <view class="work-card">
            <view class="work-head"><text class="work-title">本学期工作</text><text class="work-link" @tap="openSummary">工作汇总 →</text></view>
            <view class="work-stats"><view><text class="work-value">{{ classCount }}</text><text class="work-label">管理班级</text></view><view><text class="work-value green">{{ studentCount }}</text><text class="work-label">班级学生</text></view><view><text class="work-value">{{ activeTaskCount }}</text><text class="work-label">进行中任务</text></view></view>
            <text class="work-foot">数据来自当前账号可管理的班级与任务</text>
          </view>

          <view class="section-head"><text class="section-title">班级与教学</text><text class="section-note">常用管理</text></view>
          <view class="entry-list">
            <view class="entry-row" @tap="openClasses"><view class="entry-icon">班</view><text class="entry-title">我的班级</text><text class="entry-detail">{{ classCount }} 个班 · {{ studentCount }} 名学生</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openModule('students')"><view class="entry-icon">生</view><text class="entry-title">学生管理</text><text class="entry-detail">名单 · 分组 · 关注</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openAnalytics"><view class="entry-icon">学</view><text class="entry-title">学情看板</text><text class="entry-detail">任务完成 · 学生状态</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openModule('summary')"><view class="entry-icon">汇</view><text class="entry-title">工作汇总</text><text class="entry-detail">记录数 · 待跟进事项</text><text class="entry-arrow">›</text></view>
          </view>

          <view class="section-head"><text class="section-title">教学工具</text><text class="section-note">记录与资料</text></view>
          <view class="entry-list">
            <view class="entry-row" @tap="openModule('courseware')"><view class="entry-icon">课</view><text class="entry-title">我的课件</text><text class="entry-detail">教学资料</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openModule('conversation')"><view class="entry-icon">谈</view><text class="entry-title">谈话记录</text><text class="entry-detail">沟通与后续跟进</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openModule('memo')"><view class="entry-icon">记</view><text class="entry-title">教师备忘录</text><text class="entry-detail">待办 · 分类 · 置顶</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openModule('activity')"><view class="entry-icon">活</view><text class="entry-title">班级活动</text><text class="entry-detail">发布与活动记录</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="openModule('schedule')"><view class="entry-icon">表</view><text class="entry-title">我的课表</text><text class="entry-detail">每周课程安排</text><text class="entry-arrow">›</text></view>
            <view class="entry-row" @tap="goStudentWorkspace"><view class="entry-icon">切</view><text class="entry-title">返回学生学习空间</text><text class="entry-detail">保持当前登录状态</text><text class="entry-arrow">›</text></view>
          </view>
        </template>
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
    <teacher-tab-bar current="profile" />
  </view>
</template>

<script>
import TeacherTabBar from '@/components/teacher/TeacherTabBar.vue'
import { getTeacherHome } from '@/api/teacher/home.js'
import * as authApi from '@/api/auth.js'
import { enterStudentWorkspace } from '@/utils/workspace.js'

export default {
  components: { TeacherTabBar },
  data() { return { nickname: '老师', account: '', loading: true, loadError: false, errorMessage: '', classCount: 0, studentCount: 0, classes: [] } },
  computed: {
    avatarText() { return (this.nickname || '老').charAt(0) },
    activeTaskCount() { return this.classes.reduce(function (sum, item) { return sum + Number(item.activeTaskCount || 0) }, 0) }
  },
  onShow() {
    if (!authApi.requireTeacher()) return
    var user = authApi.getLoginUser() || {}; this.nickname = user.nickname || '老师'; this.account = user.account || ''
    this.loadProfile()
  },
  methods: {
    refresh() { var self = this; this.loadProfile(); setTimeout(function () { if (uni.stopPullDownRefresh) uni.stopPullDownRefresh() }, 300); self },
    loadProfile() {
      var self = this; this.loading = true; this.loadError = false; this.errorMessage = ''
      getTeacherHome().then(function (res) {
        if (!res || res.code !== 200) { if (res && res.code === 401) { self.handleSessionExpired(); return } self.loadError = true; self.errorMessage = res && res.message || '工作概况加载失败，请稍后重试'; return }
        var data = res.data || {}; var stats = data.statistics || {}; self.classCount = Number(stats.classCount || 0); self.studentCount = Number(stats.studentCount || 0); self.classes = data.classes || []
      }).catch(function (err) { if (err && err.code === 401) return; self.loadError = true; self.errorMessage = '工作概况加载失败，请稍后重试' }).then(function () { self.loading = false })
    },
    handleSessionExpired() { authApi.logout(); uni.reLaunch({ url: '/pages/auth/select' }) },
    openClasses() { uni.navigateTo({ url: '/pages/teacher/class/index' }) },
    openModule(module) { uni.navigateTo({ url: '/pages/teacher/module/index?module=' + module }) },
    openSummary() { this.openModule('summary') },
    openAnalytics() { uni.navigateTo({ url: '/pages/teacher/class/index?from=analytics' }) },
    goStudentWorkspace() { enterStudentWorkspace() },
    confirmLogout() { authApi.logout(); uni.reLaunch({ url: '/pages/auth/select' }) }
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


.top-title { display: none; }
.logout-spaced-content { margin-top: 0; }
.top-action { position: absolute; top: var(--teacher-top-action-top); right: var(--teacher-top-action-right); min-height: 64rpx; padding: 12rpx 22rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.90); border: 1rpx solid var(--app-line); color: var(--app-muted); font-size: 23rpx; }
.top-action-hover { opacity: var(--teacher-hover-opacity); }
.profile-head { margin: 4rpx 8rpx 20rpx; display: flex; align-items: center; }
.avatar { width: 104rpx; height: 104rpx; font-size: 44rpx; }
.profile-copy { margin-left: 20rpx; min-width: 0; display: flex; flex-direction: column; }
.profile-name { font-size: 38rpx; font-weight: 600; line-height: 1.3; color: var(--app-ink); }
.profile-meta { margin-top: 4rpx; color: var(--app-muted); font-size: 23rpx; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge-row { margin: 0 8rpx 24rpx; display: flex; }
.badge + .badge { margin-left: 12rpx; }
.work-card {
	padding: 30rpx;
	border-radius: var(--app-radius-lg);
	background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
	box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	color: #FFFFFF;
}
.work-head { display: flex; align-items: center; justify-content: space-between; }
.work-title { font-size: 28rpx; font-weight: 600; color: #FFFFFF; }
.work-link { padding: 8rpx 18rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.16); border: 1rpx solid rgba(255, 255, 255, 0.22); color: #FFFFFF; font-size: 22rpx; }
.work-stats { margin-top: 24rpx; display: flex; }
.work-stats > view { flex: 1; display: flex; flex-direction: column; align-items: center; }
.work-value { font-size: 40rpx; line-height: 1.2; font-weight: 600; color: #FFFFFF; }
.work-value.green { color: #A9E6DD; }
.work-label { margin-top: 4rpx; color: rgba(255, 255, 255, 0.68); font-size: 22rpx; }
.work-foot { display: block; margin-top: 22rpx; color: rgba(255, 255, 255, 0.62); font-size: 22rpx; }
.entry-list { overflow: hidden; background: var(--app-surface-solid); border: 1rpx solid var(--app-line); border-radius: var(--app-radius); box-shadow: var(--app-shadow-soft); }
.entry-row { display: flex; align-items: center; min-height: 92rpx; padding: 16rpx 20rpx; border-bottom: 1rpx solid var(--app-line); }
.entry-row:last-child { border-bottom: 0; }
.entry-icon { width: 56rpx; height: 56rpx; border-radius: 18rpx; background: var(--app-surface-soft); color: var(--app-primary); display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 600; flex-shrink: 0; }
.entry-title { margin-left: 16rpx; font-size: 27rpx; color: var(--app-ink); font-weight: 500; }
.entry-detail { margin-left: auto; margin-right: 12rpx; color: var(--app-muted); font-size: 22rpx; }
.entry-arrow { color: var(--app-hint); font-size: 30rpx; line-height: 1; }
.state-card { margin-top: 20rpx; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>

