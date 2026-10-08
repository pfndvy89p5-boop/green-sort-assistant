// AI 识别候选列表页 —— 一次拍照展示 top5 候选,点击查看分类详情
const icons = require('../../utils/icons.js')

Page({
  data: {
    safeTop: 20,
    icons: icons,
    list: []
  },

  onLoad() {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
    const list = wx.getStorageSync('aiCandidateList') || []
    this.setData({ list })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  openDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.name) return
    // 写入 aiResult,结果页走 fromAi 分支直接展示(未命中库的候选也能看)
    wx.setStorageSync('aiResult', item)
    wx.navigateTo({ url: `/pages/result/result?fromAi=1&name=${encodeURIComponent(item.name)}` })
  }
})
