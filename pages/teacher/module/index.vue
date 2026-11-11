<template>
	<view class="page">
		<view class="bg-layer"><view class="blob"></view></view>
		<view class="top-bar" :style="teacherTopBarStyle">
			<view class="top-side"><view class="back-hit" @tap="goBack"><text class="back-icon">‹</text></view></view>
			<text class="top-title">{{ config.title }}</text>
			<view class="top-side"></view>
		</view>

		<scroll-view class="content" scroll-y :show-scrollbar="false" refresher-enabled @refresherrefresh="refresh">
			<view class="content-inner">
				<view class="intro">
					<text class="intro-title">{{ config.title }}</text>
					<text class="intro-copy">{{ config.subtitle }}</text>
				</view>

				<view v-if="stats.length" class="stat-row">
					<view v-for="stat in stats" :key="stat.label" class="stat-cell">
						<text class="stat-value">{{ stat.value }}</text>
						<text class="stat-label">{{ stat.label }}</text>
					</view>
				</view>

				<template v-if="module !== 'summary'">
					<view v-if="module === 'memo'" class="filter-row">
						<view v-for="filter in memoFilters" :key="filter.key" class="filter-chip" :class="{ selected: memoFilter === filter.key }" @tap="memoFilter = filter.key">{{ filter.label }}</view>
					</view>

					<view v-if="module !== 'students'" class="form-card">
						<view class="form-head">
							<text class="form-title">{{ form.id ? '编辑记录' : config.formTitle }}</text>
							<text v-if="form.id" class="cancel-edit" @tap="resetForm">取消编辑</text>
						</view>
						<view v-for="field in config.fields" :key="field.key" class="field">
							<text class="field-label">{{ field.label }}<text v-if="field.required" class="required"> *</text></text>
							<picker v-if="field.options || field.key === 'classId'" :range="fieldOptions(field)" :value="optionIndex(field)" @change="onPickerChange($event, field)">
								<view class="picker-value">{{ fieldDisplay(field) || field.placeholder || '请选择' }}<text class="picker-arrow">⌄</text></view>
							</picker>
							<picker v-else-if="field.type === 'date' || field.type === 'time'" :mode="field.type" :value="form[field.key] || ''" @change="onPickerChange($event, field)">
								<view class="picker-value">{{ form[field.key] || field.placeholder || '请选择' }}<text class="picker-arrow">⌄</text></view>
							</picker>
							<textarea v-else-if="field.type === 'textarea'" class="textarea" :value="form[field.key] || ''" :placeholder="field.placeholder" maxlength="1000" @input="onFieldInput($event, field.key)" />
							<input v-else class="input" :type="field.type || 'text'" :value="form[field.key] || ''" :placeholder="field.placeholder" :maxlength="field.maxlength || 120" @input="onFieldInput($event, field.key)" />
						</view>
						<view v-if="module === 'courseware'" class="file-row">
							<text class="file-name">{{ form.fileName || '可选：从微信文件中添加课件' }}</text>
							<view class="small-action" @tap="chooseCourseware">选择文件</view>
						</view>
						<view class="save-btn" :class="{ disabled: saving }" @tap="saveForm">{{ saving ? '保存中…' : (form.id ? '保存修改' : config.saveLabel) }}</view>
					</view>

					<view v-if="module === 'students'" class="class-picker-block">
						<text class="section-title">班级学生</text>
						<picker :range="classNames" :value="classIndex" @change="onClassChange">
							<view class="picker-value">{{ selectedClassName || '暂无管理班级' }}<text class="picker-arrow">⌄</text></view>
						</picker>
						<input class="input search-input" :value="searchText" placeholder="搜索学生姓名" @input="searchText = $event.detail.value" />
					</view>

					<view class="list-head">
						<text class="section-title">{{ config.listTitle }}</text>
						<text class="list-count">{{ visibleRecords.length }} 条</text>
					</view>
					<view v-if="loading" class="empty-state">正在加载…</view>
					<view v-else-if="error" class="empty-state"><text>{{ error }}</text><text class="retry-link" @tap="load">重新加载</text></view>
					<view v-else-if="visibleRecords.length === 0" class="empty-state">
						<text>{{ module === 'students' ? (classes.length ? '这个班级还没有学生' : '先创建一个班级，再管理学生') : config.emptyText }}</text>
					</view>
					<view v-else class="record-list">
						<view v-for="item in visibleRecords" :key="item.id" class="record-row">
							<view class="record-main" @tap="module === 'courseware' ? openCourseware(item) : editRecord(item)">
								<view class="record-title-line">
									<text class="record-title">{{ recordTitle(item) }}</text>
									<text v-if="module === 'memo' && item.starred" class="pin-mark">置顶</text>
									<text v-if="module === 'students' && studentMeta(item).focus" class="focus-mark">重点</text>
								</view>
								<text class="record-meta">{{ recordMeta(item) }}</text>
								<text v-if="recordDescription(item)" class="record-desc">{{ recordDescription(item) }}</text>
							</view>
							<view class="row-actions">
								<text v-if="module === 'memo'" class="row-action pin-action" @tap="togglePinned(item)">{{ item.starred ? '取消置顶' : '置顶' }}</text>
								<text v-if="module === 'memo'" class="row-action" @tap="toggleDone(item)">{{ item.status === 'DONE' ? '恢复' : '完成' }}</text>
								<text v-if="module === 'students'" class="row-action" @tap="editStudent(item)">标签</text>
								<text v-if="module === 'students'" class="row-action" @tap="toggleStudentFocus(item)">{{ studentMeta(item).focus ? '取消重点' : '重点关注' }}</text>
								<text v-if="module !== 'summary' && module !== 'students'" class="row-action" @tap="editRecord(item)">编辑</text>
								<text v-if="module !== 'students'" class="row-action delete-action" @tap="confirmDelete(item)">删除</text>
							</view>
						</view>
				</view>
			</template>

			<view v-else-if="error" class="empty-state"><text>{{ error }}</text><text class="retry-link" @tap="load">重新加载</text></view>
				<view v-else class="summary-list">
					<view v-for="row in summaryRows" :key="row.title" class="summary-row" @tap="openModule(row.module)">
						<view class="summary-copy"><text class="summary-title">{{ row.title }}</text><text class="summary-sub">{{ row.subtitle }}</text></view>
						<text class="summary-value">{{ row.value }}</text>
					</view>
				</view>
			</view>
			<view class="bottom-space"></view>
		</scroll-view>
	</view>
