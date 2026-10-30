<template>
  <view class="page">
    <view class="top-bar" :style="teacherTopBarStyle">
      <view class="top-bar-side"></view>
      <text class="top-title">工作台</text>
      <view class="top-bar-side top-bar-right">
        <view class="logout-hit" hover-class="logout-hit-hover" @tap="confirmLogout"><text>退出</text></view>
      </view>
    </view>

    <scroll-view class="content logout-spaced-content" scroll-y :show-scrollbar="false" refresher-enabled @refresherrefresh="refresh">
      <view class="content-inner">
        <view class="identity">
          <view class="avatar">{{ avatarText }}</view>
          <view class="identity-copy">
            <text class="teacher-name">{{ teacherName }}</text>
            <text class="teacher-meta">{{ identityMeta }}</text>
          </view>
        </view>

        <view v-if="loading" class="state-card"><text class="state-text">正在加载教师工作台…</text></view>
        <view v-else-if="loadError" class="state-card">
          <text class="state-text">加载失败，请检查网络</text>
          <view class="dark-button state-button" @tap="loadHome"><text>重试</text></view>
        </view>
        <template v-else>
          <view class="insight-card" @tap="openAnalytics">
            <view class="insight-head"><text class="eyebrow">学情概览</text><text class="insight-link">查看班级分析 →</text></view>
            <view class="insight-main">
              <text v-if="activeRate !== null" class="insight-number">{{ activeRate }}<text class="insight-unit">%</text></text>
              <text v-else class="insight-number insight-na">—</text>
              <view class="insight-copy"><text>班级任务完成率</text><text>{{ activeRate === null ? '当前还没有学生任务数据' : '按学生任务实时计算' }}</text></view>
            </view>
            <view v-if="activeClass" class="insight-class"><text>{{ activeClass.name }}</text><text>{{ activeClass.studentCount }} 名学生 · {{ activeClass.activeTaskCount }} 个进行中任务</text></view>
            <view v-else class="insight-class"><text>还没有管理班级</text><text>创建班级后，这里会显示真实学习数据</text></view>
            <view class="insight-cta"><text>{{ activeClass ? '进入学情看板' : '管理班级' }} →</text></view>
          </view>

          <view class="section-head"><text class="section-title">工作概览</text><text class="section-note">班级与任务实时统计</text></view>
          <view class="work-grid">
            <view v-for="item in workStats" :key="item.key" class="work-card" @tap="openWork(item.key)">
              <text class="work-number" :class="{ accent: item.accent }">{{ item.value }}</text><text class="work-label">{{ item.label }}</text>
            </view>
          </view>

          <view class="section-head core-head"><text class="section-title">核心功能</text><text class="section-note">常用入口</text></view>
          <view class="core-grid">
            <view v-for="tool in coreTools" :key="tool.key" class="core-card" @tap="openTool(tool.key)">
              <view class="core-icon">{{ tool.mark }}</view><text class="core-title">{{ tool.name }}</text><text class="core-sub">{{ tool.description }}</text>
            </view>
          </view>

          <view v-if="todayLessons.length" class="schedule-strip">
            <view class="section-head schedule-head"><text class="section-title">今日课表</text><text class="section-note" @tap="goTeacherModule('schedule')">查看全部 →</text></view>
            <view v-for="lesson in todayLessons" :key="lesson.id" class="lesson-row"><text class="lesson-time">{{ lesson.startTime || lesson.period || '—' }}</text><text class="lesson-name">{{ lesson.subject }} · {{ lesson.className }}</text><text class="lesson-place">{{ lesson.location || '地点待补充' }}</text></view>
          </view>
        </template>
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
    <teacher-tab-bar current="home" :class-id="activeClassId" />
  </view>
</template>

<script>
import TeacherTabBar from '@/components/teacher/TeacherTabBar.vue'
import { getTeacherHome } from '@/api/teacher/home.js'
import { getTeacherRecords } from '@/api/teacher/workspace.js'
import * as authApi from '@/api/auth.js'
import { goTaskCenter, enterStudentWorkspace } from '@/utils/workspace.js'

