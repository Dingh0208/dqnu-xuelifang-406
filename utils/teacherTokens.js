// ============================================================
// ⚠️ DEPRECATED / STALE（P4-FIX-5 标记，请勿在新代码中引用）
// ------------------------------------------------------------
// 本文件是历史视觉稿遗留，全项目零业务引用；其中色板（#2E9E7B + 暖米白）
// 与当前实际生效的教师端设计体系不一致。
//
// 当前教师端【唯一】生效的 Design Token 来源是 App.vue 中定义的
// CSS 变量 --teacher-*（如 --teacher-accent: #0D9488、
// --teacher-page-bg-color: #F2F7F5）及全局类 .teacher-card / .teacher-btn。
// 新页面/新组件一律使用 var(--teacher-*)，禁止引用本文件。
//
// 暂不删除仅为避免影响历史构建；待确认无任何外部依赖后由后续阶段清理。
// ------------------------------------------------------------
//
// 教师端 Design Token（视觉层颜色常量 · 翡翠绿暖色版定稿）
//
// 锁定规则：
//   - 教师端统一使用本文件的颜色，禁止在 .vue 内自行创造新色值。
//   - 历史版本（#12423B 深墨绿 / #0FA98E 冷薄荷绿）均已废弃，全端以本文件为准；
//     学生端暖色体系独立，不受本文件影响。
//   - 主题只影响视觉表现，不修改任何业务数据。
//
// 颜色语义：
//   primary       #2E9E7B  主色翡翠绿：主按钮渐变终点/链接/选中态/数据高亮/进度填充
//   primaryLight  #E6F4EF  主色浅底：次按钮按压态背景
//   gradStart     #3FB98F  主按钮/进度填充渐变起点
//   bgTop/bgBottom  暖米白渐变页面底（180deg）
//   blobMint      左上薄荷绿光斑  blobWarm 右下浅暖橙光斑（仅允许的暖色）
//   text1/text2/text3  一级 #1F2D2A / 二级 #7C8B86 / 三级 #A8B4AF
//   card #FFFFFF / line #EAF1EE（分隔与轨道）/ track #E9EFEC（骨架）
//   cardBorder #E3EDE8（退出胶囊描边）/ topLine #EEF3F1（顶栏/底栏分隔线）
//   shadow        绿调柔和投影 0 4px 16px
//
// 视觉原则：
//   1. 轻拟物：白卡 + 16px 圆角 + 柔投影；按钮/胶囊全圆角 999px；
//   2. 除主色绿外不引入彩色，暖色仅限背景光斑；禁纯黑/直角卡/重阴影。
// ============================================================

export var TEACHER_TOKENS = {
	primary: '#2E9E7B',
	primaryLight: '#E6F4EF',
	gradStart: '#3FB98F',
	bgTop: '#FBF7F0',
	bgBottom: '#F7F3EC',
	blobMint: 'rgba(205, 235, 221, 0.55)',
	blobWarm: 'rgba(251, 230, 210, 0.45)',
	text1: '#1F2D2A',
	text2: '#7C8B86',
	text3: '#A8B4AF',
	card: '#FFFFFF',
	line: '#EAF1EE',
	track: '#E9EFEC',
	cardBorder: '#E3EDE8',
	topLine: '#EEF3F1'
}

// 便于页面直接解构：import { T } from '@/utils/teacherTokens.js'
export var T = TEACHER_TOKENS
