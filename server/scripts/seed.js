'use strict'
/**
 * 种子数据：把 mock/ 下的演示数据（账号 / 班级 / 任务 / 错题 / 金币 / FAQ 等）写入 MySQL。
 * 可重复执行：所有表先清空再插入。
 */
const path = require('path')
const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const pad = (n) => (n < 10 ? '0' + n : '' + n)
const d = new Date()
const TODAY = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const offsetDate = (days) => {
  const x = new Date()
  x.setDate(x.getDate() + days)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}
const stamp = (date, time) => `${date} ${time}`

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, multipleStatements: true, charset: 'utf8mb4'
  })
  const q = (sql, params = []) => conn.execute(sql, params)

  console.log('[seed] 清空旧数据...')
  const tables = ['teacher_records', 'parent_children', 'workbenches', 'user_themes', 'faq_items', 'feedback',
    'orders', 'coin_products', 'silver_products', 'coin_transactions', 'upload_history', 'wrong_questions',
    'reviews', 'schedules', 'daily_tasks', 'student_tasks', 'tasks', 'class_memberships', 'classes', 'user_assets', 'users']
  await conn.query('SET FOREIGN_KEY_CHECKS=0')
  for (const t of tables) await conn.query(`TRUNCATE TABLE \`${t}\``)
  await conn.query('SET FOREIGN_KEY_CHECKS=1')

  const pwd = await bcrypt.hash('123456', 10)
  const adminPwd = await bcrypt.hash('admin123', 10)

  console.log('[seed] 用户...')
  const users = [
    ['admin', adminPwd, 'admin', '系统管理员', '管', '平台运营账号'],
    ['student01', pwd, 'student', '小明同学', '明', '今天也要继续努力'],
    ['student02', pwd, 'student', '李雨桐', '李', '每天进步一点点'],
    ['student03', pwd, 'student', '陈子昂', '陈', '越努力越幸运'],
    ['student04', pwd, 'student', '赵一诺', '赵', '保持专注'],
    ['student05', pwd, 'student', '周思远', '周', '稳扎稳打'],
    ['teacher01', pwd, 'teacher', '王老师', '王', '高一（3）班班主任'],
    ['teacher02', pwd, 'teacher', '李老师', '李', '数学教研组'],
    ['parent01', pwd, 'parent', '小明家长', '家', '陪伴成长']
  ]
  for (const [account, hash, role, nickname, avatarText, signature] of users) {
    await q('INSERT INTO users (account, password_hash, role, nickname, avatar_text, signature, study_days) VALUES (?,?,?,?,?,?,?)',
      [account, hash, role, nickname, avatarText, signature, role === 'student' ? 28 : 0])
  }

  console.log('[seed] 资产...')
  const assets = [['student01', 126, 20], ['student02', 88, 0], ['student03', 64, 10], ['student04', 150, 40], ['student05', 42, 0]]
  for (const [u, coin, silver] of assets) await q('INSERT INTO user_assets (user_id, learning_coin, silver_coin) VALUES (?,?,?)', [u, coin, silver])
  for (const u of ['student01', 'student02', 'student03', 'student04', 'student05']) await q('INSERT INTO user_themes (user_id) VALUES (?)', [u])

  console.log('[seed] 班级与成员...')
  await q(`INSERT INTO classes (id, name, description, goal, invite_code, max_members, status, created_by, created_at) VALUES
    ('class-001','高一（3）班','高一（3）班学习空间','完成本阶段课程学习','A8K29D',60,'ACTIVE','teacher01','2026-09-01'),
    ('class-002','Java算法学习小组','Java与算法学习小组','提升算法与编程能力','J7K2QD',30,'ACTIVE','student01','2026-09-03')`)

  const memberships = [
    ['teacher01', 'class-001', 'ADMIN', '2026-09-01'],
    ['student01', 'class-001', 'MEMBER', '2026-09-02'],
    ['student02', 'class-001', 'MEMBER', '2026-09-02'],
    ['student03', 'class-001', 'MEMBER', '2026-09-05'],
    ['student04', 'class-001', 'MEMBER', '2026-09-06'],
    ['student05', 'class-001', 'MEMBER', '2026-09-08'],
    ['student01', 'class-002', 'ADMIN', '2026-09-03']
  ]
  for (const [u, c, role, joined] of memberships) {
    await q("INSERT INTO class_memberships (user_id, class_id, role, status, joined_at) VALUES (?,?,?,'ACTIVE',?)", [u, c, role, joined])
  }

  console.log('[seed] 班级任务...')
  await q(`INSERT INTO tasks (id, class_id, title, description, deadline, status, created_by, created_at) VALUES
    ('t-3001','class-001','完成二分查找专项练习','完成课程配套的二分查找练习题，掌握基本二分查找算法实现与边界处理。',?, 'active','teacher01',?),
    ('t-3002','class-001','完成英语阅读理解','完成一篇英语阅读理解练习，提交答案并查看解析。',?, 'ended','teacher01',?),
    ('t-3003','class-002','高等数学极限预习','预习教材第 2 章极限部分，完成课后基础题。',?, 'active','student01',?)`,
    [offsetDate(3), offsetDate(-2), offsetDate(-1), offsetDate(-5), offsetDate(5), offsetDate(-1)])

  const st = [
    ['t-3001', 'class-001', 'student01', 'completed', TODAY],
    ['t-3001', 'class-001', 'student02', 'completed', TODAY],
    ['t-3001', 'class-001', 'student03', 'pending', null],
    ['t-3001', 'class-001', 'student04', 'pending', null],
    ['t-3001', 'class-001', 'student05', 'completed', offsetDate(-1)],
    ['t-3002', 'class-001', 'student01', 'completed', offsetDate(-3)],
    ['t-3002', 'class-001', 'student02', 'pending', null],
    ['t-3002', 'class-001', 'student03', 'pending', null],
    ['t-3002', 'class-001', 'student04', 'pending', null],
    ['t-3002', 'class-001', 'student05', 'pending', null]
  ]
  for (const [task, cls, u, status, doneAt] of st) {
    await q('INSERT INTO student_tasks (task_id, class_id, user_id, status, completed_at, created_at) VALUES (?,?,?,?,?,?)',
      [task, cls, u, status, doneAt, offsetDate(-2)])
  }

  console.log('[seed] 今日任务 / 安排 / 复习...')
  const daily = [
    ['student01', '英语四级词汇', '新学40个高频词汇', 'study', 'ai', 40, 20, 1],
    ['student01', '数据结构 · 链表', '掌握单链表基本操作', 'study', 'ai', 50, 30, 0],
    ['student01', '高等数学 · 极限', '复习函数极限基础', 'review', 'ai', 30, 30, 0],
    ['student01', '错题复习', '复习5道历史错题', 'review', 'ai', 30, 20, 0],
    ['student01', '完成二分查找练习', '班级任务：完成二分查找专项练习', 'study', 'class', 30, 20, 1],
    ['student01', '完成英语阅读理解', '班级任务：完成一篇英语阅读理解', 'review', 'class', 20, 20, 1]
  ]
  for (const [u, title, desc, type, source, minutes, weight, completed] of daily) {
    const isClass = source === 'class'
    const teacherTask = title.includes('二分') ? 't-3001' : isClass ? 't-3002' : null
    await q(`INSERT INTO daily_tasks (user_id, task_date, title, description, type, source, class_id, teacher_task_id, estimated_minutes, weight, completed)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [u, TODAY, title, desc, type, source, isClass ? 'class-001' : null, teacherTask, minutes, weight, completed])
  }

  const schedule = [
    ['09:00', '10:40', '高等数学', 'class', 'completed', null],
    ['16:00', '16:50', '数据结构 · 链表', 'study', 'upcoming', null],
    ['19:00', '20:00', '高等数学 · 极限', 'review', 'upcoming', null]
  ]
  for (const [start, end, title, type, status, taskId] of schedule) {
    await q('INSERT INTO schedules (user_id, task_date, start_time, end_time, title, type, status, task_id) VALUES (?,?,?,?,?,?,?,?)',
      ['student01', TODAY, start, end, title, type, status, taskId])
  }
  const reviews = [
    [5001, '高等数学 · 函数极限', 5, 1, 1],
    [5002, '数据结构 · 单链表', 3, 1, 1],
    [5003, '英语四级 · 高频词汇复习建议', 7, 2, 0]
  ]
  for (const [kpId, title, days, level, due] of reviews) {
    await q('INSERT INTO reviews (user_id, task_date, knowledge_point_id, title, last_study_days_ago, review_level, due) VALUES (?,?,?,?,?,?,?)',
      ['student01', TODAY, kpId, title, days, level, due])
  }

  console.log('[seed] 错题本...')
  const questions = [
    [3001, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=340&fit=crop', '高等数学', '极限的定义与基本性质', '函数极限', 5001, 'choice', '2026-08-29 10:24:00', 'camera', 'cam_20260829_1024', 'review', 1, 'success',
      '设函数 f(x) 在 x=0 处连续，求 lim(x→0) f(x)/x ...', '本题考查极限定义，关键在于理解 ε-δ 语言...', 3, 1],
    [3002, 'https://images.unsplash.com/photo-1516259767581-4c94d2a4b05c?w=600&h=340&fit=crop', '数据结构', '链表插入与删除', '单链表', 5002, 'application', '2026-08-31 16:08:00', 'document', 'doc_20260831_1608', 'review', 1, 'success',
      '已知单链表 L，写出在 p 结点后插入新结点 s 的操作...', '指针修改顺序：先 s->next = p->next，再 p->next = s...', 2, 1],
    [3003, 'https://images.unsplash.com/photo-1456512280520-7a8412c6b1fe?w=600&h=340&fit=crop', '英语', '四级高频词汇辨析', '高频词汇', 5003, 'choice', '2026-08-25 09:12:00', 'camera', 'cam_20260825_0912', 'mastered', 0, 'success',
      'The word "complement" is most similar in meaning to...', 'complement 与 compliment 形近义异，需区分记忆...', 5, 3],
    [3004, 'https://images.unsplash.com/photo-1497633762265-104d8d4c4d03?w=600&h=340&fit=crop', '高等数学', '复合函数求导法则', '导数与微分', 5004, 'application', '2026-09-01 08:30:00', 'document', 'doc_20260901_0830', 'review', 1, 'processing',
      '', '', 2, 0],
    [3005, 'https://images.unsplash.com/photo-1543001288-f7d5a8f4b1f5?w=600&h=340&fit=crop', '数据结构', '栈的出入序列判断', '栈与队列', 5005, 'choice', '2026-08-27 14:50:00', 'camera', 'cam_20260827_1450', 'mastered', 0, 'success',
      '设栈的输入序列为 1,2,3,4,5，下列哪个不可能是合法出栈序列...', '栈的特性为后进先出 LIFO，合法出栈需满足...', 4, 2],
    [3006, 'https://images.unsplash.com/photo-1434034191-1acd6c2d7f95?w=600&h=340&fit=crop', '英语', '虚拟语气条件句', '语法', 5006, 'proof', '2026-09-02 19:15:00', 'document', 'doc_20260902_1915', 'review', 1, 'failed',
      '', '', 1, 0]
  ]
  for (const [id, image, subject, title, kp, kpId, type, uploaded, source, fileId, status, needReview, aiStatus, recognized, analysis, wrongCount, level] of questions) {
    await q(`INSERT INTO wrong_questions (id, user_id, image_url, subject, title, knowledge_point, knowledge_point_id, question_type,
             uploaded_at, source, source_file_id, status, need_review, ai_status, ai_recognized_text, ai_analysis, wrong_count, review_level, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, 'student01', image, subject, title, kp, kpId, type, uploaded, source, fileId, status, needReview, aiStatus, recognized, analysis, wrongCount, level, uploaded, uploaded])
  }

  const histories = [
    ['h_001', '高数期中错题.jpg', 'camera', '2026-08-29 10:24:00', 'success', 1, '3001'],
    ['h_002', '数据结构错题集.pdf', 'document', '2026-08-31 16:08:00', 'success', 1, '3002'],
    ['h_003', '英语真题错题.docx', 'document', '2026-09-02 19:15:00', 'failed', 0, ''],
    ['h_004', '高数练习错题.docx', 'document', '2026-09-01 08:30:00', 'success', 1, '3004']
  ]
  for (const [id, name, source, time, status, count, ids] of histories) {
    await q('INSERT INTO upload_history (id, user_id, file_name, source, upload_time, status, result_count, question_ids) VALUES (?,?,?,?,?,?,?,?)',
      [id, 'student01', name, source, time, status, count, ids])
  }

  console.log('[seed] 金币流水 / 商品 / 订单...')
  const coins = [
    [6, 'earn', '完成今日学习任务', 126, '2026-09-04 20:10:00'],
    [8, 'earn', '完成今日学习任务', 120, '2026-09-03 21:02:00'],
    [10, 'earn', '完成今日学习任务', 112, '2026-09-02 20:30:00'],
    [5, 'earn', '完成今日学习任务', 102, '2026-09-01 19:45:00'],
    [-2, 'penalty', '连续完全未完成惩罚（第1天）', 97, '2026-08-31 23:59:00']
  ]
  for (const [delta, type, desc, balance, time] of coins) {
    await q('INSERT INTO coin_transactions (user_id, delta, type, description, balance_after, created_at) VALUES (?,?,?,?,?,?)',
      ['student01', delta, type, desc, balance, time])
  }

  const silver = [
    ['silver_20', 20, 9.9, 0.495], ['silver_50', 50, 19.9, 0.398],
    ['silver_100', 100, 49.9, 0.499], ['silver_200', 200, 89.9, 0.4495]
  ]
  for (const [id, amount, price, unit] of silver) {
    await q('INSERT INTO silver_products (product_id, silver_amount, price, unit_price, enabled) VALUES (?,?,?,?,1)', [id, amount, price, unit])
  }

  const coinProducts = [
    ['coin_theme_mint', '薄荷主题皮肤', 50, 'theme', '解锁专属薄荷绿首页主题'],
    ['coin_report_once', '周报导出券', 20, 'report', '导出一次家长版学习周报'],
    ['coin_title_1', '「自律新星」头衔', 30, 'title', '个人中心展示专属头衔'],
    ['coin_focus_skin', '深海专注皮肤', 80, 'theme', '解锁专注页深海水色皮肤']
  ]
  for (const p of coinProducts) {
    await q('INSERT INTO coin_products (product_id, name, cost, type, description, enabled) VALUES (?,?,?,?,?,1)', p)
  }

  await q("INSERT INTO orders (id, user_id, product_id, product_type, amount, status) VALUES ('XLF20260904001','student01','silver_50','silver',19.9,'pending')")

  console.log('[seed] FAQ / 反馈 / 家长孩子 / 教师记录...')
  const faq = [
    ['faq_coin_1', '关于学习金币', '学习金币怎么获得？', '完成每日学习任务，按今日完成度获得学习金币。每完成约 10% 的任务获得 1 枚，每日最多 10 枚。', 1],
    ['faq_coin_2', '关于学习金币', '学习金币可以兑换银币吗？', '不可以。学习金币与银币是两套独立资产，禁止互相兑换。', 2],
    ['faq_silver_1', '关于银币', '银币怎么获得？', '银币通过充值购买获得，不会通过普通学习任务获得。银币永久有效。', 3],
    ['faq_rate_1', '关于每日完成度', '完成度怎么计算？', '今日完成度 = 已完成任务数量 ÷ 今日任务总数量。所有任务权重完全相同。', 4],
    ['faq_streak_1', '关于连续未完成', '连续未完成会怎样？', '当天完成任务数为 0 才触发连续完全未完成惩罚：第1天 -2、第2天 -4、第3天 -8、第4天起每天 -10。完成至少 1 个任务即归零。', 5],
    ['faq_deduct_1', '关于资产扣除', '惩罚扣哪个资产？', '银币优先扣除，银币不足再扣学习金币。资产最低为 0，不会出现负数。', 6],
    ['faq_member_1', '关于终身会员', '终身会员价格多少？', '终身会员最终价格、金币抵扣比例、具体权益尚未最终确定，确定后会公布。当前仅预留入口。', 7],
    ['faq_wb_1', '关于工作台', '工作台生成的计划在哪里查看？', '工作台生成的学习/生活计划继续在首页已有内容中查看，不在「我的」新增「我的工作台」入口。', 8],
    ['faq_wrong_1', '关于错题本', '错题本在哪里？', '错题本是底部 TabBar 的独立入口，可在底部导航直接切换。', 9],
    ['faq_acc_1', '关于账号', '如何修改个人资料？', '当前阶段个人资料修改入口已预留，后续开放。', 10]
  ]
  for (const f of faq) await q('INSERT INTO faq_items (id, category, question, answer, sort, enabled) VALUES (?,?,?,?,?,1)', f)

  await q(`INSERT INTO feedback (user_id, type, content, contact, status) VALUES
    ('student01','功能建议','希望错题本支持按知识点筛选，现在题多了不太好找。','student01@example.com','new'),
    ('student02','问题反馈','首页今日任务偶尔会出现重复的班级任务。','','read')`)

  await q(`INSERT INTO parent_children (parent_id, child_name, short_name, grade, class_name, student_no, relation, is_primary) VALUES
    ('parent01','林小满','林','初三','初三(2)班','20240312','哥哥',1),
    ('parent01','林小禾','禾','初二','初二(4)班','20240408','妹妹',0)`)

  await q(`INSERT INTO teacher_records (id, user_id, type, payload) VALUES
    ('tw-1','teacher01','memos','{"title":"下周函数极限小测","content":"覆盖极限定义、四则运算、两个重要极限","category":"TEACHING","priority":"NORMAL"}'),
    ('tw-2','teacher01','activities','{"title":"班级读书分享会","date":"2026-11-20","location":"图书馆三楼"}')`)

  console.log('[seed] 完成：')
  for (const t of ['users', 'classes', 'class_memberships', 'tasks', 'student_tasks', 'daily_tasks', 'wrong_questions', 'coin_transactions', 'faq_items']) {
    const [rows] = await conn.query(`SELECT COUNT(*) c FROM \`${t}\``)
    console.log(`   ${t}: ${rows[0].c}`)
  }
  await conn.end()
}

main().catch((e) => { console.error('[seed] 失败:', e); process.exit(1) })
