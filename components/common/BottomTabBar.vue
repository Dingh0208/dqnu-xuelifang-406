<template>
	<view class="tab-bar">
		<view
			v-for="tab in tabs"
			:key="tab.key"
			class="tab-item"
			:class="{ active: tab.key === activeKey }"
			hover-class="tab-item-hover"
			:hover-stay-time="80"
			@click="switchTab(tab)"
		>
			<view class="tab-icon-wrap">
				<image
					class="tab-icon"
					:src="tab.key === activeKey ? tab.iconActive : tab.icon"
					mode="aspectFit"
				/>
			</view>
			<text class="tab-text">{{ tab.label }}</text>
		</view>
	</view>
</template>

<script>
	// 统一线性 SVG（stroke-width 1.8）。使用 base64 data URI 兼容小程序 image 组件。
	var ICON_HOME = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjN0I5QUExIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMy41IDEwLjUgMTIgMy41bDguNSA3Ii8+PHBhdGggZD0iTTUuNSA5LjVWMjBoMTNWOS41Ii8+PHBhdGggZD0iTTkuNSAyMHYtNS41aDVWMjAiLz48L3N2Zz4='
	var ICON_HOME_ACTIVE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEE1QzZBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMy41IDEwLjUgMTIgMy41bDguNSA3Ii8+PHBhdGggZD0iTTUuNSA5LjVWMjBoMTNWOS41Ii8+PHBhdGggZD0iTTkuNSAyMHYtNS41aDVWMjAiLz48L3N2Zz4='
	var ICON_BOOK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjN0I5QUExIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA1LjVBMi41IDIuNSAwIDAgMSA2LjUgM0gyMHYxOEg2LjVBMi41IDIuNSAwIDAgMSA0IDE4LjV6Ii8+PHBhdGggZD0iTTQgMTguNUEyLjUgMi41IDAgMCAxIDYuNSAxNkgyMCIvPjxwYXRoIGQ9Ik04IDdoOCIvPjwvc3ZnPg=='
	var ICON_BOOK_ACTIVE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEE1QzZBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA1LjVBMi41IDIuNSAwIDAgMSA2LjUgM0gyMHYxOEg2LjVBMi41IDIuNSAwIDAgMSA0IDE4LjV6Ii8+PHBhdGggZD0iTTQgMTguNUEyLjUgMi41IDAgMCAxIDYuNSAxNkgyMCIvPjxwYXRoIGQ9Ik04IDdoOCIvPjwvc3ZnPg=='
	var ICON_GRID = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjN0I5QUExIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzLjUiIHk9IjMuNSIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjEzLjUiIHk9IjMuNSIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjMuNSIgeT0iMTMuNSIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjEzLjUiIHk9IjEzLjUiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxLjUiLz48L3N2Zz4='
	var ICON_GRID_ACTIVE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEE1QzZBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzLjUiIHk9IjMuNSIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjEzLjUiIHk9IjMuNSIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjMuNSIgeT0iMTMuNSIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjEzLjUiIHk9IjEzLjUiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxLjUiLz48L3N2Zz4='
	var ICON_USER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjN0I5QUExIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjMuNSIvPjxwYXRoIGQ9Ik01IDIwYy44LTMuNiAzLjQtNS41IDctNS41czYuMiAxLjkgNyA1LjUiLz48L3N2Zz4='
	var ICON_USER_ACTIVE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEE1QzZBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjMuNSIvPjxwYXRoIGQ9Ik01IDIwYy44LTMuNiAzLjQtNS41IDctNS41czYuMiAxLjkgNyA1LjUiLz48L3N2Zz4='

	// 页面路由 → Tab key。二级页没有匹配项时 activeKey 为空，避免错误点亮某个主 Tab。
	var ROUTE_TAB_MAP = {
		'pages/index/index': 'index',
		'pages/wrongbook/index': 'wrongbook',
		'pages/workbench/index': 'workbench',
		'pages/profile/index': 'profile'
	}

	export default {
		name: 'BottomTabBar',
		props: {
			// 当前页面标识（兼容旧用法；优先按实际页面路由计算）
			current: {
				type: String,
				default: 'index'
			},
			// 可选：自定义 tab 列表（不传则用学生端默认 4 个 tab）
			// 项结构：{ key, label, url, icon?, iconActive?, placeholder? }
			tabs: {
				type: Array,
				default() {
					return [
						{ key: 'index', label: '首页', icon: ICON_HOME, iconActive: ICON_HOME_ACTIVE, url: '/pages/index/index' },
						{ key: 'wrongbook', label: '错题', icon: ICON_BOOK, iconActive: ICON_BOOK_ACTIVE, url: '/pages/wrongbook/index' },
						{ key: 'workbench', label: '工作台', icon: ICON_GRID, iconActive: ICON_GRID_ACTIVE, url: '/pages/workbench/index' },
						{ key: 'profile', label: '我的', icon: ICON_USER, iconActive: ICON_USER_ACTIVE, url: '/pages/profile/index' }
					]
				}
			}
		},
		computed: {
			activeKey() {
				try {
					var pages = getCurrentPages()
					var current = pages.length ? pages[pages.length - 1] : null
					var route = current && current.route ? current.route.replace(/^\//, '') : ''
					if (route && ROUTE_TAB_MAP[route]) return ROUTE_TAB_MAP[route]
					if (route) return ''
				} catch (e) {}
				return this.current
			}
		},
		methods: {
			switchTab(tab) {
				if (tab.key === this.activeKey) {
					// 已经在目标主页面：不重复跳转
					var pages = getCurrentPages()
					var currentPage = pages.length ? pages[pages.length - 1] : null
					var route = currentPage && currentPage.route ? currentPage.route.replace(/^\//, '') : ''
					if (route === String(tab.url || '').replace(/^\//, '')) return
				}
				// 占位 tab（功能建设中）：仅提示，不跳转
				if (tab.placeholder) {
					uni.showToast({ title: '功能建设中', icon: 'none' })
					return
				}
				// 主页面切换用 redirectTo：关闭当前页再打开目标页，页面栈始终为 1，不堆叠
				uni.redirectTo({ url: tab.url })
			}
		}
	}
</script>

<style>
	.tab-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		display: flex;
		padding: 10rpx 24rpx calc(8rpx + env(safe-area-inset-bottom));
		background: rgba(255, 255, 255, 0.92);
		border-top: 1rpx solid var(--app-line, #D3E8E7);
		box-shadow: 0 -8rpx 24rpx rgba(10, 80, 90, 0.06);
		box-sizing: border-box;
	}

	.tab-item {
		flex: 1;
		min-height: 96rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
	}

	.tab-item-hover {
		opacity: 0.78;
	}

	.tab-icon-wrap {
		width: 64rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		background: transparent;
	}

	.tab-item.active .tab-icon-wrap {
		background: rgba(18, 181, 165, 0.12);
	}

	.tab-icon {
		width: 40rpx;
		height: 40rpx;
	}

	.tab-text {
		margin-top: 4rpx;
		font-size: 22rpx;
		line-height: 1.2;
		color: var(--app-muted, #7B9AA1);
	}

	.tab-item.active .tab-text {
		color: var(--app-primary, #0A5C6A);
		font-weight: 600;
	}
</style>
