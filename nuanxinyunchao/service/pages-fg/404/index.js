Page({
  data: {
    // 如果有需要的数据可以放这里
  },

  onLoad(options) {
    // 页面加载时执行
  },

  goBack() {
    // 原生小程序使用 wx.reLaunch 切换到 TabBar 页面
    // 请确保这里的路径与你 app.json 中配置的首页路径完全一致
    wx.reLaunch({ 
      url: '/nuanxinyunchao/service/pages/index/index' 
    });
  }
});