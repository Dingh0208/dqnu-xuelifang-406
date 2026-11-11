<template>
	<!-- 快捷操作：两个等宽胶囊（flex:1 均分），间距 12px，等高 48px，全圆角 -->
	<view class="action-row">
		<!-- 次操作（低频）：创建班级 → 描边胶囊 + 强调色加号图标 -->
		<view class="action-btn btn-secondary" hover-class="btn-secondary-hover" :hover-stay-time="80" @tap="$emit('create')">
			<view class="btn-icon icon-plus"></view>
			<text class="btn-text btn-text-secondary">创建班级</text>
		</view>
		<!-- 主操作（高频）：布置任务 → 实心强调色胶囊 + 白色清单图标 -->
		<view class="action-btn btn-primary" hover-class="btn-primary-hover" :hover-stay-time="80" @tap="$emit('assign')">
			<view class="btn-icon icon-clip"></view>
			<text class="btn-text btn-text-primary">布置任务</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'QuickActions'
	}
</script>

<style>
.action-row { display: flex; }
.action-btn { flex: 1; height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; box-sizing: border-box; }
.action-btn:last-child { margin-right: 0; }
.btn-primary { background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%); box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18); }
.btn-secondary { background: rgba(255, 255, 255, 0.92); border: 1rpx solid var(--app-line); }
.btn-primary-hover, .btn-secondary-hover { opacity: 0.9; }
.btn-icon { width: 32rpx; height: 32rpx; margin-right: 12rpx; }
.icon-plus { background-color: var(--app-primary); -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 5v14'/%3E%3Cpath d='M5 12h14'/%3E%3C/svg%3E"); -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; }
.icon-clip { background-color: #FFFFFF; -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='8' y='2' width='8' height='4' rx='1'/%3E%3Cpath d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/%3E%3Cpath d='M9 12h6'/%3E%3Cpath d='M9 16h6'/%3E%3C/svg%3E"); -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; }
.btn-text { font-size: 28rpx; font-weight: 600; line-height: 1; }
.btn-text-primary { color: #FFFFFF; }
.btn-text-secondary { color: var(--app-primary); }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
