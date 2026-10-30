<template>
	<view class="page">
		<view v-if="loadStatus === 'loading'" class="aq-state-card">
			<text class="aq-state-text">正在加载班级详情…</text>
		</view>
		<view v-else-if="loadStatus === 'error'" class="aq-state-card">
			<text class="aq-state-text">班级详情加载失败，请稍后重试</text>
			<view class="aq-btn aq-btn-ghost state-btn" @click="loadDetail"><text>重新加载</text></view>
		</view>
		<view v-else-if="!classInfo.name" class="aq-state-card">
			<text class="aq-state-text">班级不存在或已解散</text>
		</view>
		<block v-else>
		<!-- 班级信息（学生只读视图：不提供成员管理/修改班级/查看他人学情等操作） -->
		<view class="info-card">
			<view class="name-line">
				<text class="class-name">{{ classInfo.name }}</text>
				<text v-if="isAdmin" class="role-tag">管理员</text>
			</view>
			<text class="meta-line">管理员：{{ classInfo.adminName }}</text>
			<text class="meta-line">成员：{{ classInfo.memberCount }}人</text>
			<text v-if="classInfo.description" class="desc-line">{{ classInfo.description }}</text>
			<text v-if="classInfo.goal" class="desc-line">学习目标：{{ classInfo.goal }}</text>
			<text class="identity-line">我的身份：{{ identityText }}</text>
		</view>

		<!-- 今日班级任务（仅成员可见；与今日任务共用同一状态源，只读展示，
		     完成状态在「今日计划」翻转后此处 onShow 自动同步，不建第二套状态） -->
		<view v-if="isMember">
			<text class="section-title">今日班级任务</text>
			<view class="list-card">
				<view
					v-for="(task, index) in classTasks"
					:key="task.id"
					class="task-line"
					:class="{ 'last-row': index === classTasks.length - 1 }"
				>
					<text class="task-status" :class="{ done: task.completed }">{{ task.completed ? '✓' : '○' }}</text>
					<text class="task-title" :class="{ 'task-done': task.completed }">{{ task.title }}</text>
				</view>
				<view v-if="classTasks.length === 0" class="task-empty">
					<text class="task-empty-text">今天暂无班级任务</text>
				</view>
			</view>
			<text class="tip-line">任务在「今日计划」中完成，完成后此处自动同步</text>
		</view>
		</block>

		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import { getClassDetail } from '@/api/class.js'
	import { getTasksByFilter, isTaskStateReady } from '@/utils/taskState.js'
	import { getTodayTasks } from '@/api/home.js'

	export default {
		data() {
			return {
				classId: '',
				loadStatus: 'loading',   // loading / normal / error
				classInfo: {
					name: '',
					adminName: '',
					memberCount: 0,
					description: '',
					goal: ''
				},
				isMember: false,
				isAdmin: false,
				// 班级任务 = 今日任务中属于本班的任务（getTasksByFilter 引用筛选，
				// 不复制任务对象、不创建第二份 completed 状态）
				classTasks: []
			}
		},
		computed: {
			identityText() {
				if (this.isAdmin && this.isMember) return '管理员 · 成员'
				if (this.isAdmin) return '管理员'
				if (this.isMember) return '成员'
				return '未加入'
			}
		},
		onLoad(options) {
			this.classId = (options && options.classId) || ''
		},
		onShow() {
			// onShow 重新加载：在「今日计划」完成班级任务后返回本页，状态保持一致
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				var self = this
				if (!this.classId) {
					this.loadStatus = 'error'
					return
				}
				this.loadStatus = 'loading'
				getClassDetail(this.classId)
					.then(function (res) {
						if (!res || res.code !== 200) {
							// 含后端 403（无权限访问该班级）、404（班级不存在）等场景
							uni.showToast({ title: (res && res.message) || '班级加载失败', icon: 'none' })
							self.loadStatus = 'error'
							return
						}
						var data = res.data || {}
						self.classInfo = data.classInfo || self.classInfo
						self.isMember = !!data.isMember
						self.isAdmin = !!data.isAdmin
						self.loadStatus = 'normal'
						self.loadClassTasks()
					})
					.catch(function () {
						self.loadStatus = 'error'
					})
			},
			loadClassTasks() {
				var self = this
				if (!this.isMember) {
					// 仅管理员未加入的班级：任务不进本人今日计划，不展示
					this.classTasks = []
					return
				}
				if (!isTaskStateReady()) {
					// 冷启动直接进入本页时共享任务状态可能尚未初始化，拉一次今日任务触发
					getTodayTasks().then(function () {
						self.filterClassTasks()
					})
					return
				}
				this.filterClassTasks()
			},
			filterClassTasks() {
				this.classTasks = getTasksByFilter('all').filter((t) => {
					return t.source === 'class' && t.classId === this.classId
				})
			}
		}
	}
</script>

<style>
	.page {
		min-height: 100vh;
		padding: 20rpx var(--app-page-padding) 0;
		box-sizing: border-box;
		background: transparent;
	}

	.state-btn {
		width: 240rpx;
		height: 72rpx;
		margin: 24rpx auto 0;
		font-size: 26rpx;
	}

	.info-card {
		background-color: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		padding: 32rpx 28rpx;
		margin-bottom: 24rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.name-line {
		display: flex;
		align-items: center;
	}

	.class-name {
		font-size: 34rpx;
		font-weight: 600;
		color: var(--app-ink);
	}

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

	.meta-line {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		color: var(--app-muted);
	}

	.desc-line {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		color: var(--app-copy);
	}

	.identity-line {
		display: block;
		margin-top: 18rpx;
		padding-top: 18rpx;
		border-top: 1rpx solid var(--app-line);
		font-size: 24rpx;
		color: var(--app-hint);
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
		margin-bottom: 16rpx;
		box-shadow: var(--app-shadow-soft);
	}

	.task-line {
		display: flex;
		align-items: flex-start;
		padding: 26rpx 0;
		border-bottom: 1rpx solid var(--app-line);
	}

	.task-line.last-row {
		border-bottom: none;
		padding-bottom: 8rpx;
	}

	.task-status {
		flex-shrink: 0;
		width: 44rpx;
		font-size: 28rpx;
		color: var(--app-hint);
		line-height: 44rpx;
	}

	.task-status.done {
		color: var(--app-positive);
		font-weight: 600;
	}

	.task-title {
		flex: 1;
		min-width: 0;
		font-size: 30rpx;
		color: var(--app-ink);
		line-height: 44rpx;
	}

	.task-title.task-done {
		color: var(--app-muted);
	}

	.task-empty {
		padding: 40rpx 0 24rpx;
		text-align: center;
	}

	.task-empty-text {
		font-size: 26rpx;
		color: var(--app-muted);
	}

	.tip-line {
		display: block;
		padding: 0;
		font-size: 24rpx;
		color: var(--app-hint);
	}

	.bottom-space {
		height: 120rpx;
		height: calc(120rpx + env(safe-area-inset-bottom));
	}
</style>
