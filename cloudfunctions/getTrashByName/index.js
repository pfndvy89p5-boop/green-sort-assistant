// 云函数：getTrashByName —— 按名称查询垃圾物品（优先精确匹配，其次模糊匹配，支持关键词拆分）
// 统一返回 color / bgColor / categoryName 字段
const cloud = require('wx-server-sdk')
const { decorate } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 去掉常见名词后缀（子、儿、头、式、物、品、具），用于模糊匹配兜底
function stripSuffix(s) {
  return s.replace(/[子儿头式物品具]$/, '')
}

// 生成搜索关键词列表：原词 → 去后缀词 → 拆词（空格分词）
function buildKeywords(kw) {
  const arr = [kw]
  const stripped = stripSuffix(kw)
  if (stripped && stripped !== kw && stripped.length >= 1) arr.push(stripped)
  return arr
}

exports.main = async (event) => {
  const { name } = event
  if (!name || typeof name !== 'string') {
    return { code: -1, msg: '缺少查询名称', data: null }
  }
  const kw = name.trim()
  if (!kw) return { code: -1, msg: '查询名称不能为空', data: null }

  try {
    let item = null
    const keywords = buildKeywords(kw)

    // 第一轮：精确匹配（用原词）
    let res = await db.collection('trash_data').where({ name: kw }).limit(1).get()
    item = res.data[0]

    // 第二轮：模糊匹配 —— 遍历所有关键词，谁先命中用谁
    if (!item) {
      for (const k of keywords) {
        const reg = db.RegExp({ regexp: k, options: 'i' })
        res = await db.collection('trash_data').where({ name: reg }).limit(1).get()
        if (res.data.length > 0) {
          item = res.data[0]
          break
        }
      }
    }

    if (!item) {
      return { code: 1, msg: '未在数据库中查询到该垃圾', data: null }
    }

    // 统一补充 color/bgColor/categoryName
    return { code: 0, msg: 'ok', data: decorate(item) }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
