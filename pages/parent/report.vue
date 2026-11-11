<template>
	<view class="parent-page">
		<ParentTopSpace />
		<scroll-view class="parent-scroll scroll" scroll-y :show-scrollbar="false" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="refresh">
			<view class="parent-content">
				<view class="parent-heading">
					<text class="parent-title">学习周报</text>
					<text class="parent-subtitle">{{ report.child ? report.child.name : '孩子' }} · {{ report.week && report.week.label || '本周' }} · {{ report.week && report.week.dateRange || '学习记录' }}</text>
				</view>

				<view v-if="loading" class="parent-state">
					<view class="aq-spinner"></view>
					<text class="parent-state-title">正在生成学习周报…</text>
					<text class="parent-state-desc">马上就好</text>
				</view>
				<view v-else-if="error" class="parent-state">
					<text class="parent-state-title">暂时无法加载周报</text>
					<text class="parent-state-desc">请检查网络后重试</text>
					<view class="aq-btn aq-btn-primary parent-state-action" hover-class="aq-tap" :hover-stay-time="80" @tap="load"><text>重新加载</text></view>
				</view>
				<view v-else-if="!report.week || !report.week.label" class="parent-state">
					<text class="parent-state-title">暂无周报数据</text>
					<text class="parent-state-desc">孩子完成本周学习后，这里会自动生成周报</text>
				</view>
				<template v-else>
					<view class="aq-hero hero-card">
						<view class="hero-head">
							<text class="hero-eyebrow">{{ report.week.label }} · 学习周报</text>
							<text class="sync-pill">已同步家长端</text>
						</view>
						<view class="hero-main">
							<text class="hero-hours">{{ report.stats.studyHours }}<text class="hero-unit">h</text></text>
							<view class="hero-copy">
								<text>本周学习时长</text>
								<text>环比 {{ report.stats.studyDelta }} · 目标达成 {{ report.stats.targetRate }}%</text>
							</view>
						</view>
						<view class="hero-chart">
							<view v-for="(point, index) in report.chart" :key="index" class="chart-point" :style="pointStyle(point, index)"></view>
							<view v-for="(point, index) in report.chart.slice(0, report.chart.length - 1)" :key="'line-' + index" class="chart-line" :style="lineStyle(point, report.chart[index + 1], index)"></view>
						</view>
						<view class="hero-stats">
							<view class="hero-stat"><text class="hero-stat-number">{{ report.stats.homeworkRate }}%</text><text class="hero-stat-label">作业完成率</text></view>
							<view class="hero-stat"><text class="hero-stat-number mint">{{ report.stats.knowledgeDelta }}</text><text class="hero-stat-label">知识点掌握变化</text></view>
							<view class="hero-stat"><text class="hero-stat-number">{{ report.stats.wrongCount }} 题</text><text class="hero-stat-label">本周攻克错题</text></view>
						</view>
						<view class="hero-foot">
							<text class="hero-foot-text">平均每日 {{ report.stats.averageDaily }} 分钟 · 连续 {{ report.stats.streakDays }} 天完成计划</text>
							<view class="aq-btn aq-btn-ghost hero-cta" hover-class="aq-tap" :hover-stay-time="80" @tap="goHome"><text>回到总览 →</text></view>
						</view>
					</view>

					<view class="section-heading"><text>学科表现对比</text><text>孩子 vs 班级平均</text></view>
					<view class="aq-card subject-card">
						<view v-for="subject in report.subjects" :key="subject.name" class="subject-row">
							<text class="subject-name">{{ subject.name }}</text>
							<view class="score-track"><view class="score-fill" :style="{ width: subject.score + '%' }"></view></view>
							<text class="score-value">{{ subject.score }} <text class="score-average">/ 班均 {{ subject.classAverage }}</text></text>
						</view>
					</view>

					<view class="section-heading"><text>知识点掌握变化</text><text>对比上周</text></view>
					<view class="aq-card knowledge-card">
						<view v-for="item in report.knowledge" :key="item.name" class="knowledge-row">
							<text class="knowledge-name">{{ item.name }}</text>
							<text class="knowledge-detail">{{ item.before }}% → {{ item.after }}% · {{ item.detail }}</text>
							<text class="knowledge-change" :class="{ positive: item.positive }">{{ item.change }}</text>
						</view>
					</view>

					<view class="aq-card-soft advice-card">
						<text class="advice-kicker">家长建议</text>
						<text class="advice-text">{{ report.advice.text }}</text>
						<view class="reminder-row">
							<view class="aq-btn aq-btn-primary reminder-button" hover-class="aq-tap" :hover-stay-time="80" @tap="setReminder"><text>约定提醒 · 周六 15:00</text></view>
							<text v-if="report.reminder" class="reminder-note">已提醒 {{ report.reminder.text }}</text>
						</view>
					</view>
				</template>
				<view class="bottom-space"></view>
			</view>
		</scroll-view>
		<ParentTabBar current="report" />
	</view>
