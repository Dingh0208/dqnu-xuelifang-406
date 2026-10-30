<template>
	<view class="parent-page">
		<ParentTopSpace />
		<scroll-view class="parent-scroll scroll" scroll-y :show-scrollbar="false">
			<view class="parent-content">
				<view class="parent-heading">
					<text class="parent-title">我的</text>
					<text class="parent-subtitle">家长资料与孩子绑定</text>
				</view>

				<view v-if="loading" class="parent-state">
					<view class="aq-spinner"></view>
					<text class="parent-state-title">正在加载家长资料…</text>
					<text class="parent-state-desc">马上就好</text>
				</view>
				<view v-else-if="error" class="parent-state">
					<text class="parent-state-title">个人信息加载失败</text>
					<text class="parent-state-desc">请检查网络后重试</text>
					<view class="aq-btn aq-btn-primary parent-state-action" hover-class="aq-tap" :hover-stay-time="80" @tap="load"><text>重新加载</text></view>
				</view>
				<view v-else-if="!parent.name && !sections.length && !recommendation.title" class="parent-state">
					<text class="parent-state-title">暂无家长资料</text>
					<text class="parent-state-desc">完善资料后，这里会显示家长信息与孩子绑定</text>
				</view>
				<template v-else>
					<view class="aq-card profile-card">
						<view class="avatar">{{ parent.name ? parent.name.charAt(0) : '家' }}</view>
						<view class="profile-copy">
							<text class="profile-name">{{ parent.name || '家长' }}（{{ parent.relation || '家长' }}）</text>
							<text class="profile-meta">{{ parent.school || '学立方家长' }} · {{ parent.membership || '成长陪伴会员' }}</text>
							<view class="profile-tags">
								<text class="aq-chip">家长身份</text>
								<text class="aq-chip">已绑定 {{ children.length }} 个孩子</text>
								<text class="aq-chip">监护人</text>
							</view>
						</view>
					</view>

					<view class="aq-card bind-card">
						<view class="bind-head"><text>孩子账号绑定</text><text class="bind-count">{{ children.length }} 个已绑定</text></view>
						<view v-if="!children.length" class="bind-empty">
							<text class="bind-empty-title">还没有绑定孩子</text>
							<text class="bind-empty-desc">输入孩子端生成的邀请码即可绑定</text>
						</view>
						<view v-for="child in children" :key="child.id" class="bind-row">
							<view class="child-avatar">{{ child.shortName || '孩' }}</view>
							<view class="child-copy">
								<view class="child-name-line"><text>{{ child.name }}</text><text v-if="child.isPrimary" class="primary-tag">主账号</text></view>
								<text class="child-meta">{{ child.className }} · 学号 {{ child.studentNo }}</text>
							</view>
							<view class="aq-btn aq-btn-secondary bind-switch" hover-class="aq-tap" :hover-stay-time="80" @tap="switchChild(child)"><text>切换</text></view>
						</view>
						<view class="bind-actions">
							<view class="aq-btn aq-btn-secondary bind-add" hover-class="aq-tap" :hover-stay-time="80" @tap="openBind"><text>＋ 添加孩子</text></view>
						</view>
					</view>

					<view v-for="section in sections" :key="section.title">
						<view class="section-heading"><text>{{ section.title }}</text></view>
						<view class="aq-card menu-card">
							<view v-for="item in section.items" :key="item.key" class="menu-row" hover-class="menu-hover" :hover-stay-time="80" @tap="openMenu(item)">
								<view class="menu-icon">{{ item.label.slice(0, 1) }}</view>
								<text class="menu-label">{{ item.label }}</text>
								<text class="menu-detail">{{ item.detail }}</text>
								<text class="menu-arrow">›</text>
							</view>
						</view>
					</view>

					<view class="section-heading recommendation-heading"><text>本周推荐课程</text><text>家长课堂</text></view>
					<view class="aq-card-soft recommend-card">
						<view class="recommend-copy">
							<text class="recommend-title">{{ recommendation.title }}</text>
							<text class="recommend-meta">{{ recommendation.meta }}</text>
						</view>
						<view class="aq-btn aq-btn-primary recommend-button" hover-class="aq-tap" :hover-stay-time="80" @tap="openCourse"><text>去听课</text></view>
					</view>
				</template>
				<view class="bottom-space"></view>
			</view>
		</scroll-view>
		<ParentTabBar current="profile" />

		<view v-if="showBind" class="modal-mask" @tap="showBind = false">
			<view class="bind-modal" @tap.stop>
				<text class="modal-title">添加孩子</text>
				<text class="modal-hint">输入孩子端生成的邀请码</text>
				<input v-model="bindCode" class="bind-input" placeholder="例如 20240408" placeholder-class="bind-placeholder" />
				<view class="modal-actions">
					<view class="aq-btn aq-btn-secondary modal-button" hover-class="aq-tap" :hover-stay-time="80" @tap="showBind = false"><text>取消</text></view>
					<view class="aq-btn aq-btn-primary modal-button" hover-class="aq-tap" :hover-stay-time="80" @tap="submitBind"><text>确认绑定</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import ParentTopSpace from '@/components/parent/ParentTopSpace.vue'
