<template>
	<view class="parent-page">
		<ParentTopSpace />
		<scroll-view class="parent-scroll scroll" scroll-y :show-scrollbar="false" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="refresh">
			<view class="parent-content">
				<view class="parent-heading">
					<text class="parent-title">成长陪伴</text>
					<text class="parent-subtitle">孩子的每一步，都看得见</text>
				</view>

				<view v-if="children.length" class="child-switch">
					<view
						v-for="child in children"
						:key="child.id"
						class="child-pill"
						:class="{ active: child.id === activeChildId }"
						hover-class="aq-tap"
						:hover-stay-time="80"
						@tap="switchChild(child.id)"
					>
						<text>{{ child.relation }} · {{ child.grade }}</text>
					</view>
				</view>

				<view v-if="loading" class="parent-state">
					<view class="aq-spinner"></view>
					<text class="parent-state-title">正在整理孩子的学习进展…</text>
					<text class="parent-state-desc">马上就好</text>
				</view>
				<view v-else-if="error" class="parent-state">
					<text class="parent-state-title">暂时无法加载数据</text>
					<text class="parent-state-desc">请检查网络后重试</text>
					<view class="aq-btn aq-btn-primary parent-state-action" hover-class="aq-tap" :hover-stay-time="80" @tap="load"><text>重新加载</text></view>
				</view>
				<view v-else-if="!children.length" class="parent-state">
					<text class="parent-state-title">还没有绑定孩子</text>
					<text class="parent-state-desc">绑定孩子后，这里会显示学习与成长数据</text>
					<view class="aq-btn aq-btn-secondary parent-state-action" hover-class="aq-tap" :hover-stay-time="80" @tap="goProfile"><text>去绑定</text></view>
				</view>
				<template v-else>
					<view class="aq-card stats-card">
						<view class="stat">
							<text class="stat-number">{{ home.stats.studyHours }}<text class="stat-unit">h</text></text>
							<text class="stat-label">本周学习时长</text>
							<text class="stat-change">环比 {{ home.stats.studyDelta }}</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat">
							<text class="stat-number">{{ home.stats.newWrong }}</text>
							<text class="stat-label">本周新增错题</text>
							<text class="stat-change">{{ home.stats.wrongDelta }}</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat">
							<text class="stat-number">{{ home.stats.masteredWrong }}</text>
							<text class="stat-label">已攻克错题</text>
							<text class="stat-change">攻克率 {{ home.stats.masteryRate }}%</text>
						</view>
					</view>

					<view class="aq-hero hero-report" hover-class="aq-tap" :hover-stay-time="80" @tap="openReport">
						<view class="report-head">
							<text class="report-eyebrow">{{ home.weeklyReport.weekLabel }}</text>
							<text class="report-chip">周报</text>
						</view>
						<view class="report-main">
							<view class="report-number-group">
								<text class="report-number">{{ home.weeklyReport.masteryDelta }}</text>
								<text class="report-label">掌握率环比</text>
							</view>
							<text class="report-hint">本周趋势</text>
						</view>
						<view class="trend-chart">
							<view v-for="(point, index) in home.weeklyReport.chart" :key="index" class="trend-point" :style="trendStyle(point, index)"></view>
							<view v-for="(point, index) in home.weeklyReport.chart.slice(0, home.weeklyReport.chart.length - 1)" :key="'line-' + index" class="trend-line" :style="lineStyle(point, home.weeklyReport.chart[index + 1], index)"></view>
						</view>
						<view class="report-foot">
							<text class="report-progress">{{ home.weeklyReport.reviewProgress }}</text>
							<view class="aq-btn aq-btn-ghost report-button"><text>查看完整周报</text></view>
						</view>
						<text class="report-sync">{{ home.weeklyReport.syncText }}</text>
					</view>

					<view class="section-heading"><text>错题分布</text><text>近 30 天 · 按学科</text></view>
					<view class="aq-card distribution-card">
						<view v-for="(item, index) in home.wrongDistribution" :key="item.subject" class="distribution-row">
							<view class="distribution-head"><text class="distribution-subject">{{ item.subject }}</text><text class="distribution-value">{{ item.count }} 题 · {{ item.percent }}%</text></view>
							<view class="track"><view class="track-fill" :style="{ width: item.percent + '%' }"></view></view>
							<view v-if="index < home.wrongDistribution.length - 1" class="row-divider"></view>
						</view>
					</view>

					<view class="aq-card-soft advice-card">
						<text class="advice-kicker">{{ home.advice.title }}</text>
						<text class="advice-text">{{ home.advice.text }}</text>
						<view class="advice-actions">
							<view class="aq-btn aq-btn-primary" hover-class="aq-tap" :hover-stay-time="80" @tap="setReminder"><text>约定提醒 · 周六 15:00</text></view>
							<text v-if="home.reminder" class="reminder-note">已提醒 {{ home.reminder.text }}</text>
						</view>
					</view>
				</template>
				<view class="bottom-space"></view>
			</view>
		</scroll-view>
		<ParentTabBar current="home" />
	</view>
