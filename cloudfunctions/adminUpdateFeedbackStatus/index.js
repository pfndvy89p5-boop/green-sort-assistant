// 云函数：adminUpdateFeedbackStatus —— 标记反馈为已处理 / 未处理
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
  const id = p.id
  // status：1 已处理，0 未处理
  const status = parseInt(p.status, 10) === 1 ? 1 : 0
  if (!id) return { code: -1, msg: '缺少反馈ID', data: null }

  try {
    // 3. 更新反馈状态
    await db.collection('feedback').doc(id).update({ data: { status } })
    return { code: 0, msg: status === 1 ? '已标记为已处理' : '已标记为未处理', data: null }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
