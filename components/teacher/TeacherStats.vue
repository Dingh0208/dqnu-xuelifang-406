<template>
	<!-- 数据概览卡组：2 张等宽可点击卡（整卡热区，点击 emit tap）；0 值数字弱化 -->
	<view class="stat-row">
		<view class="stat-card" hover-class="stat-card-hover" :hover-stay-time="60" @tap="$emit('tap', 'class')">
			<text class="stat-num" :class="{ 'num-zero': classCount === 0 }">{{ classCount }}</text>
			<text class="stat-label">班级</text>
		</view>
		<view class="stat-card" hover-class="stat-card-hover" :hover-stay-time="60" @tap="$emit('tap', 'student')">
			<text class="stat-num" :class="{ 'num-zero': studentCount === 0 }">{{ studentCount }}</text>
			<text class="stat-label">学生</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TeacherStats',
		props: {
			// 班级数
			classCount: {
				type: Number,
				default: 0
			},
			// 学生数
			studentCount: {
				type: Number,
				default: 0
			}
		}
	}
</script>

<style>
.stat-row { display: flex; }
.stat-card { flex: 1; background: var(--app-surface-solid); border: 1rpx solid var(--app-line); border-radius: var(--app-radius); padding: 24rpx 0; margin-right: 16rpx; display: flex; flex-direction: column; align-items: center; box-shadow: var(--app-shadow-soft); box-sizing: border-box; }
.stat-card:last-child { margin-right: 0; }
.stat-card-hover { background: var(--app-surface-soft); }
.stat-num { font-size: 40rpx; font-weight: 600; line-height: 1.2; color: var(--app-accent); font-variant-numeric: tabular-nums; }
.stat-num.num-zero { color: var(--app-muted); }
.stat-label { margin-top: 4rpx; font-size: 23rpx; font-weight: 400; line-height: 1.3; color: var(--app-muted); }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
