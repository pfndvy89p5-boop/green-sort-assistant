// 云函数：addPoints —— 增加用户积分
// 传入 { action }，action 为 'query' | 'identify' | 'collect' | 'checkin'
// 积分映射：query=1, identify=3, collect=2, checkin=5
// 写入后返回当前用户总积分
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const POINTS_MAP = {
  query: 1,
  identify: 3,
  collect: 2,
  checkin: 5
}

exports.main = async (event) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  if (!action || !POINTS_MAP[action]) {
    return { code: -1, msg: '无效的 action' }
  }

  try {
    await db.collection('user_points').add({
      data: {
        openid: OPENID,
        action,
        points: POINTS_MAP[action],
        createTime: new Date()
      }
    })

    // 统计当前用户总积分
    const res = await db.collection('user_points').where({ openid: OPENID }).get()
    let totalPoints = 0
    res.data.forEach(r => { totalPoints += r.points || 0 })
    return { code: 0, points: totalPoints }
  } catch (e) {
    return { code: -1, msg: e.message }
  }
}
