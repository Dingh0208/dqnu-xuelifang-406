<template>
	<!-- 创建班级：教师/管理端流程；创建成功后弹窗确认，不自动跳转教师首页 -->
	<view class="page">
		<!-- 背景光斑：与教师首页一致的清透冷白青绿环境光 -->
		<view class="bg-layer">
			<view class="blob blob-mint"></view>
		</view>

		<!-- 顶部导航栏：返回 + 标题（不绝对定位，正常文档流） -->
		<view class="top-bar" :style="teacherTopBarStyle">
			<view class="top-bar-side">
				<view class="back-hit" hover-class="back-hit-hover" :hover-stay-time="80" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
			</view>
			<text class="top-title">创建班级</text>
			<view class="top-bar-side top-bar-right"></view>
		</view>

		<!-- 中间内容滚动区 -->
		<scroll-view class="content" scroll-y="true" :show-scrollbar="false">
			<view class="content-inner">
				<!-- 表单卡片 -->
				<view class="form-card teacher-card teacher-card-pad">
					<text class="form-label">班级名称</text>
					<input
						class="teacher-input"
						v-model="form.name"
						placeholder="请输入班级名称"
						placeholder-class="teacher-input-ph"
						maxlength="30"
						:disabled="submitting"
					/>

					<text class="form-label">班级简介</text>
					<textarea
						class="teacher-input textarea"
						v-model="form.description"
						placeholder="请输入班级简介（可选）"
						placeholder-class="teacher-input-ph"
						maxlength="200"
						:disabled="submitting"
					/>

					<text class="form-label">班级身份</text>
					<view class="identity-list">
						<view
							class="identity-item"
							:class="{ active: form.joinSelf === false }"
							hover-class="identity-item-hover"
							:hover-stay-time="80"
							@tap="form.joinSelf = false"
						>
							<view class="identity-radio" :class="{ checked: form.joinSelf === false }"></view>
							<view class="identity-texts">
								<text class="identity-title">管理者</text>
								<text class="identity-desc">负责管理班级、创建任务、查看学习数据</text>
							</view>
						</view>
						<view
							class="identity-item"
							:class="{ active: form.joinSelf === true }"
							hover-class="identity-item-hover"
							:hover-stay-time="80"
							@tap="form.joinSelf = true"
						>
							<view class="identity-radio" :class="{ checked: form.joinSelf === true }"></view>
							<view class="identity-texts">
								<text class="identity-title">管理者 + 学生</text>
								<text class="identity-desc">既可以管理班级，也可以作为学生参与学习</text>
							</view>
						</view>
					</view>

					<!-- 创建按钮：主按钮，全宽 -->
					<view
						class="submit-btn teacher-btn teacher-btn--primary"
						:class="{ disabled: submitting }"
						hover-class="teacher-btn--primary-hover"
						:hover-stay-time="80"
						@tap="onSubmit"
					>
						<text>{{ submitting ? '创建中…' : '创建班级' }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 创建成功确认弹窗：不自动跳转，由用户选择 -->
		<view v-if="showSuccess" class="mask" @tap="closeSuccess">
			<view class="dialog" @tap.stop>
				<text class="dialog-title">班级创建成功</text>
				<text class="dialog-content">{{ successMessage }}</text>
				<view class="dialog-btns">
					<view class="dialog-btn dialog-btn-secondary" hover-class="teacher-btn--secondary-hover" :hover-stay-time="80" @tap="closeSuccess">
						<text class="dialog-btn-text-secondary">留在当前页面</text>
					</view>
					<view class="dialog-btn dialog-btn-primary" hover-class="teacher-btn--primary-hover" :hover-stay-time="80" @tap="goWorkbench">
						<text class="dialog-btn-text-primary">进入管理工作台</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { createClass } from '@/api/class.js'
	import * as authApi from '@/api/auth.js'

	export default {
		data() {
			return {
				submitting: false,
				showSuccess: false,
				createdClassId: '',
				createdJoinSelf: false,
				form: {
					name: '',
					description: '',
					joinSelf: false // false=仅管理者；true=管理者+学生
				}
			}
		},
		computed: {
			successMessage() {
				if (this.createdJoinSelf) {
					return '你已创建「' + this.form.name + '」班级，并同时加入该班级。\n接下来可以进入管理工作台进行班级管理。'
				}
				return '你已成功创建「' + this.form.name + '」班级。\n接下来可以进入管理工作台进行班级管理。'
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
			onSubmit() {
				var self = this
				if (this.submitting) return
				var name = (this.form.name || '').trim()
				if (!name) {
					uni.showToast({ title: '请输入班级名称', icon: 'none' })
					return
				}
				this.submitting = true
				createClass({
					name: name,
					description: (this.form.description || '').trim(),
					goal: '',
					joinSelf: this.form.joinSelf
				})
					.then(function (res) {
					if (!res || res.code !== 200) {
						self.submitting = false
						// 认证失效：清登录态并回身份选择页（与其他教师端页面统一）
						// 403/404/400：不退出登录，仅提示接口返回的业务消息
						if (res && res.code === 401) {
							authApi.logout()
							uni.reLaunch({ url: '/pages/auth/select' })
							return
						}
						uni.showToast({ title: (res && res.message) || '创建失败，请重试', icon: 'none' })
						return
					}
					// 创建成功：停留当前页面，显示确认弹窗，不自动跳转
					self.createdClassId = (res.data && res.data.classId) || ''
					self.createdJoinSelf = !!(res.data && res.data.joinSelf)
					self.submitting = false
					self.showSuccess = true
				})
					.catch(function () {
						self.submitting = false
						uni.showToast({ title: '网络异常，请重试', icon: 'none' })
					})
			},
			// 留在当前页面：仅关闭弹窗，保留已填写内容，不跳转
			closeSuccess() {
				this.showSuccess = false
			},
			// 进入管理工作台：携带真实 classId 跳转教师首页（reLaunch 清栈，统一工作空间切换方式）
			goWorkbench() {
				if (!this.createdClassId) return
				this.showSuccess = false
				if (typeof authApi.setTeacherWorkspaceAccess === 'function') authApi.setTeacherWorkspaceAccess()
				uni.reLaunch({ url: '/pages/teacher/home?classId=' + this.createdClassId })
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


.form-card { padding: 32rpx; }
.form-label { display: block; font-size: 28rpx; font-weight: 500; color: var(--app-ink); margin-top: 32rpx; margin-bottom: 16rpx; }
.form-label:first-child { margin-top: 0; }
.textarea { height: 200rpx; padding-top: 24rpx; padding-bottom: 24rpx; }
.identity-list { display: flex; flex-direction: column; }
.identity-item { display: flex; align-items: flex-start; padding: 24rpx; border-radius: var(--app-radius); background: var(--app-surface-solid); border: 1rpx solid var(--app-line); }
.identity-item + .identity-item { margin-top: 16rpx; }
.identity-item.active { border-color: var(--app-accent); background: var(--app-surface-soft); }
.identity-item-hover { opacity: var(--teacher-hover-opacity); }
.identity-radio { width: 36rpx; height: 36rpx; border-radius: 50%; border: 2rpx solid var(--app-hint); margin-right: 20rpx; margin-top: 4rpx; flex-shrink: 0; }
.identity-radio.checked { border-color: var(--app-accent); background: var(--app-accent); box-shadow: inset 0 0 0 6rpx #FFFFFF; }
.identity-texts { flex: 1; display: flex; flex-direction: column; }
.identity-title { font-size: 28rpx; font-weight: 500; color: var(--app-ink); line-height: 1.4; }
.identity-desc { margin-top: 8rpx; font-size: 25rpx; color: var(--app-muted); line-height: 1.5; }
.submit-btn { margin-top: 44rpx; width: 100%; }
.submit-btn.disabled { opacity: var(--teacher-disabled-opacity); }
.mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 100; padding-bottom: env(safe-area-inset-bottom); background: var(--teacher-mask); display: flex; align-items: center; justify-content: center; }
.dialog { width: 600rpx; padding: 40rpx 32rpx; display: flex; flex-direction: column; align-items: center; }
.dialog-title { font-size: 32rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; text-align: center; }
.dialog-content { margin-top: 20rpx; font-size: 27rpx; color: var(--app-copy); line-height: 1.6; text-align: center; }
.dialog-btns { margin-top: 40rpx; width: 100%; display: flex; }
.dialog-btn { flex: 1; height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.dialog-btn + .dialog-btn { margin-left: 20rpx; }
.dialog-btn-text-primary, .dialog-btn-text-secondary { font-size: 28rpx; font-weight: 600; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