</template>

<script>
	import * as authApi from '@/api/auth.js'
	import * as workspaceApi from '@/api/teacher/workspace.js'
	import { getClasses, getClassMembers } from '@/api/class.js'
	import { getClassTasks } from '@/api/teacher/task.js'

	var DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
	var MODULES = {
		memo: {
			type: 'memos', title: '教师备忘录', subtitle: '把要处理的事记下来，置顶事项会排在前面。', formTitle: '新建备忘', saveLabel: '保存备忘', listTitle: '我的备忘', emptyText: '还没有备忘，先记下一件要处理的事。',
			fields: [
				{ key: 'title', label: '标题', required: true, placeholder: '例如：准备周五家长会材料', maxlength: 120 },
				{ key: 'category', label: '分类', options: ['教学', '班级', '学生', '会议', '个人'], values: ['TEACHING', 'CLASS', 'STUDENT', 'MEETING', 'PERSONAL'] },
				{ key: 'dueAt', label: '提醒日期', type: 'date' },
				{ key: 'priority', label: '优先级', options: ['普通', '紧急'], values: ['NORMAL', 'URGENT'] },
				{ key: 'content', label: '补充内容', type: 'textarea', placeholder: '选填' }
			]
		},
		activity: {
			type: 'activities', title: '班级活动', subtitle: '发布活动安排，并持续记录准备情况与活动结果。', formTitle: '发布活动', saveLabel: '发布活动', listTitle: '活动记录', emptyText: '还没有活动安排。',
			fields: [
				{ key: 'classId', label: '所属班级', required: true, placeholder: '先创建并选择管理班级' },
				{ key: 'title', label: '活动名称', required: true, placeholder: '例如：秋季阅读分享会' },
				{ key: 'date', label: '活动日期', type: 'date', required: true },
				{ key: 'time', label: '开始时间', type: 'time' },
				{ key: 'location', label: '地点', placeholder: '活动教室或集合地点' },
				{ key: 'category', label: '活动类型', options: ['课堂活动', '班级建设', '家长会', '其他'] },
				{ key: 'description', label: '活动安排/记录', type: 'textarea', placeholder: '活动内容、准备事项或活动后记录' }
			]
		},
		conversation: {
			type: 'conversations', title: '谈话记录', subtitle: '登记学生或家长沟通主题、内容和后续跟进。', formTitle: '登记谈话', saveLabel: '保存谈话记录', listTitle: '沟通记录', emptyText: '还没有谈话记录。',
			fields: [
				{ key: 'studentName', label: '学生姓名', required: true, placeholder: '填写学生姓名' },
				{ key: 'contactType', label: '沟通对象', options: ['学生', '家长'] },
				{ key: 'topic', label: '沟通主题', required: true, options: ['学习情况', '行为习惯', '心理关怀', '家校沟通', '其他'] },
				{ key: 'talkAt', label: '谈话日期', type: 'date' },
				{ key: 'content', label: '谈话内容', type: 'textarea', placeholder: '记录沟通要点，注意保护敏感信息' },
				{ key: 'followUp', label: '后续跟进', type: 'textarea', placeholder: '需要跟进的事项（选填）' },
				{ key: 'followUpStatus', label: '跟进状态', options: ['待跟进', '已完成'] }
			]
		},
		courseware: {
			type: 'courseware', title: '我的课件', subtitle: '按学科和类型整理教学文件，可在本机预览。', formTitle: '添加课件', saveLabel: '保存课件', listTitle: '课件资料', emptyText: '还没有课件，添加标题后可选取文件。',
			fields: [
				{ key: 'title', label: '资料名称', required: true, placeholder: '例如：分数加减法课件' },
				{ key: 'subject', label: '学科', placeholder: '数学' },
				{ key: 'category', label: '资料类型', options: ['课件', '教案', '练习', '素材'] },
				{ key: 'description', label: '说明', type: 'textarea', placeholder: '选填' }
			]
		},
		schedule: {
			type: 'schedule', title: '我的课表', subtitle: '维护每周课程、班级、节次和上课地点。', formTitle: '添加课程', saveLabel: '保存课程', listTitle: '每周课程', emptyText: '还没有课程安排。',
			fields: [
				{ key: 'subject', label: '课程/科目', required: true, placeholder: '语文' },
				{ key: 'classId', label: '班级', required: true, placeholder: '先创建并选择管理班级' },
				{ key: 'weekday', label: '星期', options: DAY_NAMES, values: [1, 2, 3, 4, 5, 6, 7], required: true },
				{ key: 'period', label: '节次', type: 'number', required: true, placeholder: '例如 1' },
				{ key: 'startTime', label: '开始时间', type: 'time', required: true },
				{ key: 'endTime', label: '结束时间', type: 'time', required: true },
				{ key: 'location', label: '教室', placeholder: 'A301' },
				{ key: 'effectiveFrom', label: '生效日期', type: 'date', required: true },
				{ key: 'effectiveTo', label: '结束日期', type: 'date' }
			]
		},
		grades: {
			type: 'grades', title: '成绩分析', subtitle: '按考试、班级和学科记录均分与分数区间。', formTitle: '登记考试成绩概况', saveLabel: '保存成绩概况', listTitle: '考试记录', emptyText: '还没有考试记录。',
			fields: [
				{ key: 'examName', label: '考试名称', required: true, placeholder: '期中考试' },
				{ key: 'className', label: '班级', required: true, placeholder: '高一（3）班' },
				{ key: 'subject', label: '学科', required: true, placeholder: '数学' },
				{ key: 'examDate', label: '考试日期', type: 'date' },
				{ key: 'average', label: '平均分', type: 'digit', placeholder: '0–100' },
				{ key: 'highest', label: '最高分', type: 'digit', placeholder: '0–100' },
				{ key: 'lowest', label: '最低分', type: 'digit', placeholder: '0–100' },
				{ key: 'studentCount', label: '参考人数', type: 'number', placeholder: '人数' },
				{ key: 'notes', label: '分析备注', type: 'textarea', placeholder: '知识点或后续教学安排' }
			]
		},
		students: {
			type: 'students', title: '学生管理', subtitle: '查看班级成员并维护分组、标签和重点关注标记。', formTitle: '', saveLabel: '', listTitle: '班级学生', emptyText: '暂无学生。', fields: []
		},
		summary: {
			type: '', title: '工作汇总', subtitle: '从已登记的教学记录汇总工作量与待跟进事项。', formTitle: '', saveLabel: '', listTitle: '', emptyText: '', fields: []
		}
	}

	function today() {
		var d = new Date()
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
	}

	function weekdayIndex(value) {
		if (typeof value === 'number') return value - 1
		return DAY_NAMES.indexOf(value)
	}

	export default {
		data() {
			return {
				module: 'memo', loading: true, saving: false, error: '', records: [], classes: [], selectedClassId: '', searchText: '',
				studentMetadata: [], memoFilter: 'all', form: {}, summaryData: {},
				memoFilters: [{ key: 'all', label: '全部' }, { key: 'todo', label: '待办' }, { key: 'pinned', label: '置顶' }, { key: 'done', label: '已完成' }]
			}
		},
		computed: {
			config() { return MODULES[this.module] || MODULES.memo },
			classNames() { return this.classes.map(function (item) { return item.name }) },
			classIndex() {
				for (var i = 0; i < this.classes.length; i++) if (this.classes[i].id === this.selectedClassId) return i
				return 0
			},
			selectedClassName() {
				var cls = this.classes[this.classIndex]
				return cls ? cls.name : ''
			},
			studentRecords() {
				var self = this
				var list = []
				this.records.forEach(function (record) {
					if (record.classId !== self.selectedClassId) return
					var meta = self.studentMeta(record)
						if (self.searchText && String(record.nickname || '').indexOf(self.searchText.trim()) < 0) return
					list.push(Object.assign({}, record, { _meta: meta }))
				})
				return list
			},
			visibleRecords() {
				var list = this.module === 'students' ? this.studentRecords : this.records
				if (this.module === 'memo') {
					if (this.memoFilter === 'todo') list = list.filter(function (item) { return item.status !== 'DONE' })
					if (this.memoFilter === 'pinned') list = list.filter(function (item) { return item.starred })
					if (this.memoFilter === 'done') list = list.filter(function (item) { return item.status === 'DONE' })
					list = list.slice().sort(function (a, b) { return Number(!!b.starred) - Number(!!a.starred) })
				}
				if (this.module === 'schedule') {
					list = list.slice().sort(function (a, b) { return weekdayIndex(a.weekday) - weekdayIndex(b.weekday) || String(a.startTime || '').localeCompare(String(b.startTime || '')) })
				}
				return list
			},
			stats() {
				var list = this.records
				if (this.module === 'memo') return [
					{ label: '全部', value: list.length },
					{ label: '待办', value: list.filter(function (item) { return item.status !== 'DONE' }).length },
					{ label: '置顶', value: list.filter(function (item) { return item.starred }).length }
				]
				if (this.module === 'students') {
					var classId = this.selectedClassId
					return [
					{ label: '班级', value: this.classes.length },
					{ label: '学生', value: this.records.filter(function (item) { return item.classId === classId && item.isMember }).length },
					{ label: '重点关注', value: this.studentMetadata.filter(function (item) { return item.classId === classId && item.focus }).length }
					]
				}
				if (this.module === 'summary') return []
				var pending = this.module === 'conversation' ? list.filter(function (item) { return item.followUpStatus !== '已完成' && item.followUp }).length : 0
				var secondary = this.module === 'activity' ? list.filter(function (item) { return item.date >= today() }).length : (this.module === 'conversation' ? pending : list.length)
				var latest = list.length && list[0].updatedAt ? String(list[0].updatedAt).slice(0, 10) : '—'
				return [{ label: '记录', value: list.length }, { label: this.module === 'activity' ? '近期' : (this.module === 'conversation' ? '待跟进' : '最近更新'), value: secondary }, { label: '已更新', value: latest }]
			},
			summaryRows() {
				var all = this.summaryData || {}
				return [
					{ title: '教学任务', subtitle: '已发布并跟踪学生完成进度', value: all.tasks || 0, module: 'homework' },
					{ title: '班级活动', subtitle: '活动发布与活动记录', value: all.activities || 0, module: 'activity' },
					{ title: '备忘待办', subtitle: '尚未完成的个人工作事项', value: all.openMemos || 0, module: 'memo' },
					{ title: '谈话待跟进', subtitle: '需要继续联系的学生或家长', value: all.followUps || 0, module: 'conversation' },
					{ title: '课件资料', subtitle: '已整理到教师资料库', value: all.courseware || 0, module: 'courseware' },
					{ title: '本周课程', subtitle: '教师每周课表记录', value: all.lessons || 0, module: 'schedule' }
				]
			}
		},
		onLoad(options) {
			this.module = options && MODULES[options.module] ? options.module : 'memo'
			this.form = this.emptyForm()
		},
		onShow() {
			if (!authApi.requireTeacher()) return
			this.load()
		},
		methods: {
			goBack() { uni.navigateBack({ delta: 1 }) },
			emptyForm() {
				var form = {}
				;(MODULES[this.module] || MODULES.memo).fields.forEach(function (field) { form[field.key] = '' })
				if (this.module === 'memo') Object.assign(form, { category: 'TEACHING', priority: 'NORMAL', status: 'OPEN', starred: false })
				if (this.module === 'activity') Object.assign(form, { category: '课堂活动', date: today() })
				if (this.module === 'conversation') Object.assign(form, { contactType: '学生', topic: '学习情况', talkAt: today(), followUpStatus: '待跟进' })
				if (this.module === 'courseware') Object.assign(form, { category: '课件', fileName: '', filePath: '' })
				if (this.module === 'schedule') Object.assign(form, { weekday: new Date().getDay() || 7, period: '', effectiveFrom: today(), effectiveTo: '' })
				if (this.module === 'grades') form.examDate = today()
				return form
			},
			load() {
				var self = this
				this.loading = true
				this.error = ''
				if (this.module === 'summary') {
					this.loadSummary()
						.then(function (data) { self.summaryData = data })
						.catch(function () { self.error = '汇总数据加载失败，请下拉重试' })
						.then(function () { self.loading = false })
					return
				}
				if (this.module === 'students') {
					this.loadStudents()
						.catch(function (err) { self.error = err.message || '班级学生加载失败' })
						.then(function () { self.loading = false })
					return
				}
				var recordsPromise = this.module === 'schedule' || this.module === 'activity'
					? Promise.all([
						workspaceApi.getTeacherRecords(this.config.type, this.module === 'schedule' ? { weekStart: this.weekStart() } : {}),
						getClasses()
					]).then(function (result) {
						var response = result[1]
						if (!response || response.code !== 200) throw new Error((response && response.message) || '班级加载失败')
						self.classes = (response.data && response.data.managedClasses) || []
						if (!self.form.id && !self.form.classId && self.classes.length) {
							self.form.classId = self.classes[0].id
							self.form.className = self.classes[0].name
						}
						return result[0]
					})
					: workspaceApi.getTeacherRecords(this.config.type)
				recordsPromise
					.then(function (items) { self.records = items || [] })
					.catch(function () { self.error = '记录加载失败，请下拉重试' })
					.then(function () { self.loading = false })
			},
			resetForm() { this.form = this.emptyForm() },
			refresh() { var self = this; this.load(); setTimeout(function () { if (uni.stopPullDownRefresh) uni.stopPullDownRefresh() }, 300) },
			weekStart() {
				var date = new Date()
				date.setDate(date.getDate() - (date.getDay() + 6) % 7)
				return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
			},
			loadSummary() {
				var types = ['memos', 'activities', 'conversations', 'courseware', 'schedule']
				var weekStart = this.weekStart()
				var calls = types.map(function (type) { return workspaceApi.getTeacherRecords(type, type === 'schedule' ? { weekStart: weekStart } : {}) })
				return Promise.all([Promise.all(calls), getClasses()]).then(function (result) {
					var groups = result[0]
					var classes = (result[1] && result[1].data && result[1].data.managedClasses) || []
					var tasks = classes.map(function (cls) { return getClassTasks(cls.id) })
					return Promise.all(tasks).then(function (taskGroups) {
						var taskCount = 0
						taskGroups.forEach(function (res) { taskCount += (res && res.data && res.data.tasks ? res.data.tasks.length : 0) })
						return {
							tasks: taskCount,
							activities: groups[1].length,
							openMemos: groups[0].filter(function (item) { return item.status !== 'DONE' }).length,
							followUps: groups[2].filter(function (item) { return item.followUp && item.followUpStatus !== '已完成' }).length,
							courseware: groups[3].length,
							lessons: groups[4].length
						}
					})
				})
			},
			loadStudents() {
				var self = this
				return Promise.all([getClasses(), workspaceApi.getTeacherRecords('studentMeta')]).then(function (result) {
					var response = result[0]
					if (!response || response.code !== 200) throw new Error((response && response.message) || '班级加载失败')
					self.classes = (response.data && response.data.managedClasses) || []
					self.studentMetadata = result[1] || []
					if (!self.selectedClassId && self.classes.length) self.selectedClassId = self.classes[0].id
					return Promise.all(self.classes.map(function (cls) {
						return getClassMembers(cls.id).then(function (res) {
							if (!res || res.code !== 200) return []
							return (res.data.members || []).map(function (member) { return Object.assign({}, member, { classId: cls.id, className: cls.name, id: cls.id + ':' + member.userId }) })
						})
					})).then(function (lists) { self.records = [].concat.apply([], lists) })
				})
			},
			optionIndex(field) {
				if (field.key === 'classId') {
					for (var i = 0; i < this.classes.length; i++) if (this.classes[i].id === this.form.classId) return i
					return 0
				}
				var index = (field.values || field.options).indexOf(this.form[field.key])
				return index < 0 ? 0 : index
			},
			fieldOptions(field) { return field.key === 'classId' ? this.classNames : field.options || [] },
			fieldDisplay(field) {
				if (field.key === 'classId') {
					for (var i = 0; i < this.classes.length; i++) if (this.classes[i].id === this.form.classId) return this.classes[i].name
					return this.form.className || this.selectedClassName
				}
				var value = this.form[field.key]
				var values = field.values || field.options
				var index = values ? values.indexOf(value) : -1
				return index >= 0 && field.options ? field.options[index] : value
			},
			onPickerChange(e, field) {
				var selectedIndex = Number(e.detail.value)
				if (field.key === 'classId') {
					var cls = this.classes[selectedIndex]
					if (cls) {
						this.$set ? this.$set(this.form, 'classId', cls.id) : (this.form.classId = cls.id)
						this.$set ? this.$set(this.form, 'className', cls.name) : (this.form.className = cls.name)
					}
					return
				}
				var value = field.options ? (field.values || field.options)[selectedIndex] : e.detail.value
				this.$set ? this.$set(this.form, field.key, value) : (this.form[field.key] = value)
			},
			onFieldInput(e, key) {
				var value = e.detail.value
				if (this.module === 'schedule' && key === 'period' && value !== '') value = Number(value)
				this.$set ? this.$set(this.form, key, value) : (this.form[key] = value)
			},
			validateForm() {
				if (this.module === 'schedule' && this.classes.length === 0) {
					uni.showToast({ title: '请先创建并管理一个班级', icon: 'none' })
					return false
				}
				if (this.module === 'activity' && this.classes.length === 0) {
					uni.showToast({ title: '请先创建并管理一个班级', icon: 'none' })
					return false
				}
				for (var i = 0; i < this.config.fields.length; i++) {
					var field = this.config.fields[i]
					if (field.required && !String(this.form[field.key] || '').trim()) {
						uni.showToast({ title: '请填写' + field.label, icon: 'none' })
						return false
					}
				}
				if (this.module === 'schedule' && this.form.endTime <= this.form.startTime) {
					uni.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
					return false
				}
				if (this.module === 'schedule' && (!Number.isInteger(Number(this.form.period)) || Number(this.form.period) < 1)) {
					uni.showToast({ title: '节次须为大于 0 的整数', icon: 'none' })
					return false
				}
				if (this.module === 'schedule' && this.form.effectiveTo && this.form.effectiveTo < this.form.effectiveFrom) {
					uni.showToast({ title: '结束日期不能早于生效日期', icon: 'none' })
					return false
				}
				return true
			},
			saveForm() {
				var self = this
				if (this.saving || !this.validateForm()) return
				this.saving = true
				var payload = Object.assign({}, this.form)
				if (this.module === 'memo' && !payload.status) payload.status = 'OPEN'
				if (this.module === 'activity' && !payload.status) payload.status = 'PUBLISHED'
				if (this.module === 'schedule' || this.module === 'activity') {
					for (var i = 0; i < this.classes.length; i++) {
						if (this.classes[i].id === payload.classId) { payload.className = this.classes[i].name; break }
					}
				}
				workspaceApi.saveTeacherRecord(this.config.type, payload)
					.then(function () { self.form = self.emptyForm(); return self.load() })
					.then(function () { uni.showToast({ title: self.config.saveLabel.replace('保存', '已保存').replace('发布', '已发布'), icon: 'success' }) })
					.catch(function (err) { uni.showToast({ title: err.message || '保存失败，请重试', icon: 'none' }) })
					.then(function () { self.saving = false })
			},
			editRecord(item) { this.form = Object.assign(this.emptyForm(), item) },
			confirmDelete(item) {
				var self = this
				uni.showModal({ title: '删除记录', content: '删除后无法恢复，确定继续吗？', success: function (result) {
					if (!result.confirm) return
					workspaceApi.deleteTeacherRecord(self.config.type, item.id).then(function () {
						if (self.module === 'courseware' && item.filePath && uni.removeSavedFile) uni.removeSavedFile({ filePath: item.filePath })
						return self.load()
					}).then(function () { uni.showToast({ title: '已删除', icon: 'success' }) }).catch(function () { uni.showToast({ title: '删除失败，请重试', icon: 'none' }) })
				} })
			},
			togglePinned(item) { this.updateRecord(item, { starred: !item.starred }) },
			toggleDone(item) { this.updateRecord(item, { status: item.status === 'DONE' ? 'OPEN' : 'DONE' }) },
			updateRecord(item, patch) {
				var self = this
				workspaceApi.saveTeacherRecord(this.config.type, Object.assign({}, item, patch)).then(function () { return self.load() }).catch(function () { uni.showToast({ title: '更新失败，请重试', icon: 'none' }) })
			},
			chooseCourseware() {
				var self = this
				if (typeof uni.chooseMessageFile !== 'function' || typeof uni.saveFile !== 'function') {
					uni.showToast({ title: '请在微信小程序中选择课件文件', icon: 'none' })
					return
				}
				uni.chooseMessageFile({ count: 1, type: 'all', success: function (res) {
					var file = res.tempFiles && res.tempFiles[0]
					if (!file) return
					uni.saveFile({ tempFilePath: file.path, success: function (saved) {
						self.form.fileName = file.name
						self.form.filePath = saved.savedFilePath
					} })
				}, fail: function () {} })
			},
			openCourseware(item) {
				if (!item.filePath) { uni.showToast({ title: '这条课件没有关联本地文件', icon: 'none' }); return }
				uni.openDocument({ filePath: item.filePath, showMenu: true, fail: function () { uni.showToast({ title: '当前文件暂不支持预览', icon: 'none' }) } })
			},
			onClassChange(e) { var cls = this.classes[Number(e.detail.value)]; this.selectedClassId = cls ? cls.id : '' },
			studentMeta(item) {
				var id = item.classId + ':' + item.userId
				for (var i = 0; i < this.studentMetadata.length; i++) if (this.studentMetadata[i].id === id) return this.studentMetadata[i]
				return { id: id, group: '', tags: '', focus: false }
			},
			recordTitle(item) {
				if (this.module === 'students') return item.nickname || '未命名学生'
				return item.title || item.examName || item.subject || item.topic || '未命名记录'
			},
			recordMeta(item) {
				if (this.module === 'students') return item.className + ' · ' + (item.isMember ? '学生' : '班级管理员') + (this.studentMeta(item).group ? ' · ' + this.studentMeta(item).group : '')
				if (this.module === 'memo') {
					var categories = { TEACHING: '教学', CLASS: '班级', STUDENT: '学生', MEETING: '会议', PERSONAL: '个人' }
					return [categories[item.category] || item.category, item.dueAt || '无提醒日期', item.priority === 'URGENT' ? '紧急' : '普通'].filter(Boolean).join(' · ')
				}
				if (this.module === 'activity') return [item.className || this.classNameFor(item.classId), item.date, item.time, item.location, item.category].filter(Boolean).join(' · ')
				if (this.module === 'conversation') return [item.studentName, item.contactType, item.talkAt, item.followUpStatus].filter(Boolean).join(' · ')
				if (this.module === 'courseware') return [item.subject, item.category, item.fileName].filter(Boolean).join(' · ') || '点击编辑资料'
				if (this.module === 'schedule') return [item.className || this.classNameFor(item.classId), typeof item.weekday === 'number' ? DAY_NAMES[item.weekday - 1] : item.weekday, item.period ? '第' + item.period + '节' : '', item.startTime && item.endTime ? item.startTime + '–' + item.endTime : item.startTime, item.location].filter(Boolean).join(' · ')
				if (this.module === 'grades') return [item.className, item.subject, item.examDate].filter(Boolean).join(' · ')
				return ''
			},
			recordDescription(item) {
				if (this.module === 'memo' || this.module === 'conversation') return item.content || item.followUp || ''
				if (this.module === 'activity' || this.module === 'courseware') return item.description || ''
				if (this.module === 'grades') return '均分 ' + (item.average || '—') + ' · 最高 ' + (item.highest || '—') + ' · 最低 ' + (item.lowest || '—')
				return ''
			},
			classNameFor(classId) {
				for (var i = 0; i < this.classes.length; i++) if (this.classes[i].id === classId) return this.classes[i].name
				return ''
			},
			editStudent(item) {
				var self = this
				var meta = this.studentMeta(item)
				uni.showModal({ title: '学生分组与标签', editable: true, placeholderText: '分组 / 标签，用逗号分隔', content: [meta.group, meta.tags].filter(Boolean).join(' / '), success: function (res) {
					if (!res.confirm) return
					var pieces = (res.content || '').split('/')
					workspaceApi.saveTeacherRecord('studentMeta', { id: item.id, classId: item.classId, studentId: item.userId, group: (pieces[0] || '').trim(), tags: (pieces[1] || '').trim(), focus: meta.focus })
						.then(function () { return workspaceApi.getTeacherRecords('studentMeta') })
						.then(function (items) { self.studentMetadata = items })
				} })
			},
			toggleStudentFocus(item) {
				var self = this
				var meta = this.studentMeta(item)
				workspaceApi.saveTeacherRecord('studentMeta', Object.assign({}, meta, {
					id: item.id, classId: item.classId, studentId: item.userId, focus: !meta.focus
				})).then(function () {
					return workspaceApi.getTeacherRecords('studentMeta')
				}).then(function (items) { self.studentMetadata = items })
			},
			openModule(module) {
				if (module === 'homework') { uni.navigateTo({ url: '/pages/teacher/teaching/index' }); return }
				uni.navigateTo({ url: '/pages/teacher/module/index?module=' + module })
			}
		}
	}
