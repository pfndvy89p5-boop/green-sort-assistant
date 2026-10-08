// 云函数：adminGetFeedbackList —— 反馈管理列表（分页）
const cloud = require('wx-server-sdk')
const { authorize, params } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  // 1. token 鉴权
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期', data: null }

  // 2. 解析参数
  const p = params(event)
  const page = Math.max(1, parseInt(p.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(p.pageSize, 10) || 10))

  try {
    // 3. 查询反馈列表（按时间倒序，分页）
    const countRes = await db.collection('feedback').count()
    const listRes = await db.collection('feedback')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      msg: 'ok',
      data: { list: listRes.data, total: countRes.total, page, pageSize }
    }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
