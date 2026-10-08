// 收藏页(调云函数 getCollectList,支持删除收藏)
const icons = require('../../utils/icons.js')
Page({
  data: { safeTop: 20, icons: icons, collectList: [], loading: true },

  onLoad() {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    // 只在首次或从结果页返回时刷新（结果页可能新增/删除收藏）
    if (!this.data.collectList.length || this._needRefresh) {
      this.getCollectList()
      this._needRefresh = false
    }
  },

  // 读取云端收藏列表
  async getCollectList() {
    this.setData({ loading: true })
    try {
      let res = await wx.cloud.callFunction({ name: "getCollectList" })
      if (res.result && res.result.code === 0) {
        this.setData({ collectList: res.result.data || [], loading: false })
      } else {
        this.setData({ collectList: [], loading: false })
      }
    } catch (e) {
      this.setData({ collectList: [], loading: false })
    }
  },

  // 点击收藏 → 查询结果页（返回时刷新列表）
  goResult(e) {
    let name = e.currentTarget.dataset.name
    this._needRefresh = true
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(name)}` })
  },

  // 删除收藏(调云函数 toggleCollect 取消,加确认弹窗)
  async deleteCollect(e) {
    const item = e.currentTarget.dataset.item || {}
    const name = item.name || e.currentTarget.dataset.name
    if (!name) return
    // 确认弹窗,防止误删
    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '取消收藏',
        content: `确定要取消收藏「${name}」吗?`,
        confirmColor: '#FF006E',
        success: (res) => resolve(res.confirm)
      })
    })
    if (!confirmed) return
    wx.showLoading({ title: '处理中...', mask: true })
    try {
      const goods = {
        name,
        category: item.category || '',
        color: item.color || '',
        bgColor: item.bgColor || '',
        desc: item.desc || '',
        tip: item.tip || ''
      }
      const res = await wx.cloud.callFunction({ name: "toggleCollect", data: { goods } })
      wx.hideLoading()
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '已取消收藏', icon: 'none' })
        this.getCollectList()
      } else {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  }
})
