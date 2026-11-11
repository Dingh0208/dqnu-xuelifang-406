<template>
	<view class="page">
		<view class="form-card">
			<text class="form-label">请输入班级邀请码</text>
			<input
				class="code-input"
				v-model="inviteCode"
				placeholder="如 A8K29D"
				placeholder-class="code-placeholder"
				maxlength="12"
				:disabled="submitting"
			/>
			<view class="submit-btn" :class="{ disabled: submitting }" @click="onJoin">
				<text class="submit-btn-text">{{ submitting ? '加入中…' : '加入班级' }}</text>
			</view>
			<text class="form-tip">邀请码由班级管理员提供，加入后该班级任务会进入今日计划</text>
		</view>
	</view>
</template>

<script>
	import { joinClass } from '@/api/class.js'

	export default {
		data() {
			return {
				inviteCode: '',
				submitting: false
			}
		},
		methods: {
			onJoin() {
				var self = this
				if (this.submitting) return
				var code = (this.inviteCode || '').trim()
				if (!code) {
					uni.showToast({ title: '请输入班级邀请码', icon: 'none' })
					return
				}
				this.submitting = true
				// 邀请码校验统一由 api/mock 层模拟后端完成，页面不做真实校验、不写死任何邀请码
				joinClass(code)
					.then(function (res) {
						if (res && res.code === 200) {
							var name = (res.data && res.data.name) || ''
							uni.showToast({ title: '已加入' + name, icon: 'none' })
							// 返回「我的班级」，onShow 自动刷新列表
							setTimeout(function () {
								uni.navigateBack()
							}, 600)
							return
						}
						self.submitting = false
						uni.showToast({ title: (res && res.message) || '加入失败，请重试', icon: 'none' })
					})
					.catch(function () {
						self.submitting = false
						uni.showToast({ title: '网络异常，请重试', icon: 'none' })
					})
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 24rpx var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.form-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 36rpx 28rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.form-label {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

	.code-input {
		margin-top: 24rpx;
		padding: 0 24rpx;
		height: 88rpx;
		line-height: 88rpx;
		border: 1rpx solid var(--app-line);
		border-radius: 20rpx;
		background-color: #FFFFFF;
		font-size: 32rpx;
		letter-spacing: 4rpx;
		color: var(--app-ink);
		box-sizing: border-box;
		width: 100%;
	}

	.code-placeholder {
		color: var(--app-hint);
		letter-spacing: 0;
	}

	.submit-btn {
		margin-top: 32rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.submit-btn.disabled {
		opacity: 0.5;
	}

	.submit-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.form-tip {
		display: block;
		margin-top: 24rpx;
		font-size: 24rpx;
		color: var(--app-hint);
		text-align: center;
		line-height: 1.6;
	}
</style>
