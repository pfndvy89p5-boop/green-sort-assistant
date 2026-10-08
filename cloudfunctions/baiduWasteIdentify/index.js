// 云函数：baiduWasteIdentify —— 百度AI垃圾分类识别
// 业务逻辑（标准流程）：
//   1. 从云存储下载用户上传的图片
//   2. 获取百度AI access_token
//   3. 调用「通用物体识别」接口识别物体
//   4. 【本地数据库优先】在 trash_data 集合中匹配识别结果
//   5. 数据库命中 → 返回数据库详情；未命中 → 返回AI结果（标注"结果仅供参考"）
// 说明：百度API Key 通过 config.js 变量引用，不硬编码。
// 统一返回 color / bgColor / categoryName 字段。
const cloud = require('wx-server-sdk')
const https = require('https')
const config = require('./config')   // 百度AI 配置（变量引用）
const { CATEGORY_PALETTE, CAT_EMOJI, decorate } = require('./category') // 统一分类配色

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 通过关键词简单判断分类（AI 结果兜底用）
function guessCategory(name) {
  const kw = (name || '').toLowerCase()
  const rules = [
    { cat: '可回收物', words: ['瓶', '纸', '罐', '盒', '书', '金属', '玻璃', '塑料', '衣', '鞋', '铁', '铝'] },
    { cat: '厨余垃圾', words: ['饭', '菜', '皮', '果', '蛋', '骨', '虾', '渣', '叶'] },
    { cat: '有害垃圾', words: ['电池', '药', '灯管', '灯', '油漆', '墨盒', '温度计', '杀虫'] }
  ]
  for (const rule of rules) {
    if (rule.words.some(w => kw.includes(w))) return rule.cat
  }
  return '其他垃圾'
}

// 去掉常见名词后缀，用于模糊匹配兜底
function stripSuffix(s) {
  return s.replace(/[子儿头式物品具]$/, '')
}

// 尝试在本地库匹配：先精确 → 再去后缀模糊
async function matchLocalDb(name) {
  // 1. 精确匹配
  let res = await db.collection('trash_data').where({ name }).limit(1).get()
  if (res.data.length > 0) return res.data[0]

  // 2. 去后缀模糊匹配
  const stripped = stripSuffix(name)
  if (stripped && stripped !== name && stripped.length >= 1) {
    const reg = db.RegExp({ regexp: stripped, options: 'i' })
    res = await db.collection('trash_data').where({ name: reg }).limit(1).get()
    if (res.data.length > 0) return res.data[0]
  }
  return null
}

// 获取百度 access_token
function getToken() {
  return new Promise((resolve, reject) => {
    const url = `${config.TOKEN_URL}?grant_type=client_credentials&client_id=${config.API_KEY}&client_secret=${config.SECRET_KEY}`
    https.get(url, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data).access_token) }
        catch (e) { reject(new Error('获取token失败')) }
      })
    }).on('error', reject)
  })
}

// 调用百度通用物体识别
function detectObject(buffer) {
  return new Promise((resolve, reject) => {
    getToken().then(token => {
      const base64 = buffer.toString('base64')
      const postData = `image=${encodeURIComponent(base64)}`
      const postBuf = Buffer.from(postData, 'utf-8')
      const options = {
        method: 'POST',
        hostname: 'aip.baidubce.com',
        path: `/rest/2.0/image-classify/v2/advanced_general?access_token=${token}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postBuf.length
        }
      }
      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch (e) { reject(new Error('解析AI响应失败')) }
        })
      })
      req.on('error', reject)
      req.write(postBuf)
      req.end()
    }).catch(reject)
  })
}

exports.main = async (event) => {
  const { fileID } = event
  if (!fileID) {
    return { code: -1, msg: '缺少图片参数', data: null }
  }

  try {
    // 1. 从云存储下载图片
    const fileRes = await cloud.downloadFile({ fileID })
    const buffer = fileRes.fileContent
    if (!buffer || buffer.length === 0) {
      return { code: -1, msg: '图片下载失败', data: null }
    }

    // 2-3. 调用百度AI识别
    const aiResult = await detectObject(buffer)
    if (aiResult.error_code) {
      return { code: -1, msg: `AI识别失败:${aiResult.error_msg || ''}`, data: null }
    }

    // 取置信度排序的候选列表:过滤过低置信度,按名称去重,最多 5 个
    const resultList = (aiResult.result || [])
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .filter(r => (r.score || 0) >= 0.02)
    const seen = new Set()
    const candidates = []
    for (const r of resultList) {
      if (!r.keyword || seen.has(r.keyword)) continue
      seen.add(r.keyword)
      candidates.push({ name: r.keyword, score: Math.round((r.score || 0) * 100) })
      if (candidates.length >= 5) break
    }
    if (!candidates.length) {
      return { code: -1, msg: '未能识别出物体', data: null }
    }

    // 4. 每个候选优先匹配本地数据库（精确→后缀拆分模糊），未命中走 AI 兜底
    const list = await Promise.all(candidates.map(async (c) => {
      try {
        const localItem = await matchLocalDb(c.name)
        if (localItem) {
          const item = decorate(localItem)
          return Object.assign({}, item, { aiScore: c.score, fromDb: true })
        }
      } catch (e) { /* 查库失败走兜底 */ }
      const category = guessCategory(c.name)
      const p = CATEGORY_PALETTE[category] || CATEGORY_PALETTE['其他垃圾']
      return {
        name: c.name,
        category,
        categoryName: category,
        color: p.color,
        bgColor: p.bgColor,
        catEmoji: CAT_EMOJI[category] || '🗑️',
        desc: `AI识别：「${c.name}」，识别置信度 ${c.score}%`,
        tip: '请以当地垃圾分类标准为准，结果仅供参考',
        aiScore: c.score,
        fromDb: false
      }
    }))

    return { code: 0, msg: 'ok', fromAi: true, data: list[0], list }
  } catch (e) {
    return { code: -2, msg: e.message, data: null }
  }
}