</template>

<script>
import ParentTopSpace from '@/components/parent/ParentTopSpace.vue'
import ParentTabBar from '@/components/parent/ParentTabBar.vue'
import { getWeeklyReport, createReminder } from '@/api/parent/dashboard.js'
import * as authApi from '@/api/auth.js'
import { getActiveChildId } from '@/utils/parentState.js'
import { getParentChartPointStyle, getParentChartLineStyle } from '@/utils/parentChart.js'

export default {
	components: { ParentTopSpace, ParentTabBar },
	data() { return { loading: true, refreshing: false, error: false, weekOffset: 0, childId: '', chartSize: { width: 0, height: 0 }, report: { week: {}, stats: {}, chart: [], subjects: [], knowledge: [], advice: {} } } },
	onShow() { if (!authApi.requireParent()) return; this.load() },
	methods: {
		load() {
			this.loading = true; this.error = false; this.childId = getActiveChildId()
			var self = this
			return getWeeklyReport(this.childId, this.weekOffset).then(function (res) { if (!res || res.code !== 200) throw res; self.report = Object.assign({}, self.report, res.data || {}) }).catch(function () { self.error = true }).then(function () {
				self.loading = false
				self.$nextTick(function () { self.measureChart() })
			})
		},
		refresh() { var self = this; this.refreshing = true; this.load().then(function () { self.refreshing = false }) },
		goHome() { uni.redirectTo({ url: '/pages/parent/home' }) },
		setReminder() {
			var self = this
			createReminder({ childId: this.childId, text: '周六 15:00' }).then(function (res) { if (!res || res.code !== 200) throw res; self.report.reminder = res.data; uni.showToast({ title: '提醒已设置', icon: 'success' }) }).catch(function () { uni.showToast({ title: '设置失败，请稍后重试', icon: 'none' }) })
		},
		measureChart() {
			var self = this
			uni.createSelectorQuery().select('.hero-chart').boundingClientRect(function (rect) {
				if (rect) self.chartSize = { width: rect.width, height: rect.height }
			}).exec()
		},
		pointStyle(value, index) { return getParentChartPointStyle(value, index, this.chartSize, 3, 12, 84, -1) },
		lineStyle(from, to, index) { return getParentChartLineStyle(from, to, index, this.chartSize, 3, 12, 84, -1) }
	}
}
</script>

<style>
@import "../../components/parent/parent-theme.css";

.scroll { flex: 1; height: 0; min-height: 0; }
.bottom-space { height: 24rpx; }

.hero-card {
	margin-top: 4rpx;
	padding: 28rpx 30rpx 24rpx;
}

.hero-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.hero-eyebrow {
	color: rgba(255, 255, 255, 0.72);
	font-size: 24rpx;
	line-height: 34rpx;
}

