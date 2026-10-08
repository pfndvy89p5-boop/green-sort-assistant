// 自定义底部 Tab Bar —— Neo-Brutalist 新野兽派
// 使用纯 SVG data URI 图标,零图片依赖,绕过组件样式隔离
const icons = require('../utils/icons.js')

Component({
  data: {
    selected: 0,
    // 每个 tab 有两套图标:默认粉红版(白底粉图标) + active 白版(粉底白图标)
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon:      icons.HOT.home,
        iconActive: icons.WHITE.home
      },
      {
        pagePath: "/pages/knowledge/knowledge",
        text: "知识库",
        icon:      icons.HOT.book,
        iconActive: icons.WHITE.book
      },
      {
        pagePath: "/pages/collect/collect",
        text: "收藏",
        icon:      icons.HOT.star,
        iconActive: icons.WHITE.star
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        icon:      icons.HOT.user,
        iconActive: icons.WHITE.user
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const index = data.index
      const url = data.path
      // 点击当前 tab 不重复跳转
      if (this.data.selected === index) return
      wx.switchTab({
        url,
        success: () => { this.setData({ selected: index }) }
      })
    }
  }
})