</template>

<script>
import ParentTopSpace from '@/components/parent/ParentTopSpace.vue'
import ParentTabBar from '@/components/parent/ParentTabBar.vue'
import { getParentHome, createReminder } from '@/api/parent/dashboard.js'
import * as authApi from '@/api/auth.js'
import { getActiveChildId, setActiveChildId } from '@/utils/parentState.js'
import { getParentChartPointStyle, getParentChartLineStyle } from '@/utils/parentChart.js'

export default {
	components: { ParentTopSpace, ParentTabBar },
	data() {
		return { loading: true, refreshing: false, error: false, activeChildId: '', children: [], chartSize: { width: 0, height: 0 }, home: { stats: {}, weeklyReport: { chart: [] }, wrongDistribution: [], advice: {} } }
	},
	onShow() { if (!authApi.requireParent()) return; this.load() },
	methods: {
		load() {
			this.loading = true; this.error = false
			var self = this
			return getParentHome(getActiveChildId()).then(function (res) {
				if (!res || res.code !== 200) throw res
				self.home = Object.assign({}, self.home, res.data || {})
				self.children = self.home.children || []
				self.activeChildId = (self.home.child && self.home.child.id) || (self.children[0] && self.children[0].id) || ''
				if (self.activeChildId) setActiveChildId(self.activeChildId)
			}).catch(function () { self.error = true }).then(function () {
				self.loading = false
				self.$nextTick(function () { self.measureChart() })
			})
		},
		refresh() { var self = this; this.refreshing = true; this.load().then(function () { self.refreshing = false }) },
		switchChild(id) { if (id === this.activeChildId) return; setActiveChildId(id); this.load() },
		goProfile() { uni.redirectTo({ url: '/pages/parent/profile' }) },
		openReport() { uni.redirectTo({ url: '/pages/parent/report' }) },
		setReminder() {
			var self = this
			createReminder({ childId: this.activeChildId, text: '周六 15:00' }).then(function (res) {
				if (!res || res.code !== 200) throw res
				self.home.reminder = res.data
				uni.showToast({ title: '提醒已设置', icon: 'success' })
			}).catch(function (err) { uni.showToast({ title: (err && err.message) || '设置失败', icon: 'none' }) })
		},
		measureChart() {
			var self = this
			uni.createSelectorQuery().select('.trend-chart').boundingClientRect(function (rect) {
				if (rect) self.chartSize = { width: rect.width, height: rect.height }
			}).exec()
		},
		trendStyle(value, index) { return getParentChartPointStyle(value, index, this.chartSize, 3, 12, 82, -1) },
		lineStyle(from, to, index) { return getParentChartLineStyle(from, to, index, this.chartSize, 3, 12, 82, -1) }
	}
}
</script>

<style>
@import "../../components/parent/parent-theme.css";

.scroll { flex: 1; height: 0; min-height: 0; }
.bottom-space { height: 24rpx; }

.child-switch {
	display: flex;
	margin: 0 4rpx 22rpx;
	overflow-x: auto;
}

.child-pill {
	flex-shrink: 0;
	min-width: 196rpx;
	margin-right: 14rpx;
	padding: 16rpx 24rpx;
	box-sizing: border-box;
	border: 1rpx solid var(--app-line);
	border-radius: 999rpx;
	background: var(--app-surface);
	color: var(--app-muted);
	text-align: center;
	font-size: 25rpx;
	font-weight: 500;
}

.child-pill:last-child {
	margin-right: 0;
}

.child-pill.active {
	border-color: var(--app-accent-soft);
	background: rgba(18, 181, 165, 0.12);
	color: var(--app-primary);
	font-weight: 600;
}