.sync-pill {
	padding: 7rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.16);
	color: #E8FFFB;
	font-size: 21rpx;
	line-height: 1.4;
}

.hero-main {
	display: flex;
	align-items: center;
	margin-top: 18rpx;
}

.hero-hours {
	color: #FFFFFF;
	font-size: 64rpx;
	line-height: 72rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.hero-unit {
	font-size: 28rpx;
	font-weight: 400;
}

.hero-copy {
	display: flex;
	flex-direction: column;
	margin-left: 24rpx;
	color: rgba(255, 255, 255, 0.66);
	font-size: 23rpx;
	line-height: 34rpx;
}

.hero-copy text + text {
	margin-top: 4rpx;
}

.hero-chart {
	position: relative;
	height: 108rpx;
	margin: 16rpx 80rpx 6rpx 18%;
}

.chart-point {
	position: absolute;
	width: 12rpx;
	height: 12rpx;
	margin: -6rpx;
	border-radius: 50%;
	background: var(--app-accent-soft);
}

.chart-line {
	position: absolute;
	height: 3rpx;
	margin-top: -1.5rpx;
	transform-origin: left center;
	background: rgba(143, 227, 216, 0.82);
}

.hero-stats {
	display: flex;
	margin-top: 12rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(255, 255, 255, 0.16);
}

.hero-stat {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.hero-stat + .hero-stat {
	margin-left: 8rpx;
	border-left: 1rpx solid rgba(255, 255, 255, 0.16);
}

.hero-stat-number {
	color: #FFFFFF;
	font-size: 32rpx;
	line-height: 40rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.hero-stat-number.mint {
	color: var(--app-accent-soft);
}

.hero-stat-label {
	margin-top: 4rpx;
	color: rgba(255, 255, 255, 0.62);
	font-size: 21rpx;
	line-height: 30rpx;
}

.hero-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 20rpx;
}

.hero-foot-text {
	flex: 1;
	color: rgba(255, 255, 255, 0.60);
	font-size: 21rpx;
	line-height: 30rpx;
}

.hero-cta {
	height: 64rpx;
	padding: 0 18rpx;
	margin-left: 16rpx;
	font-size: 22rpx;
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

.subject-card,
.knowledge-card {
	padding: 10rpx 28rpx;
}

.subject-row {
	display: flex;
	min-height: 64rpx;
	align-items: center;
}

.subject-name {
	width: 92rpx;
	flex-shrink: 0;
	color: var(--app-ink);
	font-size: 26rpx;
}

.score-track {
	flex: 1;
	height: 14rpx;
	margin: 0 16rpx;
	border-radius: 999rpx;
	background: var(--parent-track);
	overflow: hidden;
}

.score-fill {
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, var(--app-accent), var(--app-sky));
}

.score-value {
	width: 190rpx;
	flex-shrink: 0;
	color: var(--app-ink);
	font-size: 24rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.score-average {
	color: var(--app-muted);
	font-weight: 400;
}

.knowledge-row {
	display: flex;
	align-items: center;
	min-height: 78rpx;
	border-bottom: 1rpx solid var(--app-line);
}

.knowledge-row:last-child {
	border-bottom: 0;
}

.knowledge-name {
	max-width: 250rpx;
	overflow: hidden;
	color: var(--app-ink);
	font-size: 25rpx;
	font-weight: 500;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.knowledge-detail {
	flex: 1;
	margin-left: 12rpx;
	color: var(--app-muted);
	font-size: 21rpx;
}

.knowledge-change {
	margin-left: 12rpx;
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	background: var(--app-negative-bg);
	color: var(--app-negative);
	font-size: 21rpx;
	font-weight: 500;
}

.knowledge-change.positive {
	background: var(--app-positive-bg);
	color: var(--app-positive);
}

.advice-card {
	margin-top: 24rpx;
	padding: 28rpx;
}

.advice-kicker {
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

.reminder-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-top: 18rpx;
}

.reminder-button {
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
