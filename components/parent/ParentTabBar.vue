<template>
	<view class="parent-tabbar">
		<view
			v-for="item in tabs"
			:key="item.key"
			class="tab"
			:class="{ selected: current === item.key }"
			hover-class="tab-hover"
			:hover-stay-time="80"
			@tap="go(item)"
		>
			<view class="tab-icon-wrap">
				<view class="tab-icon" :class="'icon-' + item.key">
					<template v-if="item.key === 'home'">
						<view class="home-roof"></view>
						<view class="home-body"></view>
					</template>
					<template v-else-if="item.key === 'report'">
						<view class="report-sheet">
							<view class="report-line"></view>
							<view class="report-line short"></view>
							<view class="report-line"></view>
						</view>
					</template>
					<template v-else-if="item.key === 'children'">
						<view class="kid kid-one"><view class="kid-head"></view><view class="kid-body"></view></view>
						<view class="kid kid-two"><view class="kid-head"></view><view class="kid-body"></view></view>
					</template>
					<template v-else>
						<view class="person-head"></view>
						<view class="person-body"></view>
					</template>
				</view>
			</view>
			<text class="tab-label">{{ item.label }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'ParentTabBar',
	props: { current: { type: String, default: 'home' } },
	data() {
		return { tabs: [
			{ key: 'home', label: '总览', url: '/pages/parent/home' },
			{ key: 'report', label: '周报', url: '/pages/parent/report' },
			{ key: 'children', label: '孩子', url: '/pages/parent/children' },
			{ key: 'profile', label: '我的', url: '/pages/parent/profile' }
		] }
	},
	methods: {
		go(item) {
			if (item.key === this.current) return
			uni.redirectTo({ url: item.url })
		}
	}
}
</script>

<style>
.parent-tabbar {
	z-index: 20;
	position: relative;
	flex-shrink: 0;
	width: 100%;
	display: flex;
	align-items: flex-start;
	padding: 10rpx 18rpx calc(8rpx + env(safe-area-inset-bottom, 0px));
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.92);
	border-top: 1rpx solid var(--app-line, #D3E8E7);
	box-shadow: 0 -6rpx 20rpx rgba(10, 80, 90, 0.06);
}

.tab {
	flex: 1;
	min-height: 92rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: var(--app-muted, #7B9AA1);
}

.tab-hover {
	opacity: 0.76;
}

.tab-icon-wrap {
	width: 76rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
}

.tab.selected {
	color: var(--app-primary, #0A5C6A);
	font-weight: 600;
}

.tab.selected .tab-icon-wrap {
	background: rgba(18, 181, 165, 0.12);
}

.tab-icon {
	position: relative;
	width: 36rpx;
	height: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: currentColor;
}

.tab-label {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 30rpx;
}

.home-roof {
	position: absolute;
	left: 8rpx;
	top: 5rpx;
	width: 20rpx;
	height: 20rpx;
	border-left: 3rpx solid currentColor;
	border-top: 3rpx solid currentColor;
	border-radius: 2rpx 0 0 0;
	transform: rotate(45deg);
}

.home-body {
	position: absolute;
	left: 6rpx;
	bottom: 4rpx;
	width: 24rpx;
	height: 20rpx;
	box-sizing: border-box;
	border: 3rpx solid currentColor;
	border-top: 0;
	border-radius: 0 0 5rpx 5rpx;
}

.report-sheet {
	width: 25rpx;
	height: 31rpx;
	padding: 6rpx 4rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border: 3rpx solid currentColor;
	border-radius: 5rpx;
}

.report-line {
	width: 100%;
	height: 2rpx;
	border-radius: 2rpx;
	background: currentColor;
	opacity: 0.82;
}

.report-line.short {
	width: 72%;
}

.kid {
	position: absolute;
	bottom: 3rpx;
	width: 15rpx;
	height: 20rpx;
}

.kid-one {
	left: 2rpx;
}

.kid-two {
	right: 2rpx;
}

.kid-head {
	position: absolute;
	top: 0;
	left: 4rpx;
	width: 8rpx;
	height: 8rpx;
	box-sizing: border-box;
	border: 2.5rpx solid currentColor;
	border-radius: 50%;
}

.kid-body {
	position: absolute;
	bottom: 0;
	left: 1rpx;
	width: 13rpx;
	height: 8rpx;
	box-sizing: border-box;
	border: 2.5rpx solid currentColor;
	border-bottom: 0;
	border-radius: 8rpx 8rpx 0 0;
}

.person-head {
	position: absolute;
	top: 2rpx;
	width: 12rpx;
	height: 12rpx;
	box-sizing: border-box;
	border: 3rpx solid currentColor;
	border-radius: 50%;
}

.person-body {
	position: absolute;
	bottom: 4rpx;
	width: 27rpx;
	height: 13rpx;
	box-sizing: border-box;
	border: 3rpx solid currentColor;
	border-bottom: 0;
	border-radius: 14rpx 14rpx 0 0;
}
</style>
