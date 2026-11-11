<template>
	<view class="page">
		<view class="hero">
			<view class="brand-mark"><text class="brand-char">学</text></view>
			<text class="app-name">学立方</text>
			<text class="slogan">选择你的身份，开始学习之旅</text>
		</view>

		<view class="role-list">
			<view
				v-for="role in roles"
				:key="role.key"
				class="role-card"
				hover-class="role-card-hover"
				:hover-stay-time="80"
				@tap="goLogin(role.key)"
			>
				<view class="role-icon-wrap"><text class="role-icon">{{ role.icon }}</text></view>
				<view class="role-text">
					<text class="role-name">{{ role.name }}</text>
					<text class="role-desc">{{ role.desc }}</text>
				</view>
				<text class="role-arrow">›</text>
			</view>
		</view>

		<view class="footer-tip">
			<text>登录 / 注册时请选择与账号身份一致的入口</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				roles: [
					{ key: 'student', icon: '学', name: '学生入口', desc: '错题本、今日计划、学习安排' },
					{ key: 'teacher', icon: '师', name: '老师入口', desc: '教师工作台、班级与教学管理' },
					{ key: 'parent', icon: '家', name: '家长入口', desc: '学习报告、孩子成长与陪伴提醒' }
				]
			}
		},
		methods: {
			// 跳转到登录/注册页（携带身份，仅作入口提示；登录后以账号实际角色为准）
			goLogin(role) {
				uni.navigateTo({ url: '/pages/auth/login?role=' + role })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 32rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.hero {
		padding: 116rpx 0 64rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.brand-mark {
		width: 116rpx;
		height: 116rpx;
		border-radius: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--app-primary, #0A5C6A) 0%, var(--app-accent, #12B5A5) 100%);
		box-shadow: 0 12rpx 28rpx rgba(10, 92, 106, 0.22);
	}

	.brand-char {
		font-size: 52rpx;
		font-weight: 700;
		color: #FFFFFF;
	}

	.app-name {
		margin-top: 26rpx;
		font-size: 48rpx;
		font-weight: 700;
		letter-spacing: 4rpx;
		color: var(--app-ink, #0D2F36);
	}

	.slogan {
		margin-top: 14rpx;
		font-size: 25rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.role-list {
		display: flex;
		flex-direction: column;
	}

	.role-card {
		display: flex;
		align-items: center;
		padding: 30rpx 28rpx;
		background: var(--app-surface, rgba(255, 255, 255, 0.90));
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
	}

	.role-card + .role-card {
		margin-top: 24rpx;
	}

	.role-card-hover {
		background: var(--app-surface-soft, #E2F3F2);
		opacity: 0.92;
	}

	.role-icon-wrap {
		width: 88rpx;
		height: 88rpx;
		border-radius: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--app-positive-bg, #E2F7F1);
		flex-shrink: 0;
	}

	.role-icon {
		font-size: 34rpx;
		font-weight: 600;
		color: var(--app-primary, #0A5C6A);
	}

	.role-text {
		flex: 1;
		min-width: 0;
		margin-left: 24rpx;
		display: flex;
		flex-direction: column;
	}

	.role-name {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.role-desc {
		margin-top: 8rpx;
		font-size: 24rpx;
		line-height: 1.5;
		color: var(--app-muted, #7B9AA1);
	}

	.role-arrow {
		flex-shrink: 0;
		margin-left: 16rpx;
		font-size: 40rpx;
		line-height: 1;
		color: var(--app-hint, #A9C2C6);
	}

	.footer-tip {
		margin-top: auto;
		padding: 56rpx 0 calc(36rpx + env(safe-area-inset-bottom));
		text-align: center;
	}

	.footer-tip text {
		font-size: 22rpx;
		line-height: 1.6;
		color: var(--app-hint, #A9C2C6);
	}
</style>
