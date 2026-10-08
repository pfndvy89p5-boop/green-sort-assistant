// 云函数：adminUpdateGoods —— 编辑垃圾物品
const cloud = require('wx-server-sdk')
const { authorize, params } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const VALID_CATS = ['recycle', 'kitchen', 'danger', 'other']
const COLOR_MAP = { recycle: '#3A86FF', kitchen: '#06D6A0', danger: '#FF006E', other: '#495057' }

exports.main = async (event) => {
  // 1. token 鉴权
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期', data: null }

  // 2. 解析参数
  const p = params(event)
  const id = p.id
  const goods = p.goods || p
  const name = (goods.name || '').trim()
  const category = (goods.category || '').trim()

  // 3. 参数校验
  if (!id) return { code: -1, msg: '缺少物品ID', data: null }
  if (!name || !category) return { code: -1, msg: '名称和分类不能为空', data: null }
  if (!VALID_CATS.includes(category)) return { code: -1, msg: '分类不合法', data: null }

  try {
    // 4. 更新 trash_data 文档
    await db.collection('trash_data').doc(id).update({
      data: {
        name,
        category,
        color: goods.color || COLOR_MAP[category],
        desc: (goods.desc || '').trim(),
        tip: (goods.tip || '').trim()
      }
    })
    return { code: 0, msg: '更新成功', data: null }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
