<template>
	<view class="parent-page">
		<ParentTopSpace />
		<scroll-view class="parent-scroll scroll" scroll-y :show-scrollbar="false" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="refresh">
			<view class="parent-content">
				<view class="parent-heading">
					<text class="parent-title">孩子与成长</text>
					<text class="parent-subtitle">已绑定 {{ children.length }} 个孩子 · 查看学习进度与在校表现</text>
				</view>

				<view v-if="loading" class="parent-state">
					<view class="aq-spinner"></view>
					<text class="parent-state-title">正在加载成长数据…</text>
					<text class="parent-state-desc">马上就好</text>
				</view>
				<view v-else-if="error" class="parent-state">
					<text class="parent-state-title">成长数据加载失败</text>
					<text class="parent-state-desc">请检查网络后重试</text>
					<view class="aq-btn aq-btn-primary parent-state-action" hover-class="aq-tap" :hover-stay-time="80" @tap="load"><text>重新加载</text></view>
				</view>
				<view v-else-if="!children.length" class="parent-state">
					<text class="parent-state-title">还没有绑定孩子</text>
					<text class="parent-state-desc">绑定孩子后，这里会显示成长档案与学习数据</text>
					<view class="aq-btn aq-btn-secondary parent-state-action" hover-class="aq-tap" :hover-stay-time="80" @tap="goProfile"><text>去绑定</text></view>
				</view>
				<template v-else>
					<view class="aq-card child-card">
						<view class="child-avatar">{{ dashboard.child.shortName || '孩' }}</view>
						<view class="child-copy">
							<text class="child-name">{{ dashboard.child.name || '孩子' }}</text>
							<text class="child-meta">{{ dashboard.child.className || '未设置班级' }} · 学号 {{ dashboard.child.studentNo || '—' }}</text>
						</view>
						<view class="aq-btn aq-btn-secondary child-switch-button" hover-class="aq-tap" :hover-stay-time="80" @tap="toggleChild"><text>切换孩子</text></view>
					</view>

					<view class="section-heading"><text>本周学习进度</text><text>已完成 {{ dashboard.progress.completed }}/{{ dashboard.progress.total }} 项 · <text class="progress-percent">{{ dashboard.progress.percent }}%</text></text></view>
					<view class="aq-card progress-card">
						<view class="progress-track"><view class="progress-fill" :style="{ width: dashboard.progress.percent + '%' }"></view></view>
						<view class="progress-stats">
							<view><text>{{ dashboard.progress.dailyHours }}h</text><text class="stat-caption">日均学习</text></view>
							<view><text>{{ dashboard.progress.streakDays }}天</text><text class="stat-caption">连续学习</text></view>
							<view><text>{{ dashboard.progress.pendingWrong }}题</text><text class="stat-caption">待复习错题</text></view>
						</view>
					</view>

					<view class="section-heading"><text>成绩趋势</text><text>近 5 次月考 · 满分 120</text></view>
					<view class="aq-card grade-card">
						<view class="grade-head">
							<text class="grade-title"><text class="grade-latest">{{ dashboard.grades.latest }}</text> 分 · {{ dashboard.grades.latestName }}</text>
							<text class="grade-delta">较上次 {{ dashboard.grades.delta }}</text>
						</view>
						<view class="grade-chart">
							<view class="grade-baseline"></view>
							<view v-for="(value, index) in dashboard.grades.values" :key="index" class="grade-point" :style="gradePointStyle(value, index)"></view>
							<view v-for="(value, index) in dashboard.grades.values.slice(0, dashboard.grades.values.length - 1)" :key="'grade-line-' + index" class="grade-line" :style="gradeLineStyle(value, dashboard.grades.values[index + 1], index)"></view>
						</view>
						<view class="grade-labels"><text v-for="label in dashboard.grades.labels" :key="label">{{ label }}</text></view>
					</view>

					<view class="section-heading"><text>错题概览</text><text>近 30 天 · 共 {{ dashboard.wrong.total }} 题</text></view>
					<view class="aq-card wrong-card">
						<view v-for="item in dashboard.wrong.items" :key="item.subject">
							<text class="wrong-number">{{ item.count }}</text>
							<text class="wrong-label">{{ item.subject }} · {{ item.percent }}%</text>
						</view>
						<view>
							<text class="wrong-number positive">{{ dashboard.wrong.mastered }}</text>
							<text class="wrong-label">已攻克</text>
						</view>
					</view>

					<view class="section-heading"><text>在校表现</text><text>本周 · 班主任反馈</text></view>
					<view class="aq-card school-card">
						<view class="school-tags">
							<text v-for="tag in dashboard.school.tags" :key="tag.label" class="school-tag" :class="{ positive: tag.tone === 'positive' }">{{ tag.label }}</text>
						</view>
						<text class="school-comment">{{ dashboard.school.comment }}</text>
					</view>
				</template>
				<view class="bottom-space"></view>
			</view>
		</scroll-view>
		<ParentTabBar current="children" />
	</view>