</script>

<style>
/* ===== 海盐薄荷 · 教师端共享皮肤 ===== */
page {
	background-color: var(--app-bg);
	background-image:
		radial-gradient(circle at 12% 0%, rgba(56, 189, 248, 0.18), transparent 52%),
		radial-gradient(circle at 88% 4%, rgba(18, 181, 165, 0.16), transparent 46%),
		linear-gradient(180deg, #EDF8F7 0%, #F8FCFB 100%);
	background-repeat: no-repeat;
	background-size: cover;
	background-attachment: scroll;
	color: var(--app-ink);
}

.page {
	position: relative;
	height: 100vh;
	max-width: 860rpx;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: transparent;
}

.bg-layer {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 0;
	overflow: hidden;
	pointer-events: none;
}

.blob {
	position: absolute;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(18, 181, 165, 0.14) 0%, rgba(18, 181, 165, 0) 70%);
}

.blob-mint {
	width: 600rpx;
	height: 600rpx;
	top: -260rpx;
	left: -220rpx;
}

.top-bar {
	position: relative;
	z-index: 2;
	flex-shrink: 0;
	height: calc(88rpx + var(--teacher-safe-top));
	padding: var(--teacher-safe-top) var(--teacher-page-padding) 0;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.72);
	border-bottom: 1rpx solid var(--app-line);
}

