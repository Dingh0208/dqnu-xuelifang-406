<template>
	<view class="page">
		<view class="profile-head">
			<view class="avatar"><image v-if="profile.avatar" :src="profile.avatar" mode="aspectFill" /><text v-else>{{ profile.avatarText || (profile.nickname || '同')[0] }}</text></view>
			<view class="profile-copy"><text class="page-title">{{ profile.nickname || '同学' }}</text><text class="profile-sub">{{ profile.signature || '学生身份 · 学习与成长记录' }}</text></view>
		</view>

		<view class="identity-row"><text class="identity-pill">学生身份</text><text class="identity-pill">错题复习 {{ wrongStats.reviewCount || 0 }} 项</text><text class="identity-pill">学习资产</text></view>

		<view class="asset-hero">
			<view class="asset-head"><text class="asset-title">我的资产</text><text class="mall-link" @click="goSilverMall">金币商城　→</text></view>
			<view class="balances">
				<view class="balance" @click="goCoinDetail"><text class="balance-label">◎　学习金币</text><text class="balance-num">{{ coinStatus === 'normal' || coinStatus === 'zero' ? learningCoin : '--' }}</text></view>
				<view class="balance-divider"></view>
				<view class="balance" @click="goSilverMall"><text class="balance-label">◉　银币</text><text class="balance-num">{{ silverStatus === 'normal' || silverStatus === 'zero' ? silverCoin : '--' }}</text></view>
			</view>
			<view class="asset-actions"><text class="asset-button" @click="goCoinDetail">学习金币明细　→</text><text class="coin-mark">◎</text></view>
		</view>

		<view v-if="coinStatus === 'error' || silverStatus === 'error'" class="state-banner" @click="loadData">
			<text class="state-banner-text">资产加载失败，点击重试</text>
		</view>

		<view class="stat-row">
			<view class="stat-box"><text class="stat-num">{{ wrongStats.reviewCount || 0 }}</text><text class="stat-label">待复习</text></view>
			<view class="stat-box"><text class="stat-num">{{ studyTime || '--' }}</text><text class="stat-label">今日学习</text></view>
			<view class="stat-box"><text class="stat-num">{{ wrongStats.masteredCount || 0 }}</text><text class="stat-label">已掌握</text></view>
		</view>

		<text class="section-title">我的学习</text>
		<view class="list-card">
			<my-menu-item icon="▤" label="我的作业" :value="pendingTaskText" @click="goTasks" />
			<my-menu-item icon="▱" label="错题本" :value="wrongStats.reviewCount + ' 题待复习'" @click="goWrongBook" />
			<my-menu-item icon="▥" label="学习安排" value="查看今日计划" last="true" @click="goSchedule" />
		</view>

		<text class="section-title">班级与设置</text>
		<view class="list-card">
			<my-menu-item icon="＋" label="创建 / 加入班级" value="邀请同学一起练" @click="goMyClass" />
			<my-menu-item icon="♧" label="管理班级" value="教师工作台" @click="goTeacherWorkspace" />
			<my-menu-item icon="⚙" label="设置" @click="goSettings" />
			<my-menu-item icon="◐" label="主题" :value="themeName" last="true" @click="goTheme" />
		</view>

		<text class="section-title">更多</text>
		<view class="list-card">
			<my-menu-item icon="▣" label="学习记录" @click="onComingSoon('学习记录')" />
			<my-menu-item icon="▥" label="成长统计" @click="onComingSoon('成长统计')" />
			<my-menu-item icon="◎" label="我的目标" @click="onComingSoon('我的目标')" />
			<my-menu-item icon="♕" label="终身会员" value="了解权益" @click="goMembership" />
			<my-menu-item icon="?" label="常见问题" @click="goFaq" />
			<my-menu-item icon="✉" label="向开发者提建议" @click="goFeedback" />
			<my-menu-item icon="i" label="关于学立方" last="true" @click="goAbout" />
		</view>

		<view class="bottom-space"></view>

		<!-- 底部 TabBar 固定，不随页面滚走；页面底部留出安全区域 -->
		<bottom-tab-bar current="profile" />
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import MyMenuItem from '@/components/my/MyMenuItem.vue'
	import { getMyPage } from '@/api/my.js'
	import * as homeApi from '@/api/home.js'
	import { getWrongBookStatistics } from '@/api/wrongbook.js'
	import { getTheme } from '@/api/theme.js'
	import { themeDisplayName } from '@/utils/theme.js'
	import { enterTeacherWorkspace } from '@/utils/workspace.js'

	export default {
		components: {
			BottomTabBar,
			MyMenuItem
		},
		data() {
			return {
				profile: {
					avatar: '',
					avatarText: '学',
					nickname: '同学',
					signature: '今天也要继续努力'
				},
				// learningCoin / silverCoin 字段完全独立；账户余额以后端结算为权威
				learningCoin: 0,
				silverCoin: 0,
				coinStatus: 'loading',       // loading / normal / zero / error
				silverStatus: 'loading',
				membershipStatus: 'unopened', // unopened / member / error
				pendingTaskCount: 0,
				studyTime: '',
				wrongStats: { total: 0, reviewCount: 0, masteredCount: 0 },
				// 当前首页主题名（视觉层设置，显示在「主题」入口右侧）
				themeName: '默认主题'
			}
		},
		computed: {
			pendingTaskText() { return this.pendingTaskCount + ' 项待完成' }
		},
		onShow() {
			// 每次进入页面重新加载（资产余额可能变化）
			this.loadData()
		},
		methods: {
			loadData() {
				this.coinStatus = 'loading'
				this.silverStatus = 'loading'
				getMyPage()
					.then((res) => {
						var data = res.data || {}
						this.profile = data.profile || this.profile
						var assets = data.assets || {}
						// learningCoin / silverCoin 独立字段，禁止用统一 coin 字段
						this.learningCoin = Number(assets.learningCoin) || 0
						this.silverCoin = Number(assets.silverCoin) || 0
						this.coinStatus = this.learningCoin > 0 ? 'normal' : 'zero'
						this.silverStatus = this.silverCoin > 0 ? 'normal' : 'zero'
						var m = data.membership || {}
						if (m && m.isMember) {
							this.membershipStatus = 'member'
						} else {
							this.membershipStatus = 'unopened'
						}
					})
					.catch(() => {
						this.coinStatus = 'error'
						this.silverStatus = 'error'
						this.membershipStatus = 'error'
					})
				homeApi.getHomeToday().then((res) => {
					var minutes = Number(res.data && res.data.studyDuration) || 0
					var hours = Math.floor(minutes / 60)
					this.studyTime = hours ? hours + 'h' : minutes + 'min'
					this.pendingTaskCount = (res.data && res.data.tasks || []).filter(function (task) { return !task.completed }).length
				}).catch(() => {})
				getWrongBookStatistics().then((res) => { this.wrongStats = res.data || this.wrongStats }).catch(() => {})
				// 主题状态（视觉层）：失败时静默，入口保持「默认主题」兜底，不影响其他模块
				getTheme()
					.then((res) => {
						var t = res.data || {}
						this.themeName = themeDisplayName(t.homeTheme)
					})
					.catch(() => {})
			},
			// 主题设置
			goTheme() {
				uni.navigateTo({ url: '/pages/profile/theme' })
			},
			// 学习金币详情
			goCoinDetail() {
				uni.navigateTo({ url: '/pages/profile/coin-detail' })
			},
			// 银币商城（沿用现有路由 /pages/shop/index）
			goSilverMall() {
				uni.navigateTo({ url: '/pages/shop/index' })
			},
			// 终身会员详情（当前只预留入口）
			goMembership() {
				uni.navigateTo({ url: '/pages/profile/membership' })
			},
			// 我的班级（查看/加入班级；创建班级进入教师端流程）
			goMyClass() {
				uni.navigateTo({ url: '/pages/class/index' })
			},
			goTasks() { uni.navigateTo({ url: '/pages/tasks/index' }) },
			goWrongBook() { uni.redirectTo({ url: '/pages/wrongbook/index' }) },
			goSchedule() { uni.navigateTo({ url: '/pages/schedule/index' }) },
			// 进入教师工作台：先预检 ACTIVE ADMIN；没有可管理班级时引导创建，不进入假的教师空间
			goTeacherWorkspace() {
				enterTeacherWorkspace().then(function (entered) {
					if (entered) return
					uni.showModal({
						title: '暂无可管理的班级',
						content: '创建班级并成为管理者后，即可进入教师工作台。',
						confirmText: '创建班级',
						cancelText: '继续学生端',
						success: function (r) {
							if (r.confirm) uni.navigateTo({ url: '/pages/teacher/class/create' })
						}
					})
				}).catch(function () {
					uni.showToast({ title: '管理班级加载失败，请重试', icon: 'none' })
				})
			},
			// 常见问题
			goFaq() {
				uni.navigateTo({ url: '/pages/profile/faq' })
			},
			// 开发者建议
			goFeedback() {
				uni.navigateTo({ url: '/pages/profile/feedback' })
			},
			// 设置
			goSettings() {
				uni.navigateTo({ url: '/pages/profile/settings' })
			},
			// 关于学立方
			goAbout() {
				uni.navigateTo({ url: '/pages/profile/about' })
			},
			onComingSoon(name) {
				uni.showToast({ title: name + ' 即将开放', icon: 'none' })
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

	.profile-head {
		display: flex;
		align-items: center;
		padding: 24rpx 0 18rpx;
	}

	.avatar {
		width: 108rpx;
		height: 108rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		font-size: 46rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.avatar image {
		width: 100%;
		height: 100%;
	}

	.profile-copy {
		min-width: 0;
		margin-left: 22rpx;
		display: flex;
		flex-direction: column;
	}

	.page-title {
		font-size: 38rpx;
		line-height: 1.3;
		font-weight: 600;
		color: var(--app-ink);
	}

	.profile-sub {
		margin-top: 6rpx;
		font-size: 24rpx;
		color: var(--app-muted);
	}

	.identity-row {
		display: flex;
		margin: 0 0 22rpx;
	}

	.identity-pill {
		flex-shrink: 0;
		margin-right: 12rpx;
		padding: 9rpx 18rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
		font-size: 22rpx;
		font-weight: 500;
	}

	.asset-hero {
		position: relative;
		overflow: hidden;
		padding: 30rpx 32rpx 26rpx;
		margin-bottom: 22rpx;
		border-radius: 36rpx;
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
		color: #FFFFFF;
	}

	.asset-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.asset-title {
		font-size: 25rpx;
		letter-spacing: 4rpx;
		color: rgba(255, 255, 255, 0.86);
	}

	.mall-link {
		display: inline-flex;
		align-items: center;
		padding: 8rpx 17rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.18);
		color: #FFFFFF;
		font-size: 22rpx;
	}

	.balances {
		display: flex;
		align-items: center;
		margin-top: 24rpx;
	}

	.balance {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.balance-label {
		color: rgba(255, 255, 255, 0.86);
		font-size: 24rpx;
	}

	.balance-num {
		margin-top: 8rpx;
		color: #FFFFFF;
		font-size: 64rpx;
		line-height: 1.15;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.balance-divider {
		width: 1rpx;
		height: 92rpx;
		margin: 0 24rpx;
		background: rgba(255, 255, 255, 0.20);
	}

	.asset-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 22rpx;
	}

	.asset-button {
		display: inline-flex;
		align-items: center;
		padding: 14rpx 28rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.92);
		color: var(--app-primary);
		font-size: 24rpx;
		font-weight: 600;
	}

	.coin-mark {
		color: rgba(255, 255, 255, 0.62);
		font-size: 34rpx;
	}

	.state-banner {
		margin-bottom: 20rpx;
		padding: 18rpx 24rpx;
		border-radius: 20rpx;
		background: var(--app-negative-bg);
	}

	.state-banner-text {
		font-size: 24rpx;
		color: var(--app-negative);
	}

	.stat-row {
		display: flex;
		margin-bottom: 26rpx;
	}

	.stat-box {
		flex: 1;
		min-width: 0;
		min-height: 112rpx;
		margin-right: 12rpx;
		padding: 14rpx 8rpx;
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		background: var(--app-surface-solid);
		box-shadow: var(--app-shadow-soft);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.stat-box:last-child {
		margin-right: 0;
	}

	.stat-num {
		font-size: 34rpx;
		line-height: 1.25;
		font-weight: 600;
		color: var(--app-ink);
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		margin-top: 5rpx;
		color: var(--app-muted);
		font-size: 21rpx;
	}

	.section-title {
		display: block;
		padding: 8rpx 0 12rpx;
		color: var(--app-ink);
		font-size: 32rpx;
		line-height: 1.35;
		font-weight: 600;
	}

	.list-card {
		padding: 0 26rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		background: var(--app-surface-solid);
		box-shadow: var(--app-shadow-soft);
	}

	.bottom-space {
		height: calc(132rpx + env(safe-area-inset-bottom));
	}
</style>
