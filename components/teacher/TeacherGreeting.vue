<template>
	<!-- 问候区：仅左侧问候语 + 副文案；右侧不放任何操作（退出已移至顶部导航栏） -->
	<view class="greeting-row">
		<text class="greeting-title">{{ greeting }}，{{ teacherName }}</text>
		<!-- 副标题由首页传入真实待办摘要；加载/错误态为空时不渲染，避免空行占位 -->
		<text v-if="subtitle" class="greeting-sub">{{ subtitle }}</text>
	</view>
</template>

<script>
	export default {
		name: 'TeacherGreeting',
		props: {
			// 时段问候：早上好/下午好/晚上好（来自接口）
			greeting: {
				type: String,
				default: ''
			},
			// 教师姓名（来自登录态/接口，非硬编码）
			teacherName: {
				type: String,
				default: '老师'
			},
			// 次级文案
			subtitle: {
				type: String,
				default: '今天也一起关注学生的学习'
			}
		}
	}
</script>

<style>
.greeting-row { display: flex; flex-direction: column; }
.greeting-title { font-size: 38rpx; font-weight: 600; line-height: 1.35; color: var(--app-ink); }
.greeting-sub { margin-top: 8rpx; font-size: 24rpx; font-weight: 400; line-height: 1.5; color: var(--app-muted); }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
