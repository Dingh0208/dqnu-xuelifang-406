<template>
	<view class="page">
		<view class="header">
			<text class="title">{{ mode === 'login' ? '登录' : '注册' }}</text>
			<text class="subtitle" v-if="mode === 'login'">{{ entryRoleName }}账号登录后自动进入对应主页</text>
			<text class="subtitle" v-else>请填写信息并选择身份完成注册</text>
		</view>

		<!-- 登录 / 注册 切换 -->
		<view class="mode-tabs">
			<view class="mode-tab" :class="{ active: mode === 'login' }" @tap="mode = 'login'">
				<text>登录</text>
			</view>
			<view class="mode-tab" :class="{ active: mode === 'register' }" @tap="mode = 'register'">
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
						@tap="registerRole = r.key"
					>
						<text class="role-option-icon">{{ r.icon }}</text>
						<text class="role-option-name">{{ r.name }}</text>
					</view>
				</view>
			</view>

			<view class="submit-btn" :class="{ disabled: submitting }" @tap="submit">
				<text>{{ mode === 'login' ? '登 录' : '注 册' }}</text>
			</view>
		</view>

		<view class="tip">
			<text>演示账号：student01 / teacher01 / parent01，密码 123456</text>
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
					{ key: 'student', icon: '🎓', name: '学生' },
					{ key: 'teacher', icon: '👩‍🏫', name: '老师' },
					{ key: 'parent', icon: '👨‍👩‍👧‍👦', name: '家长' }
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
					.catch(() => {
						uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
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
					.catch(() => {
						uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
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
		background-color: #F7EFE3;
		padding: 0 48rpx;
		box-sizing: border-box;
	}

	.header {
		padding: 100rpx 0 48rpx;
	}

	.title {
		font-size: 52rpx;
		font-weight: 700;
		color: #4A3520;
	}

	.subtitle {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		color: #B49D82;
	}

	.mode-tabs {
		display: flex;
		border-bottom: 1rpx solid #EFE3D0;
		margin-bottom: 48rpx;
	}

	.mode-tab {
		flex: 1;
		padding: 24rpx 0;
		text-align: center;
	}

	.mode-tab text {
		font-size: 30rpx;
		color: #B49D82;
	}

	.mode-tab.active text {
		color: #4A3520;
		font-weight: 600;
	}

	.mode-tab.active {
		border-bottom: 6rpx solid #E8A340;
	}

	.form-item {
		margin-bottom: 36rpx;
	}

	.label {
		display: block;
		font-size: 26rpx;
		color: #7A6448;
		margin-bottom: 14rpx;
	}

	.input {
		background-color: #FFFDF8;
		border: 1rpx solid #EFE3D0;
		border-radius: 16rpx;
		padding: 24rpx 28rpx;
		font-size: 30rpx;
		color: #4A3520;
	}

	.ph {
		color: #C9B697;
	}

	.role-picker {
		display: flex;
		gap: 20rpx;
	}

	.role-option {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 28rpx 0;
		background-color: #FFFDF8;
		border: 2rpx solid #EFE3D0;
		border-radius: 16rpx;
	}

	.role-option.active {
		border-color: #E8A340;
		background-color: #FBF3E2;
	}

	.role-option-icon {
		font-size: 48rpx;
	}

	.role-option-name {
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #4A3520;
	}

	.submit-btn {
		margin-top: 24rpx;
		background-color: #E8A340;
		border-radius: 44rpx;
		padding: 26rpx 0;
		text-align: center;
	}

	.submit-btn text {
		color: #FFFDF8;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 8rpx;
	}

	.submit-btn.disabled {
		opacity: 0.6;
	}

	.submit-btn:active {
		opacity: 0.85;
	}

	.tip {
		margin-top: 60rpx;
		text-align: center;
	}

	.tip text {
		font-size: 22rpx;
		color: #C9B697;
	}
</style>
