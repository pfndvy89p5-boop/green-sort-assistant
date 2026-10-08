// ============================================================
// 云函数 HTTP 调用封装 + 登录鉴权工具
// 所有管理员云函数均需携带 token（24小时有效期）
// ============================================================
const API_BASE = (window.ADMIN_CONFIG && window.ADMIN_CONFIG.API_BASE) || ''

/**
 * 调用云函数
 * @param {string} name   云函数名
 * @param {object} data   业务参数
 * @returns {Promise<object>} 云函数返回 { code, msg, data }
 */
async function callFunction(name, data = {}) {
  const token = localStorage.getItem('admin_token') || ''
  const res = await fetch(API_BASE + '/' + name, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token // token 放在请求头，服务端鉴权
    },
    body: JSON.stringify(data)
  })

  let json = {}
  try { json = await res.json() } catch (e) { /* 响应非 JSON */ }

  // 兼容腾讯云 HTTP 访问可能的外层包裹
  if (json && json.data && typeof json.data === 'object' && 'code' in json.data) {
    return json.data
  }
  return json
}

/**
 * 检查登录态：无 token 则跳转登录页
 */
function checkAuth() {
  if (!localStorage.getItem('admin_token')) {
    location.href = 'login.html'
    return false
  }
  return true
}

/**
 * 统一处理云函数返回码：401 未授权 → 清除 token 并跳转登录
 * @returns {boolean} 是否已拦截
 */
function handleCode(r) {
  if (r && r.code === 401) {
    localStorage.removeItem('admin_token')
    location.href = 'login.html'
    return true
  }
  return false
}

/**
 * 退出登录
 */
function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_username')
  location.href = 'login.html'
}
