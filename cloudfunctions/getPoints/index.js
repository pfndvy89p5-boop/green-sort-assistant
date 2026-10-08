// 云函数：getPoints —— 获取当前用户积分
// 返回 { code: 0, total, records: 最近10条记录 }
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await db.collection('user_points').where({ openid: OPENID }).get()

    // 累计总积分
    let total = 0
    res.data.forEach(r => { total += r.points || 0 })

    // 最近 10 条记录（按 createTime 倒序）
    const records = res.data
      .slice()
      .sort((a, b) => {
        const ta = a.createTime ? new Date(a.createTime).getTime() : 0
        const tb = b.createTime ? new Date(b.createTime).getTime() : 0
        return tb - ta
      })
      .slice(0, 10)

    return { code: 0, total, records }
  } catch (e) {
    return { code: -1, msg: e.message, total: 0, records: [] }
  }
}
