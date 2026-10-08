// 云函数：adminGetGoodsList —— 物品管理列表（支持搜索 + 分页）
const cloud = require('wx-server-sdk')
const { authorize, params } = require('./auth')
const { decorate } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  // 1. token 鉴权
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期', data: null }

  // 2. 解析参数
  const p = params(event)
  const keyword = (p.keyword || '').trim()
  const page = Math.max(1, parseInt(p.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(p.pageSize, 10) || 10))

  try {
    // 3. 构造查询条件（支持按名称模糊搜索）
    let query = {}
    if (keyword) {
      query.name = db.RegExp({ regexp: keyword, options: 'i' })
    }

    // 4. 查询总数 + 当前页数据
    const countRes = await db.collection('trash_data').where(query).count()
    const listRes = await db.collection('trash_data')
      .where(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      msg: 'ok',
      data: { list: listRes.data.map(decorate), total: countRes.total, page, pageSize }
    }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
