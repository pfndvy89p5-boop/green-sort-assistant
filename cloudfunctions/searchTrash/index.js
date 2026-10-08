// 云函数：searchTrash —— 关键词查询接口
// 支持三种模式：
//   1. mode='list' → 模糊匹配返回候选列表（搜索联想用）
//   2. mode='hot'  → 统计 query_history 真实热门物品（过滤掉库里没有的）
//   3. 默认 → 精确匹配返回单条（兼容旧逻辑）
// 所有匹配均支持关键词后缀拆分（鞋子→鞋 命中旧鞋/运动鞋）
const cloud = require('wx-server-sdk')
const { decorate } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

function stripSuffix(s) {
  return s.replace(/[子儿头式物品具]$/, '')
}

function buildKeywords(kw) {
  const arr = [kw]
  const stripped = stripSuffix(kw)
  if (stripped && stripped !== kw && stripped.length >= 1) arr.push(stripped)
  return arr
}

// 从 trash_data 里随机取 10 个真实物品（fallback 用）
async function fallBackHot(excludeNames = []) {
  const res = await db.collection('trash_data').limit(20).get()
  const filtered = res.data.filter(x => !excludeNames.includes(x.name))
  // shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[filtered[i], filtered[j]] = [filtered[j], filtered[i]]
  }
  return filtered.slice(0, 10).map(x => ({
    name: x.name,
    count: 0,
    itemEmoji: x.itemEmoji || x.catEmoji
  }))
}

function pickTrend(count) {
  if (count >= 10) return '🔥'
  if (count >= 5) return '↑'
  if (count >= 3) return '→'
  return '↑'
}

exports.main = async (event) => {
  let { name, mode } = event

  // ---- mode='hot': 统计 query_history 热门物品 ----
  if (mode === 'hot') {
    try {
      // Step 1: aggregate 统计 query_history 里 name 出现次数
      const agg = await db.collection('query_history').aggregate()
        .match({ name: db.command.exists(true) })
        .group({ _id: '$name', count: $.sum(1) })
        .sort({ count: -1 })
        .limit(20)
        .end()
      const candidates = agg.list || []
      if (candidates.length === 0) return { code: 0, list: await fallBackHot() }

      // Step 2: 过滤掉 trash_data 里不存在的
      let real = []
      for (const c of candidates) {
        if (!c._id) continue
        const reg = db.RegExp({ regexp: c._id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: 'i' })
        const hit = await db.collection('trash_data').where({ name: reg }).limit(1).get()
        if (hit.data.length > 0) {
          real.push({ name: hit.data[0].name, count: c.count, itemEmoji: hit.data[0].itemEmoji || hit.data[0].catEmoji })
        }
        if (real.length >= 8) break
      }
      // Step 3: 不够 8 个 → 用真实物品补齐
      if (real.length < 8) {
        const more = await fallBackHot(real.map(x => x.name))
        for (const m of more) {
          if (!real.find(r => r.name === m.name)) real.push(m)
          if (real.length >= 8) break
        }
      }
      return { code: 0, list: real.slice(0, 8).map(x => ({ name: x.name, trend: pickTrend(x.count) })) }
    } catch (e) {
      return { code: 0, list: await fallBackHot().then(arr => arr.map(x => ({ name: x.name, trend: '↑' }))) }
    }
  }

  // ---- 原有逻辑 ----
  if (!name) return { data: null }
  const kw = name.trim()
  if (!kw) return { data: null }

  try {
    // 列表模式：输入联想，遍历所有关键词做模糊匹配，去重合并
    if (mode === 'list') {
      const seen = new Set()
      let all = []
      for (const k of buildKeywords(kw)) {
        const reg = db.RegExp({ regexp: k, options: 'i' })
        let res = await db.collection('trash_data').where({ name: reg }).limit(10).get()
        for (const item of res.data) {
          if (!seen.has(item._id)) {
            seen.add(item._id)
            let d = decorate(item)
            all.push({ name: item.name, categoryName: d.categoryName, itemEmoji: d.itemEmoji || d.catEmoji, color: d.color })
          }
        }
      }
      return { code: 0, list: all.slice(0, 10) }
    }

    // 默认模式：精确匹配优先 → 后缀拆分模糊（兼容旧调用方）
    let res = await db.collection('trash_data').where({ name: kw }).limit(1).get()
    if (res.data.length === 0) {
      for (const k of buildKeywords(kw)) {
        const reg = db.RegExp({ regexp: k, options: 'i' })
        res = await db.collection('trash_data').where({ name: reg }).limit(1).get()
        if (res.data.length > 0) break
      }
    }
    if (res.data.length === 0) return { data: null }
    return { data: decorate(res.data[0]) }
  } catch (e) {
    return { data: null }
  }
}
