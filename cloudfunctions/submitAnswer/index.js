// 云函数：submitAnswer —— 判对错 + 每日首次答对 +5 分（答对额外奖）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1 }

  const picked = event.picked  // 用户选的 index
  const answer = event.answer  // 正确 index
  const today = ymd(new Date())
  const correct = picked === answer

  try {
    // 写答题记录
    await db.collection('quiz_log').add({
      data: { _openid: OPENID, date: today, picked, answer, correct, createTime: Date.now() }
    })

    // 答对且今天还没得过积分 → +5
    let reward = 0
    if (correct) {
      const res = await db.collection('quiz_log')
        .where({ _openid: OPENID, date: today, correct: true, pointsAwarded: true }).limit(1).get()
      if (res.data.length === 0) {
        reward = 5
        await db.collection('user_points').add({
          data: { openid: OPENID, action: 'quiz', points: 5, createTime: Date.now() }
        })
      }
    }

    return { code: 0, correct, reward }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
