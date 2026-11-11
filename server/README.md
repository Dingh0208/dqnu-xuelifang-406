# 学立方后端服务 + 后台管理台

按 `dqnu-xuelifang-406-dev-student` 里 `api/*.js` 中预留的 REST 契约实现的后端，数据落在 **MySQL 8.0**，
自带一个中文后台管理网页（登录、概览、18 张业务表的增删改查、金币手动调整）。

> 本目录是前端工程的一部分（`student-app/server/`），与小程序共用同一个 git 仓库。
> 数据库使用本机安装的 MySQL 8.0.28 服务 **MySQL80**（端口 3306，开机自启），`node_modules/` 不进版本库。

- 后端：Node.js 24 + Express 4 + mysql2 + JWT + bcrypt
- 数据库：MySQL 8.0.28（本机服务 **MySQL80**，端口 **3306**，数据目录 `C:\ProgramData\MySQL\MySQL Server 8.0\Data`）
- 管理台：纯静态 SPA（`public/`），由后端同端口托管

```
server/
├── src/
│   ├── server.js          入口（挂载 5 组路由 + 管理台静态资源）
│   ├── db.js              mysql2 连接池 / query / one / tx
│   ├── auth.js            JWT 签发校验、requireAuth / requireRole、班级 ADMIN 判定
│   ├── http.js            统一响应体 { code, message, data }
│   ├── admin-meta.js      管理台「资源元数据」：一张表 = 一组字段 + 中文标签
│   └── routes/
│       ├── auth.js        /api/auth/*
│       ├── student.js     /api/student/*
│       ├── teacher.js     /api/teacher/*
│       ├── parent.js      /api/parent/*
│       └── admin.js       /api/admin/*（后台管理接口）
├── public/                后台管理台（index.html / style.css / app.js）
├── sql/schema.sql         18 张表建表脚本
├── scripts/
│   ├── init-db.js         建库 + 建应用账号 + 执行 schema.sql
│   ├── seed.js            写入 mock/ 中的演示数据
│   ├── smoke.js           90 项接口自检
│   ├── ui-check.mjs       管理台浏览器端到端检查
│   ├── verify-h5.mjs      小程序 H5 端「真连后端」端到端验证
│   ├── h5-fixture.cjs     验证用标记数据（改标题/昵称，直改 MySQL）
│   └── shot.mjs           无头 Chrome 截图
├── .env                   端口、数据库账号、JWT 密钥（已 gitignore）
├── .env.example           配置模板
├── start.cmd              一键启动（检查 MySQL 服务 + 后端 + 打开管理台）
└── shots/                 管理台截图
```

---

## 一、启动

### 一键（推荐）

双击 `start.cmd`：检测 `3306` → 未运行则 `net start MySQL80` → 启动后端 → 打开
<http://127.0.0.1:3100/admin/>。

### 手动

```bat
:: 1. 启动数据库服务（管理员命令行；服务为开机自启，通常无需手动）
net start MySQL80

:: 2. 建库建表（首次或换机器时；会用到 .env 里的 root 账号）
node scripts\init-db.js
node scripts\seed.js

:: 3. 后端
node src\server.js
```

> 换机器/重装系统后：先装 MySQL 8（本机为 8.0.28），再用 root 执行
> `node scripts/init-db.js` 建库与应用账号 `xlf`，最后 `node scripts/seed.js` 灌演示数据。

| 地址 | 说明 |
| --- | --- |
| <http://127.0.0.1:3100/admin/> | 后台管理台 |
| <http://127.0.0.1:3100/api/health> | 健康检查（返回 MySQL 版本与库名） |
| <http://127.0.0.1:3100/api/...> | 小程序端接口 |

### 账号

| 身份 | 账号 | 密码 | 能访问 |
| --- | --- | --- | --- |
| 管理员 | `admin` | `admin123` | 后台管理台 |
| 学生 | `student01` ~ `student05` | `123456` | `/api/student/*` |
| 教师 | `teacher01` / `teacher02` | `123456` | `/api/teacher/*` |
| 家长 | `parent01` | `123456` | `/api/parent/*` |

---

## 二、接口对应关系

接口路径、请求体、返回结构均按 `api/*.js` 的注释契约实现，管理台和自检脚本都直接打这些接口。

