<template>
	<view class="page student-page">
		<view class="welcome-row">
			<view class="avatar">
				<image v-if="profile.avatar" class="avatar-img" :src="profile.avatar" mode="aspectFill" />
				<text v-else>{{ profile.avatarText || (profile.nickname || '同')[0] }}</text>
			</view>
			<view class="welcome-copy">
				<text class="page-title">{{ greeting || '早上好' }}，{{ profile.nickname || '同学' }}</text>
				<text class="welcome-sub">今天也按自己的节奏，做好眼前这几件事</text>
			</view>
		</view>

		<today-progress
			:completed-tasks="completedTasks"
			:total-tasks="totalTasks"
			:percent="completionPercent"
			:coins="todayRewardCoins"
			:study-time="studyTime"
			@more="goTasks"
		/>

		<today-tasks
			:tasks="todayTasks"
			:empty-text="homeEmptyText"
			:empty-action-text="homeEmptyActionText"
			@toggle="toggleTask"
			@more="goTasks"
			@start="startFocus"
			@empty-action="handleHomeEmptyAction"
		/>

		<today-review :reviews="reviews" @more="goReview" />

		<view class="bottom-space"></view>

		<!-- 底部主导航（四个主页面共享同一组件） -->
		<bottom-tab-bar current="index" />

		<!-- 每日欢迎弹窗（独立 Overlay，不占首页布局） -->
		<welcome-modal
			:visible="welcomeVisible"
			:greeting="greeting"
			:message="welcomeMessage"
			:task-count="welcomeTaskCount"
			:estimated-text="welcomeEstimatedText"
			@close="closeWelcome"
		/>

		<!-- 专注学习浮层：从任务预计时长倒计时，完成后一键打卡 -->
		<focus-overlay
			:visible="focusVisible"
			:task="focusTask"
			@close="closeFocus"
			@complete="completeFocus"
		/>
	</view>
</template>

