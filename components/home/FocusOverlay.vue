<template>
	<view v-if="visible && task" class="focus-mask">
		<view class="focus-card">
			<view class="focus-close" @click="onClose">×</view>
			<text class="focus-kicker">专注学习</text>
			<text class="focus-title">{{ task.title }}</text>
			<text class="focus-sub">{{ task.description }}</text>

			<view class="focus-ring">
				<view class="focus-time">{{ timeText }}</view>
				<text class="focus-total">计划 {{ totalMinutes }} 分钟</text>
			</view>

			<view class="focus-actions">
				<view v-if="!finished" class="focus-btn primary" @click="toggle">
					<text>{{ running ? '暂停' : '开始专注' }}</text>
				</view>
				<view v-else class="focus-btn primary" @click="confirmDone">
					<text>完成并打卡</text>
				</view>
				<view class="focus-btn ghost" @click="onClose">
					<text>关闭</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	// 极简专注浮层：从任务预计时长倒计时，结束后可一键把任务标记为完成。
	// 计时只作用于本地浮层，不改 taskState；完成由父页面统一处理。
	export default {
		name: 'FocusOverlay',
		props: {
			visible: { type: Boolean, default: false },
			task: { type: Object, default: null }
		},
		data() {
			return {
				remaining: 0,   // 剩余秒数
				running: false,
				finished: false
			}
		},
		computed: {
			totalMinutes() {
				var t = this.task || {}
				var m = Number(t.estimatedMinutes)
				return m > 0 ? m : 25
			},
			timeText() {
				var m = Math.floor(this.remaining / 60)
				var s = this.remaining % 60
				return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s)
			}
		},
		watch: {
			visible(val) {
				if (val) {
					this.reset()
				} else {
					this.stop()
				}
			}
		},
		methods: {
			reset() {
				this.remaining = this.totalMinutes * 60
				this.running = false
				this.finished = false
			},
			start() {
				if (this.timer) return
				this.running = true
				var self = this
				this.timer = setInterval(function () {
					if (self.remaining <= 0) {
						self.finished = true
						self.running = false
						self.stop()
						return
					}
					self.remaining -= 1
				}, 1000)
			},
			stop() {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
			},
			toggle() {
				if (this.running) {
					this.running = false
					this.stop()
				} else {
					this.start()
				}
			},
			confirmDone() {
				this.$emit('complete', this.task)
			},
			onClose() {
				this.stop()
				this.$emit('close')
			}
		},
		onUnload() {
			this.stop()
		}
	}
</script>

<style>
	.focus-mask {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 300;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 64rpx;
		background: var(--app-mask, rgba(8, 42, 48, 0.46));
	}

	.focus-card {
		position: relative;
		width: 100%;
		padding: 48rpx 36rpx 36rpx;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 36rpx;
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.focus-close {
		position: absolute;
		top: 20rpx;
		right: 24rpx;
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 44rpx;
		color: var(--app-hint, #A9C2C6);
	}

	.focus-kicker {
		font-size: 22rpx;
		font-weight: 600;
		letter-spacing: 2rpx;
		color: var(--app-primary, #0A5C6A);
	}

	.focus-title {
		margin-top: 16rpx;
		font-size: 34rpx;
		font-weight: 600;
		line-height: 1.4;
		text-align: center;
		color: var(--app-ink, #0D2F36);
	}

	.focus-sub {
		margin-top: 10rpx;
		font-size: 24rpx;
		line-height: 1.6;
		text-align: center;
		color: var(--app-muted, #7B9AA1);
	}

	.focus-ring {
		width: 280rpx;
		height: 280rpx;
		margin: 36rpx 0 30rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(10, 92, 106, 0.10) 0%, rgba(18, 181, 165, 0.14) 100%);
		border: 2rpx solid var(--app-accent-soft, #8FE3D8);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.focus-time {
		font-size: 76rpx;
		font-weight: 600;
		color: var(--app-primary, #0A5C6A);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.focus-total {
		margin-top: 14rpx;
		font-size: 23rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.focus-actions {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.focus-btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		font-size: 28rpx;
		font-weight: 600;
	}

	.focus-btn.primary {
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.focus-btn.ghost {
		margin-left: 20rpx;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		color: var(--app-primary, #0A5C6A);
	}
</style>
