// 云函数：adminGetAllHistory —— 所有用户的丢弃/查询记录（分页）
// 管理员视角，全表访问 query_history
const cloud = require('wx-server-sdk')
const { authorize, params } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期' }

  try {
    const p = params(event)
    const page = Math.max(1, parseInt(p.page) || 1)
    const pageSize = Math.min(50, Math.max(10, parseInt(p.pageSize) || 20))
    const skip = (page - 1) * pageSize

    // 可选筛选
    const where = {}
    if (p.openid) where.openid = p.openid
    if (p.source) where.source = p.source
    if (p.category) where.category = p.category
    if (p.name) where.name = db.RegExp({ regexp: p.name, options: 'i' })

    const [total, list] = await Promise.all([
      db.collection('query_history').where(where).count(),
      db.collection('query_history')
        .where(where)
        .orderBy('createTime', 'desc')
        .skip(skip).limit(pageSize).get()
    ])

    return {
      code: 0,
      data: {
        list: list.data,
        total: total.total,
        page, pageSize,
        totalPages: Math.ceil(total.total / pageSize)
      }
    }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
