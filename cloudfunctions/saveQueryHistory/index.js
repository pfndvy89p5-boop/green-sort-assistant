// 云函数：saveQueryHistory —— 保存查询历史
// 传入 { name, category, source }，source 为 'text' 或 'camera'
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { name, category, source } = event
  const { OPENID } = cloud.getWXContext()

  if (!name) {
    return { code: -1, msg: '缺少查询名称' }
  }

  try {
    await db.collection('query_history').add({
      data: {
        openid: OPENID,
        name,
        category: category || '',
        source: source || 'text',
        createTime: new Date()
      }
    })
    return { code: 0 }
  } catch (e) {
    return { code: -1, msg: e.message }
  }
}
