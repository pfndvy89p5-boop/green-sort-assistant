// 云函数：loginOrRegister —— 用户登录/注册（upsert user_profile）
// 小程序新版不允许 wx.getUserInfo，改用头像昵称填写组件，存云端留 openid 关联
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1, msg: '缺少 openid' }

  const avatarUrl = (event.avatarUrl || '').trim()
  const nickName = (event.nickName || '').trim()

  try {
    // 1. 查是否已存在
    let res = await db.collection('user_profile').where({ _openid: OPENID }).limit(1).get()
    const now = Date.now()

    if (res.data.length > 0) {
      // 2. 已存在 → 更新（只覆盖传入的字段）
      const id = res.data[0]._id
      const update = { updateTime: now }
      if (avatarUrl) update.avatarUrl = avatarUrl
      if (nickName) update.nickName = nickName
      await db.collection('user_profile').doc(id).update({ data: update })
      return { code: 0, msg: 'ok', isNew: false, data: { ...res.data[0], ...update } }
    } else {
      // 3. 不存在 → 新建
      const addRes = await db.collection('user_profile').add({
        data: {
          _openid: OPENID,
          avatarUrl: avatarUrl || '',
          nickName: nickName || '',
          createTime: now,
          updateTime: now
        }
      })
      return {
        code: 0, msg: 'ok', isNew: true,
        data: { _id: addRes._id, _openid: OPENID, avatarUrl, nickName, createTime: now, updateTime: now }
      }
    }
  } catch (e) {
    return { code: -2, msg: e.message }
  }
}
