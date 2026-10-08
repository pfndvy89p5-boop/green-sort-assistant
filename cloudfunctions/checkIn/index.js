// 云函数：checkIn —— 每日签到，连续 N 天额外奖励
// 签到奖励：基础 5 分 + 连续 3/7/30 天额外 +10/+20/+50
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1, msg: '缺少 openid' }

  const today = ymd(new Date())

  try {
    // 1. 查今天签了没
    let res = await db.collection('checkin_log')
      .where({ _openid: OPENID, date: today }).limit(1).get()
    if (res.data.length > 0) {
      return { code: 1, msg: '今天已签到', signed: true, reward: 0 }
    }

    // 2. 查昨天签了没 → 算连续天数
    const yesterday = ymd(new Date(Date.now() - 86400000))
    res = await db.collection('checkin_log')
      .where({ _openid: OPENID, date: yesterday }).limit(1).get()
    let streak = res.data.length > 0 ? (res.data[0].streak || 0) + 1 : 1

    // 3. 奖励规则
    let base = 5
    let bonus = 0
    if (streak > 0 && streak % 30 === 0) bonus = 50
    else if (streak > 0 && streak % 7 === 0) bonus = 20
    else if (streak > 0 && streak % 3 === 0) bonus = 10
    const total = base + bonus

    // 4. 写签到记录
    await db.collection('checkin_log').add({
      data: {
        _openid: OPENID,
        date: today,
        streak,
        base,
        bonus,
        total,
        createTime: Date.now()
      }
    })

    // 5. 写积分流水
    await db.collection('user_points').add({
      data: { openid: OPENID, action: 'checkin', points: total, createTime: Date.now() }
    })

    return {
      code: 0, signed: true,
      reward: total, base, bonus, streak
    }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