import ParentTabBar from '@/components/parent/ParentTabBar.vue'
import { getParentProfile, bindChild } from '@/api/parent/dashboard.js'
import * as authApi from '@/api/auth.js'
import { setActiveChildId } from '@/utils/parentState.js'

export default {
	components: { ParentTopSpace, ParentTabBar },
	data() { return { loading: true, error: false, parent: {}, children: [], sections: [], recommendation: {}, showBind: false, bindCode: '' } },
	onShow() { if (!authApi.requireParent()) return; this.load() },
	methods: {
		load() {
			var self = this
			this.loading = true
			this.error = false
			return getParentProfile().then(function (res) {
				if (!res || res.code !== 200) throw res
				var data = res.data || {}
				self.parent = data.parent || {}
				self.children = data.children || []
				self.sections = data.sections || []
				self.recommendation = data.recommendation || {}
			}).catch(function () { self.error = true }).then(function () { self.loading = false })
		},
		switchChild(child) { setActiveChildId(child.id); uni.showToast({ title: '已切换至' + child.name, icon: 'none' }) },
		openBind() { this.bindCode = ''; this.showBind = true },
		submitBind() {
			var self = this
			if (!this.bindCode.trim()) { uni.showToast({ title: '请输入邀请码', icon: 'none' }); return }
			bindChild({ code: this.bindCode.trim() }).then(function (res) {
				if (!res || res.code !== 200) throw res
				self.children = res.data.children || self.children
				self.showBind = false
				uni.showToast({ title: '孩子绑定成功', icon: 'success' })
			}).catch(function (err) { uni.showToast({ title: (err && err.message) || '绑定失败', icon: 'none' }) })
		},
		openMenu(item) { var messages = { archive: '成长档案即将开放', classroom: '家长课堂已为你准备课程', notice: '暂无新的通知', settings: '设置功能即将开放', help: '请通过客服联系我们', orders: '会员订单功能即将开放' }; uni.showToast({ title: messages[item.key] || item.label, icon: 'none' }) },
		openCourse() { uni.showToast({ title: '课程播放功能即将开放', icon: 'none' }) }
	}
}
</script>

<style>
@import "../../components/parent/parent-theme.css";

.scroll { flex: 1; height: 0; min-height: 0; }
.bottom-space { height: 24rpx; }

.profile-card {
	display: flex;
	align-items: center;
	padding: 26rpx 28rpx;
}

.avatar {
	width: 92rpx;
	height: 92rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	border: 1rpx solid var(--app-line);
	border-radius: 28rpx;
	background: linear-gradient(135deg, rgba(18, 181, 165, 0.16), rgba(56, 189, 248, 0.12));
	color: var(--app-primary);
	font-size: 40rpx;
	font-weight: 600;
}

.profile-copy {
	flex: 1;
	min-width: 0;
	margin-left: 22rpx;
}

