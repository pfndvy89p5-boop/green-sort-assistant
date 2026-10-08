// adminApiGateway —— 管理员 API 网关（同时支持云函数调用 + HTTP 触发）
// 所有 Web 后台的请求都打这一个函数，内部按 action 转发
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// ========== 鉴权 ==========
const crypto = require('crypto')
const SECRET = process.env.ADMIN_SECRET || 'dev_secret_change_me'
const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || ''
const TTL = 24 * 60 * 60 * 1000
function sign(username) {
  const expiry = Date.now() + TTL
  const payload = `${username}.${expiry}`
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${hmac}`
}
function verify(token) {
  if (!token || typeof token !== 'string') { console.log('[verify] 无 token'); return { ok: false } }
  const parts = token.split('.')
  if (parts.length !== 3) { console.log('[verify] token 格式不对, parts=' + parts.length); return { ok: false } }
  const [username, expiryStr, hmac] = parts
  const payload = `${username}.${expiryStr}`
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  console.log('[verify] username=' + username, 'expiry=' + expiryStr, 'hmac=' + hmac.slice(0,8) + '...', 'expected=' + expected.slice(0,8) + '...', 'match=' + (expected === hmac))
  if (expected !== hmac) return { ok: false }
  const expiry = parseInt(expiryStr, 10)
  if (!expiry || Date.now() > expiry) { console.log('[verify] 过期, now=' + Date.now(), 'expiry=' + expiry); return { ok: false } }
  return { ok: true, username }
}
function extractToken(event) {
  // 从所有可能的位置提取 token
  if (event.token) return String(event.token).trim()
  if (event.body && typeof event.body === 'object' && event.body.token) return String(event.body.token).trim()
  if (event.queryStringParameters && event.queryStringParameters.token) return String(event.queryStringParameters.token).trim()
  if (event.headers) {
    const h = event.headers
    const auth = h.Authorization || h.authorization || h['X-Token'] || h['x-token'] || ''
    if (auth) return auth.replace(/^Bearer\s+/i, '').trim()
  }
  return ''
}

// ========== HTTP 返回包装 ==========
function httpRes(obj, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: typeof obj === 'string' ? obj : JSON.stringify(obj)
  }
}

// ========== Handlers ==========
const handlers = {
  login: async (p) => {
    // 账号密码从环境变量读取
    if (!ADMIN_PASS) return { code: 401, msg: '服务端未配置管理员密码' }
    if (p.username === ADMIN_USER && p.password === ADMIN_PASS) {
      const token = sign(ADMIN_USER)
      return { code: 0, data: { token, username: ADMIN_USER, expireIn: TTL } }
    }
    return { code: 401, msg: '账号或密码错误' }
  },

  dashboard: async () => {
    try {
      const [goods, feedback, fbStats] = await Promise.all([
        db.collection('trash_data').count(),
        db.collection('feedback').count(),
        db.collection('feedback').where({ status: _.neq(1) }).count().catch(() => ({ total: 0 }))
      ])
      let latestFb = { data: [] }
      try { latestFb = await db.collection('feedback').orderBy('createTime', 'desc').limit(5).get() } catch (e) {}
      return {
        code: 0, data: {
          goodsCount: goods.total,
          feedbackCount: feedback.total,
          pendingCount: (fbStats && fbStats.total) || 0,
          latestFeedback: latestFb.data
        }
      }
    } catch (e) { return { code: -2, msg: e.message } }
  },

  stats: async () => {
    const catMap = {}
    try {
      const res = await db.collection('trash_data').limit(1000).get()
      for (const g of res.data) catMap[g.category] = (catMap[g.category] || 0) + 1
    } catch (e) {}
    return { code: 0, data: catMap }
  },

  // ------- Users -------
  users: async () => {
    try {
      const MAX = 1000
      let users = [], res = await db.collection('user_profile').limit(MAX).get()
      users = res.data
      while (res.data.length === MAX) { res = await db.collection('user_profile').skip(users.length).limit(MAX).get(); users = users.concat(res.data) }

      let allHist = []; res = await db.collection('query_history').limit(MAX).get()
      allHist = res.data
      while (res.data.length === MAX) { res = await db.collection('query_history').skip(allHist.length).limit(MAX).get(); allHist = allHist.concat(res.data) }

      const histByUser = {}
      for (const h of allHist) {
        const k = h._openid
        histByUser[k] = histByUser[k] || { total: 0, camera: 0, text: 0, lastTime: 0 }
        histByUser[k].total++
        if (h.source === 'camera') histByUser[k].camera++
        else histByUser[k].text++
        if (h.createTime > histByUser[k].lastTime) histByUser[k].lastTime = h.createTime
      }

      let allPts = []; res = await db.collection('user_points').limit(MAX).get()
      allPts = res.data
      while (res.data.length === MAX) { res = await db.collection('user_points').skip(allPts.length).limit(MAX).get(); allPts = allPts.concat(res.data) }
      const ptsByUser = {}
      for (const p of allPts) ptsByUser[p.openid] = (ptsByUser[p.openid] || 0) + (p.points || 0)

      let allFav = []; res = await db.collection('user_collect').limit(MAX).get()
      allFav = res.data
      while (res.data.length === MAX) { res = await db.collection('user_collect').skip(allFav.length).limit(MAX).get(); allFav = allFav.concat(res.data) }
      const favByUser = {}
      for (const f of allFav) favByUser[f._openid] = (favByUser[f._openid] || 0) + 1

      const list = users.map(u => ({
        openid: u._openid,
        nickName: u.nickName || '(未设置)',
        avatarUrl: u.avatarUrl || '',
        createTime: u.createTime,
        historyCount: (histByUser[u._openid] || {}).total || 0,
        cameraCount: (histByUser[u._openid] || {}).camera || 0,
        totalPoints: ptsByUser[u._openid] || 0,
        favoriteCount: favByUser[u._openid] || 0,
        lastActiveTime: (histByUser[u._openid] || {}).lastTime || u.updateTime || u.createTime
      })).sort((a, b) => (b.lastActiveTime || 0) - (a.lastActiveTime || 0))

      return { code: 0, data: { total: list.length, list } }
    } catch (e) { return { code: -2, msg: e.message } }
  },

  // ------- History -------
  history: async (p) => {
    try {
      const page = Math.max(1, parseInt(p.page) || 1)
      const pageSize = Math.min(50, Math.max(10, parseInt(p.pageSize) || 20))
      const skip = (page - 1) * pageSize
      const where = {}
      if (p.openid) where.openid = p.openid
      if (p.source) where.source = p.source
      if (p.category) where.category = p.category
      if (p.name) where.name = db.RegExp({ regexp: p.name, options: 'i' })

      const [totalRes, listRes] = await Promise.all([
        db.collection('query_history').where(where).count(),
        db.collection('query_history').where(where).orderBy('createTime', 'desc').skip(skip).limit(pageSize).get()
      ])
      return {
        code: 0, data: {
          list: listRes.data, total: totalRes.total, page, pageSize,
          totalPages: Math.ceil(totalRes.total / pageSize)
        }
      }
    } catch (e) { return { code: -2, msg: e.message } }
  },

  // ------- Points -------
  points: async () => {
    try {
      const MAX = 1000
      let all = []; let res = await db.collection('user_points').limit(MAX).get()
      all = res.data
      while (res.data.length === MAX) { res = await db.collection('user_points').skip(all.length).limit(MAX).get(); all = all.concat(res.data) }

      const byUser = {}
      for (const r of all) {
        if (!byUser[r.openid]) byUser[r.openid] = { openid: r.openid, total: 0, query: 0, identify: 0, collect: 0, checkin: 0, quiz: 0 }
        byUser[r.openid].total += r.points || 0
        if (byUser[r.openid][r.action] !== undefined) byUser[r.openid][r.action] += r.points || 0
      }

      const ranking = Object.values(byUser).sort((a, b) => b.total - a.total).slice(0, 50)
      const latest = await db.collection('user_points').orderBy('createTime', 'desc').limit(100).get()
      const totalRes = await db.collection('user_points').count()

      return {
        code: 0, data: {
          totalFlows: totalRes.total,
          userCount: Object.keys(byUser).length,
          ranking,
          latestFlows: latest.data
        }
      }
    } catch (e) { return { code: -2, msg: e.message } }
  },

  // ------- Goods -------
  goodsList: async (p) => {
    try {
      const page = Math.max(1, parseInt(p.page) || 1)
      const pageSize = Math.min(50, Math.max(10, parseInt(p.pageSize) || 20))
      const skip = (page - 1) * pageSize
      const where = {}
      if (p.category) where.category = p.category
      if (p.keyword) where.name = db.RegExp({ regexp: p.keyword, options: 'i' })

      const [totalRes, listRes] = await Promise.all([
        db.collection('trash_data').where(where).count(),
        db.collection('trash_data').where(where).orderBy('createTime', 'desc').skip(skip).limit(pageSize).get()
      ])
      return { code: 0, data: { list: listRes.data, total: totalRes.total, page, pageSize, totalPages: Math.ceil(totalRes.total / pageSize) } }
    } catch (e) { return { code: -2, msg: e.message } }
  },
  goodsDelete: async (p) => {
    if (!p.id) return { code: -1, msg: '缺少 id' }
    try { await db.collection('trash_data').doc(p.id).remove(); return { code: 0 } }
    catch (e) { return { code: -2, msg: e.message } }
  },

  // ------- Feedback -------
  feedbackList: async (p) => {
    try {
      const page = Math.max(1, parseInt(p.page) || 1)
      const pageSize = Math.min(50, Math.max(10, parseInt(p.pageSize) || 20))
      const skip = (page - 1) * pageSize
      const [totalRes, listRes] = await Promise.all([
        db.collection('feedback').count(),
        db.collection('feedback').orderBy('createTime', 'desc').skip(skip).limit(pageSize).get()
      ])
      return { code: 0, data: { list: listRes.data, total: totalRes.total, page, pageSize } }
    } catch (e) { return { code: -2, msg: e.message } }
  },
  feedbackResolve: async (p) => {
    if (!p.id) return { code: -1, msg: '缺少 id' }
    try { await db.collection('feedback').doc(p.id).update({ data: { status: 1 } }); return { code: 0 } }
    catch (e) { return { code: -2, msg: e.message } }
  },
  feedbackDelete: async (p) => {
    if (!p.id) return { code: -1, msg: '缺少 id' }
    try { await db.collection('feedback').doc(p.id).remove(); return { code: 0 } }
    catch (e) { return { code: -2, msg: e.message } }
  }
}

exports.main = async (event) => {
  // CORS 预检
  if (event.httpMethod === 'OPTIONS') return httpRes({})

  // 合并参数
  const body = (event.body && typeof event.body === 'string') ? JSON.parse(event.body) : (event.body || {})
  const qs = event.queryStringParameters || {}
  const p = Object.assign({}, qs, body, event || {})
  const action = p.action || p.path || 'dashboard'
  console.log('[main] action=' + action)

  // login 不需要 token
  if (action === 'login') {
    const r = await handlers.login(p)
    return event.httpMethod ? httpRes(r) : r
  }

  // 鉴权
  const token = extractToken(event) || p.token || ''
  console.log('[main] extract token len=' + token.length)
  const auth = verify(token)
  if (!auth.ok) {
    const err = { code: 401, msg: '未授权或登录已过期' }
    return event.httpMethod ? httpRes(err, 401) : err
  }

  // 转发
  if (!handlers[action]) {
    const err = { code: -1, msg: '未知 action: ' + action }
    return event.httpMethod ? httpRes(err, 404) : err
  }
  const result = await handlers[action](p)
  return event.httpMethod ? httpRes(result) : result
}
