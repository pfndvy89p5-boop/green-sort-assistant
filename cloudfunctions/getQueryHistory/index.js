// 云函数：getQueryHistory —— 获取当前用户的查询历史
// 按 createTime 倒序返回最近 50 条
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await db.collection('query_history')
      .where({ openid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()
    return { code: 0, data: res.data }
  } catch (e) {
    return { code: -1, msg: e.message, data: [] }
  }
}
