// 云函数：getKnowledgeList —— 获取知识库物品列表
// 支持按分类筛选：category 传 key（recycle/kitchen/danger/other）或中文名
// 统一返回 color / bgColor / categoryName 字段（UI修复文档要求）
const cloud = require('wx-server-sdk')
const { CAT_KEY_MAP, decorate } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { category } = event

  try {
    let query = {}
    // 分类筛选：前端传英文 key（recycle/kitchen/danger/other），数据库也存英文 key
    if (category) {
      query = { category: category }
    }

    const res = await db.collection('trash_data')
      .where(query)
      .limit(200)
      .get()

    // 统一补充 color/bgColor/categoryName
    const list = res.data.map(decorate)
    return { code: 0, msg: 'ok', data: list }
  } catch (e) {
    return { code: -2, msg: e.message, data: [] }
  }
}