.top-bar-side {
	width: 160rpx;
	display: flex;
	align-items: center;
}

.top-bar-right {
	justify-content: flex-end;
}

.back-hit {
	width: 88rpx;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	font-size: 52rpx;
	color: var(--app-primary);
}

.back-hit-hover {
	background: rgba(18, 181, 165, 0.10);
}

.back-icon {
	font-size: 52rpx;
	line-height: 1;
	color: var(--app-primary);
}

.top-title {
	flex: 1;
	text-align: center;
	font-size: 34rpx;
	font-weight: 600;
	color: var(--app-ink);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.logout-hit {
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.90);
	border: 1rpx solid var(--app-line);
	color: var(--app-muted);
	font-size: 23rpx;
}

.logout-hit-hover {
	opacity: var(--teacher-hover-opacity);
}

.content {
	flex: 1;
	min-height: 0;
	position: relative;
	z-index: 1;
	background: transparent;
}

.content-inner {
	padding: 24rpx var(--teacher-page-padding) calc(48rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.state-card {
	margin: 20rpx 0;
	padding: 56rpx 28rpx;
	border-radius: var(--app-radius);
	background: var(--app-surface-solid);
	border: 1rpx solid var(--app-line);
	box-shadow: var(--app-shadow-soft);
	display: flex;
	flex-direction: column;
	align-items: center;
	box-sizing: border-box;
}

.state-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--app-ink);
	line-height: 1.4;
}

