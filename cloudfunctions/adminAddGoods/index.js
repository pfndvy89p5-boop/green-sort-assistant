// 云函数：adminAddGoods —— 新增垃圾物品
const cloud = require('wx-server-sdk')
const { authorize, params } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 合法分类与默认颜色（统一使用英文 key，与 seed 数据一致）
const VALID_CATS = ['recycle', 'kitchen', 'danger', 'other']
const COLOR_MAP = { recycle: '#3A86FF', kitchen: '#06D6A0', danger: '#FF006E', other: '#495057' }

exports.main = async (event) => {
  // 1. token 鉴权
  const auth = authorize(event)
  if (!auth.ok) return { code: 401, msg: '未授权或登录已过期', data: null }

  // 2. 解析参数
  const p = params(event)
  const goods = p.goods || p
  const name = (goods.name || '').trim()
  const category = (goods.category || '').trim()

  // 3. 参数校验
  if (!name || !category) return { code: -1, msg: '名称和分类不能为空', data: null }
  if (!VALID_CATS.includes(category)) return { code: -1, msg: '分类不合法', data: null }

  try {
    // 4. 写入 trash_data 集合
    const addRes = await db.collection('trash_data').add({
      data: {
        name,
        category,
        color: goods.color || COLOR_MAP[category],
        desc: (goods.desc || '').trim(),
        tip: (goods.tip || '').trim(),
        createTime: Date.now()
      }
    })
    return { code: 0, msg: '添加成功', data: { id: addRes._id } }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
