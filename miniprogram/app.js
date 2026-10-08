// 绿分类助手 —— 全局应用逻辑
// 初始化云开发 + 全局状态栏高度 + 预拉用户资料
App({
  globalData: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navBarTotal: 64,
    userProfile: null,
    adminToken: null // 管理员登录 token
  },

  onLaunch() {
    // 恢复管理员登录态
    const t = wx.getStorageSync('adminToken')
    if (t) this.globalData.adminToken = t

    // 云开发
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true })
    }
    // 状态栏高度
    try {
      const sys = wx.getSystemInfoSync()
      const sbh = sys.statusBarHeight || 20
      const nb = 44
      this.globalData.statusBarHeight = sbh
      this.globalData.navBarHeight = nb
      this.globalData.navBarTotal = sbh + nb
    } catch (e) {}

    // 预拉用户资料（OPENID 自动隔离）
    this.prefetchUserProfile()
  },

  async prefetchUserProfile() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getUserProfile' })
      if (res.result && res.result.code === 0 && res.result.data) {
        this.globalData.userProfile = res.result.data
        wx.setStorageSync('userInfo', {
          avatarUrl: res.result.data.avatarUrl || '',
          nickName: res.result.data.nickName || ''
        })
      }
    } catch (e) {}
  }
})
