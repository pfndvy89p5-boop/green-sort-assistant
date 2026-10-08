// 查询结果页（部署手册定稿）
//   - 文字查询 → 调云函数 searchTrash 按名称查询 trash_data
//   - AI 识别结果 → 由 camera 页通过 storage 传入,直接展示
//   - 收藏状态 → 调云函数 toggleCollect / getCollectList
const icons = require('../../utils/icons.js')

Page({
  data: {
    safeTop: 20,
    icons: icons,
    name: "",
    trashInfo: {},
    isCollect: false,
    isAi: false,
    cameraFileID: "",
    loading: false
  },

  onLoad(options) {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
    // AI 识别结果分支:camera 页上传图片调 baiduWasteIdentify 后,把结果写入 storage 跳过来
    if (options.fromAi === '1') {
      const aiResult = wx.getStorageSync('aiResult')
      const cameraFileID = wx.getStorageSync('cameraFileID') || ''
      if (aiResult) {
        wx.removeStorageSync('aiResult')
        if (cameraFileID) wx.removeStorageSync('cameraFileID')
        this.setData({
          name: aiResult.name,
          trashInfo: aiResult,
          isAi: !!(aiResult.aiScore || aiResult.fromAi),
          cameraFileID
        })
        this.saveHistory(aiResult.name)
        this.checkCollect(aiResult.name)
        this.saveCloudHistory(aiResult.name, aiResult.category || '', 'camera')
        this.addUserPoints('identify')
        return
      }
    }

    // 文字查询分支
    if (options.name) {
      const name = decodeURIComponent(options.name)
      this.setData({ name, loading: true })
      this.searchResult(name)
    }
  },

  goBack() { wx.navigateBack({ delta: 1 }) },

  async searchResult(name) {
    try {
      let res = await wx.cloud.callFunction({ name: "getTrashByName", data: { name } })
      if (res.result && res.result.code === 0 && res.result.data) {
        this.setData({ trashInfo: res.result.data, loading: false })
        this.saveHistory(name)
        this.checkCollect(name)
        this.saveCloudHistory(name, res.result.data.category || '', 'text')
        this.addUserPoints('query')
      } else {
        this.setData({ trashInfo: {}, loading: false })
      }
    } catch (e) {
      this.setData({ trashInfo: {}, loading: false })
      wx.showToast({ title: '查询失败,请重试', icon: 'none' })
    }
  },

  saveHistory(name) {
    let list = wx.getStorageSync('searchHistory') || []
    if (!list.includes(name)) {
      list.unshift(name)
      wx.setStorageSync('searchHistory', list.slice(0, 10))
    }
  },

  async checkCollect(name) {
    try {
      let res = await wx.cloud.callFunction({ name: "getCollectList" })
      if (res.result && res.result.code === 0) {
        const list = res.result.data || []
        this.setData({ isCollect: list.some(item => item.name === name) })
      }
    } catch (e) {
      this.setData({ isCollect: false })
    }
  },

  async toggleCollect() {
    const info = this.data.trashInfo
    if (!info || !info.name) return
    if (this._toggling) return
    this._toggling = true
    wx.showLoading({ title: '处理中...', mask: true })
    try {
      const goods = {
        goodsId: info._id || '',
        name: info.name,
        category: info.category || '',
        color: info.color || '',
        bgColor: info.bgColor || '',
        desc: info.desc || '',
        tip: info.tip || ''
      }
      const res = await wx.cloud.callFunction({ name: "toggleCollect", data: { goods } })
      wx.hideLoading()
      if (res.result && res.result.code === 0) {
        const collected = res.result.collected
        this.setData({ isCollect: collected })
        wx.showToast({ title: collected ? '已收藏' : '已取消收藏', icon: 'none' })
        if (collected) this.addUserPoints('collect')
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '操作失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
    this._toggling = false
  },

  // 保存查询历史到云端（按 openid 隔离）
  saveCloudHistory(name, category, source) {
    wx.cloud.callFunction({
      name: "saveQueryHistory",
      data: { name, category, source }
    }).catch(() => {})
  },

  // 加积分（静默，不弹提示）
  addUserPoints(action) {
    wx.cloud.callFunction({
      name: "addPoints",
      data: { action }
    }).catch(() => {})
  },

  // ========== 分享海报 ==========
  onShareAppMessage() {
    const info = this.data.trashInfo
    return {
      title: `「${info.name}」原来是${info.categoryName}！来绿分类助手测一测`,
      path: `/pages/result/result?name=${encodeURIComponent(info.name || '')}`
    }
  },

  onShareTimeline() {
    const info = this.data.trashInfo
    return {
      title: `${info.name} → ${info.categoryName} | 绿分类助手`,
      query: `name=${encodeURIComponent(info.name || '')}`
    }
  },

  async generatePoster() {
    const info = this.data.trashInfo
    if (!info || !info.name) return
    wx.showLoading({ title: '生成中...' })
    const canvas = wx.createOffscreenCanvas({ type: '2d', width: 600, height: 800 })
    const ctx = canvas.getContext('2d')

    // 背景:白色 + 粗黑边
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, 600, 800)
    ctx.lineWidth = 6
    ctx.strokeStyle = '#000000'
    ctx.strokeRect(3, 3, 594, 794)

    // 顶部色块
    ctx.fillStyle = info.color || '#3A86FF'
    ctx.fillRect(0, 0, 600, 180)

    // 分类大类 emoji + 名称
    ctx.font = 'bold 90px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText(info.catEmoji || '🗑️', 300, 110)

    ctx.font = 'bold 48px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(info.categoryName || '垃圾分类', 300, 165)

    // 物品名
    ctx.font = 'bold 56px sans-serif'
    ctx.fillStyle = '#000000'
    ctx.fillText(info.name || '', 300, 280)

    // 分隔线
    ctx.fillStyle = '#000000'
    ctx.fillRect(80, 310, 440, 4)

    // 说明
    ctx.font = '26px sans-serif'
    ctx.fillStyle = '#333333'
    ctx.textAlign = 'left'
    this._wrapText(ctx, info.desc || '正确分类，从我做起！', 60, 360, 480, 36)
    this._wrapText(ctx, info.tip || '', 60, 500, 480, 36)

    // 底部:应用名 + slogan
    ctx.fillStyle = '#CCFF00'
    ctx.fillRect(0, 700, 600, 100)
    ctx.font = 'bold 36px sans-serif'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.fillText('🌱 绿分类助手', 300, 750)

    // 导出
    try {
      const filePath = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas,
          x: 0, y: 0, width: 600, height: 800,
          destWidth: 1200, destHeight: 1600,
          success: r => resolve(r.tempFilePath),
          fail: reject
        })
      })
      wx.hideLoading()
      wx.previewImage({ urls: [filePath] })
      wx.showModal({
        title: '海报已生成',
        content: '长按图片可保存，或直接分享到朋友圈',
        showCancel: false
      })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
  },

  // canvas 自动换行
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y
    let line = ''
    for (let i = 0; i < text.length; i++) {
      const test = line + text[i]
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, x, y)
        line = text[i]
        y += lineHeight
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, x, y)
    return y + lineHeight
  }
})
