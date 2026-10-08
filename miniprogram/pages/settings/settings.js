// 设置页 —— Neo-Brutalist
const icons = require('../../utils/icons.js')

// 联系方式验证正则(和 mine 页一致,避免绕页)
const RE_PHONE = /^1[3-9]\d{9}$/
const RE_EMAIL = /^[\w.-]+@[\w-]+\.[\w.-]+$/

const ABOUT = `绿分类助手 v3.0.0

一款基于 AI 的智能垃圾分类助手,支持拍照识别、文字查询、四分类速查等功能。

© 2025 BRUTAL Studio`

const HELP = `【拍照识别】
点击首页相机按钮 → 对准垃圾物品拍照 → AI 自动识别分类

【文字查询】
在搜索栏输入物品名称 → 查看分类结果和投放建议

【四分类速查】
可回收物 / 厨余垃圾 / 有害垃圾 / 其他垃圾 四大类快速浏览

【我的收藏】
在知识库页面点击物品右侧菱形图标收藏,方便后续查看`

const PRIVACY = `绿分类助手 隐私政策

1. 数据收集
本应用仅在您主动使用拍照识别功能时,调用相机获取图片,不收集地理位置等无关信息。

2. 数据存储
搜索历史、收藏列表仅保存在您的本地设备,不会上传至云端。

3. 权限说明
- 相机权限:用于拍照识别垃圾
- 网络权限:用于 AI 识别接口调用
- 存储权限:用于缓存搜索历史

4. 联系我们
如有疑问,请通过意见反馈功能联系开发者。`

Page({
  data: {
    safeTop: 20,
    icons: icons,
    cacheSize: "计算中...",
    historyCount: 0,
    // 文本弹层(关于/帮助/隐私)
    showModal: false,
    modalTitle: "",
    modalContent: "",
    // 反馈弹层(独立弹层,不用绕回 mine)
    showFeedback: false,
    fbContent: "",
    fbContact: "",
    fbContactType: "phone",
    submitting: false
  },

  onLoad(options) {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
    this.refreshCacheInfo()
    // 从 mine 页跳转过来时自动打开反馈弹层
    if (options && options.openFeedback === '1') {
      setTimeout(() => this.goFeedback(), 300)
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: "/pages/index/index" }) })
  },

  // ---------- 缓存管理 ----------
  refreshCacheInfo() {
    const history = wx.getStorageSync('searchHistory') || []
    try {
      const info = wx.getStorageInfoSync()
      const keys = info.keys || []
      let size = 0
      keys.forEach(key => {
        try {
          const v = wx.getStorageSync(key)
          if (v) size += JSON.stringify(v).length
        } catch(e) {}
      })
      const kb = (size / 1024).toFixed(1)
      this.setData({
        cacheSize: kb < 1024 ? `${kb} KB` : `${(kb/1024).toFixed(2)} MB`,
        historyCount: history.length
      })
    } catch(e) {
      this.setData({ cacheSize: "未知", historyCount: history.length })
    }
  },

  clearCache() {
    wx.showModal({
      title: "清除缓存",
      content: "将清除所有本地缓存数据(搜索历史、收藏记录不会丢失),确定继续?",
      confirmColor: "#FF006E",
      success: (res) => {
        if (res.confirm) {
          try {
            const keys = wx.getStorageInfoSync().keys || []
            keys.forEach(k => {
              if (k !== 'collectList' && k !== 'searchHistory') {
                wx.removeStorageSync(k)
              }
            })
            wx.showToast({ title: "缓存已清除", icon: "success" })
            this.refreshCacheInfo()
          } catch(e) {
            wx.showToast({ title: "清除失败", icon: "none" })
          }
        }
      }
    })
  },

  clearHistory() {
    if (this.data.historyCount === 0) {
      wx.showToast({ title: "暂无历史记录", icon: "none" })
      return
    }
    wx.showModal({
      title: "清空历史",
      content: "确定要清空全部搜索历史吗?",
      confirmColor: "#FF006E",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          wx.showToast({ title: "已清空", icon: "success" })
          this.refreshCacheInfo()
        }
      }
    })
  },

  // ---------- 文本弹层 ----------
  showAbout()   { this.setData({ showModal: true, modalTitle: "关于我们", modalContent: ABOUT }) },
  showHelp()    { this.setData({ showModal: true, modalTitle: "使用帮助", modalContent: HELP }) },
  showPrivacy() { this.setData({ showModal: true, modalTitle: "隐私政策", modalContent: PRIVACY }) },
  closeModal()  { this.setData({ showModal: false }) },

  // ---------- 反馈弹层(不再绕回 mine,直接弹) ----------
  goFeedback() {
    this.setData({ showFeedback: true })
  },
  closeFeedback() {
    this.setData({ showFeedback: false, fbContent: "", fbContact: "", fbContactType: "phone", submitting: false })
  },
  inputFbContent(e) { this.setData({ fbContent: e.detail.value }) },
  inputFbContact(e) { this.setData({ fbContact: e.detail.value }) },
  switchContactType(e) {
    const type = e.currentTarget.dataset.type
    if (type !== this.data.fbContactType) {
      this.setData({ fbContactType: type, fbContact: "" })
    }
  },
  validateContact(contact, type) {
    if (!contact) return null
    if (type === "phone") {
      if (!RE_PHONE.test(contact)) return "手机号格式不正确(需 11 位)"
    } else {
      if (!RE_EMAIL.test(contact)) return "邮箱格式不正确"
    }
    return null
  },
  async submitFeedback() {
    if (this.data.submitting) return
    const content = (this.data.fbContent || "").trim()
    if (!content) {
      wx.showToast({ title: "请输入反馈内容", icon: "none" })
      return
    }
    const contact = (this.data.fbContact || "").trim()
    const err = this.validateContact(contact, this.data.fbContactType)
    if (err) {
      wx.showToast({ title: err, icon: "none" })
      return
    }
    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: "submitFeedback",
        data: { content, contact, contactType: this.data.fbContactType }
      })
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: "提交成功", icon: "success" })
        this.setData({ showFeedback: false, fbContent: "", fbContact: "", fbContactType: "phone", submitting: false })
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || "提交失败", icon: "none" })
        this.setData({ submitting: false })
      }
    } catch (e) {
      wx.showToast({ title: "网络错误", icon: "none" })
      this.setData({ submitting: false })
    }
  },

  stopProp() {}
})