</template>

<script>
import ParentTopSpace from '@/components/parent/ParentTopSpace.vue'
import ParentTabBar from '@/components/parent/ParentTabBar.vue'
import { getChildren, getChildDashboard } from '@/api/parent/dashboard.js'
import * as authApi from '@/api/auth.js'
import { getActiveChildId, setActiveChildId } from '@/utils/parentState.js'
import { getParentChartPointStyle, getParentChartLineStyle } from '@/utils/parentChart.js'

export default {
	components: { ParentTopSpace, ParentTabBar },
	data() { return { loading: true, refreshing: false, error: false, children: [], activeChildId: '', chartSize: { width: 0, height: 0 }, dashboard: { child: {}, progress: {}, grades: { values: [], labels: [] }, wrong: { items: [] }, school: { tags: [] } } } },
	onShow() { if (!authApi.requireParent()) return; this.load() },
	methods: {
		load() {
			this.loading = true; this.error = false; var self = this
			return getChildren().then(function (res) {
				if (!res || res.code !== 200) throw res
				self.children = res.data.children || []
				self.activeChildId = getActiveChildId() || (self.children[0] && self.children[0].id) || ''
				if (self.activeChildId) setActiveChildId(self.activeChildId)
				if (!self.children.length) return null
				return getChildDashboard(self.activeChildId)
			}).then(function (res) {
				if (!res) return
				if (res.code !== 200) throw res
				self.dashboard = Object.assign({}, self.dashboard, res.data || {})
			}).catch(function () { self.error = true }).then(function () {
				self.loading = false
				self.$nextTick(function () { self.measureChart() })
			})
		},
		refresh() { var self = this; this.refreshing = true; this.load().then(function () { self.refreshing = false }) },
		goProfile() { uni.redirectTo({ url: '/pages/parent/profile' }) },
		toggleChild() { var index = this.children.findIndex(function (item) { return item.id === this.activeChildId }.bind(this)); var next = this.children[(index + 1) % this.children.length]; if (next) { setActiveChildId(next.id); this.load() } },
		measureChart() {
			var self = this
			uni.createSelectorQuery().select('.grade-chart').boundingClientRect(function (rect) {
				if (rect) self.chartSize = { width: rect.width, height: rect.height }
			}).exec()
		},
		gradePointStyle(value, index) { return getParentChartPointStyle(value, index, this.chartSize, 5, 22, 410, -4) },
		gradeLineStyle(from, to, index) { return getParentChartLineStyle(from, to, index, this.chartSize, 5, 22, 410, -4) }
	}
}
</script>

<style>
@import "../../components/parent/parent-theme.css";

.scroll { flex: 1; height: 0; min-height: 0; }
.bottom-space { height: 24rpx; }

.child-card {
	display: flex;
	align-items: center;
	padding: 26rpx 28rpx;
}

.child-avatar {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	border: 1rpx solid var(--app-line);
	border-radius: 24rpx;
	background: var(--app-surface-soft);
	color: var(--app-primary);
	font-size: 30rpx;
	font-weight: 600;
}

