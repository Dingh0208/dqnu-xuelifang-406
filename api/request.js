// 统一请求封装（未来 Spring Boot 后端接入时使用）
// 当前 USE_MOCK = true，业务层（api/home.js）不会走到这里，因此不会发送任何真实请求。
// 页面/组件禁止直接调用 uni.request，一律通过 api/ 层间接使用本入口。

// 后端基础地址：未来部署时填写，例如 'https://api.example.com'
const BASE_URL = ''

// 统一 token key
const TOKEN_KEY = 'student_token'

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
		var token = ''
		try {
			token = uni.getStorageSync(TOKEN_KEY) || ''
		} catch (e) {
			token = ''
		}

		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: Object.assign(
				{
					'Content-Type': 'application/json',
					Authorization: token ? ('Bearer ' + token) : ''
				},
				options.header || {}
			),
			success: function (res) {
				// HTTP 状态码处理
				if (res.statusCode === 401) {
					// 登录失效：未来跳转登录页
					// uni.redirectTo({ url: '/pages/login/index' })
					reject({ code: 401, message: '登录已失效，请重新登录' })
					return
				}
				if (res.statusCode < 200 || res.statusCode >= 300) {
					reject({ code: res.statusCode, message: '网络请求失败' })
					return
				}

				var body = res.data || {}
				// 后端业务错误处理
				if (body.code !== undefined && body.code !== 200) {
					if (body.code === 401) {
						// 登录失效
					}
					reject(body)
					return
				}
				resolve(body)
			},
			fail: function (err) {
				// 网络异常
				reject({ code: -1, message: '网络异常，请稍后重试', raw: err })
			}
		})
	})
}

export default request