.state-text {
	font-size: 26rpx;
	line-height: 1.6;
	color: var(--app-muted);
	text-align: center;
}

.state-btn,
.dark-button,
.empty-btn,
.create-btn,
.copy-btn,
.submit-btn,
.save-btn,
.progress-entry,
.locked-btn,
.add-hit,
.dialog-btn-primary,
.filter-chip.selected,
.teacher-btn--primary {
	background: var(--teacher-btn-primary-bg);
	color: #FFFFFF;
	box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
}

.ghost-button,
.dialog-btn-secondary,
.teacher-btn--secondary {
	background: rgba(255, 255, 255, 0.92);
	border: 1rpx solid var(--app-line);
	color: var(--app-primary);
	box-shadow: none;
}

.state-btn-text,
.dialog-btn-text-primary,
.create-btn-text,
.copy-btn-text,
.empty-btn-text,
.locked-btn-text,
.submit-btn-text,
.save-btn,
.add-text {
	color: #FFFFFF;
}

.dialog-btn-text-secondary {
	color: var(--app-primary);
}

.state-btn-hover,
.dark-button-hover,
.empty-btn-hover,
.create-btn-hover,
.copy-btn-hover,
.submit-btn-hover,
.progress-entry-hover,
.locked-btn-hover,
.add-hit-hover {
	opacity: var(--teacher-hover-opacity);
}

