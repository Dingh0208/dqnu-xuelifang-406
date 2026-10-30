<template>
	<view class="page">
		<view class="header">
			<text class="title">{{ mode === 'login' ? '登录' : '注册' }}</text>
			<text class="subtitle" v-if="mode === 'login'">{{ entryRoleName }}账号登录后自动进入对应主页</text>
			<text class="subtitle" v-else>请填写信息并选择身份完成注册</text>
		</view>

		<!-- 登录 / 注册 切换 -->
		<view class="mode-tabs">
			<view class="mode-tab" :class="{ active: mode === 'login' }" hover-class="mode-tab-hover" :hover-stay-time="80" @tap="mode = 'login'">
				<text>登录</text>
			</view>
			<view class="mode-tab" :class="{ active: mode === 'register' }" hover-class="mode-tab-hover" :hover-stay-time="80" @tap="mode = 'register'">
				<text>注册</text>
			</view>
		</view>

		<view class="form">
			<view class="form-item">
				<text class="label">账号</text>
				<input class="input" v-model="account" placeholder="请输入账号" placeholder-class="ph" />
			</view>
			<view class="form-item" v-if="mode === 'register'">
				<text class="label">昵称</text>
				<input class="input" v-model="nickname" placeholder="请输入昵称（选填）" placeholder-class="ph" />
			</view>
			<view class="form-item">
				<text class="label">密码</text>
				<input class="input" v-model="password" password placeholder="请输入密码" placeholder-class="ph" />
			</view>

			<!-- 注册必须再次选择身份 -->
			<view class="form-item" v-if="mode === 'register'">
				<text class="label">注册身份（必选）</text>
				<view class="role-picker">
					<view
						v-for="r in roles"
						:key="r.key"
						class="role-option"
						:class="{ active: registerRole === r.key }"
						hover-class="role-option-hover"
						:hover-stay-time="80"
						@tap="registerRole = r.key"
					>
						<text class="role-option-icon">{{ r.icon }}</text>
						<text class="role-option-name">{{ r.name }}</text>
					</view>
				</view>
			</view>

			<view class="submit-btn" :class="{ disabled: submitting }" hover-class="submit-btn-hover" :hover-stay-time="80" @tap="submit">
				<text>{{ mode === 'login' ? '登 录' : '注 册' }}</text>
			</view>
		</view>

		<view class="tip">
			<text>演示账号：student01 / parent01 / teacher01（教师账号由学校管理员开通），密码 123456</text>
		</view>
	</view>
</template>

