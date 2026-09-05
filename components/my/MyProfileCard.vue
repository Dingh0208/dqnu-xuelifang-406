<template>
	<view class="profile-card">
		<!-- 头像：圆形；无图片资源时用暖色圆形底 + 昵称首字 -->
		<view class="avatar">
			<image v-if="profile.avatar" class="avatar-img" :src="profile.avatar" mode="aspectFill" />
			<text v-else class="avatar-text">{{ profile.avatarText || '学' }}</text>
		</view>

		<view class="info">
			<text class="nickname">{{ profile.nickname || '同学' }}</text>
			<text class="signature">{{ profile.signature || '今天也要继续努力' }}</text>
		</view>

		<!-- 设置入口：不要过大；点击进入设置页 -->
		<view class="settings-btn" @click="onSettings">
			<text class="settings-icon">⚙</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'MyProfileCard',
		props: {
			profile: {
				type: Object,
				default: function () {
					return { avatar: '', avatarText: '学', nickname: '同学', signature: '' }
				}
			}
		},
		methods: {
			onSettings() {
				this.$emit('settings')
			}
		}
	}
</script>

<style>
	.profile-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 32rpx 30rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.avatar {
		width: 108rpx;
		height: 108rpx;
		border-radius: 54rpx;
		background: linear-gradient(135deg, #EEB048 0%, #E8A340 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.avatar-img {
		width: 108rpx;
		height: 108rpx;
		border-radius: 54rpx;
	}

	.avatar-text {
		font-size: 44rpx;
		font-weight: 600;
		color: #FFFDF8;
	}

	.info {
		flex: 1;
		min-width: 0;
		margin-left: 24rpx;
		display: flex;
		flex-direction: column;
	}

	.nickname {
		font-size: 34rpx;
		font-weight: 600;
		color: #4A3520;
	}

	.signature {
		margin-top: 10rpx;
		font-size: 25rpx;
		color: #8D7964;
	}

	.settings-btn {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.settings-icon {
		font-size: 38rpx;
		color: #B49D82;
	}
</style>
