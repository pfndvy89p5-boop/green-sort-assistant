// 拍照识别页 —— 定格预览 + 高画质 + 状态机
const icons = require('../../utils/icons.js')
Page({
  data: {
    safeTop: 20,
    icons: icons,
    loading: false,      // 识别中遮罩
    previewPath: '',     // 定格照片路径(有值时显示在相机上)
    camError: false      // 相机不可用时显示降级界面
  },

  onLoad() {
    this.setData({ safeTop: getApp().globalData.statusBarHeight || 20 })
    this.ctx = wx.createCameraContext()
  },

  goBack() {
    // 识别中不允许返回,避免状态混乱
    if (this.data.loading) {
      wx.showToast({ title: '识别中,请稍候', icon: 'none' })
      return
    }
    wx.navigateBack({ delta: 1 })
  },

  // 拍照 → 定格预览
  takePhoto() {
    if (this.data.loading) return
    this.ctx.takePhoto({
      quality: 'high',  // 改成高画质,给 AI 更清晰的图
      success: (res) => {
        // 定格:把拍到的照片立刻盖在相机上,不再实时预览
        this.setData({ previewPath: res.tempImagePath })
        this.uploadAndIdentify(res.tempImagePath)
      },
      fail: () => {
        wx.showToast({ title: '拍照失败,请重试', icon: 'none' })
      }
    })
  },

  // 从相册选择 → 同样定格预览
  chooseFromAlbum() {
    if (this.data.loading) return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.setData({ previewPath: tempPath })
        this.uploadAndIdentify(tempPath)
      },
      fail: () => {
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  // 重拍:清除定格,回到实时相机预览
  retake() {
    if (this.data.loading) return
    this.setData({ previewPath: '' })
  },

  // 上传 → AI 识别
  async uploadAndIdentify(tempPath) {
    this.setData({ loading: true })
    try {
      const cloudPath = `identify/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
      const r = await wx.cloud.callFunction({ name: 'baiduWasteIdentify', data: { fileID: up.fileID } })

      if (r.result && r.result.code === 0 && r.result.data) {
        const list = r.result.list || []
        this.setData({ loading: false, previewPath: '' })
        if (list.length > 1) {
          // 多候选 → 候选列表页让用户挑
          wx.setStorageSync('aiCandidateList', list)
          wx.setStorageSync('cameraFileID', up.fileID)
          wx.navigateTo({ url: '/pages/aiList/aiList' })
        } else {
          // 单候选 → 直接进详情
          wx.setStorageSync('aiResult', r.result.data)
          wx.setStorageSync('cameraFileID', up.fileID)
          wx.navigateTo({ url: `/pages/result/result?fromAi=1&name=${encodeURIComponent(r.result.data.name)}` })
        }
      } else {
        // 识别失败 → 停留在定格预览,显示重拍按钮
        this.setData({ loading: false })
        wx.showToast({ title: (r.result && r.result.msg) || '识别失败,请重拍', icon: 'none' })
      }
    } catch (e) {
      // 网络/云函数异常 → 也停留在定格预览
      console.error('识别异常', e)
      this.setData({ loading: false })
      wx.showToast({ title: '识别失败,请重试', icon: 'none' })
    }
  },

  // 相机组件错误处理 → 显示降级界面
  error(e) {
    console.log('camera error', e.detail)
    this.setData({ camError: true })
  }
})
