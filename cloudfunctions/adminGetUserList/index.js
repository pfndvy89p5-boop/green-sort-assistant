// 云函数：adminGetUserList —— 所有已注册用户 + 各自统计
const cloud = require('wx-server-sdk')
const { authorize } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期' }

  try {
    // 1. 拉所有 user_profile
    const MAX = 1000
    let users = []
    let res = await db.collection('user_profile').limit(MAX).get()
    users = res.data
    while (res.data.length === MAX) {
      res = await db.collection('user_profile').skip(users.length).limit(MAX).get()
      users = users.concat(res.data)
    }

    // 2. 拉所有 query_history + 统计每个用户
    let allHist = []
    res = await db.collection('query_history').limit(MAX).get()
    allHist = res.data
    while (res.data.length === MAX) {
      res = await db.collection('query_history').skip(allHist.length).limit(MAX).get()
      allHist = allHist.concat(res.data)
    }
    const histByUser = {}
    for (const h of allHist) {
      histByUser[h._openid] = histByUser[h._openid] || { total: 0, camera: 0, text: 0, lastTime: 0 }
      histByUser[h._openid].total++
      if (h.source === 'camera') histByUser[h._openid].camera++
      else histByUser[h._openid].text++
      if (h.createTime > histByUser[h._openid].lastTime) histByUser[h._openid].lastTime = h.createTime
    }

    // 3. 拉所有 user_points + 统计每个用户总积分
    let allPts = []
    res = await db.collection('user_points').limit(MAX).get()
    allPts = res.data
    while (res.data.length === MAX) {
      res = await db.collection('user_points').skip(allPts.length).limit(MAX).get()
      allPts = allPts.concat(res.data)
    }
    const ptsByUser = {}
    for (const p of allPts) {
      ptsByUser[p.openid] = (ptsByUser[p.openid] || 0) + (p.points || 0)
    }

    // 4. 拉收藏数
    let allFav = []
    res = await db.collection('user_collect').limit(MAX).get()
    allFav = res.data
    while (res.data.length === MAX) {
      res = await db.collection('user_collect').skip(allFav.length).limit(MAX).get()
      allFav = allFav.concat(res.data)
    }
    const favByUser = {}
    for (const f of allFav) {
      favByUser[f._openid] = (favByUser[f._openid] || 0) + 1
    }

    // 5. 合并输出
    const enriched = users.map(u => ({
      openid: u._openid,
      nickName: u.nickName || '(未设置)',
      avatarUrl: u.avatarUrl || '',
      createTime: u.createTime,
      updateTime: u.updateTime,
      historyCount: (histByUser[u._openid] || {}).total || 0,
      cameraCount: (histByUser[u._openid] || {}).camera || 0,
      textCount: (histByUser[u._openid] || {}).text || 0,
      lastActiveTime: (histByUser[u._openid] || {}).lastTime || u.updateTime,
      totalPoints: ptsByUser[u._openid] || 0,
      favoriteCount: favByUser[u._openid] || 0
    })).sort((a, b) => (b.lastActiveTime || 0) - (a.lastActiveTime || 0))

    return {
      code: 0,
      data: {
        total: enriched.length,
        list: enriched
      }
    }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
