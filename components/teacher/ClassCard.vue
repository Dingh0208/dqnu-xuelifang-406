<template>
	<!-- 班级卡：白底 / 16px 圆角 / 绿调柔投影 / 16px 内边距；四行紧凑结构 -->
	<view class="class-card" @tap="$emit('view', cls)">
		<!-- 第 1 行：班名（超长省略） + 查看→ -->
		<view class="card-head">
			<text class="class-name">{{ cls.name }}</text>
			<view class="view-link" @tap.stop="$emit('view', cls)">
				<text class="view-text">查看</text>
				<view class="view-arrow arrow-mask"></view>
			</view>
		</view>

		<!-- 第 2 行：学生数 · 进行中任务数（口径：该班 Task.status === 'active' 的数量） -->
		<text class="class-meta">{{ cls.studentCount }} 名学生 · 进行中 {{ cls.activeTaskCount }} 个任务</text>

		<!-- 第 3 行：进度条 + 完成率同行；completionRate 为 null（无任务）时显示空态，不显示 0% -->
		<view v-if="cls.completionRate !== null" class="progress-row">
			<view class="progress-track">
				<view class="progress-fill" :style="{ width: fillWidth + '%' }"></view>
			</view>
			<text class="progress-text">完成率 {{ cls.completionRate }}%</text>
		</view>
		<text v-else class="progress-empty">暂无任务数据</text>
	</view>
</template>

<script>
	export default {
		name: 'ClassCard',
		props: {
			// 班级摘要：{ name, studentCount, activeTaskCount, completionRate }（与 Mock 契约一致；completionRate 可为 null）
		cls: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				// 进度动画：初始 0，挂载后过渡到目标百分比
				fillWidth: 0
			}
		},
		computed: {
			// 边界收敛：0~100，异常值（null/负数/超界）安全兜底
			targetProgress() {
				var p = Number(this.cls.completionRate)
				if (isNaN(p) || p < 0) return 0
				if (p > 100) return 100
				return p
			}
		},
		mounted() {
			// 下一帧再赋值，确保 transition 生效（0 → 目标宽度）
			setTimeout(() => {
				this.fillWidth = this.targetProgress
			}, 50)
		}
	}
</script>

<style>
.class-card {
	background: var(--app-surface-solid);
	border: 1rpx solid var(--app-line);
	border-radius: var(--app-radius);
	padding: 28rpx;
	margin-bottom: 16rpx;
	box-shadow: var(--app-shadow-soft);
	box-sizing: border-box;
}
.card-head { display: flex; align-items: center; justify-content: space-between; }
.class-name { min-width: 0; font-size: 32rpx; font-weight: 600; color: var(--app-ink); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.view-link { flex-shrink: 0; display: flex; align-items: center; margin-left: 16rpx; padding: 8rpx 0; }
.view-text { font-size: 25rpx; font-weight: 500; color: var(--app-accent); line-height: 1; }
.view-arrow { width: 26rpx; height: 26rpx; margin-left: 6rpx; }
.arrow-mask { background-color: var(--app-accent); -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12h14'/%3E%3Cpath d='M12 5l7 7-7 7'/%3E%3C/svg%3E"); -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; }
.class-meta { display: block; margin-top: 10rpx; font-size: 24rpx; line-height: 1.5; color: var(--app-muted); }
.progress-row { display: flex; align-items: center; margin-top: 16rpx; }
.progress-track { flex: 1; height: 10rpx; border-radius: 999rpx; background: var(--teacher-track); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999rpx; background: linear-gradient(90deg, #0A5C6A 0%, #12B5A5 100%); transition: width 0.5s ease-out; }
.progress-text { flex-shrink: 0; margin-left: 16rpx; font-size: 23rpx; font-weight: 500; color: var(--app-primary); line-height: 1.3; white-space: nowrap; }
.progress-empty { display: block; margin-top: 16rpx; font-size: 23rpx; color: var(--app-muted); line-height: 1.4; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
