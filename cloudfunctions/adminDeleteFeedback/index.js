// 云函数：adminDeleteFeedback —— 删除用户反馈
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
  if (!id) return { code: -1, msg: '缺少反馈ID', data: null }

  try {
    // 3. 删除反馈文档
    await db.collection('feedback').doc(id).remove()
    return { code: 0, msg: '删除成功', data: null }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
