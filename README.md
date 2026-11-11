# 学立方（learnmate_front）

学立方是一款面向 **学生 / 教师 / 家长** 三端的学习管理微信小程序，基于 **uni-app + Vue 3** 构建。它把「今日任务、错题复习、班级教学、家长周报」放进同一条数据链路：学生完成任务 → 教师查看真实完成进度 → 家长看懂孩子这一周。

> 当前阶段数据层全部使用本地 Mock（`USE_MOCK = true`），后端为未来 Spring Boot 接入口。

---

## ✨ 功能概览

### 学生端
- **今日闭环首页**：今日完成度、待办任务、今日复习、欢迎弹窗
- **今日计划**：全部 / 已完成 / 未完成 筛选，完成任务即时反馈
- **专注学习**：从任务进入专注浮层，倒计时结束一键打卡
- **错题本**：拍照 / 文档 / 粘贴录入，错题卡片堆叠、详情解析、上传历史批次
- **学习工作台**：小筑 AI 生成今日计划，一键加入首页
- **我的**：学习金币 / 银币 / 会员 / 主题 / 常见问题 / 建议反馈
- **银币商城 & 金币兑换**：银币充值套餐 + 学习金币兑换虚拟权益

### 教师端
- **工作台**：学情概览、班级 / 任务统计、核心工具入口、今日课表
- **班级中心**：创建班级、成员管理、班级详情、学习数据分析
- **任务管理**：创建 / 发布 / 详情 / 完成进度，实时统计完成与逾期
- **教学工具**：备忘、活动、谈话、课件、课表、成绩、学生、汇总 8 个模块

### 家长端
- **成长陪伴**：学习时长、错题变化、周报趋势、AI 陪伴建议
- **学习周报**：掌握率、学科对比、知识点变化、家长建议
- **孩子与成长**：成绩、错题、在校表现、多孩子切换

---

## 🛠 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | uni-app（Vue 3，Options API） |
| 目标平台 | 微信小程序（同时可编译 H5 预览） |
| 数据 | 本地 Mock（`mock/`）→ `api/` 封装层，预留 `request.js` 切换真实后端 |
| 设计系统 | 海盐薄荷 Aqua 风格，Token 见 `App.vue` 与根目录 `DESIGN.md` |

---

## 📁 目录结构

```
student-app/
├── api/            # 接口封装（USE_MOCK 切换 mock / request）
├── mock/           # 本地 Mock 数据
├── utils/          # 业务工具：任务状态、金币、主题、工作区等
├── components/     # 公共组件（home / my / teacher / parent / wrongbook / common）
├── pages/          # 页面（auth / index / tasks / wrongbook / workbench / profile / class / shop / teacher / parent）
├── static/         # 静态资源
├── App.vue         # 全局样式 + 路由守卫
├── main.js         # 入口 + 全局登录守卫 mixin
├── pages.json      # 页面注册与全局样式
└── manifest.json   # 应用配置
```

---

## 🚀 快速开始

### 方式一：微信小程序（推荐）

1. 用 **HBuilderX** 打开本目录 `student-app`
2. 运行 → 运行到小程序模拟器 → 微信开发者工具
3. 登录演示账号查看

### 方式二：H5 预览

```bash
# 需要 Node 24+
cd _h5_runner          # 构建工具目录（与本项目并列）
npm ci --ignore-scripts

cd ../_h5_src          # 源码副本（与 student-app 同步）
node ../_h5_runner/node_modules/@dcloudio/vite-plugin-uni/bin/uni.js build -p h5 -c ../_h5_runner/vite.config.js
node ../_h5_runner/serve.js ../_h5_dist_v4 5192
# 打开 http://127.0.0.1:5192/#/pages/auth/select
```

> `_h5_runner` / `_h5_src` 仅用于本地 H5 视觉验收，不属于 `student-app` 源码；日常开发以 HBuilderX 为主。

### 演示账号

| 身份 | 账号 | 密码 |
| --- | --- | --- |
| 学生 | `student01` | `123456` |
| 教师 | `teacher01` | `123456` |
| 家长 | `parent01` | `123456` |

---

## 🧪 测试

项目根目录内置 9 个 Node 测试套件（数据层契约 / 任务生命周期 / 班级分析 / 路由与权限 / 家长模块 / 教师模块 / 工作区）：

```bash
node test-p2-4.js
node test-p3-1.js
node test-p3-2.js
node test-p4-5.js
node test-p4-5b.js
node test-p4-fix.js
node test-parent-modules.js
node test-teacher-modules.js
node test-ws.js
```

当前全部通过（397 项断言）。

---

## 🎨 设计系统

- 设计规范：根目录 `DESIGN.md`（机器可读 Token）+ `设计规范_海盐薄荷.md`（实施规范）
- 视觉风格：海盐薄荷 Aqua——浅青渐变底、白玻璃卡、薄荷青强调色
- 全部页面统一使用 `--app-*` / 角色别名 Token，禁止页面私有色板

---

## 🔄 Git 工作流

- 主分支：`main`
- 功能分支：`dev-student` / `dev-teacher` / `dev-parent` / `dev-auth` / `dev-admin`
- 提交前请运行对应测试套件，确保全部通过
- 不提交 `unpackage/`（已在 `.gitignore` 中忽略）