export default {
  components: { TeacherTabBar },
  data() {
    return {
      loading: true, loadError: false, teacherName: '老师', classId: '', activeClassId: '',
      classCount: 0, studentCount: 0, classes: [], todayLessons: [],
      coreTools: [
        { key: 'homework', mark: '作', name: '作业管理', description: '发布 / 进度' },
        { key: 'grades', mark: '分', name: '成绩分析', description: '记录 / 趋势' },
        { key: 'students', mark: '生', name: '学生管理', description: '名单 / 关注' },
        { key: 'summary', mark: '汇', name: '工作汇总', description: '教学 / 跟进' },
        { key: 'courseware', mark: '课', name: '我的课件', description: '资料 / 预览' },
        { key: 'conversation', mark: '谈', name: '谈话记录', description: '沟通 / 跟进' }
      ]
    }
  },
  computed: {
    avatarText() { return (this.teacherName || '老').charAt(0) },
    activeClass() { return this.classes.find(function (item) { return item.id === this.activeClassId }.bind(this)) || this.classes[0] || null },
    activeRate() { var item = this.activeClass; return item && item.completionRate !== null && item.completionRate !== undefined ? item.completionRate : null },
    identityMeta() { var cls = this.activeClass; return cls ? cls.name + ' · 教师工作台' : '教师工作台 · 还没有管理班级' },
    workStats() {
      var activeTasks = this.classes.reduce(function (sum, item) { return sum + Number(item.activeTaskCount || 0) }, 0)
      return [{ key: 'homework', value: activeTasks, label: '进行中任务', accent: activeTasks > 0 }, { key: 'class', value: this.classCount, label: '管理班级', accent: false }, { key: 'students', value: this.studentCount, label: '学生总数', accent: false }]
    },
  },
  onLoad(options) { this.classId = options && options.classId || '' },
  onShow() {
    if (!authApi.requireTeacher()) return
    this.loadHome(); this.loadTodaySchedule()
  },
  methods: {
    refresh() { var self = this; this.loadHome(); this.loadTodaySchedule(); setTimeout(function () { if (uni.stopPullDownRefresh) uni.stopPullDownRefresh() }, 300) },
    loadHome() {
      var self = this; this.loading = true; this.loadError = false
      getTeacherHome(this.classId).then(function (res) {
        if (!res || res.code !== 200) {
          if (res && res.code === 401) { self.handleSessionExpired(); return }
          self.loadError = true; return
        }
        var data = res.data || {}; var teacher = data.teacher || {}; var stats = data.statistics || {}
        self.teacherName = teacher.name || '老师'; self.classCount = Number(stats.classCount || 0); self.studentCount = Number(stats.studentCount || 0); self.classes = data.classes || []
        self.activeClassId = self.classId || (self.classes[0] && self.classes[0].id) || ''
      }).catch(function (err) { if (err && err.code === 401) return; self.loadError = true }).then(function () { self.loading = false })
    },
    loadTodaySchedule() {
      var self = this; var date = new Date(); var weekday = date.getDay() || 7; date.setDate(date.getDate() - (date.getDay() + 6) % 7)
      var weekStart = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
      getTeacherRecords('schedule', { weekStart: weekStart }).then(function (items) { var names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']; self.todayLessons = (items || []).filter(function (item) { return Number(item.weekday) === weekday || item.weekday === names[weekday - 1] }).sort(function (a, b) { return String(a.startTime || '').localeCompare(String(b.startTime || '')) }) }).catch(function () { self.todayLessons = [] })
    },
    openAnalytics() { if (this.activeClassId) uni.navigateTo({ url: '/pages/teacher/class/analytics?classId=' + this.activeClassId }); else uni.navigateTo({ url: '/pages/teacher/class/index' }) },
    openWork(key) { if (key === 'homework') { goTaskCenter(); return } if (key === 'class') { uni.navigateTo({ url: '/pages/teacher/class/index' }); return } if (key === 'students') { this.openTool('students') } },
    openTool(key) { uni.navigateTo({ url: '/pages/teacher/module/index?module=' + key }) },
    goTeacherModule(module) { this.openTool(module) },
    confirmLogout() { authApi.logout(); uni.reLaunch({ url: '/pages/auth/select' }) },
    handleSessionExpired() { authApi.logout(); uni.reLaunch({ url: '/pages/auth/select' }) },
    goStudentWorkspace() { enterStudentWorkspace() }
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
.identity { display: flex; align-items: center; margin: 8rpx 8rpx 28rpx; }
.avatar { width: 96rpx; height: 96rpx; font-size: 40rpx; }
.identity-copy { margin-left: 20rpx; display: flex; flex-direction: column; min-width: 0; }
.teacher-name { font-size: 38rpx; line-height: 1.3; font-weight: 600; color: var(--app-ink); }
.teacher-meta { margin-top: 4rpx; color: var(--app-muted); font-size: 25rpx; line-height: 1.4; }
.insight-card {
	position: relative;
	overflow: hidden;
	min-height: 320rpx;
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
	right: -140rpx;
	bottom: -180rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(143, 227, 216, 0.35) 0%, rgba(143, 227, 216, 0) 70%);
	pointer-events: none;
}
.insight-head, .insight-main, .insight-class, .insight-cta { position: relative; z-index: 1; }
.insight-head { display: flex; align-items: center; justify-content: space-between; }
.eyebrow { font-size: 26rpx; letter-spacing: 8rpx; color: rgba(255, 255, 255, 0.72); }
.insight-link { padding: 10rpx 20rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.16); border: 1rpx solid rgba(255, 255, 255, 0.22); color: #FFFFFF; font-size: 23rpx; }
.insight-main { margin-top: 24rpx; display: flex; align-items: baseline; }
.insight-number { font-size: 64rpx; line-height: 1; font-weight: 600; letter-spacing: -1rpx; }
.insight-unit { font-size: 28rpx; margin-left: 4rpx; }
.insight-na { color: rgba(255, 255, 255, 0.62); }
.insight-copy { display: flex; flex-direction: column; margin-left: 20rpx; color: rgba(255, 255, 255, 0.86); font-size: 26rpx; line-height: 1.5; }
.insight-copy text:last-child { color: rgba(255, 255, 255, 0.62); font-size: 23rpx; }
.insight-class { margin-top: 24rpx; display: flex; flex-direction: column; color: rgba(255, 255, 255, 0.66); font-size: 24rpx; line-height: 1.5; }
.insight-class text:first-child { color: rgba(255, 255, 255, 0.88); font-size: 27rpx; }
.insight-cta { position: absolute; right: 32rpx; bottom: 26rpx; padding: 16rpx 26rpx; border-radius: 999rpx; color: var(--app-primary); background: #FFFFFF; font-size: 25rpx; font-weight: 600; }
.work-grid { display: flex; }
.work-card { flex: 1; min-height: 128rpx; margin-right: 16rpx; padding: 20rpx 8rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.work-card:last-child { margin-right: 0; }
.work-number { font-size: 40rpx; line-height: 1.2; font-weight: 600; color: var(--app-ink); }
.work-number.accent { color: var(--app-accent); }
.work-label { margin-top: 6rpx; color: var(--app-muted); font-size: 24rpx; }
.core-grid { display: flex; flex-wrap: wrap; justify-content: space-between; }
.core-card { width: 31.6%; min-height: 176rpx; margin-bottom: 16rpx; padding: 20rpx 8rpx 16rpx; display: flex; flex-direction: column; align-items: center; text-align: center; }
.core-icon { width: 58rpx; height: 58rpx; border-radius: 18rpx; background: var(--app-surface-soft); color: var(--app-primary); display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: 600; }
.core-title { margin-top: 12rpx; font-size: 26rpx; font-weight: 600; line-height: 1.4; color: var(--app-ink); }
.core-sub { margin-top: 4rpx; color: var(--app-muted); font-size: 21rpx; line-height: 1.4; }
.schedule-strip { margin-top: 12rpx; padding: 4rpx 24rpx 10rpx; }
.schedule-head { margin: 22rpx 4rpx 10rpx; }
.lesson-row { min-height: 76rpx; padding: 12rpx 0; border-bottom: 1rpx solid var(--app-line); display: flex; align-items: center; }
.lesson-row:last-child { border-bottom: 0; }
.lesson-time { width: 104rpx; flex-shrink: 0; color: var(--app-muted); font-size: 23rpx; }
.lesson-name { flex: 1; margin-right: 16rpx; font-size: 26rpx; color: var(--app-copy); }
.lesson-place { color: var(--app-hint); font-size: 22rpx; flex-shrink: 0; }
.state-card { margin-top: 20rpx; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
