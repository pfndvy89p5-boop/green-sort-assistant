// 个人中心页 —— 用户头像昵称 + 积分 + 签到 + 数据统计 + 历史
const icons = require('../../utils/icons.js')

Page({
  data: {
    safeTop: 20,
    icons: icons,
    points: 0,
    historyList: [],
    pointsLoaded: false,
    userInfo: { avatarUrl: '', nickName: '' },
    _cloudAvatarFileID: '',

    // 签到
    checkInStatus: { todaySigned: false, streak: 0, calendar: [] },
    checkInLoading: false,

    // 数据统计
    stats: { total: 0, camera: 0, kg: 0, favorite: 0 }
  },

  onLoad() {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
    const cached = getApp().globalData.userProfile
    if (cached) {
      this.setData({ userInfo: { avatarUrl: cached.avatarUrl || '', nickName: cached.nickName || '' } })
    } else {
      const local = wx.getStorageSync('userInfo') || {}
      if (local.avatarUrl || local.nickName) {
        this.setData({ userInfo: local })
      } else {
        this.fetchUserProfile()
      }
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.loadPoints()
    this.loadHistory()
    this.loadCheckInStatus()
    this.loadStats()
  },

  async fetchUserProfile() {
    try {
      const res = await wx.cloud.callFunction({ name: "getUserProfile" })
      if (res.result && res.result.code === 0 && res.result.data) {
        const info = res.result.data
        this.setData({ userInfo: { avatarUrl: info.avatarUrl || '', nickName: info.nickName || '' } })
        wx.setStorageSync('userInfo', this.data.userInfo)
      }
    } catch (e) {}
  },

  // ========== 用户头像昵称 ==========
  async onChooseAvatar(e) {
    const tempUrl = e.detail.avatarUrl
    if (!tempUrl) return
    this.setData({ 'userInfo.avatarUrl': tempUrl })
    wx.setStorageSync('userInfo', this.data.userInfo)
    try {
      const cloudPath = `avatars/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: tempUrl })
      this.setData({ _cloudAvatarFileID: up.fileID })
      await wx.cloud.callFunction({
        name: "loginOrRegister",
        data: { avatarUrl: up.fileID, nickName: this.data.userInfo.nickName }
      })
    } catch (e) {}
  },

  onNickNameInput(e) {
    const nickName = (e.detail.value || '').trim()
    this.setData({ 'userInfo.nickName': nickName })
    wx.setStorageSync('userInfo', this.data.userInfo)
    if (nickName) {
      wx.cloud.callFunction({
        name: "loginOrRegister",
        data: { avatarUrl: this.data._cloudAvatarFileID || this.data.userInfo.avatarUrl, nickName }
      }).catch(() => {})
    }
  },

  // ========== 积分 & 历史 ==========
  async loadPoints() {
    try {
      const res = await wx.cloud.callFunction({ name: "getPoints" })
      if (res.result && res.result.code === 0) {
        this.setData({ points: res.result.total || 0, pointsLoaded: true })
      }
    } catch (e) { this.setData({ pointsLoaded: false }) }
  },

  async loadHistory() {
    try {
      const res = await wx.cloud.callFunction({ name: "getQueryHistory" })
      if (res.result && res.result.code === 0) {
        this.setData({ historyList: (res.result.data || []).slice(0, 5) })
      }
    } catch (e) { this.setData({ historyList: [] }) }
  },

  // ========== 签到 ==========
  async loadCheckInStatus() {
    try {
      const res = await wx.cloud.callFunction({ name: "getCheckInStatus" })
      if (res.result && res.result.code === 0) {
        this.setData({ checkInStatus: res.result })
      }
    } catch (e) {}
  },

  async doCheckIn() {
    if (this.data.checkInLoading || this.data.checkInStatus.todaySigned) return
    this.setData({ checkInLoading: true })
    try {
      const res = await wx.cloud.callFunction({ name: "checkIn" })
      if (res.result && res.result.code === 0) {
        const r = res.result
        let msg = `签到成功 +${r.reward} 分`
        if (r.bonus > 0) msg += `（含连续奖励 +${r.bonus}）`
        wx.showToast({ title: msg, icon: 'none' })
        // 刷新状态 + 积分
        await this.loadCheckInStatus()
        await this.loadPoints()
      } else if (res.result && res.result.code === 1) {
        wx.showToast({ title: '今天已签到', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '签到失败', icon: 'none' })
    } finally {
      this.setData({ checkInLoading: false })
    }
  },

  // ========== 数据统计 ==========
  async loadStats() {
    try {
      const res = await wx.cloud.callFunction({ name: "getQueryHistory" })
      const history = (res.result && res.result.data) || []
      const total = history.length
      const camera = history.filter(h => h.source === 'camera').length
      const kg = (total * 0.05).toFixed(1)
      const favRes = await wx.cloud.callFunction({ name: "getCollectList" })
      const favorite = (favRes.result && favRes.result.code === 0) ? (favRes.result.data || []).length : 0
      this.setData({ stats: { total, camera, kg, favorite } })
    } catch (e) {}
  },

  // ========== 管理员入口（藏彩蛋：点积分徽章 5 次） ==========
  _pBadgeClicks: 0,
  _pBadgeTimer: null,
  tapPointsBadge() {
    if (getApp().globalData.adminToken) {
      // 已登录 → 直接跳管理员页
      wx.navigateTo({ url: '/pages/admin/admin' })
      return
    }
    this._pBadgeClicks++
    clearTimeout(this._pBadgeTimer)
    this._pBadgeTimer = setTimeout(() => { this._pBadgeClicks = 0 }, 1500)
    if (this._pBadgeClicks >= 5) {
      this._pBadgeClicks = 0
      this.showAdminLogin()
    }
  },

  showAdminLogin() {
    wx.showModal({
      title: '🔒 管理员登录',
      editable: true,
      placeholderText: '输入管理员密码',
      success: async (r) => {
        if (!r.confirm) return
        const password = r.content
        if (!password) return
        wx.showLoading({ title: '验证中...' })
        try {
          const res = await wx.cloud.callFunction({
            name: 'adminLogin',
            data: { username: 'admin', password }
          })
          wx.hideLoading()
          if (res.result && res.result.code === 0) {
            const token = res.result.data.token
            getApp().globalData.adminToken = token
            wx.setStorageSync('adminToken', token)
            wx.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => wx.navigateTo({ url: '/pages/admin/admin' }), 500)
          } else {
            wx.showToast({ title: '密码错误', icon: 'none' })
          }
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    })
  },

  tapHistory(e) {
    const name = e.currentTarget.dataset.name
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(name)}` })
  },
  goCollect() { wx.switchTab({ url: "/pages/collect/collect" }) },
  goSetting() { wx.navigateTo({ url: "/pages/settings/settings" }) },
  goFeedback() { wx.navigateTo({ url: "/pages/settings/settings?openFeedback=1" }) }
})
