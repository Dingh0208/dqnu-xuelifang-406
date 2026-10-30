<script>
	import { isLoggedIn } from '@/api/auth.js'

	export default {
		onLaunch: function() {
			// uni.addInterceptor 的 invoke 必须返回原始 options；返回 true 会让
			// navigateTo/reLaunch 在微信端直接失败，登录页也无法进入教师主页。
			if (typeof uni.addInterceptor !== 'function') return
			;['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'].forEach(function (method) {
				uni.addInterceptor(method, {
					invoke: function (options) {
						var path = ((options && options.url) || '').split('?')[0]
						if (path === '/pages/auth/select' || path === '/pages/auth/login') return options

						if (!isLoggedIn()) {
							uni.reLaunch({ url: '/pages/auth/select' })
							return false
						}
						return options
					}
				})
			})
		},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style>
	/* ============================================================
	   学立方 · 海盐薄荷 UI 规范 v2
	   参考：乔木 UI 学习 Frutiger Aero / Aqua / Liquid Glass
	   三端共用同一套基础视觉；角色只通过内容区分。
	   ============================================================ */
	page {
		/* ---------- 全局设计 Token ---------- */
		--app-bg: #EDF8F7;
		--app-bg-deep: #E2F4F3;
		--app-surface: rgba(255, 255, 255, 0.90);
		--app-surface-solid: #FFFFFF;
		--app-surface-soft: #E2F3F2;
		--app-ink: #0D2F36;
		--app-copy: #44666E;
		--app-muted: #7B9AA1;
		--app-hint: #A9C2C6;
		--app-line: #D3E8E7;
		--app-primary: #0A5C6A;
		--app-primary-dark: #083F4A;
		--app-accent: #12B5A5;
		--app-accent-soft: #8FE3D8;
		--app-sky: #38BDF8;
		--app-positive: #0E9F86;
		--app-positive-bg: #E2F7F1;
		--app-warning: #C48A2A;
		--app-warning-bg: #FFF5E2;
		--app-negative: #D56157;
		--app-negative-bg: #FCECEA;
		--app-shadow: 0 10rpx 28rpx rgba(10, 80, 90, 0.10);
		--app-shadow-soft: 0 4rpx 14rpx rgba(10, 80, 90, 0.06);
		--app-radius: 28rpx;
		--app-radius-lg: 36rpx;
		--app-page-padding: 32rpx;

		/* ---------- 学生端别名（全部指向全局 token） ---------- */
		--student-bg: var(--app-bg);
		--student-surface: var(--app-surface-solid);
		--student-surface-soft: var(--app-surface-soft);
		--student-ink: var(--app-ink);
		--student-copy: var(--app-copy);
		--student-muted: var(--app-muted);
		--student-hint: var(--app-hint);
		--student-line: var(--app-line);
		--student-positive: var(--app-positive);
		--student-positive-bg: var(--app-positive-bg);
		--student-warning: var(--app-warning);
		--student-warning-bg: var(--app-warning-bg);
		--student-negative: var(--app-negative);
		--student-negative-bg: var(--app-negative-bg);
		--student-dark: var(--app-primary);
		--student-dark-copy: #D4EFEF;
		--student-white: #FFFFFF;
		--student-glass-12: rgba(255, 255, 255, 0.12);
		--student-glass-14: rgba(255, 255, 255, 0.14);
		--student-glass-20: rgba(255, 255, 255, 0.20);
		--student-glass-50: rgba(255, 255, 255, 0.50);
		--student-shadow-soft: rgba(10, 80, 90, 0.06);
		--student-shadow: rgba(10, 80, 90, 0.12);
		--student-mask: rgba(8, 42, 48, 0.46);
		--student-radius-card: 28rpx;
		--student-page-padding: 32rpx;

		/* ---------- 家长端别名（全部指向全局 token） ---------- */
		--parent-bg: var(--app-bg);
		--parent-surface: var(--app-surface-solid);
		--parent-surface-soft: var(--app-surface-soft);
		--parent-ink: var(--app-ink);
		--parent-copy: var(--app-copy);
		--parent-muted: var(--app-muted);
		--parent-hint: var(--app-hint);
		--parent-line: var(--app-line);
		--parent-track: #DCEFED;
		--parent-positive: var(--app-positive);
		--parent-positive-bg: var(--app-positive-bg);
		--parent-negative: var(--app-negative);
		--parent-negative-bg: var(--app-negative-bg);
		--parent-dark: var(--app-primary);
		--parent-dark-copy: #D4EFEF;
		--parent-mint: var(--app-accent-soft);
		--parent-white: #FFFFFF;
		--parent-card-radius: 28rpx;
		--parent-page-padding: 32rpx;

		/* ---------- 教师端别名（全部指向全局 token） ---------- */
		--teacher-primary: var(--app-primary);
		--teacher-secondary: var(--app-copy);
		--teacher-accent: var(--app-accent);
		--teacher-accent-strong: #0B6E78;
		--teacher-success-on-dark: #A9E6DD;
		--teacher-tint: #CBE9E6;
		--teacher-surface: #F2FAF9;
		--teacher-surface-dark: var(--app-primary);
		--teacher-surface-dark-control: #1A6570;
		--teacher-surface-muted: #E8F5F4;
		--teacher-text: var(--app-ink);
		--teacher-text-secondary: #577B82;
		--teacher-text-muted: var(--app-muted);
		--teacher-text-hint: var(--app-hint);
		--teacher-white: #FFFFFF;
		--teacher-track: #DCEDEC;
		--teacher-tint-bg: #E1F3F1;
		--teacher-text-on-dark: #FFFFFF;
		--teacher-text-on-dark-secondary: #D2F0EC;
		--teacher-text-on-dark-muted: #B7DFDA;
		--teacher-text-on-dark-hint: #9AC9C2;
		--teacher-success: var(--app-positive);
		--teacher-success-bg: var(--app-positive-bg);
		--teacher-warning: var(--app-warning);
		--teacher-warning-bg: var(--app-warning-bg);
		--teacher-error: var(--app-negative);
		--teacher-error-bg: var(--app-negative-bg);
		--teacher-hover-bg: #F0FAF9;
		--teacher-disabled-bg: #EAF4F3;
		--teacher-disabled-text: #A3BEC2;
		--teacher-hover-opacity: 0.92;
		--teacher-disabled-opacity: 0.55;
		--teacher-glow: rgba(125, 224, 213, 0.28);
		--teacher-glow-soft: rgba(125, 224, 213, 0.16);
		--teacher-glow-transparent: rgba(125, 224, 213, 0);
		--teacher-surface-glass: rgba(255, 255, 255, 0.78);
		--teacher-surface-glass-soft: rgba(255, 255, 255, 0.84);
		--teacher-surface-glass-strong: rgba(255, 255, 255, 0.92);
		--teacher-dark-control-bg: rgba(255, 255, 255, 0.14);
		--teacher-dark-divider: rgba(255, 255, 255, 0.22);
		--teacher-dark-glow: rgba(148, 240, 226, 0.22);
		--teacher-transparent: transparent;
		--teacher-divider-solid: var(--app-line);
		--teacher-border: rgba(13, 47, 54, 0.10);
		--teacher-border-strong: rgba(13, 47, 54, 0.14);
		--teacher-divider-medium: rgba(13, 47, 54, 0.07);
		--teacher-divider-strong: rgba(13, 47, 54, 0.09);
		--teacher-divider-soft: rgba(13, 47, 54, 0.04);
		--teacher-shadow-color-soft: rgba(10, 80, 90, 0.05);
		--teacher-shadow-color: rgba(10, 80, 90, 0.08);
		--teacher-shadow-color-float: rgba(10, 80, 90, 0.14);
		--teacher-card-bg: rgba(255, 255, 255, 0.92);
		--teacher-card-bg-solid: #FFFFFF;
		--teacher-card-border: rgba(13, 47, 54, 0.08);
		--teacher-card-shadow: var(--app-shadow-soft);
		--teacher-card-shadow-sm: 0 2rpx 8rpx rgba(10, 80, 90, 0.05);
		--teacher-radius-card: 28rpx;
		--teacher-radius-btn: 999rpx;
		--teacher-radius-sm: 16rpx;
		--teacher-page-padding: 32rpx;
		--teacher-gap-xs: 8rpx;
		--teacher-gap-sm: 16rpx;
		--teacher-gap-md: 24rpx;
		--teacher-gap-lg: 32rpx;
		--teacher-gap-xl: 48rpx;
		--teacher-btn-height: 88rpx;
		--teacher-btn-radius: 999rpx;
		--teacher-btn-primary-bg: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		--teacher-btn-primary-text: #FFFFFF;
		--teacher-btn-secondary-bg: rgba(255, 255, 255, 0.92);
		--teacher-btn-secondary-border: var(--app-line);
		--teacher-btn-secondary-text: var(--app-primary);
		--teacher-tabbar-bg: rgba(255, 255, 255, 0.94);
		--teacher-tabbar-border: var(--app-line);
		--teacher-tabbar-active: var(--app-primary);
		--teacher-tabbar-inactive: var(--app-muted);
		--teacher-page-bg-color: var(--app-bg);
		--teacher-page-bg-image: none;
		--teacher-fs-title: 38rpx;
		--teacher-fs-section: 32rpx;
		--teacher-fs-body: 28rpx;
		--teacher-fs-aux: 25rpx;
		--teacher-fs-label: 23rpx;
		--teacher-fw-bold: 600;
		--teacher-fw-medium: 500;
		--teacher-fw-regular: 400;
		--teacher-input-bg: #FFFFFF;
		--teacher-input-border: var(--app-line);
		--teacher-input-border-focus: var(--app-accent);
		--teacher-input-text: var(--app-ink);
		--teacher-input-placeholder: var(--app-hint);
		--teacher-input-radius: 20rpx;
		--teacher-input-height: 88rpx;
		--teacher-input-padding-x: 28rpx;
		--teacher-input-padding: 24rpx;
		--teacher-divider: rgba(13, 47, 54, 0.06);
		--teacher-mask: rgba(8, 42, 48, 0.46);
		--teacher-shadow-float: 0 10rpx 30rpx rgba(10, 80, 90, 0.14);
		--teacher-safe-top: env(safe-area-inset-top, 0px);
		--teacher-safe-bottom: env(safe-area-inset-bottom, 0px);
		--teacher-top-action-top: calc(var(--teacher-safe-top) + 12rpx);
		--teacher-top-action-right: var(--teacher-page-padding);

		background-color: var(--app-bg);
		background-image:
			radial-gradient(circle at 12% 0%, rgba(56, 189, 248, 0.16), transparent 52%),
			radial-gradient(circle at 88% 4%, rgba(18, 181, 165, 0.14), transparent 46%),
			linear-gradient(180deg, #EDF8F7 0%, #F8FCFB 100%);
		color: var(--app-ink);
		font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "HarmonyOS Sans SC", sans-serif;
		font-size: 28rpx;
	}

	view, text, input, textarea, button, image, scroll-view {
		box-sizing: border-box;
	}

	/* ---------- 通用 Aqua 组件 ---------- */
	.aq-page {
		min-height: 100vh;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
	}

	.aq-card {
		background: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		border-radius: var(--app-radius);
		box-shadow: var(--app-shadow-soft);
		box-sizing: border-box;
	}

	.aq-card-soft {
		background: var(--app-surface);
		border: 1rpx solid rgba(255, 255, 255, 0.7);
		border-radius: var(--app-radius);
		box-shadow: var(--app-shadow-soft);
		box-sizing: border-box;
	}

	.aq-hero {
		position: relative;
		overflow: hidden;
		border-radius: var(--app-radius-lg);
		background: linear-gradient(135deg, #0B4F5B 0%, #0E7480 48%, #17AAA1 100%);
		color: #FFFFFF;
		box-shadow: 0 16rpx 36rpx rgba(10, 80, 90, 0.18);
	}

	.aq-hero::before {
		content: '';
		position: absolute;
		left: -10%;
		right: -10%;
		top: -45%;
		height: 80%;
		background: radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, 0.30), rgba(255, 255, 255, 0) 70%);
		pointer-events: none;
	}

	.aq-hero::after {
		content: '';
		position: absolute;
		width: 420rpx;
		height: 420rpx;
		right: -160rpx;
		bottom: -220rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(143, 227, 216, 0.35) 0%, rgba(143, 227, 216, 0) 70%);
		pointer-events: none;
	}

	.aq-hero > * {
		position: relative;
		z-index: 1;
	}

	.aq-title {
		font-size: 38rpx;
		line-height: 1.35;
		font-weight: 600;
		color: var(--app-ink);
	}

	.aq-section-title {
		font-size: 32rpx;
		line-height: 1.4;
		font-weight: 600;
		color: var(--app-ink);
	}

	.aq-caption {
		font-size: 24rpx;
		line-height: 1.5;
		color: var(--app-muted);
	}

	.aq-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8rpx 20rpx;
		border-radius: 999rpx;
		background: rgba(18, 181, 165, 0.10);
		color: #0A6B63;
		font-size: 23rpx;
		font-weight: 500;
		line-height: 1.25;
	}

	.aq-btn {
		height: 88rpx;
		padding: 0 36rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		font-size: 28rpx;
		font-weight: 600;
		line-height: 1;
	}

	.aq-btn-primary {
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.aq-btn-primary::before {
		content: '';
		position: absolute;
		left: 10%;
		right: 10%;
		top: 1rpx;
		height: 45%;
		border-radius: 999rpx;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0));
		pointer-events: none;
	}

	.aq-btn-ghost {
		background: rgba(255, 255, 255, 0.92);
		border: 1rpx solid var(--app-line);
		color: var(--app-primary);
	}

	.aq-btn-secondary {
		background: rgba(255, 255, 255, 0.92);
		border: 1rpx solid var(--app-line);
		color: var(--app-primary);
	}

	.aq-tap {
		opacity: 0.86;
	}

	.aq-input {
		width: 100%;
		height: 88rpx;
		padding: 0 28rpx;
		border-radius: 20rpx;
		background: #FFFFFF;
		border: 1rpx solid var(--app-line);
		color: var(--app-ink);
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.aq-state-card {
		margin: 20rpx 0;
		padding: 56rpx 28rpx;
		border-radius: var(--app-radius);
		background: var(--app-surface-solid);
		border: 1rpx solid var(--app-line);
		text-align: center;
	}

	.aq-state-text {
		font-size: 26rpx;
		color: var(--app-muted);
	}

	.aq-empty {
		padding: 48rpx 24rpx;
		text-align: center;
		font-size: 25rpx;
		color: var(--app-muted);
	}

	/* ---------- 旧教师端工具类：映射到 Aqua 规范 ---------- */
	.teacher-page {
		min-height: 100vh;
		max-width: 860rpx;
		margin: 0 auto;
		background-color: var(--app-bg);
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
	}

	.teacher-card {
		background-color: var(--app-surface-solid);
		border-radius: var(--app-radius);
		border: 1rpx solid var(--app-line);
		box-shadow: var(--app-shadow-soft);
		box-sizing: border-box;
	}

	.teacher-page-scroll {
		flex: 1;
		min-height: 0;
	}

	.teacher-page__content {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 0 var(--app-page-padding);
		box-sizing: border-box;
	}

	.teacher-card-pad {
		padding: 28rpx;
	}

	.teacher-section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--app-ink);
		line-height: 1.4;
	}

	.teacher-btn {
		height: 88rpx;
		padding: 0 36rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		font-size: 28rpx;
		font-weight: 600;
		line-height: 1;
	}

	.teacher-btn--primary {
		background: linear-gradient(135deg, #0A5C6A 0%, #12B5A5 100%);
		color: #FFFFFF;
		box-shadow: 0 8rpx 20rpx rgba(10, 92, 106, 0.18);
	}

	.teacher-btn--secondary {
		background-color: rgba(255, 255, 255, 0.92);
		border: 1rpx solid var(--app-line);
		color: var(--app-primary);
	}

	.teacher-input {
		width: 100%;
		height: 88rpx;
		padding: 0 28rpx;
		border-radius: 20rpx;
		background-color: #FFFFFF;
		border: 1rpx solid var(--app-line);
		color: var(--app-ink);
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.teacher-input-placeholder,
	.teacher-input-ph {
		color: var(--app-hint);
		font-size: 28rpx;
	}

	/* ---------- 通用 top-bar ---------- */
	.top-bar {
		color: var(--app-ink);
	}

	.top-bar .back-hit,
	.top-bar .logout-hit {
		min-width: 88rpx;
		min-height: 88rpx;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.top-bar .logout-hit,
	.top-bar .add-hit {
		position: absolute;
		top: var(--teacher-top-action-top);
		right: var(--teacher-top-action-right);
	}

	.top-bar .top-title {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	/* ---------- 兼容旧页面的浅色卡片 ---------- */
	.card, .task-card, .info-card, .progress-card, .summary-card, .chart-card, .review-card, .add-card {
		border-radius: var(--app-radius);
	}
</style>
