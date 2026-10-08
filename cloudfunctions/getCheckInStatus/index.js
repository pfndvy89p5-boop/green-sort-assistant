// 云函数：getCheckInStatus —— 返回当月签到日期列表 + 连续天数 + 今日是否已签
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1 }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const startStr = ymd(monthStart)
  const todayStr = ymd(now)

  try {
    const res = await db.collection('checkin_log')
      .where({ _openid: OPENID, date: db.command.gte(startStr) }).get()

    const signedDates = res.data.map(r => r.date)
    const signedSet = new Set(signedDates)
    const todaySigned = signedSet.has(todayStr)

    // 连续天数:从今天(或昨天)往前数
    let streak = 0
    let d = todaySigned ? now : new Date(Date.now() - 86400000)
    while (true) {
      const ds = ymd(d)
      if (signedSet.has(ds)) {
        streak++
        d = new Date(d.getTime() - 86400000)
      } else break
    }

    // 当月所有日期(day 1..月末)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const calendar = []
    for (let i = 1; i <= daysInMonth; i++) {
      const ds = ymd(new Date(now.getFullYear(), now.getMonth(), i))
      calendar.push({
        day: i,
        dateStr: ds,
        signed: signedSet.has(ds),
        isToday: ds === todayStr,
        isFuture: i > now.getDate()
      })
    }

    return {
      code: 0,
      todaySigned,
      streak,
      signedDates,
      calendar
    }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
