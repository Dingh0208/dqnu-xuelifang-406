// 身份选择登录模块 Mock 数据
// 后端接入后：GET/POST /api/auth/* 替换本文件，页面无需改动

// 预置账号（登录时按账号判断角色，密码仅 demo：123456）
var users = [
	{ account: 'student01', password: '123456', role: 'student', nickname: '小明同学' },
	{ account: 'teacher01', password: '123456', role: 'teacher', nickname: '王老师' },
	{ account: 'parent01', password: '123456', role: 'parent', nickname: '小明家长' }
]

// 注册的新账号写入本地缓存，模拟后端入库
var REGISTER_KEY = 'mock_registered_users'

function getRegistered() {
	try {
		return uni.getStorageSync(REGISTER_KEY) || []
	} catch (e) {
		return []
	}
}

function saveRegistered(list) {
	try {
		uni.setStorageSync(REGISTER_KEY, list)
	} catch (e) {}
}

export function mockLogin(params) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			var all = users.concat(getRegistered())
			var found = null
			for (var i = 0; i < all.length; i++) {
				if (all[i].account === params.account) {
					found = all[i]
					break
				}
			}
			if (!found) {
				resolve({ code: 404, msg: '账号不存在，请先注册' })
				return
			}
			if (found.password !== params.password) {
				resolve({ code: 401, msg: '密码错误' })
				return
			}
			resolve({ code: 0, msg: 'ok', data: { account: found.account, role: found.role, nickname: found.nickname, token: 'mock-token-' + found.account } })
		}, 300)
	})
}

export function mockRegister(params) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			var all = users.concat(getRegistered())
			for (var i = 0; i < all.length; i++) {
				if (all[i].account === params.account) {
					resolve({ code: 409, msg: '该账号已被注册' })
					return
				}
			}
			var user = { account: params.account, password: params.password, role: params.role, nickname: params.nickname || params.account }
			saveRegistered(getRegistered().concat([user]))
			resolve({ code: 0, msg: 'ok', data: { account: user.account, role: user.role, nickname: user.nickname } })
		}, 300)
	})
}
