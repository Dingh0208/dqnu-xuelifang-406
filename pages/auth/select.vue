<template>
	<view class="page">
		<view class="hero">
			<text class="app-name">学立方</text>
			<text class="slogan">选择你的身份，开始学习之旅</text>
		</view>

		<view class="role-list">
			<view
				v-for="role in roles"
				:key="role.key"
				class="role-card"
				@tap="goLogin(role.key)"
			>
				<text class="role-icon">{{ role.icon }}</text>
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
					{ key: 'student', icon: '🎓', name: '学生入口', desc: '错题本、今日计划、学习安排' },
					{ key: 'teacher', icon: '👩‍🏫', name: '老师入口', desc: '班级管理、作业批改（建设中）' },
					{ key: 'parent', icon: '👨‍👩‍👧‍👦', name: '家长入口', desc: '学习报告、陪伴提醒（建设中）' }
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
		background-color: #F7EFE3;
		padding: 0 40rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.hero {
		padding: 140rpx 0 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.app-name {
		font-size: 64rpx;
		font-weight: 700;
		color: #4A3520;
		letter-spacing: 4rpx;
	}

	.slogan {
		margin-top: 20rpx;
		font-size: 28rpx;
		color: #B49D82;
	}

	.role-list {
		display: flex;
		flex-direction: column;
		gap: 28rpx;
	}

	.role-card {
		display: flex;
		align-items: center;
		background-color: #FFFDF8;
		border: 1rpx solid #EFE3D0;
		border-radius: 24rpx;
		padding: 36rpx 32rpx;
	}

	.role-card:active {
		background-color: #F6EBD9;
	}

	.role-icon {
		font-size: 64rpx;
		margin-right: 28rpx;
	}

	.role-text {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.role-name {
		font-size: 34rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.role-desc {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #B49D82;
	}

	.role-arrow {
		font-size: 44rpx;
		color: #D9C6A8;
	}

	.footer-tip {
		margin-top: auto;
		padding: 60rpx 0 calc(40rpx + env(safe-area-inset-bottom));
		text-align: center;
	}

	.footer-tip text {
		font-size: 22rpx;
		color: #C9B697;
	}
</style>
