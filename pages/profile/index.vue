<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">我的</text>
		</view>

		<!-- ① 顶部个人信息：头像 + 昵称 + 签名 + 设置入口；顶部不堆放金币/天数/排名等大量信息 -->
		<my-profile-card :profile="profile" @settings="goSettings" />

		<!-- ② 我的学习资产：学习金币（金色）+ 银币（银色）并排，两者必须明显区分 -->
		<asset-section
			:learning-coin="learningCoin"
			:silver-coin="silverCoin"
			:coin-status="coinStatus"
			:silver-status="silverStatus"
			@coin-detail="goCoinDetail"
			@silver-mall="goSilverMall"
			@reload="loadData"
		/>

		<!-- ③ 终身会员：当前只预留入口，不显示价格/折扣/抵扣比例 -->
		<membership-card :status="membershipStatus" @view="goMembership" />

		<!-- ④ 我的学习：学习记录 / 成长统计 / 我的目标；不新增「我的工作台」（工作台已是底部 Tab） -->
		<text class="section-title">我的学习</text>
		<view class="list-card">
			<my-menu-item icon="📚" label="学习记录" @click="onComingSoon('学习记录')" />
			<my-menu-item icon="📊" label="成长统计" @click="onComingSoon('成长统计')" />
			<my-menu-item icon="🎯" label="我的目标" last="true" @click="onComingSoon('我的目标')" />
		</view>

		<!-- ⑤ 帮助与反馈：常见问题 / 向开发者提建议 -->
		<text class="section-title">帮助与反馈</text>
		<view class="list-card">
			<my-menu-item icon="❓" label="常见问题" @click="goFaq" />
			<my-menu-item icon="💬" label="向开发者提建议" last="true" @click="goFeedback" />
		</view>

		<!-- ⑥ 设置：设置入口 + 主题入口（主题为视觉层设置，归在设置区域，普通菜单项样式） -->
		<text class="section-title">设置</text>
		<view class="list-card">
			<my-menu-item icon="⚙" label="设置" @click="goSettings" />
			<my-menu-item icon="◐" label="主题" :value="themeName" last="true" @click="goTheme" />
		</view>

		<!-- ⑦ 关于学立方 -->
		<text class="section-title">关于</text>
		<view class="list-card">
			<my-menu-item icon="ℹ" label="关于学立方" last="true" @click="goAbout" />
		</view>

		<view class="bottom-space"></view>

		<!-- 底部 TabBar 固定，不随页面滚走；页面底部留出安全区域 -->
		<bottom-tab-bar current="profile" />
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import MyProfileCard from '@/components/my/MyProfileCard.vue'
	import AssetSection from '@/components/my/AssetSection.vue'
	import MembershipCard from '@/components/my/MembershipCard.vue'
	import MyMenuItem from '@/components/my/MyMenuItem.vue'
	import { getMyPage } from '@/api/my.js'
	import { getTheme } from '@/api/theme.js'
	import { themeDisplayName } from '@/utils/theme.js'

	export default {
		components: {
			BottomTabBar,
			MyProfileCard,
			AssetSection,
			MembershipCard,
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
				// 当前首页主题名（视觉层设置，显示在「主题」入口右侧）
				themeName: '默认主题'
			}
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
						// error 状态：不崩溃，资产卡显示 -- 支持重新加载
						this.coinStatus = 'error'
						this.silverStatus = 'error'
						this.membershipStatus = 'error'
					})
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
		background-color: #F7EFE3;
		padding: 10rpx 24rpx 0;
		box-sizing: border-box;
	}

	.page-title {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: #4A3520;
		padding: 28rpx 8rpx 26rpx;
	}

	.section-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #4A3520;
		padding: 8rpx 10rpx 14rpx;
	}

	.list-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 0 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.bottom-space {
		height: 160rpx;
		height: calc(160rpx + env(safe-area-inset-bottom));
	}
</style>