| 模块 | 接口 |
| --- | --- |
| 认证 | `POST /api/auth/login`、`POST /api/auth/register`、`GET /api/auth/me` |
| 学生首页 | `GET /api/student/home/today`、`/welcome`、`/today/tasks`、`PATCH /today/tasks/{id}`、`/schedule`、`/reviews`、`/today/study-duration`、`GET /api/student/rewards/today` |
| 资产 / 我的 | `GET /api/student/assets`、`/profile`、`/assets/incomplete-streak`、`/me`、`/membership` |
| 金币 / 商城 | `GET /api/student/coins/learning`、`/coins/learning/records`、`/mall/silver/products`、`/mall/coin/products`、`POST /mall/coin/redeem`、`POST /mall/orders`、`/shop/orders`、`/shop/products` |
| 错题本 | `GET/POST /api/student/wrongbook`、`/statistics`、`/{id}`、`DELETE`、`PATCH`、`/history`、`/history/{id}`、`/upload/image`、`/upload/document`、`/{id}/reanalyze`、`/{id}/analysis` |
| 班级（学生） | `GET /api/student/classes`、`/{classId}`、`POST /classes/join` |
| 主题 / 工作台 | `GET/PATCH /api/student/theme`、`/workbench/inspirations`、`/workbench/create`、`/{id}/generate`、`/{id}`、`/create-modes` |
| 教师 | `GET /api/teacher/home`、`POST /classes`、`/classes/{id}/members`、`/classes/{id}/tasks`、`/{taskId}`、`/{taskId}/progress`、`/classes/{id}/analytics`、`/students/{sid}`、`/students/{sid}/analytics`、`/memos` `/activities` `/conversations` `/courseware` `/schedule` `/exams` `/student-profiles`（增删改查） |
| 家长 | `GET /api/parent/home`、`/reports/weekly`、`/children`、`/children/{id}/dashboard`、`/profile`、`POST /reminders`、`/children/bind` |
| 后台 | `POST /api/admin/login`、`GET /stats`、`/meta`、`/list/{resource}`、`/one/{resource}/{id}`、`POST /api/admin/list/{resource}`、`PATCH|DELETE /api/admin/one/{resource}/{id}`、`POST /api/admin/coins/adjust`、`POST /api/admin/tasks/{id}/reset` |

约定：成功 `{ code: 200, message: "success", data }`；业务失败 `400/401/403/404/409` 并带中文 `message`。
鉴权走 `Authorization: Bearer <token>`，与 `api/request.js` 的注入方式一致；`401` 会触发前端清理登录态。

---

## 三、数据库

`sql/schema.sql` 建 18 张表：

| 表 | 用途 |
| --- | --- |
| `users` | 学生 / 教师 / 家长 / 管理员（bcrypt 密码） |
| `user_assets` | 学习金币、银币、连续未完成天数 |
| `classes` / `class_memberships` | 班级 + 多对多成员关系（ADMIN ≠ MEMBER） |
| `tasks` / `student_tasks` | 班级任务 + 任务×学生完成归属 |
| `daily_tasks` / `schedules` / `reviews` | 学生今日任务、课表、复习 |
| `wrong_questions` / `upload_history` | 错题本、上传批次 |
| `coin_transactions` | 金币流水（余额权威来源） |
| `silver_products` / `coin_products` / `orders` | 商城与订单 |
| `feedback` / `faq_items` | 反馈与帮助中心 |
| `user_themes` / `workbenches` / `teacher_records` / `parent_children` | 主题、工作台、教师模块记录、家长孩子绑定 |

关键规则和 mock 阶段保持一致：

- 完成度 = 已完成任务数 ÷ 今日任务数；金币 = `floor(完成度 × 10)`，每日上限 10。
- 班级管理权只看 `class_memberships.role='ADMIN'`，与 `users.role` 无关。
- 连续完全未完成惩罚：第 1 天 −2、第 2 天 −4、第 3 天 −8、第 4 天起 −10。
- 教师发布班级任务时，会同时给每个 `MEMBER` 扇出 `student_tasks` 与当日 `daily_tasks`，
  学生勾选后两处同步，教师端进度立即变化。

---

## 四、自检

```bat
node scripts\smoke.js
```

覆盖 90 项断言：认证与 401、学生首页 / 金币 / 错题 / 班级 / 主题 / 工作台、教师班级任务与完成率、
家长周报、后台 9 个资源的列表与增删改、权限边界（非本班 ADMIN → 403、金币不足 → 400）等。
当前结果：**90 通过 / 0 失败**。

> 自检会写入测试数据，跑完执行 `node scripts\seed.js` 复位演示数据。

管理台的浏览器端到端检查（登录 → 列表 → 编辑弹窗 → 保存 → 搜索）：

```bat
node scripts\ui-check.mjs
```

---

## 五、让小程序改连这个后端

1. `utils/config.js`：`USE_MOCK = false`
2. `api/request.js`：`BASE_URL = 'http://127.0.0.1:3100'`

微信开发者工具需勾选「不校验合法域名」；真机调试把 `BASE_URL` 换成局域网 IP。
后端已开启 CORS，H5 端也可直接联调。

---

## 六、安全说明

- 密码使用 bcrypt（cost 10）存储，管理台接口永不返回 `password_hash`。
- JWT 密钥在 `.env`，默认 `12h` 过期；生产部署务必替换。
- 删除用户会级联清理资产 / 成员关系 / 任务归属 / 错题，管理员账号禁止删除。
- 后台所有 SQL 的表名、列名均来自 `admin-meta.js` 白名单，值全部走占位符，无字符串拼接注入面。
