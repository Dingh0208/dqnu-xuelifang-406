// ============================================================
// 学习金币奖励 & 连续未完成惩罚 —— 纯计算逻辑
//
// 说明：
//   - 本文件只做「前端实时预计」：用户每完成一个任务，今日预计金币立即变化；
//   - 用户账户真实金币余额以后端结算为权威来源（见 api/assets.js 的 coins），
//     这里的 todayRewardCoins 不写入账户余额，两者是不同字段；
//   - 银币（silverCoins）为充值资产，与学习金币独立，当前不做兑换。
// ============================================================

// 今日完成度 = 已完成任务数量 ÷ 今日任务总数量（所有任务权重完全相同）
// 返回 0～100 的数值
export function completionRateByCount(completedCount, totalCount) {
	var done = Number(completedCount) || 0
	var total = Number(totalCount) || 0
	if (total <= 0) return 0
	var rate = (done / total) * 100
	return Math.min(100, Math.max(0, rate))
}

// 今日预计获得学习金币：每完成约 10% 今日任务获得 1 枚
// 金币 = floor(完成度 × 10)，最低 0、最高 10
//   完成 0/10 → 0 ；1/10(10%) → 1 ；5/10(50%) → 5 ；9/10(90%) → 9 ；10/10(100%) → 10
export function todayRewardCoins(completedCount, totalCount) {
	var rate = completionRateByCount(completedCount, totalCount)
	return Math.min(10, Math.max(0, Math.floor(rate / 10)))
}

// 连续「完全未完成」（当天 completedCount === 0）每日扣除金币：
//   第1天 -2，第2天 -4，第3天 -8，第4天起 -10（每日惩罚封顶 10）
// streakDays 为连续完全未完成天数（≥1）；返回当日应扣金币数（正数表示扣减量）
export function consecutiveIncompletePenalty(streakDays) {
	var days = Number(streakDays) || 0
	if (days <= 0) return 0
	if (days === 1) return 2
	if (days === 2) return 4
	if (days === 3) return 8
	return 10 // 第4天及以后：每天 -10
}

// 连续未完成计数推进（供未来后端每日结算 / 前端预览使用）：
//   当天完成至少 1 个任务 → 计数立即归零（不触发惩罚）；
//   当天 0 完成           → 计数 +1。
export function nextIncompleteStreak(completedTodayCount, prevStreakDays) {
	if ((Number(completedTodayCount) || 0) > 0) return 0
	return (Number(prevStreakDays) || 0) + 1
}
