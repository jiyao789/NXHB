Page({
  data: {
    img_root: 'https://test.ischooldays.cn/images/cndj/wx',
    showNuanXinModal: false
  },

  onLoad: function() {
    // 延迟获取 app 全局数据，增加容错
    const globalData = getApp().globalData || {};
    this.setData({
      img_root: globalData.img_root || ''
    });

    // 可以在这里根据业务逻辑自动跳转，或者保留目前的弹窗选择
    console.log('Shell page loaded, awaiting user selection or auto-redirect');
  },

  onShow: function () {
    // 之前为了强制引导添加的自动弹窗，现在根据用户要求移除
  },

  toPage: function(e) {
    const index = e.currentTarget.dataset.index;
    if (index == '9') {
      this.setData({ showNuanXinModal: true });
      return;
    }
  },

  closeModal: function() {
    this.setData({ showNuanXinModal: false });
  },

  stopBubble: function() {
    // 阻止冒泡
  },

  goToNuanXin: function(e) {
    const type = e.currentTarget.dataset.type;
    let url = '';
    if (type === 'admin') {
      url = '/nuanxinyunchao/admin/pages/rank/index';
    } else if (type === 'service') {
      url = '/nuanxinyunchao/service/pages/index/index';
    } else if (type === 'user') {
      url = '/nuanxinyunchao/user/pages/index/index';
    }
    
    if (url) {
      this.closeModal();
      wx.reLaunch({
        url: url,
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({ title: '界面加载失败', icon: 'none' });
        }
      });
    }
  }
})