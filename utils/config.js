// 全局环境配置
// USE_MOCK = false：走真实后端（api 层自动切到 api/request.js，请求 BASE_URL + /api/...）
// USE_MOCK = true ：全部使用本地 Mock 数据，不发送真实 HTTP 请求
export const USE_MOCK = false

// 后端服务地址（xlf-backend，Node + Express + MySQL）
// - 微信开发者工具：需在「详情 → 本地设置」勾选「不校验合法域名」
// - 真机调试：改成电脑的局域网 IP，如 http://192.168.1.10:3100
// - H5 预览：后端已开启 CORS，可跨端口直连
export const API_BASE_URL = 'http://127.0.0.1:3100'