.section-head {
	margin: 28rpx 4rpx 16rpx;
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--app-ink);
	line-height: 1.4;
}

.section-note {
	font-size: 24rpx;
	color: var(--app-muted);
}

.section-link {
	font-size: 24rpx;
	color: var(--app-accent);
}

.retry-link {
	display: block;
	margin-top: 16rpx;
	color: var(--app-accent);
	font-size: 25rpx;
}

.bottom-space {
	height: 32rpx;
}

.class-card,
.empty-card,
.state-card,
.info-card,
.meta-card,
.admin-card,
.invite-card,
.entry-card,
.member-preview-card,
.member-card,
.invite-bar,
.title-card,
.progress-card,
.overview-card,
.form-card,
.locked-card,
.profile-card,
.stats-card,
.record-list,
.summary-list,
.schedule-strip,
.work-card,
.core-card,
.metric-card,
.summary-card,
.list-card,
.status-card,
.member-list,
.dialog {
	background: var(--app-surface-solid);
	border: 1rpx solid var(--app-line);
	border-radius: var(--app-radius);
	box-shadow: var(--app-shadow-soft);
	box-sizing: border-box;
}

.task-status,
.status-active,
.status-ended,
.member-status,
.role-badge,
.badge,
.pin-mark,
.focus-mark,
.class-status {
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 500;
	line-height: 1.35;
}

