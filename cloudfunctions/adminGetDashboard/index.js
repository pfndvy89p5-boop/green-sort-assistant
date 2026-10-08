// 云函数：adminGetDashboard —— 控制台首页数据概览
// 返回：物品总数、反馈总数、未处理反馈数、最新反馈列表
const cloud = require('wx-server-sdk')
const { authorize } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  // 1. token 鉴权，拦截非法请求
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期', data: null }

  try {
    // 2. 并行统计各项数据
    const [goodsCount, feedbackCount, pendingCount, latest] = await Promise.all([
      db.collection('trash_data').count(),
      db.collection('feedback').count(),
      db.collection('feedback').where({ status: 0 }).count(),
      db.collection('feedback').orderBy('createTime', 'desc').limit(5).get()
    ])

    return {
      code: 0,
      msg: 'ok',
      data: {
        goodsCount: goodsCount.total,    // 垃圾物品总数
        feedbackCount: feedbackCount.total, // 反馈总数
        pendingCount: pendingCount.total,   // 未处理反馈数
        latestFeedback: latest.data         // 最新反馈
      }
    }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
