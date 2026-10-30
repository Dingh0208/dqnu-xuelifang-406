// 统一请求封装（未来 Spring Boot 后端接入时使用）
// 当前 USE_MOCK = true，业务层（api/home.js）不会走到这里，因此不会发送任何真实请求。
// 页面/组件禁止直接调用 uni.request，一律通过 api/ 层间接使用本入口。
//
// 认证链路（学生 / 教师 / 家长共用，禁止第二套 token 存储）：
//   登录成功 → api/auth.js saveLoginUser 写入 login_user_info + student_token
//   业务请求 → 本文件 getToken() 读取 student_token 并注入 Authorization: Bearer <token>
//   401      → handleUnauthorized() 清登录态并 reLaunch 到身份选择页（本文件为单点入口）

// 后端基础地址：未来部署时填写，例如 'https://api.example.com'
const BASE_URL = ''

// 全项目唯一实际请求 Token 的 Storage Key（api/auth.js 复用本文件 setToken/getToken）
const TOKEN_KEY = 'student_token'
// 登录用户信息 Key（与 api/auth.js 的 USER_KEY 保持一致；401 时一并清理，避免无 token 残留用户态）
const USER_KEY = 'login_user_info'
const WORKSPACE_KEY = 'teacher_workspace_access'
// 登录失效后统一返回的身份选择入口
const AUTH_ENTRY_URL = '/pages/auth/select'

// ---------- Token 统一存取（写入位置/读取位置/注入方式三件套唯一来源） ----------
export function setToken(token) {
	try {
		if (token) uni.setStorageSync(TOKEN_KEY, token)
	} catch (e) {}
}

export function getToken() {
	try {
		return uni.getStorageSync(TOKEN_KEY) || ''
	} catch (e) {
		return ''
	}
}

export function clearToken() {
	try {
		uni.removeStorageSync(TOKEN_KEY)
	} catch (e) {}
}

// 401 单点处理：清理登录态（token + 用户信息）→ 跳身份选择页。
// 通过当前路由判断避免多个并发请求同时 401 时重复 reLaunch；已在登录相关页则不跳转。
function handleUnauthorized() {
	try {
		uni.removeStorageSync(TOKEN_KEY)
		uni.removeStorageSync(USER_KEY)
		uni.removeStorageSync(WORKSPACE_KEY)
	} catch (e) {}
	try {
		var pages = getCurrentPages()
		var current = pages.length ? pages[pages.length - 1] : null
		var route = current && current.route ? current.route.replace(/^\//, '') : ''
		if (route === 'pages/auth/select' || route === 'pages/auth/login') return
	} catch (e) {}
	uni.reLaunch({ url: AUTH_ENTRY_URL })
}

/**
 * 统一请求方法
 * @param {Object} options
 * @param {string} options.url    接口路径，如 '/api/student/home/today'
 * @param {string} [options.method] GET / POST / PATCH / PUT / DELETE
 * @param {Object} [options.data]   请求参数
 * @param {Object} [options.header] 额外请求头
 * @returns {Promise<any>} resolve 后端返回体 { code, message, data }
 */
export function request(options) {
	return new Promise(function (resolve, reject) {
		// Token 只从统一位置读取（student_token），自动注入 Bearer 头
		var token = getToken()

		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			timeout: options.timeout || 15000,
			header: Object.assign(
				{
					'Content-Type': 'application/json',
					Authorization: token ? ('Bearer ' + token) : ''
				},
				options.header || {}
			),
			success: function (res) {
				// HTTP 401：登录失效，统一清理登录态并跳身份选择页（单点入口）
				if (res.statusCode === 401) {
					handleUnauthorized()
					reject({ code: 401, message: '登录已失效，请重新登录' })
					return
				}
				// 其他非 2xx（含 403 无权限）：仅 reject，不清除登录态、不跳转
				if (res.statusCode < 200 || res.statusCode >= 300) {
					reject({ code: res.statusCode, message: '网络请求失败' })
					return
				}

				var body = res.data || {}
				// 后端业务码：登录/注册历史约定 code=0，业务接口约定 code=200，两者都视为成功。
				// 页面不再各自兼容两套成功码，统一在本入口收敛。
				if (body.code !== undefined && body.code !== 0 && body.code !== 200) {
					// 业务码 401：同样按登录失效统一处理
					if (body.code === 401) {
						handleUnauthorized()
					}
					reject(body)
					return
				}
				resolve(body)
			},
			fail: function (err) {
				// 网络异常（非鉴权问题，不清理登录态）
				reject({ code: -1, message: '网络异常，请稍后重试', raw: err })
			}
		})
	})
}

/**
 * 统一文件上传：小程序临时文件必须通过 uni.uploadFile 走 multipart，不能把 filePath 当 JSON 字段传。
 * @param {Object} options { url, filePath, name, formData, header }
 * @returns {Promise<any>}
 */
export function uploadFile(options) {
	return new Promise(function (resolve, reject) {
		var token = getToken()
		uni.uploadFile({
			url: BASE_URL + options.url,
			filePath: options.filePath,
			name: options.name || 'file',
			formData: options.formData || {},
			header: Object.assign(
				{ Authorization: token ? ('Bearer ' + token) : '' },
				options.header || {}
			),
			success: function (res) {
				if (res.statusCode === 401) {
					handleUnauthorized()
					reject({ code: 401, message: '登录已失效，请重新登录' })
					return
				}
				var body = res.data
				try {
					body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
				} catch (e) {}
				if (res.statusCode < 200 || res.statusCode >= 300) {
					reject({ code: res.statusCode, message: '上传失败' })
					return
				}
				if (body && body.code !== undefined && body.code !== 0 && body.code !== 200) {
					reject(body)
					return
				}
				resolve(body)
			},
			fail: function (err) {
				reject({ code: -1, message: '上传失败，请稍后重试', raw: err })
			}
		})
	})
}

export default request
