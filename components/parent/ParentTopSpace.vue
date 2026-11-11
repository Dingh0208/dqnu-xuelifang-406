<template>
	<view class="top-space" :style="topSpaceStyle">
		<view class="top-orb top-orb--sky"></view>
		<view class="top-orb top-orb--mint"></view>
	</view>
</template>

<script>
export default {
	data() {
		return { topSpaceStyle: {} }
	},
	mounted() {
		this.updateTopSpace()
	},
	methods: {
		updateTopSpace() {
			var systemInfo = {}
			var menuButtonRect
			try { systemInfo = uni.getSystemInfoSync() || {} } catch (e) {}
			try {
				if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
					menuButtonRect = uni.getMenuButtonBoundingClientRect()
				} else if (typeof wx !== 'undefined' && typeof wx.getMenuButtonBoundingClientRect === 'function') {
					menuButtonRect = wx.getMenuButtonBoundingClientRect()
				}
			} catch (e) {}

			var statusBarHeight = Number(systemInfo.statusBarHeight) || 0
			var windowWidth = Number(systemInfo.windowWidth) || 375
			var rpxToPx = windowWidth / 750
			var height
			if (menuButtonRect && typeof menuButtonRect.bottom === 'number') {
				var topGap = typeof menuButtonRect.top === 'number'
					? Math.max(menuButtonRect.top - statusBarHeight, 0)
					: 0
				height = menuButtonRect.bottom + topGap
			} else {
				height = statusBarHeight + (88 * rpxToPx)
			}
			this.topSpaceStyle = {
				height: height + 'px',
				paddingTop: statusBarHeight + 'px'
			}
		}
	}
}
</script>

<style>
.top-space {
	position: relative;
	width: 100%;
	flex-shrink: 0;
	min-height: 88rpx;
	box-sizing: border-box;
	overflow: hidden;
	background: transparent;
}

.top-orb {
	position: absolute;
	border-radius: 50%;
	pointer-events: none;
}

.top-orb--sky {
	left: -100rpx;
	top: -150rpx;
	width: 360rpx;
	height: 360rpx;
	background: radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, rgba(56, 189, 248, 0) 70%);
}

.top-orb--mint {
	right: -120rpx;
	top: -170rpx;
	width: 400rpx;
	height: 400rpx;
	background: radial-gradient(circle, rgba(18, 181, 165, 0.16) 0%, rgba(18, 181, 165, 0) 70%);
}
</style>
