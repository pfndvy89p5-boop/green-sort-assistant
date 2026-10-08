// 云函数：getDailyQuestion —— 返回随机一题（每天同一 openid 同一天同一题）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

// 内置 20 道垃圾分类题（避免 question 集合为空时无法出题）
const BUILTIN = [
  { q: '外卖餐盒属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '严重油污的餐盒不可回收，属于其他垃圾' },
  { q: '废电池应该投入什么颜色的桶？', options: ['蓝色', '绿色', '红色', '灰色'], answer: 2, explain: '废电池是有害垃圾，投入红色有害桶' },
  { q: '香蕉皮属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 1, explain: '果皮易腐烂，属于厨余垃圾' },
  { q: '干净的旧衣服属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 0, explain: '干净旧衣物可回收或捐赠' },
  { q: '大骨头属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '大骨头难降解，属于其他垃圾' },
  { q: '过期药品属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 2, explain: '过期药品是有害垃圾' },
  { q: '喝完的塑料矿泉水瓶应？', options: ['直接投厨余桶', '压扁投可回收', '投有害桶', '随便扔'], answer: 1, explain: '塑料瓶属于可回收物，建议倒空压扁' },
  { q: '用过的纸尿裤属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '纸尿裤属于其他垃圾，卷好后投放' },
  { q: '荧光灯管属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 2, explain: '含汞灯管是有害垃圾，小心包装' },
  { q: '茶叶渣属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 1, explain: '茶叶渣可堆肥，属于厨余垃圾' },
  { q: '干净的快递纸箱应？', options: ['投其他桶', '拆开压扁投可回收', '投厨余桶', '烧掉'], answer: 1, explain: '纸箱是可回收物，拆开压扁投放' },
  { q: '用过的口罩属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '日常口罩属于其他垃圾，用袋装好投放' },
  { q: '水银温度计属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 2, explain: '含汞物品是有害垃圾' },
  { q: '甘蔗渣属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 1, explain: '甘蔗渣是植物纤维，属于厨余垃圾' },
  { q: '宠物粪便属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '宠物粪便属于其他垃圾，用袋扎紧投放' },
  { q: '废油漆桶属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 2, explain: '油漆残留是有害垃圾' },
  { q: '猫砂属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '猫砂属于其他垃圾，用袋装好投放' },
  { q: '玉米棒芯属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 1, explain: '玉米棒芯可堆肥，属于厨余垃圾' },
  { q: '一次性筷子属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 3, explain: '一次性筷子属于其他垃圾' },
  { q: '过期食用油属于什么垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 1, explain: '过期食用油属于厨余垃圾，密封后投放' }
]

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const today = ymd(new Date())

  try {
    // 1. 拉取 question 集合（若为空则用内置题）
    let all = []
    try {
      const res = await db.collection('question').limit(50).get()
      all = res.data.map(r => ({
        q: r.q || r.question,
        options: r.options,
        answer: typeof r.answer === 'number' ? r.answer : (r.answerIndex || 0),
        explain: r.explain || ''
      }))
    } catch (e) {}
    if (all.length === 0) all = BUILTIN

    // 2. 基于日期做稳定 hash → 今天出的题固定
    const hash = [...today + (OPENID || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 0)
    const q = all[hash % all.length]

    return { code: 0, data: q, total: all.length }
  } catch (e) {
    return { code: -1, msg: e.message }
  }
}
