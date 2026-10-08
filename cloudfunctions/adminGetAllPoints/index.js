// 云函数：adminGetAllPoints —— 所有用户积分流水 + TOP N 排行
const cloud = require('wx-server-sdk')
const { authorize } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期' }

  try {
    // 1. 拉全部 user_points 流水（聚合查询超免费额度，全量拉）
    const MAX = 1000
    let all = []
    let res = await db.collection('user_points').limit(MAX).get()
    all = res.data
    while (res.data.length === MAX) {
      res = await db.collection('user_points').skip(all.length).limit(MAX).get()
      all = all.concat(res.data)
    }

    // 2. 每个 openid 累加
    const byUser = {}
    for (const r of all) {
      if (!byUser[r.openid]) byUser[r.openid] = { openid: r.openid, total: 0, query: 0, identify: 0, collect: 0, checkin: 0, quiz: 0 }
      byUser[r.openid].total += r.points || 0
      if (byUser[r.openid][r.action] !== undefined) byUser[r.openid][r.action] += r.points || 0
    }

    // 3. TOP 20
    const ranking = Object.values(byUser).sort((a, b) => b.total - a.total).slice(0, 20)

    // 4. 所有流水（最新 100 条）
    const [totalRes, latest] = await Promise.all([
      db.collection('user_points').count(),
      db.collection('user_points').orderBy('createTime', 'desc').limit(100).get()
    ])

    return {
      code: 0,
      data: {
        totalFlows: totalRes.total,
        userCount: Object.keys(byUser).length,
        ranking,
        latestFlows: latest.data
      }
    }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
