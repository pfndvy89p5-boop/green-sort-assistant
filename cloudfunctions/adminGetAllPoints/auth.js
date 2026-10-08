// 管理员鉴权工具（共享）
const crypto = require('crypto')
const SECRET = process.env.ADMIN_SECRET || 'dev_secret_change_me'
const TTL = 24 * 60 * 60 * 1000
function sign(username) {
  const expiry = Date.now() + TTL
  const payload = `${username}.${expiry}`
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${hmac}`
}
function verify(token) {
  if (!token || typeof token !== 'string') return { ok: false }
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false }
  const [username, expiryStr, hmac] = parts
  const payload = `${username}.${expiryStr}`
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  if (expected !== hmac) return { ok: false }
  const expiry = parseInt(expiryStr, 10)
  if (!expiry || Date.now() > expiry) return { ok: false }
  return { ok: true, username }
}
function params(event) {
  const src = event || {}
  const merged = {}
  if (src.body) { try { const b = typeof src.body === 'string' ? JSON.parse(src.body) : src.body; Object.assign(merged, b) } catch (e) {} }
  if (src.queryStringParameters) Object.assign(merged, src.queryStringParameters)
  Object.assign(merged, src)
  return merged
}
function authorize(event) {
  const p = params(event)
  let token = p.token || ''
  if (!token) {
    const headers = (event && event.headers) || {}
    token = (headers.Authorization || headers.authorization || headers['x-token'] || headers['X-Token'] || '').replace(/^Bearer\s+/i, '')
  }
  const result = verify(token)
  return Object.assign({ token }, result)
}
module.exports = { sign, verify, params, authorize }
