<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">向开发者提建议</text>
		</view>

		<!-- 建议类型 -->
		<view class="section-card">
			<text class="section-title">建议类型</text>
			<view class="type-row">
				<text
					v-for="t in types"
					:key="t.key"
					class="type-tag"
					:class="{ active: form.type === t.key }"
					@click="form.type = t.key"
				>{{ t.label }}</text>
			</view>
		</view>

		<!-- 建议内容 -->
		<view class="section-card">
			<text class="section-title">建议内容</text>
			<textarea
				class="content-input"
				v-model="form.content"
				:maxlength="500"
				placeholder="请详细描述你的建议或遇到的问题…"
				placeholder-class="placeholder"
			/>
			<text class="char-count">{{ form.content.length }}/500</text>
		</view>

		<!-- 联系方式（可选） -->
		<view class="section-card">
			<text class="section-title">联系方式（可选）</text>
			<input
				class="contact-input"
				v-model="form.contact"
				placeholder="留下邮箱或微信号，方便我们回复"
				placeholder-class="placeholder"
			/>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-btn" :class="{ disabled: !canSubmit || submitting }" @click="onSubmit">
			<text class="submit-text">{{ submitting ? '提交中…' : '提交建议' }}</text>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { submitFeedback } from '@/api/my.js'

	export default {
		data() {
			return {
				types: [
					{ key: 'feature', label: '功能建议' },
					{ key: 'ux', label: '页面体验' },
					{ key: 'content', label: '学习内容' },
					{ key: 'bug', label: 'Bug反馈' },
					{ key: 'other', label: '其他' }
				],
				form: {
					type: 'feature',
					content: '',
					images: [],  // 图片上传预留，当前不实现
					contact: ''
				},
				submitting: false
			}
		},
		computed: {
			canSubmit() {
				return this.form.content.trim().length > 0
			}
		},
		methods: {
			onSubmit() {
				if (!this.canSubmit || this.submitting) return
				this.submitting = true
				// 请求结构预留：{ type, content, images, contact }
				submitFeedback({
					type: this.form.type,
					content: this.form.content,
					images: this.form.images,
					contact: this.form.contact
				})
					.then(() => {
						this.submitting = false
						uni.showToast({ title: '已提交，感谢反馈', icon: 'success' })
						// 重置表单
						this.form.content = ''
						this.form.contact = ''
						this.form.type = 'feature'
					})
					.catch(() => {
						this.submitting = false
						uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
					})
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
		padding: 22rpx 0 22rpx;
	}

	.section-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 28rpx;
		margin-bottom: 22rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-ink);
		margin-bottom: 18rpx;
	}

	.type-row {
		display: flex;
		flex-wrap: wrap;
	}

	.type-tag {
		padding: 12rpx 26rpx;
		margin: 0 14rpx 14rpx 0;
		font-size: 24rpx;
		color: #0A6B63;
		background: rgba(18, 181, 165, 0.08);
		border: 1rpx solid rgba(18, 181, 165, 0.20);
		border-radius: 999rpx;
	}

	.type-tag.active {
		color: #FFFFFF;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-color: transparent;
	}

	.content-input {
		width: 100%;
		min-height: 220rpx;
		background: #FFFFFF;
		border: 1rpx solid var(--app-line);
		border-radius: 20rpx;
		padding: 22rpx;
		box-sizing: border-box;
		font-size: 27rpx;
		color: var(--app-ink);
		line-height: 1.6;
	}

	.placeholder {
		color: var(--app-hint);
		font-size: 26rpx;
	}

	.char-count {
		display: block;
		text-align: right;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: var(--app-hint);
	}

	.contact-input {
		width: 100%;
		height: 88rpx;
		background: #FFFFFF;
		border: 1rpx solid var(--app-line);
		border-radius: 20rpx;
		padding: 0 22rpx;
		box-sizing: border-box;
		font-size: 27rpx;
		color: var(--app-ink);
	}

	.submit-btn {
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: 999rpx;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.submit-btn.disabled {
		opacity: 0.5;
	}

	.submit-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.bottom-space {
		height: 60rpx;
	}
</style>
