// 云函数：toggleCollect —— 收藏 / 取消收藏
// 传入 goods（含 name/category/color/desc/tip/goodsId），按当前用户 + 名称判断：
//   已收藏 → 删除（取消）；未收藏 → 新增（收藏）
// 收藏时同时保存 color / bgColor（UI修复文档要求）
const cloud = require('wx-server-sdk')
const { CATEGORY_PALETTE } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { goods } = event
  const { OPENID } = cloud.getWXContext()

  if (!goods || !goods.name) {
    return { code: -1, msg: '参数错误', collected: false }
  }

  try {
    const col = db.collection('user_collect')

    // 判断是否已收藏
    const exist = await col.where({ _openid: OPENID, name: goods.name }).limit(1).get()

    if (exist.data.length > 0) {
      // 已收藏 → 取消
      await col.doc(exist.data[0]._id).remove()
      return { code: 0, msg: '已取消收藏', collected: false }
    }

    // 未收藏 → 加入收藏（按统一配色补充 color/bgColor）
    const p = CATEGORY_PALETTE[goods.category] || { color: '#495057', bgColor: 'rgba(73, 80, 87, 0.14)' }
    await col.add({
      data: {
        _openid: OPENID,
        goodsId: goods.goodsId || '',
        name: goods.name,
        category: goods.category || '',
        color: goods.color || p.color,
        bgColor: goods.bgColor || p.bgColor,
        desc: goods.desc || '',
        tip: goods.tip || '',
        createTime: Date.now()
      }
    })
    return { code: 0, msg: '已收藏', collected: true }
  } catch (e) {
    return { code: -2, msg: e.message, collected: false }
  }
}