.task-status {
	padding: 4rpx 16rpx;
	flex-shrink: 0;
}

.status-active,
.status-done,
.class-status {
	color: var(--app-positive);
	background: var(--app-positive-bg);
}

.status-ended,
.status-pending,
.class-status-off {
	color: var(--app-muted);
	background: var(--teacher-track);
}

.pin-mark {
	color: var(--app-warning);
	background: var(--app-warning-bg);
}

.focus-mark {
	color: var(--app-negative);
	background: var(--app-negative-bg);
}

.badge {
	padding: 8rpx 18rpx;
	background: var(--app-surface-soft);
	color: var(--app-copy);
}

.role-badge {
	padding: 4rpx 14rpx;
	background: var(--app-surface-soft);
	color: var(--app-primary);
}

.progress-bar,
.progress-track {
	height: 12rpx;
	border-radius: 999rpx;
	background: var(--teacher-track);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #0A5C6A 0%, #12B5A5 100%);
	transition: width 0.5s ease;
}

.avatar {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
	color: #FFFFFF;
}

.avatar-text {
	font-size: 34rpx;
	font-weight: 600;
	color: #FFFFFF;
}

.empty-text,
.empty-inline,
.empty-tip {
	font-size: 25rpx;
	color: var(--app-muted);
}

.insight-number,
.work-number,
.work-value,
.summary-number,
.metric-number,
.stat-num,
.stat-value,
.rate-num,
.task-rate,
.rank-rate,
.class-count,
.member-count {
	font-variant-numeric: tabular-nums;
}


