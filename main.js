import App from './App'

// 全局登录守卫：小程序冷启动、扫码、分享直达不经过 uni.addInterceptor，
// 统一在每个页面的 onShow 兜底检查登录态（学生/教师/家长共用）。
import { isLoggedIn } from '@/api/auth.js'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	app.mixin({
		onShow() {
			try {
				var pages = getCurrentPages()
				var current = pages.length ? pages[pages.length - 1] : null
				var route = current && current.route ? current.route : ''
				if (!route || route.indexOf('pages/auth/') === 0) return
				if (!isLoggedIn()) {
					uni.reLaunch({ url: '/pages/auth/select' })
				}
			} catch (e) {}
		},
		computed: {
			teacherTopBarStyle() {
				var systemInfo = {}
				var menuButtonRect
				try {
					systemInfo = uni.getSystemInfoSync() || {}
				} catch (e) {}

				try {
					if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
						menuButtonRect = uni.getMenuButtonBoundingClientRect()
					} else if (typeof wx !== 'undefined' && typeof wx.getMenuButtonBoundingClientRect === 'function') {
						menuButtonRect = wx.getMenuButtonBoundingClientRect()
					}
				} catch (e) {}

				var style = {}
				var statusBarHeight = systemInfo.statusBarHeight
				if (typeof statusBarHeight === 'number') {
					style.paddingTop = statusBarHeight + 'px'
					if (menuButtonRect && typeof menuButtonRect.bottom === 'number') {
						var menuButtonTopGap = typeof menuButtonRect.top === 'number'
							? Math.max(menuButtonRect.top - statusBarHeight, 0)
							: 0
						style.height = (menuButtonRect.bottom + menuButtonTopGap) + 'px'
					} else {
						style.height = 'calc(88rpx + ' + statusBarHeight + 'px)'
					}
				}
				var rpxToPx = typeof systemInfo.windowWidth === 'number' ? systemInfo.windowWidth / 750 : 1
				style['--teacher-top-action-top'] = menuButtonRect && typeof menuButtonRect.bottom === 'number'
					? (menuButtonRect.bottom + 8) + 'px'
					: ((typeof statusBarHeight === 'number' ? statusBarHeight : 0) + 96 * rpxToPx) + 'px'
				style['--teacher-top-action-right'] = typeof systemInfo.windowWidth === 'number' && menuButtonRect && typeof menuButtonRect.right === 'number'
					? (systemInfo.windowWidth - menuButtonRect.right) + 'px'
					: (32 * rpxToPx) + 'px'
				return style
			}
		}
	})
	return {
		app
	}
}
// #endif
