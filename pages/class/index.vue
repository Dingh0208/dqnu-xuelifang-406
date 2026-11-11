<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">我的班级</text>
		</view>

		<view v-if="loadStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载班级…</text>
		</view>
		<view v-else-if="loadStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">班级加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadClasses"><text>重新加载</text></view>
		</view>
		<block v-else>
		<!-- ① 我加入的班级（一个学生可加入多个班级；同时是管理员的班级在此标注身份） -->
		<text class="section-title">我加入的班级</text>
		<view v-if="joinedClasses.length > 0" class="list-card">
			<view
				v-for="(cls, index) in joinedClasses"
				:key="cls.id"
				class="class-row"
				:class="{ 'last-row': index === joinedClasses.length - 1 }"
				@click="goDetail(cls)"
			>
				<view class="class-info">
					<view class="class-name-line">
						<text class="class-name">{{ cls.name }}</text>
						<text v-if="cls.role === 'ADMIN'" class="role-tag">管理员</text>
					</view>
					<text class="class-meta">管理员：{{ cls.adminName }} · 成员：{{ cls.memberCount }}人</text>
				</view>
				<text class="arrow">›</text>
			</view>
		</view>
		<text v-else-if="loadStatus === 'normal'" class="empty-hint">暂无加入的班级</text>

		<!-- ② 我管理的班级（进入管理 = 跳转教师/管理端工作空间，本次为预留入口） -->
		<text class="section-title">我管理的班级</text>
		<view v-if="managedClasses.length > 0" class="list-card">
			<view
				v-for="(cls, index) in managedClasses"
				:key="cls.id"
				class="class-row"
				:class="{ 'last-row': index === managedClasses.length - 1 }"
			>
				<view class="class-info" @click="goDetail(cls)">
					<view class="class-name-line">
						<text class="class-name">{{ cls.name }}</text>
					</view>
					<text class="class-meta">管理员：{{ cls.adminName }} · 成员：{{ cls.memberCount }}人</text>
				</view>
				<text class="manage-btn" @click="goTeacher(cls)">进入管理</text>
			</view>
		</view>
		<text v-else-if="loadStatus === 'normal'" class="empty-hint">暂无管理的班级</text>
		</block>

		<!-- ③ 加入 / 创建班级 -->
		<view class="action-area">
			<view class="action-btn primary" @click="goJoin">
				<text class="action-btn-text primary-text">加入班级</text>
			</view>
			<view class="action-btn" @click="goCreate">
				<text class="action-btn-text">创建班级</text>
			</view>
		</view>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getClasses } from '@/api/class.js'
	import { enterTeacherWorkspace } from '@/utils/workspace.js'

	export default {
		data() {
			return {
				loadStatus: 'loading',   // loading / normal / error
				// joined：我是 MEMBER 的班级（若同时是 ADMIN，卡片标注「管理员」）
				// managed：我是 ADMIN 的班级（ADMIN ≠ MEMBER，是否加入由创建时 joinSelf 决定）
				joinedClasses: [],
				managedClasses: []
			}
		},
		onShow() {
			// 每次进入重新加载：加入班级返回后新班级立即出现
			this.loadClasses()
		},
		methods: {
			loadClasses() {
				var self = this
				this.loadStatus = 'loading'
				getClasses()
					.then(function (res) {
						if (!res || res.code !== 200) {
							self.loadStatus = 'error'
							return
						}
						var data = res.data || {}
						self.joinedClasses = data.joinedClasses || []
						self.managedClasses = data.managedClasses || []
						self.loadStatus = 'normal'
					})
					.catch(function () {
						self.loadStatus = 'error'
					})
			},
			goDetail(cls) {
				uni.navigateTo({ url: '/pages/class/detail?classId=' + cls.id })
			},
			goJoin() {
				uni.navigateTo({ url: '/pages/class/join' })
			},
			// 创建班级进入教师/管理端创建页（填写信息 + 选择身份），不再直接跳转教师首页
			goCreate() {
				uni.navigateTo({ url: '/pages/teacher/class/create' })
			},
			// 进入管理：统一走工作空间切换（内部再次校验该班 ADMIN，reLaunch 清栈）
			goTeacher(cls) {
				enterTeacherWorkspace(cls.id).then(function (entered) {
					if (!entered) uni.showToast({ title: '暂无可管理的班级', icon: 'none' })
				}).catch(function () {
					uni.showToast({ title: '管理班级加载失败，请重试', icon: 'none' })
				})
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
		background: transparent;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink);
		padding: 22rpx 0 22rpx;
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--app-ink);
		padding: 8rpx 0 14rpx;
	}

	.list-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 0 28rpx;
		margin-bottom: 24rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.class-row {
		display: flex;
		align-items: center;
		padding: 26rpx 0;
		border-bottom: 1rpx solid var(--app-line);
	}

	.class-row.last-row {
		border-bottom: none;
	}

	.class-info {
		flex: 1;
		min-width: 0;
	}

	.class-name-line {
		display: flex;
		align-items: center;
	}

	.class-name {
		font-size: 30rpx;
		font-weight: 500;
		color: var(--app-ink);
	}

	/* 管理员身份小标注（低视觉权重，与 ClassTaskBadge 同风格） */
	.role-tag {
		flex-shrink: 0;
		margin-left: 12rpx;
		padding: 0 12rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		font-size: 21rpx;
		line-height: 34rpx;
		color: #0A6B63;
	}

	.class-meta {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: var(--app-muted);
	}

	.arrow {
		flex-shrink: 0;
		margin-left: 16rpx;
		font-size: 34rpx;
		color: var(--app-hint);
	}

	.manage-btn {
		flex-shrink: 0;
		margin-left: 16rpx;
		padding: 10rpx 24rpx;
		border: 1rpx solid var(--app-line);
		border-radius: 999rpx;
		background: var(--app-surface-solid);
		font-size: 24rpx;
		color: var(--app-primary);
	}

	/* 空态：单行小字提示，不制造大面积空白 */
	.empty-hint {
		display: block;
		padding: 6rpx 0 22rpx;
		font-size: 26rpx;
		color: var(--app-hint);
	}

	.action-area {
		display: flex;
		margin-top: 12rpx;
	}

	.action-btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1rpx solid var(--app-line);
		border-radius: 999rpx;
		background-color: var(--app-surface-solid);
	}

	.action-btn.primary {
		border-color: transparent;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.action-btn + .action-btn {
		margin-left: 24rpx;
	}

	.action-btn-text {
		font-size: 28rpx;
		color: var(--app-primary);
		font-weight: 600;
	}

	.action-btn-text.primary-text {
		color: #FFFFFF;
	}

	.bottom-space {
		height: 160rpx;
		height: calc(160rpx + env(safe-area-inset-bottom));
	}
</style>
