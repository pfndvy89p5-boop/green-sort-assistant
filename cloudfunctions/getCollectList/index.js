// 云函数：getCollectList —— 获取当前用户的收藏列表
// 统一返回 color / bgColor / categoryName 字段
const cloud = require('wx-server-sdk')
const { decorate } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await db.collection('user_collect')
      .where({ _openid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    // 统一补充 color/bgColor/categoryName
    const list = res.data.map(decorate)
    return { code: 0, msg: 'ok', data: list }
  } catch (e) {
    return { code: -2, msg: e.message, data: [] }
  }
}
