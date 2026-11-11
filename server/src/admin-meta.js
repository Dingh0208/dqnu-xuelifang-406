'use strict'
// 后台管理台的资源元数据：一个资源 = 一张表 + 可编辑字段 + 中文标签。
// 前端管理页面完全由本文件驱动（列表列 / 表单控件 / 搜索字段），无需为每张表写页面。
const S = (name, label, options) => ({ name, label, type: 'select', options })
const T = (name, label) => ({ name, label, type: 'text' })
const N = (name, label) => ({ name, label, type: 'number' })
const D = (name, label) => ({ name, label, type: 'date' })
const DT = (name, label) => ({ name, label, type: 'datetime' })
const TX = (name, label) => ({ name, label, type: 'textarea' })

const resources = [
  {
    key: 'users',
    label: '用户',
    table: 'users',
    pk: 'id',
    search: ['account', 'nickname'],
    defaultSort: 'id',
    hiddenColumns: ['password_hash'],
    fields: [
      T('account', '账号'), T('nickname', '昵称'),
      S('role', '角色', ['student', 'teacher', 'parent', 'admin']),
      { name: 'password', label: '密码', type: 'password', virtual: true, onlyCreate: true },
      S('status', '状态', ['active', 'disabled']),
      T('signature', '个性签名'), N('study_days', '学习天数')
    ]
  },
  {
    key: 'user_assets',
    label: '学生资产',
    table: 'user_assets',
    pk: 'user_id',
    search: ['user_id'],
    defaultSort: 'user_id',
    fields: [
      T('user_id', '学生账号'), N('learning_coin', '学习金币'), N('silver_coin', '银币'),
      N('consecutive_incomplete_days', '连续未完成天数')
    ]
  },
  {
    key: 'classes',
    label: '班级',
    table: 'classes',
    pk: 'id',
    search: ['id', 'name', 'invite_code'],
    defaultSort: 'created_at',
    fields: [
      T('id', '班级ID'), T('name', '班级名称'), T('description', '描述'), T('goal', '目标'),
      T('invite_code', '邀请码'), N('max_members', '人数上限'),
      S('status', '状态', ['ACTIVE', 'DISSOLVED']), T('created_by', '创建者'), D('created_at', '创建日期')
    ]
  },
  {
    key: 'class_memberships',
    label: '班级成员',
    table: 'class_memberships',
    pk: 'id',
    search: ['user_id', 'class_id'],
    defaultSort: 'id',
    fields: [
      T('user_id', '用户账号'), T('class_id', '班级ID'),
      S('role', '班级身份', ['ADMIN', 'MEMBER']), S('status', '状态', ['ACTIVE', 'LEFT']), D('joined_at', '加入日期')
    ]
  },
  {
    key: 'tasks',
    label: '班级任务',
    table: 'tasks',
    pk: 'id',
    search: ['id', 'title', 'class_id'],
    defaultSort: 'created_at',
    fields: [
      T('id', '任务ID'), T('class_id', '班级ID'), T('title', '标题'), TX('description', '描述'),
      D('deadline', '截止日期'), S('status', '状态', ['active', 'ended']), T('created_by', '发布人'), D('created_at', '创建日期')
    ]
  },
  {
    key: 'student_tasks',
    label: '任务完成记录',
    table: 'student_tasks',
    pk: 'id',
    search: ['task_id', 'user_id'],
    defaultSort: 'id',
    fields: [
      T('task_id', '任务ID'), T('class_id', '班级ID'), T('user_id', '学生账号'),
      S('status', '状态', ['pending', 'completed']), D('completed_at', '完成日期'), D('created_at', '创建日期')
    ]
  },
  {
    key: 'daily_tasks',
    label: '今日任务',
    table: 'daily_tasks',
    pk: 'id',
    search: ['title', 'user_id'],
    defaultSort: 'id',
    fields: [
      T('user_id', '学生账号'), D('task_date', '日期'), T('title', '标题'), TX('description', '描述'),
      S('type', '类型', ['study', 'review']), S('source', '来源', ['ai', 'class']),
      T('class_id', '班级ID'), T('teacher_task_id', '教师任务ID'),
      N('estimated_minutes', '预计分钟'), N('weight', '权重'), N('completed', '是否完成')
    ]
  },
  {
    key: 'wrong_questions',
    label: '错题本',
    table: 'wrong_questions',
    pk: 'id',
    search: ['title', 'subject', 'user_id'],
    defaultSort: 'id',
    fields: [
      T('user_id', '学生账号'), T('subject', '学科'), T('title', '标题'), T('knowledge_point', '知识点'),
      S('question_type', '题型', ['choice', 'fill', 'application', 'proof']),
      S('status', '状态', ['review', 'mastered']), S('ai_status', 'AI 状态', ['processing', 'success', 'failed']),
      S('source', '来源', ['camera', 'document']),
      N('wrong_count', '错误次数'), N('review_level', '复习等级'),
      DT('uploaded_at', '上传时间'), TX('ai_analysis', 'AI 解析')
    ]
  },
  {
    key: 'upload_history',
    label: '上传历史',
    table: 'upload_history',
    pk: 'id',
    search: ['id', 'file_name'],
    defaultSort: 'upload_time',
    fields: [
      T('id', '记录ID'), T('user_id', '学生账号'), T('file_name', '文件名'),
      S('source', '来源', ['camera', 'document']), DT('upload_time', '上传时间'),
      S('status', '状态', ['processing', 'success', 'failed']), N('result_count', '识别数量'), T('question_ids', '错题ID')
    ]
  },
  {
    key: 'coin_transactions',
    label: '金币流水',
    table: 'coin_transactions',
    pk: 'id',
    search: ['user_id', 'description'],
    defaultSort: 'id',
    fields: [
      T('user_id', '学生账号'), N('delta', '变动值'),
      S('type', '类型', ['earn', 'penalty', 'redeem', 'recharge']),
      T('description', '说明'), N('balance_after', '变动后余额')
    ]
  },
  {
    key: 'orders',
    label: '订单',
    table: 'orders',
    pk: 'id',
    search: ['id', 'user_id', 'product_id'],
    defaultSort: 'created_at',
    fields: [
      T('id', '订单号'), T('user_id', '用户'), T('product_id', '商品'),
      S('product_type', '商品类型', ['silver', 'coin']), { name: 'amount', label: '金额', type: 'number' },
      S('status', '状态', ['pending', 'paid', 'cancelled'])
    ]
  },
  {
    key: 'silver_products',
    label: '银币套餐',
    table: 'silver_products',
    pk: 'product_id',
    search: ['product_id'],
    defaultSort: 'product_id',
    fields: [
      T('product_id', '商品ID'), N('silver_amount', '银币数量'), { name: 'price', label: '售价', type: 'number' },
      { name: 'unit_price', label: '单价', type: 'number' }, N('enabled', '启用')
    ]
  },
  {
    key: 'coin_products',
    label: '金币兑换',
    table: 'coin_products',
    pk: 'product_id',
    search: ['product_id', 'name'],
    defaultSort: 'product_id',
    fields: [
      T('product_id', '商品ID'), T('name', '名称'), N('cost', '所需金币'),
      T('type', '类型'), TX('description', '描述'), N('enabled', '启用')
    ]
  },
  {
    key: 'feedback',
    label: '用户反馈',
    table: 'feedback',
    pk: 'id',
    search: ['content', 'user_id'],
    defaultSort: 'created_at',
    fields: [
      T('user_id', '用户'), T('type', '类型'), TX('content', '内容'), T('contact', '联系方式'),
      S('status', '状态', ['new', 'read', 'replied', 'closed']), TX('reply', '回复')
    ]
  },
  {
    key: 'faq_items',
    label: '常见问题',
    table: 'faq_items',
    pk: 'id',
    search: ['question', 'category'],
    defaultSort: 'sort',
    fields: [
      T('id', 'ID'), T('category', '分类'), T('question', '问题'), TX('answer', '答案'),
      N('sort', '排序'), N('enabled', '启用')
    ]
  },
  {
    key: 'parent_children',
    label: '家长孩子',
    table: 'parent_children',
    pk: 'id',
    search: ['parent_id', 'child_name'],
    defaultSort: 'id',
    fields: [
      T('parent_id', '家长账号'), T('child_name', '孩子姓名'), T('short_name', '简称'),
      T('grade', '年级'), T('class_name', '班级'), T('student_no', '学号'),
      T('relation', '关系'), N('is_primary', '是否主孩子')
    ]
  }
]

module.exports = { resources }
