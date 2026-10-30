<template>
  <view class="tab-bar">
    <view v-for="tab in tabs" :key="tab.key" class="tab-item" :class="{ active: tab.key === current }" @tap="onTap(tab)">
      <view class="tab-icon-wrap"><view class="tab-icon" :class="'ic-' + tab.key"></view></view>
      <text class="tab-label">{{ tab.label }}</text>
      <view v-if="tab.key === current" class="active-dot"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TeacherTabBar',
  props: {
    // Keep the existing key names so existing pages and callers remain compatible.
    current: { type: String, default: 'home' },
    classId: { type: String, default: '' }
  },
  data() {
    return {
      // Screenshot labels: 工作台 / 学情 / 作业 / 我的.
      // The existing teaching key and route remain compatible with task pages.
      tabs: [
        { key: 'home', label: '工作台', url: '/pages/teacher/home' },
        { key: 'class', label: '学情', url: '/pages/teacher/class/analytics' },
        { key: 'teaching', label: '作业', url: '/pages/teacher/teaching/index' },
        { key: 'profile', label: '我的', url: '/pages/teacher/profile/index' }
      ]
    }
  },
  methods: {
    onTap(tab) {
      if (tab.key === this.current) return
      if (tab.key === 'class' && !this.classId) {
        // The existing analytics API requires a class; let the class center provide the choice.
        uni.navigateTo({ url: '/pages/teacher/class/index?from=analytics' })
        return
      }
      var url = tab.url
      if (tab.key === 'class' && this.classId) url += '?classId=' + encodeURIComponent(this.classId)
      uni.redirectTo({ url: url })
    }
  }
}
</script>

<style>
.tab-bar {
	flex-shrink: 0;
	height: 100rpx;
	padding-bottom: env(safe-area-inset-bottom);
	box-sizing: content-box;
	display: flex;
	background: rgba(255, 255, 255, 0.94);
	border-top: 1rpx solid var(--app-line);
	box-shadow: 0 -6rpx 20rpx rgba(10, 80, 90, 0.08);
}
.tab-item {
	position: relative;
	flex: 1;
	height: 100rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: var(--app-muted);
}
.tab-item.active { color: var(--app-primary); }
.tab-icon-wrap {
	width: 64rpx;
	height: 44rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.tab-item.active .tab-icon-wrap { background: rgba(18, 181, 165, 0.12); }
.tab-icon {
	width: 42rpx;
	height: 42rpx;
	background: currentColor;
	-webkit-mask-repeat: no-repeat;
	-webkit-mask-position: center;
	-webkit-mask-size: contain;
}
.ic-home { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='7' height='7' rx='1'/%3E%3Crect x='14' y='3' width='7' height='7' rx='1'/%3E%3Crect x='3' y='14' width='7' height='7' rx='1'/%3E%3Crect x='14' y='14' width='7' height='7' rx='1'/%3E%3C/svg%3E"); }
.ic-class { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 20v-9'/%3E%3Cpath d='M10 20V5'/%3E%3Cpath d='M16 20v-6'/%3E%3Cpath d='M22 20H2'/%3E%3C/svg%3E"); }
.ic-teaching { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='6' y='3' width='12' height='18' rx='2'/%3E%3Cpath d='M9 8h6M9 12h6M9 16h4'/%3E%3C/svg%3E"); }
.ic-profile { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 21c.8-4 3.5-6 8-6s7.2 2 8 6'/%3E%3C/svg%3E"); }
.tab-label { margin-top: 4rpx; font-size: 22rpx; line-height: 30rpx; font-weight: 500; color: currentColor; }
.tab-item.active .tab-label { font-weight: 600; }
.active-dot { display: none; }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