<script>
	import * as authApi from '@/api/auth.js'

	export default {
		data() {
			return {
				mode: 'login',          // login / register
				entryRole: 'student',   // 从身份选择页带过来的入口身份（提示用）
				registerRole: '',       // 注册时必须选择的身份
				account: '',
				nickname: '',
				password: '',
				submitting: false,
				roles: [
					// 教师账号由学校管理员开通，注册页不提供自助注册入口
					{ key: 'student', icon: '学', name: '学生' },
					{ key: 'parent', icon: '家', name: '家长' }
				]
			}
		},
		computed: {
			entryRoleName() {
				var map = { student: '学生', teacher: '老师', parent: '家长' }
				return map[this.entryRole] || ''
			}
		},
		onLoad(options) {
			if (options && options.role) {
				this.entryRole = options.role
			}
		},
		methods: {
			submit() {
				if (this.submitting) return
				if (this.mode === 'login') {
					this.doLogin()
				} else {
					this.doRegister()
				}
			},
			validate() {
				if (!this.account.trim()) {
					uni.showToast({ title: '请输入账号', icon: 'none' })
					return false
				}
				if (!this.password) {
					uni.showToast({ title: '请输入密码', icon: 'none' })
					return false
				}
				if (this.mode === 'register' && !this.registerRole) {
					uni.showToast({ title: '请选择注册身份', icon: 'none' })
					return false
				}
				return true
			},
			// 登录：后端校验账号密码 + 返回账号真实角色，按角色跳主页（不串页）
			doLogin() {
				if (!this.validate()) return
				this.submitting = true
				authApi.login({ account: this.account.trim(), password: this.password })
					.then((res) => {
						if (res.code !== 0) {
							uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
							return
						}
						var user = res.data
						authApi.saveLoginUser(user)
						uni.showToast({ title: '登录成功', icon: 'success' })
						this.goRoleHome(user.role)
					})
					.catch((err) => {
						uni.showToast({ title: (err && (err.msg || err.message)) || '网络异常，请稍后重试', icon: 'none' })
					})
					.then(() => {
						this.submitting = false
					})
			},
			// 注册：提交账号密码 + 身份，成功后自动登录进入对应主页
			doRegister() {
				if (!this.validate()) return
				this.submitting = true
				authApi.register({
					account: this.account.trim(),
					password: this.password,
					nickname: this.nickname.trim(),
					role: this.registerRole
				})
					.then((res) => {
						if (res.code !== 0) {
							uni.showToast({ title: res.msg || '注册失败', icon: 'none' })
							return
						}
						var user = res.data
						authApi.saveLoginUser(user)
						uni.showToast({ title: '注册成功', icon: 'success' })
						this.goRoleHome(user.role)
					})
					.catch((err) => {
						uni.showToast({ title: (err && (err.msg || err.message)) || '网络异常，请稍后重试', icon: 'none' })
					})
					.then(() => {
						this.submitting = false
					})
			},
			// 按角色跳主页：reLaunch 清空页面栈，避免返回键回到登录页
			goRoleHome(role) {
				var url = authApi.ROLE_HOME[role]
				if (!url) {
					uni.showToast({ title: '未知身份：' + role, icon: 'none' })
					return
				}
				setTimeout(function () {
					uni.reLaunch({ url: url })
				}, 600)
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 32rpx calc(32rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.header {
		padding: 92rpx 0 36rpx;
	}

	.title {
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.subtitle {
		display: block;
		margin-top: 14rpx;
		font-size: 25rpx;
		line-height: 1.6;
		color: var(--app-muted, #7B9AA1);
	}

	.mode-tabs {
		display: flex;
		padding: 6rpx;
		margin-bottom: 28rpx;
		border-radius: 999rpx;
		background: var(--app-surface-soft, #E2F3F2);
	}

	.mode-tab {
		flex: 1;
		padding: 18rpx 0;
		text-align: center;
		border-radius: 999rpx;
	}

	.mode-tab text {
		font-size: 28rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.mode-tab.active {
		background: var(--app-surface-solid, #FFFFFF);
		box-shadow: 0 4rpx 12rpx rgba(10, 80, 90, 0.08);
	}

	.mode-tab.active text {
		color: var(--app-primary, #0A5C6A);
		font-weight: 600;
	}

	.mode-tab-hover {
		opacity: 0.82;
	}

	.form {
		padding: 32rpx 28rpx;
		background: var(--app-surface, rgba(255, 255, 255, 0.90));
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
	}

	.form-item {
		margin-bottom: 28rpx;
	}

	.label {
		display: block;
		margin-bottom: 12rpx;
		font-size: 24rpx;
		font-weight: 500;
		color: var(--app-copy, #44666E);
	}

	.input {
		height: 88rpx;
		padding: 0 24rpx;
		box-sizing: border-box;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 20rpx;
		font-size: 28rpx;
		color: var(--app-ink, #0D2F36);
	}

	.ph {
		color: var(--app-hint, #A9C2C6);
	}

	.role-picker {
		display: flex;
	}

	.role-option {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 22rpx 0;
		background: var(--app-surface-solid, #FFFFFF);
		border: 2rpx solid var(--app-line, #D3E8E7);
		border-radius: 20rpx;
	}

	.role-option + .role-option {
		margin-left: 20rpx;
	}

	.role-option-hover {
		opacity: 0.8;
	}

	.role-option.active {
		border-color: var(--app-accent, #12B5A5);
		background: var(--app-positive-bg, #E2F7F1);
	}

	.role-option-icon {
		font-size: 34rpx;
		font-weight: 600;
		color: var(--app-primary, #0A5C6A);
	}

	.role-option-name {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: var(--app-copy, #44666E);
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 88rpx;
		margin-top: 12rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, var(--app-primary, #0A5C6A) 0%, var(--app-accent, #12B5A5) 100%);
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.submit-btn text {
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 600;
		letter-spacing: 2rpx;
	}

	.submit-btn.disabled {
		opacity: 0.5;
	}

	.submit-btn-hover {
		opacity: 0.88;
	}

	.tip {
		margin-top: 36rpx;
		text-align: center;
	}

	.tip text {
		font-size: 22rpx;
		line-height: 1.6;
		color: var(--app-hint, #A9C2C6);
	}
</style>