.blob { width: 560rpx; height: 560rpx; top: -300rpx; right: -230rpx; }
.top-side { width: 88rpx; display: flex; align-items: center; }
.back-hit { width: 88rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; }
.intro { margin-bottom: 24rpx; }
.intro-title { display: block; font-size: 38rpx; font-weight: 600; line-height: 1.3; color: var(--app-ink); }
.intro-copy { display: block; margin-top: 8rpx; font-size: 24rpx; color: var(--app-muted); line-height: 1.5; }
.stat-row { display: flex; margin-bottom: 22rpx; padding: 20rpx 4rpx; background: var(--app-surface-soft); border-radius: 24rpx; }
.stat-cell { flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1rpx solid var(--app-line); }
.stat-cell:last-child { border-right: 0; }
.stat-value { font-size: 32rpx; line-height: 1.2; font-weight: 600; color: var(--app-primary); }
.stat-label { margin-top: 6rpx; font-size: 22rpx; color: var(--app-muted); }
.filter-row { display: flex; margin-bottom: 22rpx; }
.filter-chip { margin-right: 14rpx; padding: 12rpx 24rpx; border-radius: 999rpx; color: var(--app-copy); background: rgba(255, 255, 255, 0.90); border: 1rpx solid var(--app-line); font-size: 23rpx; }
.filter-chip:last-child { margin-right: 0; }
.filter-chip.selected { color: #FFFFFF; background: var(--app-primary); border-color: var(--app-primary); }
.form-card { padding: 28rpx; margin-bottom: 28rpx; }
.form-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.form-title, .section-title { font-size: 30rpx; line-height: 1.4; font-weight: 600; color: var(--app-ink); }
.cancel-edit { font-size: 23rpx; color: var(--app-accent); padding: 12rpx; }
.field { margin-bottom: 16rpx; }
.field-label { display: block; margin-bottom: 8rpx; font-size: 23rpx; color: var(--app-copy); }
.required { color: var(--app-negative); }
.input, .picker-value, .textarea { width: 100%; box-sizing: border-box; border: 1rpx solid var(--app-line); border-radius: 20rpx; background: var(--app-surface-solid); color: var(--app-ink); font-size: 27rpx; }
.input, .picker-value { min-height: 88rpx; padding: 18rpx 20rpx; }
.input { display: block; }
.picker-value { display: flex; align-items: center; justify-content: space-between; }
.picker-arrow { margin-left: 14rpx; color: var(--app-accent); }
.textarea { min-height: 150rpx; padding: 18rpx 20rpx; }
.file-row { display: flex; align-items: center; justify-content: space-between; margin: 10rpx 0 20rpx; color: var(--app-muted); font-size: 22rpx; }
.file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.small-action { flex: none; margin-left: 16rpx; color: var(--app-accent); padding: 12rpx; }
.save-btn { height: 88rpx; display: flex; align-items: center; justify-content: center; margin-top: 8rpx; border-radius: 999rpx; font-size: 28rpx; font-weight: 600; }
.save-btn.disabled { opacity: var(--teacher-disabled-opacity); }
.class-picker-block { margin-bottom: 24rpx; }
.class-picker-block .section-title { display: block; margin-bottom: 12rpx; }
.search-input { margin-top: 12rpx; }
.list-head { display: flex; align-items: baseline; justify-content: space-between; margin: 18rpx 4rpx 12rpx; }
.list-count { font-size: 22rpx; color: var(--app-hint); }
.record-list { padding: 0 24rpx; overflow: hidden; }
.record-row { display: flex; align-items: center; padding: 22rpx 0; border-bottom: 1rpx solid var(--app-line); }
.record-row:last-child { border-bottom: 0; }
.record-main { flex: 1; min-width: 0; }
.record-title-line { display: flex; align-items: center; }
.record-title { font-size: 28rpx; font-weight: 600; line-height: 1.4; color: var(--app-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-meta, .record-desc { display: block; margin-top: 6rpx; font-size: 22rpx; line-height: 1.45; color: var(--app-muted); }
.record-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pin-mark, .focus-mark { margin-left: 12rpx; padding: 4rpx 10rpx; }
.row-actions { flex: none; display: flex; flex-direction: column; align-items: flex-end; }
.row-action { padding: 6rpx 2rpx; color: var(--app-accent); font-size: 21rpx; }
.row-action + .row-action { margin-top: 4rpx; }
.delete-action { color: var(--app-negative); }
.pin-action { color: var(--app-warning); }
.empty-state { margin-bottom: 22rpx; padding: 52rpx 24rpx; border-radius: var(--app-radius); background: var(--app-surface-solid); border: 1rpx solid var(--app-line); text-align: center; color: var(--app-muted); font-size: 25rpx; line-height: 1.5; }
.retry-link { display: block; margin-top: 18rpx; color: var(--app-accent); }
.summary-list { overflow: hidden; }
.summary-row { min-height: 108rpx; display: flex; align-items: center; padding: 18rpx 24rpx; border-bottom: 1rpx solid var(--app-line); }
.summary-row:last-child { border-bottom: 0; }
.summary-copy { flex: 1; display: flex; flex-direction: column; }
.summary-title { font-size: 27rpx; font-weight: 600; color: var(--app-ink); }
.summary-sub { margin-top: 4rpx; font-size: 21rpx; color: var(--app-muted); }
.summary-value { margin-left: 18rpx; font-size: 34rpx; font-weight: 600; color: var(--app-primary); }

/* ===== 统一按钮规格 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }

/* ===== 按钮基础布局补齐 ===== */
.state-btn, .dark-button, .empty-btn, .submit-btn, .save-btn, .progress-entry, .locked-btn, .ghost-button { padding: 0 40rpx; }
.ghost-button { height: 88rpx; min-height: 88rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
</style>
