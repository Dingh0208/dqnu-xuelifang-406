<template>
	<!-- 班级空状态：白卡内居中图标 + 引导文案（第二人称）+ 创建主按钮 -->
	<view class="empty-card">
		<!-- 空状态图标：浅绿圆底 + 线性班级牌（SVG mask） -->
		<view class="empty-icon">
			<view class="empty-icon-mask"></view>
		</view>
		<text class="empty-text">暂无管理班级，点击下方创建班级吧</text>
		<view class="empty-btn" @tap="$emit('create')">
			<text class="empty-btn-text">＋ 创建班级</text>
		</view>
		<!-- 可选次级出口：无管理班级时返回学生学习空间（默认不渲染，不改变既有用法） -->
		<view v-if="showStudentEntry" class="empty-sub-btn" hover-class="empty-sub-btn-hover" :hover-stay-time="80" @tap="$emit('student')">
			<text class="empty-sub-text">进入学生学习空间</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TeacherEmpty',
		props: {
			// 是否显示「进入学生学习空间」次级出口（工作空间切换用）
			showStudentEntry: {
				type: Boolean,
				default: false
			}
		}
	}
</script>

<style>
.empty-card { background: var(--app-surface-solid); border-radius: var(--app-radius); padding: 56rpx 28rpx; display: flex; flex-direction: column; align-items: center; box-shadow: var(--app-shadow-soft); border: 1rpx solid var(--app-line); box-sizing: border-box; }
.empty-icon { width: 88rpx; height: 88rpx; border-radius: 50%; background: var(--app-surface-soft); display: flex; align-items: center; justify-content: center; }
.empty-icon-mask { width: 40rpx; height: 40rpx; background-color: var(--app-primary); -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='14' rx='2'/%3E%3Cpath d='M7 9h6'/%3E%3Cpath d='M7 13h10'/%3E%3C/svg%3E"); -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; }
.empty-text { margin-top: 20rpx; font-size: 25rpx; line-height: 1.5; color: var(--app-muted); text-align: center; }
.empty-btn { margin-top: 28rpx; height: 80rpx; padding: 0 44rpx; border-radius: 999rpx; background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%); box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18); display: flex; align-items: center; justify-content: center; }
.empty-btn-text { font-size: 27rpx; font-weight: 600; color: #FFFFFF; line-height: 1; }
.empty-sub-btn { margin-top: 20rpx; height: 80rpx; padding: 0 44rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.92); border: 1rpx solid var(--app-line); display: flex; align-items: center; justify-content: center; }
.empty-sub-btn-hover { background: var(--app-surface-soft); }
.empty-sub-text { font-size: 26rpx; font-weight: 500; color: var(--app-primary); line-height: 1; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
