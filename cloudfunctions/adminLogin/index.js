// 云函数：adminLogin —— 管理员登录，生成 24 小时有效 token
// 账号密码从环境变量读取：ADMIN_USER / ADMIN_PASS
const cloud = require('wx-server-sdk')
const { sign, params } = require('./auth')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 管理员账号配置（从环境变量读取，禁止硬编码）
const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || ''

exports.main = async (event) => {
  const { username, password } = params(event)

  if (!ADMIN_PASS) {
    return { code: -1, msg: '服务端未配置管理员密码', data: null }
  }

  // 校验账号密码
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return { code: -1, msg: '账号或密码错误', data: null }
  }

  // 生成 24 小时 token
  const token = sign(username)
  return {
    code: 0,
    msg: '登录成功',
    data: {
      token,
      username,
      expiresIn: '24h',
      loginTime: new Date().toISOString()
    }
  }
}
