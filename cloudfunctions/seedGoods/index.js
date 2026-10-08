// 云函数：seedGoods —— 往 trash_data 集合批量插入 seed 数据（自动去重）
// 用法：部署后在云开发控制台手动调用一次即可
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const COLOR_MAP = { recycle: '#3A86FF', kitchen: '#06D6A0', danger: '#FF006E', other: '#495057' }

exports.main = async () => {
  // 1. 内嵌 seed 数据（避免外部文件依赖）
  const seed = require('./seed.json')

  // 2. 拉取现有所有 name，构建已存在集合
  const existing = new Set()
  const MAX = 1000
  let res = await db.collection('trash_data').limit(MAX).get()
  for (const item of res.data) existing.add(item.name)
  // 如果还有更多，循环翻页
  while (res.data.length === MAX) {
    res = await db.collection('trash_data').skip(existing.size).limit(MAX).get()
    for (const item of res.data) existing.add(item.name)
  }

  // 3. 遍历 seed，name 不存在的才插入
  let added = 0
  let skipped = 0
  const errors = []
  for (const item of seed) {
    if (existing.has(item.name)) {
      skipped++
      continue
    }
    try {
      await db.collection('trash_data').add({
        data: {
          name: item.name,
          category: item.category,
          color: item.color || COLOR_MAP[item.category],
          desc: item.desc || '',
          tip: item.tip || '',
          createTime: Date.now()
        }
      })
      existing.add(item.name) // 防同批重复
      added++
      // 日志（每 20 条打一条）
      if (added % 20 === 0) console.log(`[seedGoods] 已插入 ${added}`)
    } catch (e) {
      errors.push(`${item.name}: ${e.message}`)
    }
  }

  return {
    code: 0,
    msg: 'ok',
    total: seed.length,
    added,
    skipped,
    errors
  }
}
