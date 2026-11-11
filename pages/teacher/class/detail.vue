<template>
	<!-- 教师班级详情：清透冷白青绿背景；班级信息 + 管理入口 + 成员预览 + 邀请码 -->
	<view class="page">
		<view class="bg-layer">
			<view class="blob blob-mint"></view>
		</view>

		<!-- 顶部导航栏：返回 + 标题 -->
		<view class="top-bar" :style="teacherTopBarStyle">
			<view class="top-bar-side">
				<view class="back-hit" hover-class="back-hit-hover" :hover-stay-time="80" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
			</view>
			<text class="top-title">班级详情</text>
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

				<!-- 正常内容 -->
				<template v-else>
					<!-- ① 班级信息卡 -->
					<view class="info-card">
						<text class="class-name">{{ classInfo.name }}</text>
						<text v-if="classInfo.description" class="class-desc">{{ classInfo.description }}</text>
						<text v-if="classInfo.goal" class="class-goal">学习目标：{{ classInfo.goal }}</text>
					</view>

					<!-- ② 班级数据 -->
					<view class="meta-card">
						<view class="meta-row">
							<text class="meta-label">成员数量</text>
							<text class="meta-value">{{ classInfo.memberCount }} 人</text>
						</view>
						<view class="meta-row">
							<text class="meta-label">班级状态</text>
							<text class="meta-value">{{ classInfo.status === 'ACTIVE' ? '正常' : classInfo.status }}</text>
						</view>
						<view class="meta-row meta-row-last">
							<text class="meta-label">创建时间</text>
							<text class="meta-value">{{ classInfo.createdAt }}</text>
						</view>
					</view>

					<!-- ③ 管理员 -->
					<view class="admin-card">
						<text class="admin-label">管理员</text>
						<text class="admin-name">{{ adminName }}</text>
					</view>

					<!-- ④ 邀请码 -->
					<view class="invite-card">
						<text class="invite-label">班级邀请码</text>
						<view class="invite-row">
							<text class="invite-code">{{ classInfo.inviteCode }}</text>
							<view class="copy-btn" hover-class="copy-btn-hover" :hover-stay-time="80" @tap="copyInviteCode">
								<text class="copy-btn-text">复制</text>
							</view>
						</view>
						<text class="invite-tip">学生可通过邀请码加入班级</text>
					</view>

					<!-- ⑤ 任务管理入口 -->
					<view class="entry-card" hover-class="entry-card-hover" :hover-stay-time="80" @tap="goTasks">
						<text class="entry-title">任务管理</text>
						<text class="entry-arrow">›</text>
					</view>

					<!-- ⑤b 创建任务入口：直接进入本班任务创建，携带真实 classId -->
					<view class="entry-card" hover-class="entry-card-hover" :hover-stay-time="80" @tap="goCreateTask">
						<view class="entry-main">
							<text class="entry-title">创建任务</text>
							<text class="entry-sub">为本班发布新的教学任务</text>
						</view>
						<text class="entry-arrow">›</text>
					</view>

					<!-- ⑥ 班级学习数据入口 -->
					<view class="entry-card" hover-class="entry-card-hover" :hover-stay-time="80" @tap="goAnalytics">
						<view class="entry-main">
							<text class="entry-title">班级学习数据</text>
							<text class="entry-sub">查看任务完成情况、学生学习表现</text>
						</view>
						<text class="entry-arrow">›</text>
					</view>

					<!-- ⑦ 成员预览 -->
					<view class="section-head">
						<text class="section-title">成员</text>
						<text class="section-link" @tap="goMembers">查看全部成员 ›</text>
					</view>
					<view class="member-preview-card">
						<view
							v-for="(m, idx) in previewMembers"
							:key="m.userId"
							class="member-row"
							:class="{ 'member-row-last': idx === previewMembers.length - 1 }"
						>
							<text class="member-name">{{ m.nickname }}</text>
							<text class="member-role" :class="{ 'member-role-admin': m.role === 'ADMIN' }">
								{{ m.role === 'ADMIN' ? '管理员' : '学生' }}
							</text>
						</view>
						<view v-if="previewMembers.length === 0" class="member-empty">
							<text class="member-empty-text">暂无成员</text>
						</view>
					</view>
				</template>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getClassMembers } from '@/api/class.js'
	import * as authApi from '@/api/auth.js'

	export default {
		data() {
			return {
				classId: '',
				loading: true,
				loadError: false,
				retryable: true,
				errorMessage: '',
				classInfo: {},
				adminName: '',
				members: []
			}
		},
		computed: {
			previewMembers() {
				return this.members.slice(0, 5)
			}
		},
		onLoad(options) {
			this.classId = (options && options.classId) || ''
		},
		onShow() {
			if (!authApi.requireTeacher()) return
			this.loadDetail()
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			loadDetail() {
				var self = this
				if (!this.classId) {
					this.loading = false
					this.loadError = true
					this.retryable = false
					this.errorMessage = '班级信息不存在'
					return
				}
				this.loading = true
				this.loadError = false
				getClassMembers(this.classId)
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
						self.classInfo = d.classInfo || {}
						self.adminName = d.adminName || '—'
						self.members = d.members || []
						self.loading = false
					})
					.catch(function () {
						self.loading = false
						self.loadError = true
						self.retryable = true
						self.errorMessage = '网络异常，请稍后重试'
					})
			},
			copyInviteCode() {
				var code = this.classInfo.inviteCode
				if (!code) return
				uni.setClipboardData({
					data: code,
					success: function () {
						uni.showToast({ title: '邀请码已复制', icon: 'success' })
					}
				})
			},
			goMembers() {
				uni.navigateTo({ url: '/pages/teacher/class/members?classId=' + this.classId })
			},
			goTasks() {
				uni.navigateTo({ url: '/pages/teacher/task/index?classId=' + this.classId })
			},
			// 为本班创建任务：携带真实 classId 直接进入创建页
			goCreateTask() {
				if (!this.classId) return
				uni.navigateTo({ url: '/pages/teacher/task/create?classId=' + this.classId })
			},
			goAnalytics() {
				uni.navigateTo({ url: '/pages/teacher/class/analytics?classId=' + this.classId })
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
		border-bottom: 1rpx solid var(--teacher-transparent);
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
		/* 子页面无底部导航：内容底部需自行预留 Home Indicator 安全区（原设计留白 48rpx 保留） */
		padding: 32rpx var(--teacher-page-padding) calc(48rpx + env(safe-area-inset-bottom));
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

	/* 班级信息卡 */
	.info-card {
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 32rpx;
	}

	.class-name {
		font-size: 40rpx;
		font-weight: 600;
		color: var(--teacher-text);
		line-height: 56rpx;
	}

	.class-desc {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
		line-height: 40rpx;
	}

	.class-goal {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
		line-height: 40rpx;
	}

	/* 班级数据 */
	.meta-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 8rpx 32rpx;
	}

	.meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 0;
		border-bottom: 1rpx solid var(--teacher-divider);
	}

	.meta-row-last {
		border-bottom: none;
	}

	.meta-label {
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
	}

	.meta-value {
		font-size: 26rpx;
		font-weight: 500;
		color: var(--teacher-text);
	}

	/* 管理员 */
	.admin-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 24rpx 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.admin-label {
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
	}

	.admin-name {
		font-size: 26rpx;
		font-weight: 500;
		color: var(--teacher-text);
	}

	/* 邀请码 */
	.invite-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 32rpx;
	}

	.invite-label {
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
	}

	.invite-row {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.invite-code {
		font-size: 44rpx;
		font-weight: 600;
		color: var(--teacher-accent);
		letter-spacing: 4rpx;
	}

	.copy-btn {
		height: 64rpx;
		padding: 0 32rpx;
		border-radius: var(--teacher-btn-radius);
		background: var(--teacher-btn-primary-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.copy-btn-hover {
		opacity: var(--teacher-hover-opacity);
	}

	.copy-btn-text {
		font-size: 26rpx;
		font-weight: 600;
		color: var(--teacher-btn-primary-text);
	}

	.invite-tip {
		display: block;
		margin-top: 16rpx;
		font-size: 24rpx;
		color: var(--teacher-text-muted);
	}

	/* 任务管理入口 */
	.entry-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 28rpx 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.entry-card-hover {
		background-color: var(--teacher-divider-soft);
	}

	.entry-title {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--teacher-text);
	}

	/* 班级学习数据入口：标题 + 副标题 */
	.entry-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.entry-sub {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: var(--teacher-text-muted);
		line-height: 34rpx;
	}

	.entry-arrow {
		font-size: 32rpx;
		color: var(--teacher-text-muted);
		line-height: 1;
	}

	/* 成员预览 */
	.section-head {
		margin-top: 40rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 34rpx;
		font-weight: 600;
		color: var(--teacher-text);
		line-height: 48rpx;
	}

	.section-link {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--teacher-accent);
		line-height: 40rpx;
		padding: 8rpx 0;
	}

	.member-preview-card {
		margin-top: 24rpx;
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 8rpx 32rpx;
	}

	.member-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 0;
		border-bottom: 1rpx solid var(--teacher-divider);
	}

	.member-row-last {
		border-bottom: none;
	}

	.member-name {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--teacher-text);
	}

	.member-role {
		font-size: 24rpx;
		color: var(--teacher-text-secondary);
	}

	.member-role-admin {
		color: var(--teacher-accent);
		font-weight: 500;
	}

	.member-empty {
		padding: 40rpx 0;
		display: flex;
		justify-content: center;
	}

	.member-empty-text {
		font-size: 26rpx;
		color: var(--teacher-text-muted);
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


.class-name { font-size: 38rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; }
.class-desc, .class-goal { margin-top: 10rpx; font-size: 25rpx; color: var(--app-muted); line-height: 1.5; }
.meta-row { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid var(--app-line); }
.meta-label, .admin-label { font-size: 25rpx; color: var(--app-muted); }
.meta-value, .admin-name { font-size: 25rpx; color: var(--app-ink); }
.invite-code { font-size: 40rpx; font-weight: 600; color: var(--app-primary); letter-spacing: 4rpx; }
.copy-btn { height: 60rpx; padding: 0 28rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.copy-btn-text { font-size: 24rpx; font-weight: 600; }
.invite-tip { display: block; margin-top: 12rpx; font-size: 22rpx; color: var(--app-hint); }
.entry-card { padding: 24rpx 28rpx; display: flex; align-items: center; justify-content: space-between; }
.entry-title { font-size: 27rpx; font-weight: 500; color: var(--app-ink); }
.entry-sub { margin-top: 6rpx; font-size: 22rpx; color: var(--app-muted); }
.entry-arrow { font-size: 30rpx; color: var(--app-hint); }
.member-row { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid var(--app-line); }
.member-name { font-size: 27rpx; font-weight: 500; color: var(--app-ink); }
.member-role { font-size: 23rpx; color: var(--app-muted); }
.member-role-admin { color: var(--app-primary); font-weight: 500; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