<script>
	import TodayProgress from '@/components/home/TodayProgress.vue'
	import TodayTasks from '@/components/home/TodayTasks.vue'
	import TodayReview from '@/components/home/TodayReview.vue'
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import WelcomeModal from '@/components/home/WelcomeModal.vue'
	import FocusOverlay from '@/components/home/FocusOverlay.vue'
	// 页面只依赖 api 层；USE_MOCK=true 时 api 层内部返回 Mock，后端接入后页面无需改动
	import * as homeApi from '@/api/home.js'
	import { getMyPage } from '@/api/my.js'
	// 学习金币奖励纯计算（今日预计金币：每完成约 10% 任务得 1 枚，0～10）
	import { completionRateByCount, todayRewardCoins as calcTodayRewardCoins } from '@/utils/reward.js'
	// 任务状态单一来源（Bug-1）：首页与今日计划共享同一份任务数组，翻转/排序/持久化统一在此
	import {
		isTaskStateReady,
		getTaskStats,
		getPendingTasks,
		toggleTask,
		rollbackTask
	} from '@/utils/taskState.js'

	// 本地存储 key（任务状态 storage 已由 utils/taskState.js 统一管理，页面不再直读直写）
	var WELCOME_DATE_KEY = 'student_home_welcome_date'

	function formatDate(d) {
		var m = d.getMonth() + 1
		var day = d.getDate()
		return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
	}

	// 80 分钟 → "1h 20min"
	function formatStudyDuration(minutes) {
		var h = Math.floor(minutes / 60)
		var m = minutes % 60
		if (h === 0) return m + 'min'
		return m === 0 ? h + 'h' : h + 'h ' + m + 'min'
	}

	// 150 分钟 → "2小时30分钟"
	function formatEstimated(minutes) {
		var h = Math.floor(minutes / 60)
		var m = minutes % 60
		if (h === 0) return m + '分钟'
		return m === 0 ? h + '小时' : h + '小时' + m + '分钟'
	}

	export default {
		components: {
			TodayProgress,
			TodayTasks,
			TodayReview,
			BottomTabBar,
			WelcomeModal,
			FocusOverlay
		},
		data() {
			return {
				tasks: [],          // 首页按 taskState 顺序展示待完成任务（getPendingTasks）
				statCompleted: 0,   // 今日已完成数（统计/完成度/金币用，来自唯一状态源）
				statTotal: 0,       // 今日任务总数
				profile: { avatar: '', avatarText: '学', nickname: '同学' },
				reviews: [],
				studyTime: '',
				greeting: '',
				welcomeMessage: '',
				welcomeTaskCount: 0,
				welcomeEstimatedText: '',
				welcomeVisible: false,
				// 专注浮层状态
				focusVisible: false,
				focusTask: null,
				// 单任务 toggle 并发锁（同一任务请求进行期间禁止重复提交）
				taskLocks: {}
			}
		},
		computed: {
			// 已完成任务数 / 总数：来自 taskState 统计（tasks 只是未完成展示数组）
			completedTasks() {
				return this.statCompleted
			},
			totalTasks() {
				return this.statTotal
			},
			// 完成度：已完成任务数量 ÷ 今日任务总数量（所有任务等权；任务完成状态是唯一源数据）
			completionRate() {
				return completionRateByCount(this.completedTasks, this.totalTasks)
			},
			completionPercent() {
				return Math.round(this.completionRate) + '%'
			},
			// 今日预计学习金币：每 10% 完成度 1 枚，最高 10 枚，始终由完成度实时派生，不累加
			todayRewardCoins() {
				return calcTodayRewardCoins(this.completedTasks, this.totalTasks)
			},
			// 【2026-09 重写】首页「今日计划」卡片只显示未完成任务（completed === false）：
			// 纯 filter 展示，完成任务从首页卡片自然消失（数据仍保留在 this.tasks 全量中，
			// 完成度/金币统计不受影响）；顺序 = 原始顺序，不做任何排序
			todayTasks() {
				return this.tasks
			},
			// 空态文案与行动入口：把「没有任务/全部完成」升级为可执行的下一步
			homeEmptyText() {
				if (this.statTotal === 0) return '今天还没有任务，先给自己安排一件小事吧'
				if (this.statCompleted >= this.statTotal) return '今日任务已全部完成，给自己点个赞'
				return ''
			},
			homeEmptyActionText() {
				if (this.statTotal === 0) return '去制定今日计划'
				if (this.statCompleted >= this.statTotal) return '去复习错题'
				return ''
			}
		},
		onLoad() {
			this.loadHome()
			getMyPage().then((res) => {
				this.profile = (res && res.data && res.data.profile) || this.profile
			}).catch(() => {})
		},
		// 从今日计划/其他页面返回时，重新读取唯一状态源（新数组整体替换，状态自然一致）
		onShow() {
			if (isTaskStateReady()) {
				this.refreshTasks()
			}
		},
		methods: {
			// 首页聚合数据：当前走 Mock（USE_MOCK=true），未来同一切换为 GET /api/student/home/today
			loadHome() {
				homeApi.getHomeToday().then((res) => {
					var d = res.data
					this.reviews = d.reviews
					this.studyTime = formatStudyDuration(d.studyDuration)
					this.greeting = d.welcome.greeting
					this.welcomeMessage = d.welcome.message
					this.welcomeTaskCount = d.welcome.todayTaskCount
					this.welcomeEstimatedText = formatEstimated(d.welcome.estimatedStudyMinutes)
					// 任务数据从唯一状态源读取（新数组整体替换）
					this.refreshTasks()
					this.checkWelcome()
				})
			},
			// 读取状态源 → 生成展示数组 → 渲染：
			// 卡片只显示未完成任务（getPendingTasks 返回全新数组，顺序由 taskState 维护）；
			// 统计/完成度/金币读 getTaskStats。页面不排序、不原地改 task 对象。
			refreshTasks() {
				var stats = getTaskStats()
				this.statTotal = stats.total
				this.statCompleted = stats.completed
				this.tasks = getPendingTasks()
			},
			// 点击任务：原子操作（taskState 统一完成 翻转+顺序+持久化）→ 新数组刷新 → API 同步
			toggleTask(task) {
				var id = task.id
				if (this.taskLocks[id]) return
				this.taskLocks[id] = true
				var result = toggleTask(id)
				if (!result) {
					this.taskLocks[id] = false
					return
				}
				this.refreshTasks()
				var unlock = () => {
					this.taskLocks[id] = false
				}
				// 预留：未来切换为真实 PATCH /api/student/home/today/tasks/{taskId}（当前 Mock 回显确认）
				homeApi.updateTaskCompleted(id, result.completed)
					.catch(() => {
						rollbackTask(result.snapshot) // 失败用快照回滚（状态+顺序）
						this.refreshTasks()
					})
					.then(unlock, unlock)
			},
			// ===== 专注学习浮层 =====
			startFocus(task) {
				this.focusTask = task
				this.focusVisible = true
			},
			closeFocus() {
				this.focusVisible = false
				this.focusTask = null
			},
			// 专注完成 → 标记任务完成（复用统一 toggle；已完成的任务不会重复翻转）
			completeFocus(task) {
				this.closeFocus()
				if (task && !task.completed) {
					this.toggleTask(task)
				}
			},
			// 空态行动：无任务 → 去工作台/AI 制定计划；全完成 → 去错题本复习
			handleHomeEmptyAction() {
				if (this.statTotal === 0) {
					uni.navigateTo({ url: '/pages/workbench/index' })
				} else {
					uni.navigateTo({ url: '/pages/wrongbook/index' })
				}
			},
			// ===== 三个“查看全部”跳转（二级页面，navigateTo 保留返回） =====
			goSchedule() {
				uni.navigateTo({ url: '/pages/schedule/index' })
			},
			goTasks() {
				uni.navigateTo({ url: '/pages/tasks/index' })
			},
			goReview() {
				uni.navigateTo({ url: '/pages/review/index' })
			},
			// ===== 每日欢迎弹窗（按天 storage） =====
			checkWelcome() {
				var today = formatDate(new Date())
				var shownDate = ''
				try {
					shownDate = uni.getStorageSync(WELCOME_DATE_KEY) || ''
				} catch (e) {
					shownDate = ''
				}
				this.welcomeVisible = shownDate !== today
			},
			closeWelcome() {
				this.welcomeVisible = false
				try {
					uni.setStorageSync(WELCOME_DATE_KEY, formatDate(new Date()))
				} catch (e) {}
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 12rpx 32rpx 0;
		box-sizing: border-box;
	}

	.welcome-row {
		display: flex;
		align-items: center;
		padding: 24rpx 8rpx 28rpx;
	}

	.avatar {
		width: 84rpx;
		height: 84rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, var(--app-primary, #0A5C6A) 0%, var(--app-accent, #12B5A5) 100%);
		color: #FFFFFF;
		font-size: 38rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
		box-shadow: 0 8rpx 18rpx rgba(10, 92, 106, 0.18);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
	}

	.welcome-copy {
		min-width: 0;
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
		line-height: 1.35;
	}

	.welcome-sub {
		margin-top: 6rpx;
		font-size: 24rpx;
		line-height: 1.5;
		color: var(--app-muted, #7B9AA1);
	}

	.bottom-space {
		height: calc(132rpx + env(safe-area-inset-bottom));
	}
</style>
