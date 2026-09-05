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
		padding: 28rpx 8rpx 20rpx;
	}

	/* 顶部完成度行（沿用页面配色：#8D7964 标签 + #4A3520 数字） */
	.progress-line {
		display: flex;
		align-items: baseline;
		padding: 0 8rpx 4rpx;
	}

	.progress-label {
		font-size: 26rpx;
		color: #8D7964;
		margin-right: 16rpx;
	}

	.progress-num {
		font-size: 36rpx;
		font-weight: 600;
		color: #4A3520;
	}

	/* 任务卡片容器（沿用首页卡片视觉：#FFFDF8 底 + 24rpx 圆角 + 同款阴影） */
	.task-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 12rpx 30rpx 24rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	/* loading / error 状态提示（沿用页面现有配色） */
	.state-tip {
		padding: 120rpx 0 40rpx;
		text-align: center;
		font-size: 26rpx;
		color: #8D7964;
		line-height: 1.6;
	}

	.state-text {
		display: block;
	}

	.state-retry {
		display: inline-block;
		margin-top: 24rpx;
		padding: 10rpx 40rpx;
		border-radius: 999rpx;
		border: 1rpx solid #E0C9A6;
		background-color: #FFF9EE;
		color: #4A3520;
		font-size: 26rpx;
	}

	.bottom-space {
		height: 160rpx;
		height: calc(160rpx + env(safe-area-inset-bottom));
	}
</style>
