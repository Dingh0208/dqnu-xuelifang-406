'use strict'
// 统一响应体：与前端 request.js 约定一致（code=200 成功；业务错误用 400/401/403/404/409）
function ok(res, data, message = 'success') {
  return res.json({ code: 200, message, data })
}

function fail(res, code, message, httpStatus) {
  const status = httpStatus || (code >= 400 && code < 600 ? code : 200)
  return res.status(status).json({ code, message, data: null })
}

// 包装 async 路由，异常交给全局错误处理
function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const throwIf = (cond, code, message) => {
  if (cond) throw new ApiError(code, message)
}

module.exports = { ok, fail, wrap, ApiError, throwIf }
