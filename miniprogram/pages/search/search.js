// 文字查询页 —— 支持输入联想 + 模糊搜索
const icons = require('../../utils/icons.js')
Page({
  data: {
    safeTop: 20,
    icons: icons,
    key: "",
    autoFocus: true,
    focused: false,
    historyList: [],
    quickList: ["矿泉水瓶", "香蕉皮", "废电池", "纸巾", "易拉罐", "剩饭剩菜"],
    hotList: [],
    suggestList: [],
    showSuggest: false
  },

  _timer: null,

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    let safeRight = 64
    if (menu) safeRight = Math.ceil((sys.windowWidth - menu.left) + 10)
    this.setData({ safeTop, safeRight })
  },

  onShow() {
    let list = wx.getStorageSync('searchHistory') || []
    this.setData({ historyList: list })
    this.fetchHotList()
  },

  async fetchHotList() {
    try {
      const res = await wx.cloud.callFunction({ name: "searchTrash", data: { mode: "hot" } })
      if (res.result && res.result.code === 0 && res.result.list && res.result.list.length > 0) {
        this.setData({ hotList: res.result.list })
      }
    } catch (e) {
      // 查失败就用 quickList 兜底
      this.setData({
        hotList: this.data.quickList.slice(0, 6).map(n => ({ name: n, trend: '↑' }))
      })
    }
  },

  goBack() { wx.navigateBack({ delta: 1 }) },

  onFocus() { this.setData({ focused: true }) },
  onBlur() { this.setData({ focused: false }) },

  inputKey(e) {
    const val = e.detail.value
    this.setData({ key: val })
    // 防抖联想
    if (this._timer) clearTimeout(this._timer)
    if (!val.trim()) {
      this.setData({ suggestList: [], showSuggest: false })
      return
    }
    this._timer = setTimeout(() => this.fetchSuggest(val.trim()), 300)
  },

  async fetchSuggest(key) {
    try {
      let res = await wx.cloud.callFunction({
        name: "searchTrash",
        data: { name: key, mode: "list" }
      })
      if (res.result && res.result.code === 0) {
        const list = res.result.list || []
        this.setData({ suggestList: list, showSuggest: list.length > 0 })
      } else {
        this.setData({ suggestList: [], showSuggest: false })
      }
    } catch (e) {
      this.setData({ suggestList: [], showSuggest: false })
    }
  },

  clearKey() {
    this.setData({ key: "", suggestList: [], showSuggest: false })
  },

  // 点击联想项 → 直接跳结果页
  tapSuggest(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ showSuggest: false })
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(name)}` })
  },

  // 点击空白隐藏联想
  hideSuggest() {
    this.setData({ showSuggest: false })
  },

  doSearch() {
    const key = (this.data.key || "").trim()
    if (!key) {
      wx.showToast({ title: "请输入垃圾名称", icon: "none" })
      return
    }
    this.setData({ showSuggest: false })
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(key)}` })
  },

  searchHistory(e) {
    let name = e.currentTarget.dataset.name
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(name)}` })
  },

  goCategory(e) {
    const cat = e.currentTarget.dataset.cat
    wx.switchTab({ url: '/pages/knowledge/knowledge' })
    // 给知识库页面传分类筛选参数
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page && page.filterByCategory) {
      setTimeout(() => page.filterByCategory(cat), 200)
    }
  },

  clearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定要清空全部搜索历史吗?',
      confirmColor: '#FF006E',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ historyList: [] })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
