// 云函数：getUserProfile —— 获取当前 openid 的用户资料
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1, data: null }

  try {
    const res = await db.collection('user_profile').where({ _openid: OPENID }).limit(1).get()
    if (res.data.length === 0) {
      return { code: 0, data: null } // 首次访问，还没设置头像昵称
    }
    return { code: 0, data: res.data[0] }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
