// 云函数：adminGetStats —— 数据统计
// 返回：四大分类物品数量统计、反馈总数/已处理数/处理率、物品总数
const cloud = require('wx-server-sdk')
const { authorize } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  // 1. token 鉴权
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期', data: null }

  try {
    // 2. 四大分类数量统计（数据库用英文 key 存储，返回时转中文名）
    const CAT_LIST = [
      { key: 'recycle', name: '可回收物' },
      { key: 'kitchen', name: '厨余垃圾' },
      { key: 'danger', name: '有害垃圾' },
      { key: 'other', name: '其他垃圾' }
    ]
    const categoryStats = []
    for (const c of CAT_LIST) {
      const r = await db.collection('trash_data').where({ category: c.key }).count()
      categoryStats.push({ category: c.name, count: r.total })
    }

    // 3. 反馈处理统计
    const [total, handled, goodsTotal] = await Promise.all([
      db.collection('feedback').count(),
      db.collection('feedback').where({ status: 1 }).count(),
      db.collection('trash_data').count()
    ])

    // 4. 反馈处理率（保留整数百分比）
    const feedbackTotal = total.total
    const handleRate = feedbackTotal ? Math.round(handled.total / feedbackTotal * 100) : 0

    return {
      code: 0,
      msg: 'ok',
      data: {
        categoryStats,             // 分类统计
        feedbackTotal,             // 反馈总数
        feedbackHandled: handled.total, // 已处理反馈数
        handleRate,                // 反馈处理率(%)
        goodsTotal: goodsTotal.total   // 物品总数
      }
    }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
