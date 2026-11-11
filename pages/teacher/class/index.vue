<template>
	<!-- 教师班级中心：清透冷白青绿背景；管理班级列表 + 创建入口 + 加载/空/错误态 -->
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
			<text class="top-title">班级中心</text>
			<view class="top-bar-side top-bar-right"></view>
		</view>

		<scroll-view class="content" scroll-y="true" :show-scrollbar="false">
			<view class="content-inner">
				<!-- 加载中 -->
				<view v-if="loading" class="state-card">
					<text class="state-text">加载中…</text>
				</view>

				<!-- 错误 -->
				<view v-else-if="loadError" class="state-card">
					<text class="state-text">{{ errorMessage }}</text>
					<view class="state-btn" hover-class="state-btn-hover" :hover-stay-time="80" @tap="load">
						<text class="state-btn-text">重试</text>
					</view>
				</view>

				<template v-else>
					<!-- 空状态：无管理班级 -->
					<view v-if="classes.length === 0" class="empty-card">
						<text class="empty-title">还没有管理的班级</text>
						<text class="empty-sub">创建一个新的班级，开始你的教学管理</text>
						<view class="empty-btn" hover-class="empty-btn-hover" :hover-stay-time="80" @tap="goCreate">
							<text class="empty-btn-text">创建班级</text>
						</view>
					</view>

					<!-- 班级列表（仅展示当前用户 ACTIVE ADMIN 的班级） -->
					<view v-else class="class-list">
						<view
							v-for="(cls, idx) in classes"
							:key="cls.id"
							class="class-card"
							:class="{ 'class-card-last': idx === classes.length - 1 }"
							hover-class="class-card-hover"
							:hover-stay-time="80"
							@tap="onTapClass(cls)"
						>
							<view class="class-main">
								<text class="class-name">{{ cls.name }}</text>
								<text v-if="cls.goal" class="class-goal">{{ cls.goal }}</text>
							</view>
							<view class="class-meta">
								<text class="class-count">{{ cls.memberCount === null ? '人数暂不可用' : cls.memberCount + ' 名学生' }}</text>
								<text class="class-status" :class="{ 'class-status-off': cls.status !== 'ACTIVE' }">
									{{ cls.status === 'ACTIVE' ? '正常' : cls.status }}
								</text>
								<text class="class-arrow">›</text>
							</view>
						</view>
					</view>

					<!-- 创建入口（有班级时附在列表底部） -->
					<view v-if="classes.length > 0" class="create-entry" hover-class="create-entry-hover" :hover-stay-time="80" @tap="goCreate">
						<text class="create-entry-text">+ 创建新班级</text>
					</view>
				</template>
			</view>
		</scroll-view>

		<!-- 班级为主 Tab：展示统一教师底部导航（班级详情/成员/分析/创建班级等子页面不渲染） -->
		<teacher-tab-bar current="class" />
	</view>
</template>

