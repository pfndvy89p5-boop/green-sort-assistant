// 小程序内置管理员后台（轻量快速版）
const icons = require('../../utils/icons.js')

Page({
  data: {
    icons, safeTop: 20, token: '',
    tab: 'dashboard', // dashboard / users / history / points / goods / feedback
    loading: false,

    dashboard: {},
    users: [],
    history: { list: [], page: 1, totalPages: 1, source: '', keyword: '' },
    ranking: [],
    latestFlows: [],
    goods: { list: [], page: 1 },
    feedback: { list: [], total: 0 }
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    const navBarHeight = 44 // 导航栏内容高度
    // 胶囊位置（避开右上角胶囊按钮）
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    let safeRight = 0
    if (menu) safeRight = sys.windowWidth - menu.left + 10 // 胶囊右边的安全区
    this.setData({ 
      safeTop, 
      navBarHeight,
      navBarTotal: safeTop + navBarHeight,
      safeRight,
      token: getApp().globalData.adminToken || wx.getStorageSync('adminToken') || ''
    })
    this.loadDashboard()
  },

  // ========== 通用调用 ==========
  async callAdmin(name, data = {}) {
    if (!this.data.token) return { code: 401 }
    try {
      const res = await wx.cloud.callFunction({ name, data: { token: this.data.token, ...data } })
      if (res.result && res.result.code === 401) {
        wx.showModal({ title: '登录已过期', showCancel: false, success: () => {
          wx.removeStorageSync('adminToken')
          getApp().globalData.adminToken = null
          wx.navigateBack()
        }})
      }
      return res.result
    } catch (e) {
      return { code: -1, msg: e.message }
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab })
    this.refreshTab(tab)
  },

  refreshTab(tab) {
    const m = {
      dashboard: () => this.loadDashboard(),
      users: () => this.loadUsers(),
      history: () => this.loadHistory(),
      points: () => this.loadPoints(),
      goods: () => this.loadGoods(),
      feedback: () => this.loadFeedback()
    }
    if (m[tab]) m[tab]()
  },

  // ========== Dashboard ==========
  async loadDashboard() {
    const r = await this.callAdmin('adminGetDashboard')
    if (r && r.code === 0) this.setData({ dashboard: r.data })
  },

  // ========== Users ==========
  async loadUsers() {
    this.setData({ loading: true })
    const r = await this.callAdmin('adminGetUserList')
    this.setData({ loading: false })
    if (r && r.code === 0) this.setData({ users: r.data.list || [] })
  },

  // ========== History ==========
  async loadHistory() {
    this.setData({ loading: true })
    const r = await this.callAdmin('adminGetAllHistory', {
      page: this.data.history.page, pageSize: 15,
      source: this.data.history.source,
      name: this.data.history.keyword
    })
    this.setData({ loading: false })
    if (r && r.code === 0) this.setData({ history: { ...this.data.history, ...r.data } })
  },

  prevPage() { if (this.data.history.page > 1) { this.setData({ 'history.page': this.data.history.page - 1 }); this.loadHistory() } },
  nextPage() { if (this.data.history.page < this.data.history.totalPages) { this.setData({ 'history.page': this.data.history.page + 1 }); this.loadHistory() } },

  // ========== Points ==========
  async loadPoints() {
    this.setData({ loading: true })
    const r = await this.callAdmin('adminGetAllPoints')
    this.setData({ loading: false })
    if (r && r.code === 0) {
      this.setData({ ranking: r.data.ranking || [], latestFlows: r.data.latestFlows || [] })
    }
  },

  // ========== Goods ==========
  async loadGoods() {
    this.setData({ loading: true })
    const r = await this.callAdmin('adminGetGoodsList', { page: 1, pageSize: 20 })
    this.setData({ loading: false })
    if (r && r.code === 0) this.setData({ goods: { ...this.data.goods, list: r.data.list || [] } })
  },

  async quickDeleteGood(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({ title: '确认删除', content: `删除「${name}」？`, success: async (r) => {
      if (!r.confirm) return
      const res = await this.callAdmin('adminDeleteGoods', { id })
      if (res && res.code === 0) { wx.showToast({ title: '已删除' }); this.loadGoods() }
      else wx.showToast({ title: (res && res.msg) || '失败', icon: 'none' })
    }})
  },

  // ========== Feedback ==========
  async loadFeedback() {
    this.setData({ loading: true })
    const r = await this.callAdmin('adminGetFeedbackList', { page: 1, pageSize: 30 })
    this.setData({ loading: false })
    if (r && r.code === 0) this.setData({ feedback: { list: r.data.list || [], total: r.data.total || 0 } })
  },

  async resolveFeedback(e) {
    const id = e.currentTarget.dataset.id
    const res = await this.callAdmin('adminUpdateFeedbackStatus', { id, status: 1 })
    if (res && res.code === 0) { wx.showToast({ title: '已处理' }); this.loadFeedback() }
  },

  async deleteFeedback(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除反馈', success: async (r) => {
      if (!r.confirm) return
      const res = await this.callAdmin('adminDeleteFeedback', { id })
      if (res && res.code === 0) { wx.showToast({ title: '已删除' }); this.loadFeedback() }
    }})
  },

  logout() {
    wx.showModal({ title: '退出管理员登录', success: () => {
      wx.removeStorageSync('adminToken')
      getApp().globalData.adminToken = null
      wx.navigateBack()
    }})
  }
})
