// 知识库页（部署手册定稿）
const icons = require('../../utils/icons.js')
Page({
  data: {
    safeTop: 20,
    safeRight: 64,
    topBarHeight: 280,
    spacerHeight: 280,
    icons: icons,
    activeCat: "",
    trashList: [],
    loading: false,
    showTopBar: true,       // 整个顶部是否显示
    catList: [
      { name: "可回收物", cat: "recycle", color: "#3A86FF", bgColor: "rgba(58, 134, 255, 0.18)" },
      { name: "厨余垃圾", cat: "kitchen", color: "#06D6A0", bgColor: "rgba(6, 214, 160, 0.18)" },
      { name: "有害垃圾", cat: "danger",  color: "#FF006E", bgColor: "rgba(255, 0, 110, 0.18)" },
      { name: "其他垃圾", cat: "other",   color: "#495057", bgColor: "rgba(73, 80, 87, 0.14)" }
    ]
  },

  _lastScroll: 0,

  onPageScroll(e) {
    const y = e.scrollTop
    const prev = this._lastScroll
    this._lastScroll = y
    if (y < 80) {
      if (!this.data.showTopBar) this.setData({ showTopBar: true, spacerHeight: this.data.topBarHeight })
      return
    }
    const diff = y - prev
    if (diff > 15) {
      // 下滑 → 隐藏整个顶部 + spacer 归零
      if (this.data.showTopBar) this.setData({ showTopBar: false, spacerHeight: 0 })
    } else if (diff < -15) {
      // 上滑 → 显示整个顶部 + spacer 恢复
      if (!this.data.showTopBar) this.setData({ showTopBar: true, spacerHeight: this.data.topBarHeight })
    }
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    let safeRight = 64
    if (menu) safeRight = Math.ceil((sys.windowWidth - menu.left) + 10)
    // 顶部总高度 = 状态栏 + hero(180) + hero阴影(16) + 分类栏(~55) + 边框
    const topBarHeight = safeTop + 180 + 16 + 60
    this.setData({ safeTop, safeRight, topBarHeight, spacerHeight: topBarHeight })
    if (options.cat) {
      this.setData({ activeCat: options.cat })
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    let preCat = wx.getStorageSync('preCat')
    let catChanged = false
    if (preCat) {
      wx.removeStorageSync('preCat')
      if (preCat !== this.data.activeCat) {
        this.setData({ activeCat: preCat })
        catChanged = true
      }
    }
    // 只在分类变化或首次加载时请求数据
    if (catChanged || !this.data.trashList.length) {
      this.loadTrashList()
    }
  },

  // 切换分类（点击已激活分类不重复请求）
  switchCat(e) {
    let cat = e.currentTarget.dataset.cat
    if (cat === this.data.activeCat) return
    this.setData({ activeCat: cat })
    this.loadTrashList()
  },

  // 加载垃圾列表（对接云函数 getTrashList，加竞态保护 + 15s 超时兜底）
  _loadSeq: 0,
  async loadTrashList() {
    const seq = ++this._loadSeq
    this.setData({ loading: true })
    try {
      let res = await Promise.race([
        wx.cloud.callFunction({ name: "getTrashList", data: { cat: this.data.activeCat } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('云函数请求超时')), 15000))
      ])
      // 只接受最新一次请求的结果，丢弃过期的
      if (seq !== this._loadSeq) return
      this.setData({ trashList: (res.result && res.result.list) || [], loading: false })
    } catch (e) {
      console.error('getTrashList 加载失败:', e)
      if (seq !== this._loadSeq) return
      this.setData({ trashList: [], loading: false })
      wx.showToast({ title: '加载失败,请重试', icon: 'none' })
    }
  },

  // 打开详情
  openDetail(e) {
    let item = e.currentTarget.dataset.item
    wx.navigateTo({ url: `/pages/result/result?name=${encodeURIComponent(item.name)}` })
  }
})
