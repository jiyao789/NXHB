const app = getApp();

Page({
  data: {
    hasLogin: false,
    userInfo: {},
    currentDate: '',
    menuList: [
      {
        title: '我的发布',
        path: '/nuanxinyunchao/service/pages-sub/mine/publish',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/mine/publish.png'
      },
      {
        title: '我要反馈',
        path: '/nuanxinyunchao/service/pages-sub/mine/feedback/index',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/mine/feedback.png'
      },
      {
        title: '设置',
        path: '/nuanxinyunchao/service/pages-sub/mine/setting/index',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/mine/setting.png'
      }
    ],
    bannerList: [
      {
        imgUrl: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/mine/unity.png'
      }
    ]
  },

  onLoad() {
    this.setCurrentDate();
  },

  onShow() {
    const { checkPartyCenter } = require('../../utils/auth.js');
    if (checkPartyCenter()) return;

    // 激活自定义 TabBar 的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelectedFromRoute();
    }
    this.checkLoginState();
  },

  // 获取当前格式化日期 YYYY.MM.DD
  setCurrentDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    this.setData({ currentDate: `${y}.${m}.${d}` });
  },

  // 检查登录态及用户信息
  checkLoginState() {
    const token = wx.getStorageSync('service_token');
    const userInfo = wx.getStorageSync('service_userInfo') || {};
    
    let currentMenu = [...this.data.menuList];
    const hasVerify = currentMenu.some(item => item.title === '核销记录');
    
    if (userInfo.role === 'merchant') {
      if (!hasVerify) {
        currentMenu.unshift({
          title: '核销记录',
          path: '/nuanxinyunchao/service/pages-sub/mine/verify',
          icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/mine/verify.png'
        });
      }
    } else {
      if (hasVerify) {
        currentMenu = currentMenu.filter(item => item.title !== '核销记录');
      }
    }
    
    this.setData({
      hasLogin: !!token,
      userInfo: userInfo,
      menuList: currentMenu
    });
  },

  // 点击用户头像区域
  handleUserInfoClick() {
    if (!this.data.hasLogin) {
      wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/auth/login' });
    } else {
      wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/mine/setting/profile' });
    }
  },

  // 点击菜单项
  handleMenuClick(e) {
    const path = e.currentTarget.dataset.path;
    if (path) {
      wx.navigateTo({ url: path });
    }
  },

  // 点击我的权益
  handleRightsClick() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/mine/rights/index'
    });
  },

  // 点击积分明细
  handleIntegralClick() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/mine/integral/index'
    });
  },

  // 点击 Banner
  handleBannerClick() {
    console.log('Banner clicked');
  }
});