.child-copy {
	flex: 1;
	min-width: 0;
	margin-left: 20rpx;
}

.child-name {
	display: block;
	color: var(--app-ink);
	font-size: 31rpx;
	line-height: 42rpx;
	font-weight: 600;
}

.child-meta {
	display: block;
	margin-top: 5rpx;
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 32rpx;
}

.child-switch-button {
	height: 64rpx;
	padding: 0 18rpx;
	margin-left: 12rpx;
	font-size: 22rpx;
}

.section-heading {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin: 30rpx 4rpx 12rpx;
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
	text-align: right;
}

.progress-percent {
	color: var(--app-positive);
	font-weight: 600;
}

.progress-card {
	padding: 28rpx;
}

.progress-track {
	height: 14rpx;
	border-radius: 999rpx;
	background: var(--parent-track);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, var(--app-accent), var(--app-sky));
}

.progress-stats {
	display: flex;
	margin-top: 24rpx;
}

.progress-stats view {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding-left: 6rpx;
	border-right: 1rpx solid var(--app-line);
	text-align: center;
}

.progress-stats view:last-child {
	padding-left: 6rpx;
	border-right: 0;
}

.progress-stats text {
	color: var(--app-ink);
	font-size: 32rpx;
	line-height: 38rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.progress-stats .stat-caption {
	margin-top: 6rpx;
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 30rpx;
	font-weight: 400;
}

.grade-card {
	padding: 26rpx 28rpx 20rpx;
}

.grade-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.grade-title {
	color: var(--app-copy);
	font-size: 24rpx;
	line-height: 34rpx;
}

.grade-latest {
	color: var(--app-ink);
	font-size: 44rpx;
	line-height: 52rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.grade-delta {
	padding: 7rpx 14rpx;
	border-radius: 999rpx;
	background: var(--app-positive-bg);
	color: var(--app-positive);
	font-size: 21rpx;
	font-weight: 500;
}

.grade-chart {
	position: relative;
	height: 180rpx;
	margin: 20rpx 24rpx 0;
}

.grade-baseline {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 22rpx;
	height: 1rpx;
	background: var(--app-line);
}

.grade-point {
	position: absolute;
	width: 14rpx;
	height: 14rpx;
	margin: -7rpx;
	border: 2rpx solid #FFFFFF;
	border-radius: 50%;
	background: var(--app-accent);
	box-shadow: 0 2rpx 6rpx rgba(10, 92, 106, 0.18);
}

.grade-line {
	position: absolute;
	height: 3rpx;
	margin-top: -1.5rpx;
	transform-origin: left center;
	background: var(--app-accent-soft);
}

.grade-labels {
	display: flex;
	justify-content: space-between;
	color: var(--app-muted);
	font-size: 21rpx;
	line-height: 30rpx;
}

.wrong-card {
	display: flex;
	padding: 24rpx 10rpx;
}

.wrong-card > view {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	border-right: 1rpx solid var(--app-line);
	text-align: center;
}

.wrong-card > view:last-child {
	border-right: 0;
}

.wrong-number {
	color: var(--app-ink);
	font-size: 36rpx;
	line-height: 42rpx;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.wrong-number.positive {
	color: var(--app-positive);
}

.wrong-label {
	margin-top: 4rpx;
	color: var(--app-muted);
	font-size: 21rpx;
	line-height: 30rpx;
}

.school-card {
	padding: 26rpx 28rpx;
}

.school-tags {
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 12rpx;
}

.school-tag {
	margin-right: 10rpx;
	margin-bottom: 8rpx;
	padding: 7rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(18, 181, 165, 0.10);
	color: #0A6B63;
	font-size: 21rpx;
	line-height: 1.4;
}

.school-tag.positive {
	background: var(--app-positive-bg);
	color: var(--app-positive);
}

.school-comment {
	display: block;
	color: var(--app-copy);
	font-size: 26rpx;
	line-height: 44rpx;
}
</style>
