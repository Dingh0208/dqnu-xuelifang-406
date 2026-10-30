<template>
  <view class="page">
    <view class="top-bar" :style="teacherTopBarStyle">
      <view class="top-bar-side"></view>
      <text class="top-title">作业</text>
      <view class="top-bar-side top-bar-right">
        <view class="add-hit" hover-class="add-hit-hover" :hover-stay-time="80" @tap="goCreateTask"><text class="add-text">+ 布置作业</text></view>
      </view>
    </view>

    <scroll-view class="content top-action-spaced-content" scroll-y :show-scrollbar="false" refresher-enabled @refresherrefresh="refresh">
      <view class="content-inner">
        <view class="page-heading">
          <text class="page-title">作业</text>
          <text class="page-subtitle">{{ groups.length ? groups.length + ' 个管理班级 · ' + totalTasks + ' 项任务' : '管理各班已发布的教学任务' }}</text>
        </view>

        <view class="filter-row">
          <view v-for="item in filters" :key="item.key" class="filter-chip" :class="{ selected: filter === item.key }" @tap="filter = item.key">
            <text>{{ item.label }}</text><text class="filter-count">{{ item.count }}</text>
          </view>
        </view>

        <view v-if="loading" class="state-card"><text class="state-text">正在加载作业…</text></view>
        <view v-else-if="loadError" class="state-card">
          <text class="state-text">{{ errorMessage }}</text>
          <view class="dark-button" @tap="load"><text>重试</text></view>
        </view>
        <template v-else>
          <view v-if="groups.length === 0" class="state-card">
            <text class="state-title">还没有管理的班级</text>
            <text class="state-text">创建班级后，可以在这里布置和查看作业任务。</text>
            <view class="dark-button" @tap="goCreateClass"><text>创建班级</text></view>
          </view>
          <template v-else>
            <view class="summary-grid">
              <view class="summary-card"><text class="summary-number">{{ totalTasks }}</text><text class="summary-label">全部任务</text></view>
              <view class="summary-card"><text class="summary-number">{{ activeTasks }}</text><text class="summary-label">进行中</text></view>
              <view class="summary-card"><text class="summary-number muted">{{ endedTasks }}</text><text class="summary-label">已截止</text></view>
            </view>

            <view v-if="visibleGroups.length" class="group-list">
              <view v-for="group in visibleGroups" :key="group.classId" class="group-block">
                <view class="section-head"><text class="section-title">{{ group.className }}</text><text class="section-note">{{ group.tasks.length }} 项任务</text></view>
                <view class="task-list">
                  <view v-for="task in group.tasks" :key="task.id" class="task-card" hover-class="task-card-hover" :hover-stay-time="80" @tap="goDetail(group, task)">
                    <view class="task-head">
                      <text class="task-title">{{ task.title }}</text>
                      <text class="task-status" :class="effectiveStatus(task) === 'active' ? 'status-active' : 'status-ended'">{{ effectiveStatus(task) === 'active' ? '进行中' : '已截止' }}</text>
                    </view>
                    <text v-if="task.description" class="task-description">{{ task.description }}</text>
                    <view class="task-foot"><text>截止 {{ task.deadline || '未设置' }}</text><text>查看详情 ›</text></view>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="state-card"><text class="state-text">{{ filter === 'all' ? '暂无作业任务' : '当前筛选下暂无任务' }}</text></view>
          </template>
        </template>
        <view class="bottom-space"></view>
      </view>
    </scroll-view>
    <teacher-tab-bar current="teaching" />
  </view>
</template>

<script>
import TeacherTabBar from '@/components/teacher/TeacherTabBar.vue'
import { goAssignTask, fetchManagedClasses } from '@/utils/workspace.js'
import { getClassTasks } from '@/api/teacher/task.js'
import { getEffectiveTaskStatus } from '@/utils/taskLifecycle.js'
import * as authApi from '@/api/auth.js'