<script>
	import TeacherTabBar from '@/components/teacher/TeacherTabBar.vue'
	import { fetchManagedClasses } from '@/utils/workspace.js'
	import { getClassMembers } from '@/api/class.js'
	import * as authApi from '@/api/auth.js'

	export default {
		components: { TeacherTabBar },
		data() {
			return {
				loading: true,
				loadError: false,
				errorMessage: '',
				classes: [],
				// from=assign：从「布置任务」入口进入，需选择目标班级后跳转任务创建页
				from: ''
			}
		},
		onLoad(options) {
			this.from = (options && options.from) || ''
		},
		onShow() {
			// 登录守卫（三端共用）：未登录清栈回身份选择页，不加载数据
			if (!authApi.requireTeacher()) return
			this.load()
		},
		methods: {
			// 返回：若有上一页则回退（如从首页「全部班级」进入），否则回到教师首页（如从 TabBar 进入）
			goBack() {
				var pages = getCurrentPages()
				if (pages && pages.length > 1) uni.navigateBack()
				else uni.reLaunch({ url: '/pages/teacher/home' })
			},
			// 登录态失效（Mock 401）：清登录态并回身份选择页，与 request.js 401 单点一致
			handleSessionExpired() {
				this.loading = false
				authApi.logout()
				uni.reLaunch({ url: '/pages/auth/select' })
			},
			// 加载管理班级列表 + 每班真实 ACTIVE MEMBER 数
			load() {
				var self = this
				this.loading = true
				this.loadError = false
				// fetchManagedClasses 仅返回当前用户 ACTIVE ADMIN 的 Class（已过滤，支持多班级）
				fetchManagedClasses()
					.then(function (list) {
						if (!list || list.length === 0) {
							self.loading = false
							self.classes = []
							return
						}
						// 并行获取每班真实 ACTIVE MEMBER 数（聚合口径：getClassMembers.classInfo.memberCount），
						// 不使用 Class.memberCount 冗余字段，避免展示与真实成员不一致的伪数据
						var tasks = list.map(function (cls) {
							return getClassMembers(cls.id)
								.then(function (res) {
									if (res && res.code === 401) {
										self.handleSessionExpired()
										throw new Error('401')
									}
									var realCount = res && res.code === 200 && res.data && res.data.classInfo
										? res.data.classInfo.memberCount
										: null
									return {
										id: cls.id,
										name: cls.name,
										goal: cls.goal || '',
										status: cls.status || 'ACTIVE',
										memberCount: typeof realCount === 'number' ? realCount : null
									}
								})
								.catch(function (err) {
									if (err && err.message === '401') throw err
									return {
										id: cls.id,
										name: cls.name,
										goal: cls.goal || '',
										status: cls.status || 'ACTIVE',
										memberCount: null
									}
								})
						})
						Promise.all(tasks)
							.then(function (items) {
								self.classes = items
								self.loading = false
							})
							.catch(function () {
								// 多为 401 触发（已 reLaunch），此处仅兜底
								self.loading = false
								self.loadError = true
								self.errorMessage = '加载失败，请稍后重试'
							})
					})
					.catch(function () {
						self.loading = false
						self.loadError = true
						self.errorMessage = '网络异常，请稍后重试'
					})
			},
			// 点击班级卡片：布置任务来源 → 任务创建；任务选择来源 → 任务列表；普通来源 → 班级详情
			onTapClass(cls) {
				if (!cls || !cls.id) return
				if (this.from === 'assign') {
					// 来自「布置任务」：进入该班任务创建页（携带 from=assign，供创建成功后跳转任务列表）
					uni.navigateTo({ url: '/pages/teacher/task/create?classId=' + cls.id + '&from=assign' })
				} else if (this.from === 'task') {
					// 来自「任务」入口选择：进入该班任务列表
					uni.navigateTo({ url: '/pages/teacher/task/index?classId=' + cls.id })
				} else if (this.from === 'analytics') {
					// 学情 Tab 需要真实 classId；由用户先选择班级，不替用户猜测
					uni.redirectTo({ url: '/pages/teacher/class/analytics?classId=' + cls.id })
				} else {
					uni.navigateTo({ url: '/pages/teacher/class/detail?classId=' + cls.id })
				}
			},
			// 创建班级：真实跳转创建页（已有 pages/teacher/class/create）
			goCreate() {
				uni.navigateTo({ url: '/pages/teacher/class/create' })
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

	/* ---------- 顶部导航 ---------- */
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

	.top-bar-side {
		width: 160rpx;
		display: flex;
		align-items: center;
	}

	.top-bar-right {
		justify-content: flex-end;
	}

	.back-hit {
		height: 88rpx;
		display: flex;
		align-items: center;
	}

	.back-hit-hover {
		opacity: var(--teacher-hover-opacity);
	}

	.back-icon {
		font-size: 56rpx;
		color: var(--teacher-text);
		line-height: 1;
	}

	.top-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: 500;
		color: var(--teacher-text);
		line-height: 48rpx;
	}

	/* ---------- 内容区 ---------- */
	.content {
		flex: 1;
		min-height: 0;
		position: relative;
		z-index: 1;
		background: var(--teacher-transparent);
	}

	.content-inner {
		/* 底部留白保留原设计 48rpx；Home Indicator 安全区已由下方 TeacherTabBar 提供，此处不再叠加 */
		padding: 32rpx var(--teacher-page-padding) 48rpx;
		background: var(--teacher-transparent);
	}

	/* 状态卡 */
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

	.state-text {
		font-size: 28rpx;
		color: var(--teacher-text-secondary);
		line-height: 40rpx;
		text-align: center;
	}

	.state-btn {
		margin-top: 32rpx;
		height: 72rpx;
		padding: 0 56rpx;
		border-radius: var(--teacher-btn-radius);
		background: var(--teacher-btn-primary-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.state-btn-hover {
		opacity: var(--teacher-hover-opacity);
	}

	.state-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: var(--teacher-btn-primary-text);
	}

	/* 空状态 */
	.empty-card {
		margin-top: 80rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 72rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.empty-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--teacher-text);
		line-height: 48rpx;
	}

	.empty-sub {
		margin-top: 16rpx;
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
		line-height: 40rpx;
		text-align: center;
	}

	.empty-btn {
		margin-top: 40rpx;
		height: 80rpx;
		padding: 0 64rpx;
		border-radius: var(--teacher-btn-radius);
		background: var(--teacher-btn-primary-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-btn-hover {
		opacity: var(--teacher-hover-opacity);
	}

	.empty-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: var(--teacher-btn-primary-text);
	}

	/* 班级列表 */
	.class-list {
		display: flex;
		flex-direction: column;
	}

	.class-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx;
		margin-bottom: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		box-sizing: border-box;
	}

	.class-card-last {
		margin-bottom: 0;
	}

	.class-card-hover {
		background-color: var(--teacher-divider-soft);
	}

	.class-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.class-name {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--teacher-text);
		line-height: 48rpx;
	}

	.class-goal {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: var(--teacher-text-secondary);
		line-height: 34rpx;
	}

	.class-meta {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		margin-left: 24rpx;
	}

	.class-count {
		font-size: 24rpx;
		color: var(--teacher-text-secondary);
	}

	.class-status {
		margin-left: 16rpx;
		font-size: 22rpx;
		color: var(--teacher-accent);
		font-weight: 500;
	}

	.class-status-off {
		color: var(--teacher-text-muted);
	}

	.class-arrow {
		margin-left: 16rpx;
		font-size: 32rpx;
		color: var(--teacher-text-muted);
		line-height: 1;
	}

	/* 创建入口 */
	.create-entry {
		margin-top: 24rpx;
		height: 88rpx;
		border-radius: var(--teacher-radius-card);
		border: 1rpx dashed var(--teacher-card-border);
		background-color: var(--teacher-card-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.create-entry-hover {
		background-color: var(--teacher-divider-soft);
	}

	.create-entry-text {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--teacher-accent);
	}


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


.class-name { font-size: 34rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; }
.class-goal { margin-top: 6rpx; font-size: 24rpx; color: var(--app-muted); line-height: 1.4; }
.class-count { font-size: 23rpx; color: var(--app-muted); }
.class-status { margin-left: 12rpx; padding: 4rpx 14rpx; }
.class-arrow { margin-left: 10rpx; font-size: 30rpx; color: var(--app-hint); line-height: 1; }
.empty-title { font-size: 32rpx; font-weight: 600; color: var(--app-ink); }
.empty-sub { margin-top: 10rpx; font-size: 25rpx; color: var(--app-muted); line-height: 1.5; }
.empty-btn { margin-top: 28rpx; height: 80rpx; padding: 0 44rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.create-entry { margin-top: 16rpx; height: 88rpx; border: 1rpx dashed var(--app-line); border-radius: var(--app-radius); background: rgba(255, 255, 255, 0.55); display: flex; align-items: center; justify-content: center; }
.create-entry-text { font-size: 26rpx; color: var(--app-primary); font-weight: 500; }
.state-btn { height: 80rpx; padding: 0 48rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.state-btn-text { font-size: 27rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
