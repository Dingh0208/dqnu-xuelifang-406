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
			<text class="top-title">创建任务</text>
			<view class="top-bar-side top-bar-right"></view>
		</view>

		<scroll-view class="content" scroll-y="true" :show-scrollbar="false">
			<view class="content-inner">
				<!-- 缺少班级信息：拦截并引导返回班级中心，不渲染创建表单、不调用创建 API -->
				<view v-if="locked" class="locked-card">
					<text class="locked-title">未指定班级</text>
					<text class="locked-sub">创建任务需要先选择班级，请返回班级中心选择目标班级。</text>
					<view class="locked-btn" hover-class="locked-btn-hover" :hover-stay-time="80" @tap="goSelectClass">
						<text class="locked-btn-text">去选择班级</text>
					</view>
				</view>

				<view v-else class="form-card">
					<text class="form-label">任务标题</text>
					<input
						class="form-input"
						v-model="form.title"
						placeholder="请输入任务标题"
						placeholder-class="form-input-placeholder"
						maxlength="50"
					/>

					<text class="form-label">任务描述</text>
					<textarea
						class="form-textarea"
						v-model="form.description"
						placeholder="请输入任务描述（可选）"
						placeholder-class="form-input-placeholder"
						maxlength="200"
					/>

					<text class="form-label">截止时间</text>
					<input
						class="form-input"
						v-model="form.deadline"
						placeholder="例如 2026-10-10"
						placeholder-class="form-input-placeholder"
						maxlength="10"
					/>

					<view
						class="submit-btn"
						:class="{ 'submit-btn-disabled': submitting }"
						hover-class="submit-btn-hover"
						:hover-stay-time="80"
						@tap="onSubmit"
					>
						<text class="submit-btn-text">{{ submitting ? '创建中…' : '创建任务' }}</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { createTask } from '@/api/teacher/task.js'
	import * as authApi from '@/api/auth.js'
	import { isValidDeadline } from '@/utils/taskLifecycle.js'

	export default {
		data() {
			return {
				classId: '',
				from: '',        // 入口来源：assign=从班级中心布置任务；其余=从任务列表进入
				locked: false,   // 缺少 classId 时锁定表单，仅展示引导，不调用创建 API
				submitting: false,
				form: {
					title: '',
					description: '',
					deadline: ''
				}
			}
		},
		onLoad(options) {
			this.classId = (options && options.classId) || ''
			this.from = (options && options.from) || ''
			// F2：加载即校验 classId，缺失则锁定表单并提示，绝不调用创建任务 API
			if (!this.classId) {
				this.locked = true
				uni.showToast({ title: '请先选择班级', icon: 'none' })
			}
		},
		onShow() {
			// 与其他教师端页面一致的页面级登录守卫（统一入口，不新建第二套）
			if (!authApi.requireTeacher()) return
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			// 缺少班级时引导返回班级中心（用户选择班级后自动进入其任务列表）
			goSelectClass() {
				uni.navigateTo({ url: '/pages/teacher/class/index' })
			},
			onSubmit() {
				var self = this
				if (this.submitting) return
				// F2：提交前再次校验 classId，防止缺少参数仍提交请求（缺失时不调用 API）
				if (!this.classId) {
					uni.showToast({ title: '请先选择班级', icon: 'none' })
					return
				}
				if (!this.form.title.trim()) {
					uni.showToast({ title: '请输入任务标题', icon: 'none' })
					return
				}
				// deadline 允许为空（后端/Mock 默认当天）；非空必须为 YYYY-MM-DD
				var deadline = this.form.deadline.trim()
				if (deadline && !isValidDeadline(deadline)) {
					uni.showToast({ title: '截止时间格式需为 YYYY-MM-DD', icon: 'none' })
					return
				}
				this.submitting = true
				// 使用校验通过的真实 classId（非表单推导值）调用创建任务
				createTask({
					classId: this.classId,
					title: this.form.title.trim(),
					description: this.form.description.trim(),
					deadline: deadline
				})
					.then(function (res) {
						if (!res || res.code !== 200) {
							// 失败才恢复可提交，便于用户修正后重试
							self.submitting = false
							if (res && res.code === 401) {
								authApi.logout()
								uni.reLaunch({ url: '/pages/auth/select' })
								return
							}
							uni.showToast({ title: (res && res.message) || '创建失败', icon: 'none' })
							return
						}
						// 成功：保持 submitting=true 防止 600ms 内重复创建，随后进入当前班级任务列表
						uni.showToast({ title: '创建成功', icon: 'success' })
						setTimeout(function () {
							// F3：创建成功后进入当前班级任务列表；来自「布置任务」用 redirectTo 关闭创建页，
							//     其余（来自任务列表）返回上一页任务列表并自动刷新，均避免重复创建页堆叠
							if (self.from === 'assign') {
								uni.redirectTo({ url: '/pages/teacher/task/index?classId=' + self.classId })
							} else {
								uni.navigateBack()
							}
						}, 600)
					})
					.catch(function () {
						self.submitting = false
						uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
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
		padding: 32rpx var(--teacher-page-padding) calc(48rpx + env(safe-area-inset-bottom));
		background: var(--teacher-transparent);
	}

	.form-card {
		background-color: var(--teacher-card-bg);
		border-radius: var(--teacher-radius-card);
		border: 1rpx solid var(--teacher-card-border);
		box-shadow: var(--teacher-card-shadow);
		padding: 40rpx 32rpx;
	}

	.form-label {
		display: block;
		font-size: 26rpx;
		font-weight: 500;
		color: var(--teacher-text);
		line-height: 40rpx;
		margin-bottom: 16rpx;
	}

	.form-label:not(:first-child) {
		margin-top: 32rpx;
	}

	.form-input {
		height: var(--teacher-input-height, 88rpx);
		background-color: var(--teacher-input-bg, var(--teacher-white));
		border: 1rpx solid var(--teacher-input-border, var(--teacher-track));
		border-radius: var(--teacher-input-radius, 16rpx);
		padding: 0 var(--teacher-input-padding, 28rpx);
		font-size: 28rpx;
		color: var(--teacher-input-text, var(--teacher-text));
		box-sizing: border-box;
	}

	.form-textarea {
		width: 100%;
		height: 180rpx;
		background-color: var(--teacher-input-bg, var(--teacher-white));
		border: 1rpx solid var(--teacher-input-border, var(--teacher-track));
		border-radius: var(--teacher-input-radius, 16rpx);
		padding: 20rpx 28rpx;
		font-size: 28rpx;
		color: var(--teacher-input-text, var(--teacher-text));
		box-sizing: border-box;
	}

	.form-input-placeholder {
		color: var(--teacher-input-placeholder);
	}

	.submit-btn {
		margin-top: 48rpx;
		height: var(--teacher-btn-height);
		border-radius: var(--teacher-btn-radius);
		background: var(--teacher-btn-primary-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.submit-btn-hover {
		opacity: var(--teacher-hover-opacity);
	}

	.submit-btn-disabled {
		opacity: var(--teacher-disabled-opacity);
	}

	.submit-btn-text {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--teacher-btn-primary-text);
	}

	/* 缺少班级信息：引导卡 */
	.locked-card {
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

	.locked-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--teacher-text);
		line-height: 48rpx;
	}

	.locked-sub {
		margin-top: 16rpx;
		font-size: 26rpx;
		color: var(--teacher-text-secondary);
		line-height: 40rpx;
		text-align: center;
	}

	.locked-btn {
		margin-top: 40rpx;
		height: 80rpx;
		padding: 0 64rpx;
		border-radius: var(--teacher-btn-radius);
		background: var(--teacher-btn-primary-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.locked-btn-hover {
		opacity: var(--teacher-hover-opacity);
	}

	.locked-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: var(--teacher-btn-primary-text);
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


.form-card { padding: 32rpx; }
.form-label { display: block; font-size: 26rpx; font-weight: 500; color: var(--app-ink); line-height: 1.4; margin-bottom: 14rpx; }
.form-label:not(:first-child) { margin-top: 28rpx; }
.form-input, .form-textarea { width: 100%; background: var(--app-surface-solid); border: 1rpx solid var(--app-line); border-radius: 20rpx; font-size: 28rpx; color: var(--app-ink); box-sizing: border-box; }
.form-input { height: 88rpx; padding: 0 24rpx; }
.form-textarea { height: 180rpx; padding: 20rpx 24rpx; }
.form-input-placeholder { color: var(--app-hint); }
.submit-btn { margin-top: 40rpx; height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.submit-btn-disabled { opacity: var(--teacher-disabled-opacity); }
.submit-btn-text { font-size: 28rpx; font-weight: 600; }
.locked-card { margin-top: 48rpx; padding: 52rpx 28rpx; text-align: center; }
.locked-title { font-size: 30rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; }
.locked-sub { margin-top: 10rpx; font-size: 25rpx; color: var(--app-muted); line-height: 1.5; }
.locked-btn { margin-top: 28rpx; height: 80rpx; padding: 0 44rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; }
.locked-btn-text { font-size: 27rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
