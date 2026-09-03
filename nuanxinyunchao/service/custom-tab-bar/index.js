/*
 * @Author: cwkl123 1297224582@qq.com
 * @Date: 2026-09-03 17:08:50
 * @LastEditors: cwkl123 1297224582@qq.com
 * @LastEditTime: 2026-09-03 21:43:56
 * @FilePath: \NXHB\nuanxinyunchao\service\custom-tab-bar\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#FFD700',
    list: [
      {
        pagePath: '/nuanxinyunchao/service/pages/index/index',
        iconPath: '/nuanxinyunchao/service/static/tabbar/home.png',
        selectedIconPath: '/nuanxinyunchao/service/static/tabbar/home-active.png',
        text: '首页',
      },
      {
        pagePath: '/nuanxinyunchao/service/pages/create/index',
        iconPath: '/nuanxinyunchao/service/static/tabbar/create.png',
        selectedIconPath: '/nuanxinyunchao/service/static/tabbar/create-active.png',
        text: '创建',
      },

      {
        pagePath: '/nuanxinyunchao/service/pages-sub/qrcode/index',
        iconPath: '/nuanxinyunchao/service/static/tabbar/code.png',
        selectedIconPath: '/nuanxinyunchao/service/static/tabbar/code.png',
        text: '',
        isBulge: true,
      },
      {
        pagePath: '/nuanxinyunchao/service/pages/message/index',
        iconPath: '/nuanxinyunchao/service/static/tabbar/message.png',
        selectedIconPath: '/nuanxinyunchao/service/static/tabbar/message-active.png',
        text: '消息',
      },
      {
        pagePath: '/nuanxinyunchao/service/pages/mine/index',
        iconPath: '/nuanxinyunchao/service/static/tabbar/user.png',
        selectedIconPath: '/nuanxinyunchao/service/static/tabbar/user-active.png',
        text: '我的',
      },
    ],
  },
  attached() {
    const userInfo = wx.getStorageSync('service_userInfo') || {}
    if (userInfo.role !== 'merchant') {
      const list = this.data.list.filter((item) => !item.isBulge)
      this.setData({ list })
    }
  },
  pageLifetimes: {
    show() {
      this.syncSelectedFromRoute()
    },
  },
  methods: {
    syncSelectedFromRoute() {
      const pages = getCurrentPages()
      if (pages.length === 0) return
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route
      const list = this.data.list
      for (let i = 0; i < list.length; i++) {
        const pagePath = list[i].pagePath
        if (pagePath === '/' + route || pagePath === route) {
          this.setData({ selected: i })
          return
        }
      }
    },
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      const index = data.index
      const item = this.data.list[index]

      if (item.isBulge) {
        wx.navigateTo({
          url: '/nuanxinyunchao/service/pages-sub/qrcode/index',
        })
        return
      }

      wx.reLaunch({ url })
      this.setData({
        selected: index,
      })
    },
  },
})