.stats-card {
	display: flex;
	align-items: stretch;
	padding: 28rpx 16rpx;
}

.stat {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.stat-number {
	color: var(--app-ink);
	font-size: 40rpx;
	line-height: 46rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.stat-unit {
	color: var(--app-copy);
	font-size: 24rpx;
}

.stat-label {
	margin-top: 8rpx;
	color: var(--app-muted);
	font-size: 23rpx;
	line-height: 32rpx;
}

.stat-change {
	margin-top: 4rpx;
	color: var(--app-positive);
	font-size: 22rpx;
	line-height: 30rpx;
}

.stat-divider {
	width: 1rpx;
	margin: 8rpx 10rpx;
	background: var(--app-line);
}

.hero-report {
	margin-top: 24rpx;
	padding: 28rpx 30rpx 24rpx;
}

.report-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.report-eyebrow {
	color: rgba(255, 255, 255, 0.72);
	font-size: 24rpx;
	line-height: 34rpx;
}

.report-chip {
	display: inline-flex;
	padding: 7rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.16);
	color: #E8FFFB;
	font-size: 21rpx;
	line-height: 1.4;
}

.report-main {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	margin-top: 18rpx;
}

.report-number {
	color: #FFFFFF;
	font-size: 56rpx;
	line-height: 64rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.report-label {
	display: block;
	margin-top: 2rpx;
	color: rgba(255, 255, 255, 0.66);
	font-size: 23rpx;
	line-height: 32rpx;
}

.report-hint {
	color: rgba(255, 255, 255, 0.80);
	font-size: 23rpx;
	line-height: 32rpx;
}

.trend-chart {
	position: relative;
	height: 118rpx;
	margin: 18rpx 8rpx 4rpx 20%;
}

.trend-point {
	position: absolute;
	width: 12rpx;
	height: 12rpx;
	margin: -6rpx;
	border-radius: 50%;
	background: var(--app-accent-soft);
}

.trend-line {
	position: absolute;
	height: 3rpx;
	margin-top: -1.5rpx;
	transform-origin: left center;
	background: rgba(143, 227, 216, 0.82);
}

.report-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 16rpx;
}

.report-progress {
	color: rgba(255, 255, 255, 0.72);
	font-size: 23rpx;
	line-height: 32rpx;
}

.report-button {
	height: 64rpx;
	padding: 0 22rpx;
	font-size: 23rpx;
}

.report-sync {
	display: block;
	margin-top: 12rpx;
	color: rgba(255, 255, 255, 0.54);
	font-size: 21rpx;
	line-height: 30rpx;
}

.section-heading {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin: 32rpx 4rpx 14rpx;
}

.section-heading text:first-child {
	color: var(--app-ink);
	font-size: 32rpx;
	line-height: 44rpx;
	font-weight: 600;
}

.section-heading text:last-child {
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 32rpx;
}

.distribution-card {
	padding: 10rpx 28rpx;
}

.distribution-row {
	padding: 16rpx 0;
}

.distribution-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.distribution-subject {
	color: var(--app-ink);
	font-size: 27rpx;
	font-weight: 500;
}

.distribution-value {
	color: var(--app-muted);
	font-size: 23rpx;
}

.track {
	height: 14rpx;
	margin-top: 12rpx;
	overflow: hidden;
	border-radius: 999rpx;
	background: var(--parent-track);
}

.track-fill {
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, var(--app-accent), var(--app-sky));
}

.row-divider {
	height: 1rpx;
	margin-top: 16rpx;
	background: var(--app-line);
}

.advice-card {
	margin-top: 24rpx;
	padding: 28rpx;
}

.advice-kicker {
	display: block;
	color: var(--app-accent);
	font-size: 24rpx;
	line-height: 34rpx;
	font-weight: 600;
}

.advice-text {
	display: block;
	margin-top: 12rpx;
	color: var(--app-copy);
	font-size: 27rpx;
	line-height: 46rpx;
}

.advice-actions {
	display: flex;
	align-items: center;
	margin-top: 18rpx;
}

.advice-actions .aq-btn {
	height: 72rpx;
	padding: 0 24rpx;
	font-size: 24rpx;
}

.reminder-note {
	margin-left: 16rpx;
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 32rpx;
}
</style>