.profile-name {
	display: block;
	overflow: hidden;
	color: var(--app-ink);
	font-size: 34rpx;
	line-height: 44rpx;
	font-weight: 600;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.profile-meta {
	display: block;
	margin-top: 4rpx;
	overflow: hidden;
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 32rpx;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.profile-tags {
	display: flex;
	margin-top: 12rpx;
}

.profile-tags .aq-chip {
	margin-right: 10rpx;
}

.bind-card {
	margin-top: 24rpx;
	padding: 26rpx 28rpx 18rpx;
}

.bind-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 12rpx;
	color: var(--app-muted);
	font-size: 24rpx;
	line-height: 34rpx;
}

.bind-count {
	color: var(--app-ink);
	font-size: 26rpx;
	font-weight: 600;
}

.bind-empty {
	padding: 28rpx 0 18rpx;
	border-top: 1rpx solid var(--app-line);
	text-align: center;
}

.bind-empty-title {
	display: block;
	color: var(--app-ink);
	font-size: 26rpx;
	line-height: 36rpx;
	font-weight: 500;
}

.bind-empty-desc {
	display: block;
	margin-top: 6rpx;
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 32rpx;
}

.bind-row {
	display: flex;
	align-items: center;
	padding: 16rpx 0;
	border-top: 1rpx solid var(--app-line);
}

.child-avatar {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	border: 1rpx solid var(--app-line);
	border-radius: 20rpx;
	background: var(--app-surface-soft);
	color: var(--app-primary);
	font-size: 26rpx;
	font-weight: 600;
}

.child-copy {
	flex: 1;
	min-width: 0;
	margin-left: 16rpx;
}

.child-name-line {
	display: flex;
	align-items: center;
	color: var(--app-ink);
	font-size: 28rpx;
	line-height: 38rpx;
	font-weight: 600;
}

.primary-tag {
	margin-left: 10rpx;
	padding: 4rpx 10rpx;
	border-radius: 999rpx;
	background: var(--app-positive-bg);
	color: var(--app-positive);
	font-size: 19rpx;
	font-weight: 500;
}

.child-meta {
	display: block;
	margin-top: 4rpx;
	color: var(--app-muted);
	font-size: 21rpx;
	line-height: 30rpx;
}

.bind-switch {
	height: 60rpx;
	padding: 0 16rpx;
	margin-left: 10rpx;
	font-size: 21rpx;
}

.bind-actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 8rpx;
}

.bind-add {
	height: 64rpx;
	padding: 0 22rpx;
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
}

.menu-card {
	overflow: hidden;
}

.menu-row {
	display: flex;
	align-items: center;
	min-height: 104rpx;
	padding: 0 26rpx;
	border-bottom: 1rpx solid var(--app-line);
}

.menu-row:last-child {
	border-bottom: 0;
}

.menu-hover {
	background: var(--app-surface-soft);
}

.menu-icon {
	width: 52rpx;
	height: 52rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	border-radius: 16rpx;
	background: rgba(18, 181, 165, 0.10);
	color: #0A6B63;
	font-size: 23rpx;
	font-weight: 600;
}

.menu-label {
	margin-left: 18rpx;
	color: var(--app-ink);
	font-size: 27rpx;
	font-weight: 500;
}

.menu-detail {
	flex: 1;
	margin-left: 12rpx;
	overflow: hidden;
	color: var(--app-muted);
	font-size: 21rpx;
	text-align: right;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.menu-arrow {
	margin-left: 12rpx;
	color: var(--app-hint);
	font-size: 30rpx;
	line-height: 1;
}

.recommendation-heading {
	margin-top: 30rpx;
}

.recommend-card {
	display: flex;
	align-items: center;
	padding: 26rpx 28rpx;
}

.recommend-copy {
	flex: 1;
	min-width: 0;
	padding-right: 18rpx;
}

.recommend-title {
	display: block;
	color: var(--app-ink);
	font-size: 27rpx;
	line-height: 40rpx;
	font-weight: 600;
}

.recommend-meta {
	display: block;
	margin-top: 6rpx;
	color: var(--app-muted);
	font-size: 21rpx;
	line-height: 32rpx;
}

.recommend-button {
	height: 64rpx;
	padding: 0 20rpx;
	flex-shrink: 0;
	font-size: 22rpx;
}

.modal-mask {
	position: fixed;
	z-index: 30;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	background: rgba(8, 63, 74, 0.32);
}

.bind-modal {
	width: 100%;
	padding: 32rpx;
	box-sizing: border-box;
	border: 1rpx solid var(--app-line);
	border-radius: 28rpx;
	background: var(--app-surface-solid);
	box-shadow: var(--app-shadow);
}

.modal-title {
	display: block;
	color: var(--app-ink);
	font-size: 32rpx;
	line-height: 44rpx;
	font-weight: 600;
}

.modal-hint {
	display: block;
	margin-top: 6rpx;
	color: var(--app-muted);
	font-size: 22rpx;
	line-height: 32rpx;
}

.bind-input {
	height: 88rpx;
	margin-top: 22rpx;
	padding: 0 22rpx;
	box-sizing: border-box;
	border: 1rpx solid var(--app-line);
	border-radius: 20rpx;
	background: var(--app-surface-solid);
	color: var(--app-ink);
	font-size: 27rpx;
}

.bind-input:focus {
	border-color: var(--app-accent);
}

.bind-placeholder {
	color: var(--app-hint);
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 24rpx;
}

.modal-button {
	height: 76rpx;
	padding: 0 26rpx;
	margin-left: 12rpx;
	font-size: 24rpx;
}
</style>
