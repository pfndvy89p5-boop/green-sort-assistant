// 云函数：submitFeedback —— 提交用户反馈
// feedback 集合字段：_openid, content, contact, status(0未处理/1已处理), createTime
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { content, contact } = event
  const { OPENID } = cloud.getWXContext()

  // 参数校验：反馈内容必填
  const text = (content || '').trim()
  if (!text) {
    return { code: -1, msg: '反馈内容不能为空' }
  }

  try {
    await db.collection('feedback').add({
      data: {
        _openid: OPENID,                 // 用户标识
        content: text,                   // 反馈内容
        contact: (contact || '').trim(), // 联系方式（选填）
        status: 0,                       // 0 未处理
        createTime: Date.now()
      }
    })
    return { code: 0, msg: '反馈提交成功' }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
