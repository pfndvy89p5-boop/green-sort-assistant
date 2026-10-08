// 首页（部署手册定稿）
const icons = require('../../utils/icons.js')

Page({
  data: {
    safeTop: 20,
    icons: icons,
    categories: [
      { name: "可回收物", cat: "recycle", icon: "recycle" },
      { name: "厨余垃圾", cat: "kitchen", icon: "apple" },
      { name: "有害垃圾", cat: "danger",  icon: "skull" },
      { name: "其他垃圾", cat: "other",   icon: "trash" }
    ],
    recentList: []
  },

  onLoad() {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
    this.getRecentList()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.getRecentList()
  },

  getRecentList() {
    let list = wx.getStorageSync('searchHistory') || []
    // 只在数据变化时 setData,避免无意义重渲染
    if (this.data.recentList.length !== list.length ||
        JSON.stringify(this.data.recentList) !== JSON.stringify(list)) {
      this.setData({ recentList: list })
    }
  },

  // ---------- 原有入口 ----------
  goCamera() { wx.navigateTo({ url: "/pages/camera/camera" }) },
  goText()   { wx.navigateTo({ url: "/pages/search/search" }) },

  goCatList(e) {
    let cat = e.currentTarget.dataset.cat
    wx.setStorageSync('preCat', cat)
    wx.switchTab({ url: "/pages/knowledge/knowledge" })
  },

  searchHistory(e) {
    let name = e.currentTarget.dataset.name
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(name)}` })
  }
})