export default {
  components: { TeacherTabBar },
  data() {
    return {
      loading: true,
      loadError: false,
      errorMessage: '',
      groups: [],
      filter: 'all',
      filters: [
        { key: 'all', label: '全部', count: 0 },
        { key: 'active', label: '进行中', count: 0 },
        { key: 'ended', label: '已截止', count: 0 }
      ],
      // Keep the complete teacher-tool registry in one place so dashboard
      // shortcuts and this workspace continue to use the same module keys.
      moduleEntries: [
        { key: 'memo', label: '教师备忘录' },
        { key: 'activity', label: '班级活动' },
        { key: 'summary', label: '工作汇总' },
        { key: 'conversation', label: '谈话记录' },
        { key: 'courseware', label: '我的课件' },
        { key: 'schedule', label: '我的课表' },
        { key: 'grades', label: '成绩分析' },
        { key: 'students', label: '学生管理' },
        { key: 'homework', label: '作业管理' }
      ]
    }
  },
  computed: {
    totalTasks() { return this.groups.reduce(function (sum, group) { return sum + group.tasks.length }, 0) },
    activeTasks() {
      var self = this
      return this.groups.reduce(function (sum, group) {
        return sum + group.tasks.filter(function (task) { return self.effectiveStatus(task) === 'active' }).length
      }, 0)
    },
    endedTasks() { return this.totalTasks - this.activeTasks },
    visibleGroups() {
      var self = this
      if (self.filter === 'all') return self.groups
      return self.groups.map(function (group) {
        return {
          classId: group.classId,
          className: group.className,
          tasks: group.tasks.filter(function (task) { return self.effectiveStatus(task) === self.filter })
        }
      }).filter(function (group) { return group.tasks.length > 0 })
    }
  },
  onShow() {
    if (!authApi.requireTeacher()) return
    this.load()
  },
  methods: {
    effectiveStatus(task) { return getEffectiveTaskStatus(task) },
    refresh() {
      var self = this
      this.load()
      setTimeout(function () { if (uni.stopPullDownRefresh) uni.stopPullDownRefresh() }, 300)
      return self
    },
    handleSessionExpired() {
      this.loading = false
      authApi.logout()
      uni.reLaunch({ url: '/pages/auth/select' })
    },
    load() {
      var self = this
      this.loading = true
      this.loadError = false
      this.errorMessage = ''
      fetchManagedClasses().then(function (classes) {
        if (!classes || classes.length === 0) {
          self.groups = []
          self.updateFilterCounts()
          self.loading = false
          return
        }
        var requests = classes.map(function (item) {
          return getClassTasks(item.id).then(function (res) {
            if (res && res.code === 401) {
              self.handleSessionExpired()
              throw new Error('401')
            }
            if (!res || res.code !== 200) return null
            return {
              classId: item.id,
              className: res.data && res.data.classInfo && res.data.classInfo.name || item.name,
              tasks: res.data && res.data.tasks || []
            }
          })
        })
        Promise.all(requests).then(function (results) {
          self.groups = results.filter(function (group) { return !!group })
          if (!self.groups.length) {
            self.loadError = true
            self.errorMessage = '作业加载失败，请稍后重试'
          }
          self.updateFilterCounts()
          self.loading = false
        }).catch(function (err) {
          if (err && err.message === '401') return
          self.loading = false
          self.loadError = true
          self.errorMessage = '作业加载失败，请检查网络后重试'
        })
      }).catch(function () {
        self.loading = false
        self.loadError = true
        self.errorMessage = '班级信息加载失败，请稍后重试'
      })
    },
    updateFilterCounts() {
      var self = this
      var all = 0
      var active = 0
      var ended = 0
      this.groups.forEach(function (group) {
        group.tasks.forEach(function (task) {
          all++
          if (self.effectiveStatus(task) === 'active') active++
          else ended++
        })
      })
      this.filters = [
        { key: 'all', label: '全部', count: all },
        { key: 'active', label: '进行中', count: active },
        { key: 'ended', label: '已截止', count: ended }
      ]
    },
    goCreateTask() { goAssignTask() },
    goCreateClass() { uni.navigateTo({ url: '/pages/teacher/class/create' }) },
    goDetail(group, task) {
      uni.navigateTo({ url: '/pages/teacher/task/detail?classId=' + group.classId + '&taskId=' + task.id })
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


.top-title { display: none; }
.top-action-spaced-content { margin-top: 0; }
.add-hit { min-height: 64rpx; padding: 0 24rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.add-text { font-size: 24rpx; font-weight: 600; white-space: nowrap; }
.page-heading { margin: 0 4rpx 22rpx; display: flex; flex-direction: column; }
.page-title { font-size: 38rpx; line-height: 1.35; font-weight: 600; color: var(--app-ink); }
.page-subtitle { margin-top: 4rpx; color: var(--app-muted); font-size: 24rpx; line-height: 1.4; }
.filter-row { display: flex; margin-bottom: 20rpx; }
.filter-chip { min-height: 64rpx; padding: 0 22rpx; margin-right: 12rpx; display: flex; align-items: center; border: 1rpx solid var(--app-line); border-radius: 999rpx; background: rgba(255, 255, 255, 0.90); color: var(--app-copy); font-size: 24rpx; font-weight: 500; }
.filter-chip:last-child { margin-right: 0; }
.filter-chip.selected { background: var(--app-primary); border-color: var(--app-primary); color: #FFFFFF; }
.filter-count { margin-left: 8rpx; opacity: 0.72; }
.summary-grid { display: flex; margin-bottom: 24rpx; }
.summary-card { flex: 1; min-height: 112rpx; margin-right: 16rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.summary-card:last-child { margin-right: 0; }
.summary-number { font-size: 40rpx; line-height: 1.2; font-weight: 600; color: var(--app-ink); }
.summary-number.muted { color: var(--app-muted); }
.summary-label { margin-top: 4rpx; color: var(--app-muted); font-size: 22rpx; }
.group-block { margin-bottom: 26rpx; }
.group-block:last-child { margin-bottom: 0; }
.section-head { margin: 0 4rpx 12rpx; }
.section-title { font-size: 32rpx; }
.task-list { overflow: hidden; background: var(--app-surface-solid); border: 1rpx solid var(--app-line); border-radius: var(--app-radius); box-shadow: var(--app-shadow-soft); }
.task-card { padding: 22rpx 24rpx; border-bottom: 1rpx solid var(--app-line); }
.task-card:last-child { border-bottom: 0; }
.task-card-hover { background: var(--app-surface-soft); }
.task-head { display: flex; align-items: center; justify-content: space-between; }
.task-title { flex: 1; min-width: 0; font-size: 28rpx; line-height: 1.4; font-weight: 600; color: var(--app-ink); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.task-status { margin-left: 14rpx; }
.task-description { display: block; margin-top: 8rpx; color: var(--app-muted); font-size: 23rpx; line-height: 1.5; }
.task-foot { display: flex; justify-content: space-between; margin-top: 12rpx; color: var(--app-muted); font-size: 22rpx; }
.state-card { margin-top: 20rpx; padding: 52rpx 24rpx; text-align: center; }
.state-title { display: block; font-size: 30rpx; font-weight: 600; color: var(--app-ink); }
.state-text { display: block; margin-top: 8rpx; color: var(--app-muted); font-size: 25rpx; line-height: 1.5; }
.dark-button { width: 230rpx; margin: 24rpx auto 0; padding: 16rpx 0; border-radius: 999rpx; font-size: 25rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
