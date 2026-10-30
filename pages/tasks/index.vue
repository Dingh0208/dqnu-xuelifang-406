<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">今日计划</text>
		</view>

		<!-- 顶部完成度：已完成数量 / 今日任务总数量（实时派生，不参与金币结算） -->
		<view v-if="status === 'normal'" class="progress-line">
			<text class="progress-label">今日完成度</text>
			<text class="progress-num">{{ statCompleted }} / {{ statTotal }}</text>
		</view>

		<!-- 加载 / 失败状态（沿用页面现有配色，不影响首页与其他模块） -->
		<view v-if="status === 'loading'" class="state-tip">正在加载今日任务…</view>
		<view v-else-if="status === 'error'" class="state-tip">
			<text class="state-text">任务加载失败，请稍后重试</text>
			<text class="state-retry" @click="loadTasks">点击重试</text>
		</view>

		<template v-else-if="status === 'normal'">
			<!-- 三分类筛选常驻：全部 / 已完成 / 未完成（默认全部；只改展示，不改任务状态） -->
			<task-filter-tabs :current="currentFilter" @change="switchFilter" />

			<!-- 无任务时的产品化引导：不是空文案，而是下一步行动 -->
			<view v-if="statTotal === 0" class="empty-plan-card">
				<text class="empty-plan-title">今天还没有计划</text>
				<text class="empty-plan-sub">用 30 秒给自己安排几件小事，比盲目开始更有效。</text>
				<view class="empty-plan-btn" @click="goPlan"><text>去制定今日计划</text></view>
			</view>

			<view class="task-card">
				<task-list
					:tasks="tasks"
					:empty-text="emptyText"
					@toggle="onToggle"
				/>
			</view>
		</template>

		<view class="bottom-space"></view>

		<bottom-tab-bar current="index" />
	</view>
</template>

