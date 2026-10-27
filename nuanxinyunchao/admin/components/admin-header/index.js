const { logout } = require('../../utils/auth.js')

Component({
  data: {
    showDropdown: false,
    menuTop: 0,
    menuLeft: 0
  },

  methods: {
    toggleDropdown() {
      this.setData({
        showDropdown: !this.data.showDropdown
      })
    },

    closeDropdown() {
      this.setData({
        showDropdown: false
      })
    },

    preventTouchMove() {
      // 阻止蒙层滚动穿透
    },

    handleModifyPassword() {
      this.closeDropdown()
      wx.navigateTo({
        url: '/nuanxinyunchao/admin/pages-sub/password/index'
      })
    },

    handleLogout() {
      this.closeDropdown()
      wx.showModal({
        title: '退出确认',
        content: '确定要退出当前管理端登录状态吗？',
        confirmText: '退出',
        confirmColor: '#E53E3E',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            logout()
          }
        }
      })
    }
  }
})
