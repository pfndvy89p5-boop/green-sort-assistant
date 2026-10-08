// 管理员鉴权工具
// 采用 HMAC-SHA256 签名生成无状态 token，有效期 24 小时。
// 兼容两种调用方式：
//   1. 小程序 wx.cloud.callFunction：token 放在 event.token
//   2. H5 HTTP 触发：token 放在请求头 Authorization / x-token，或 JSON body 中
const crypto = require('crypto')

// 签名密钥（生产环境建议改为环境变量）
const SECRET = process.env.ADMIN_SECRET || 'dev_secret_change_me'
// token 有效期：24 小时
const TTL = 24 * 60 * 60 * 1000

// 生成 token：username.过期时间戳.HMAC签名
function sign(username) {
  const expiry = Date.now() + TTL
  const payload = `${username}.${expiry}`
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${hmac}`
}

// 校验 token，返回 { ok: true, username } 或 { ok: false }
function verify(token) {
  if (!token || typeof token !== 'string') return { ok: false }
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false }

  const [username, expiryStr, hmac] = parts
  const payload = `${username}.${expiryStr}`

  // 1. 校验签名
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  if (expected !== hmac) return { ok: false }

  // 2. 校验有效期（24 小时）
  const expiry = parseInt(expiryStr, 10)
  if (!expiry || Date.now() > expiry) return { ok: false }

  return { ok: true, username }
}

// 解析请求参数（兼容小程序 callFunction 与 HTTP 触发）
function params(event) {
  const src = event || {}
  const merged = {}
  // HTTP 触发时 body 为 JSON 字符串
  if (src.body) {
    try {
      const b = typeof src.body === 'string' ? JSON.parse(src.body) : src.body
      Object.assign(merged, b)
    } catch (e) { /* body 解析失败则忽略 */ }
  }
  // HTTP GET 查询参数
  if (src.queryStringParameters) Object.assign(merged, src.queryStringParameters)
  // 直接字段（小程序 callFunction）优先级最高
  Object.assign(merged, src)
  return merged
}

// 从请求中提取并校验 token
function authorize(event) {
  const p = params(event)
  let token = p.token || ''
  if (!token) {
    const headers = (event && event.headers) || {}
    token = (headers.Authorization || headers.authorization || headers['x-token'] || headers['X-Token'] || '')
      .replace(/^Bearer\s+/i, '')
  }
  const result = verify(token)
  return Object.assign({ token }, result)
}

module.exports = { sign, verify, params, authorize }