<script>
	import BottomTabBar from '@/components/common/BottomTabBar.vue'
	import TaskFilterTabs from './components/TaskFilterTabs.vue'
	import TaskList from './components/TaskList.vue'
	import { getTodayTasks, updateTaskCompleted } from '@/api/home.js'
	// 任务状态唯一来源：顺序与完成态全部由 taskState 维护（排序是状态，筛选是视图）
	import {
		isTaskStateReady,
		getTaskStats,
		getTasksByFilter,
		toggleTask,
		rollbackTask
	} from '@/utils/taskState.js'

	export default {
		components: {
			BottomTabBar,
			TaskFilterTabs,
			TaskList
		},
		data() {
			return {
				tasks: [],             // 当前筛选的展示任务（整体替换的新数组，不原地改对象）
				currentFilter: 'all',  // all（全部） | completed（已完成） | pending（未完成）
				status: 'loading',     // loading / normal / error（normal 下分筛空态由列表处理）
				statTotal: 0,
				statCompleted: 0,
				taskLocks: {}          // 单任务 toggle 并发锁（快速连点保护）
			}
		},
		computed: {
			// 仅当前筛选确实为 0 时显示对应空状态（空状态不再承担“任务全部消失”逻辑）
			emptyText() {
				if (this.statTotal === 0) return '今天暂无任务'
				if (this.currentFilter === 'completed') return '暂无已完成任务'
				if (this.currentFilter === 'pending') return '今日暂无未完成任务，太棒了，今天全部完成！'
				return ''
			}
		},
		onLoad() {
			this.loadTasks()
		},
		// 从首页/其他页面返回时重新读取唯一状态源（新数组整体替换，状态自然一致）
		onShow() {
			if (isTaskStateReady()) this.refresh()
		},
		methods: {
			loadTasks() {
				this.status = 'loading'
				getTodayTasks()
					.then(() => {
						this.status = 'normal'
						this.refresh()
					})
					.catch(() => {
						// 加载失败只影响本页状态展示，不影响首页/其他模块
						this.status = 'error'
					})
			},
			// 读取状态源 → 生成展示数组 → 渲染（页面不排序，只按 filter 取数）
			refresh() {
				var stats = getTaskStats()
				this.statTotal = stats.total
				this.statCompleted = stats.completed
				this.tasks = getTasksByFilter(this.currentFilter)
			},
			// 点击任务：原子操作（taskState 统一完成 翻转+顺序+持久化）→ 新数组刷新 → API 同步
			onToggle(task) {
				var id = task.id
				if (this.taskLocks[id]) return
				this.taskLocks[id] = true
				var result = toggleTask(id)
				if (!result) {
					this.taskLocks[id] = false
					return
				}
				this.refresh()
				var unlock = () => {
					this.taskLocks[id] = false
				}
				// 预留：未来切换为真实 PATCH（当前 Mock 回显确认）；失败用快照回滚
				updateTaskCompleted(id, result.completed)
					.catch(() => {
						rollbackTask(result.snapshot)
						this.refresh()
					})
					.then(unlock, unlock)
			},
			// 切换筛选：只改 currentFilter 并重新取数，不修改 completed/顺序/金币/storage
			switchFilter(key) {
				this.currentFilter = key
				this.refresh()
			},
			// 无任务 → 去工作台制定计划
			goPlan() {
				uni.navigateTo({ url: '/pages/workbench/index' })
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 10rpx 32rpx 0;
		box-sizing: border-box;
	}

	.page-title {
		display: block;
		padding: 24rpx 8rpx 18rpx;
		font-size: 38rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.progress-line {
		display: flex;
		align-items: baseline;
		padding: 0 8rpx 10rpx;
	}

	.progress-label {
		margin-right: 14rpx;
		font-size: 24rpx;
		color: var(--app-muted, #7B9AA1);
	}

	.progress-num {
		font-size: 34rpx;
		font-weight: 700;
		color: var(--app-primary, #0A5C6A);
		font-variant-numeric: tabular-nums;
	}

	.task-card {
		padding: 10rpx 28rpx 22rpx;
		margin-bottom: 24rpx;
		background: var(--app-surface, rgba(255, 255, 255, 0.90));
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
	}

	.state-tip {
		padding: 120rpx 0 40rpx;
		text-align: center;
		font-size: 25rpx;
		line-height: 1.7;
		color: var(--app-muted, #7B9AA1);
	}

	.state-text {
		display: block;
	}

	.state-retry {
		display: inline-block;
		height: 64rpx;
		line-height: 64rpx;
		margin-top: 24rpx;
		padding: 0 36rpx;
		border-radius: 999rpx;
		border: 1rpx solid var(--app-line, #D3E8E7);
		background: var(--app-surface-solid, #FFFFFF);
		color: var(--app-primary, #0A5C6A);
		font-size: 25rpx;
	}

	.empty-plan-card {
		margin: 8rpx 0 24rpx;
		padding: 34rpx 30rpx;
		background: var(--app-surface-solid, #FFFFFF);
		border: 1rpx solid var(--app-line, #D3E8E7);
		border-radius: 28rpx;
		box-shadow: var(--app-shadow-soft, 0 4rpx 14rpx rgba(10, 80, 90, 0.06));
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.empty-plan-title {
		font-size: 29rpx;
		font-weight: 600;
		color: var(--app-ink, #0D2F36);
	}

	.empty-plan-sub {
		margin-top: 10rpx;
		font-size: 23rpx;
		line-height: 1.6;
		color: var(--app-muted, #7B9AA1);
	}

	.empty-plan-btn {
		margin-top: 22rpx;
		height: 72rpx;
		padding: 0 34rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		border-radius: 999rpx;
		box-shadow: 0 6rpx 16rpx rgba(10, 92, 106, 0.16);
	}

	.empty-plan-btn text {
		font-size: 25rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.bottom-space {
		height: 160rpx;
		height: calc(160rpx + env(safe-area-inset-bottom));
	}
</style>
