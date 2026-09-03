Page({
  data: {
    safeAreaTop: 0,
    // 模拟数据状态
    settings: {
      notification: false,
      detail: true
    }
  },

  onLoad() {
    // 适配自定义导航栏安全区
    const systemInfo = wx.getSystemInfoSync();
    const safeTop = systemInfo.safeArea ? systemInfo.safeArea.top : systemInfo.statusBarHeight;
    this.setData({ safeAreaTop: safeTop || 0 });

    // 模拟从接口获取用户的初始设置
    this.fetchMockData();
  },

  // 模拟请求延迟
  fetchMockData() {
    wx.showNavigationBarLoading();
    setTimeout(() => {
      this.setData({
        'settings.notification': false, // 假设默认是关的
        'settings.detail': true         // 假设详情默认是开的
      });
      wx.hideNavigationBarLoading();
    }, 400);
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack({ delta: 1 });
  },

  // === 处理消息通知开关 ===
  handleNotificationChange(e) {
    const isOpen = e.detail.value;
    
    if (isOpen) {
      // 1. 用户想开启 -> 发起微信原生订阅请求
      this.requestSubscription();
    } else {
      // 2. 用户想关闭 -> 强制更新视图，并模拟接口调用
      this.setData({ 'settings.notification': false });
      wx.showToast({ title: '已关闭推送', icon: 'none' });
      console.log('【模拟API】: 告知后端 UserID: xxx 不再接收推送');
    }
  },

  // 调用微信原生订阅消息机制
  requestSubscription() {
    // 这里的模板ID需要换成你小程序后台真实申请的ID，否则真机会报错
    const tmplIds = ['你的模板ID_1', '你的模板ID_2']; 

    // 如果没有配置模板ID，为了演示效果，我们直接模拟成功
    if (tmplIds[0] === '你的模板ID_1') {
      wx.showToast({ title: '请配置真实模板ID', icon: 'none' });
      this.setData({ 'settings.notification': false }); // 恢复关闭状态
      return;
    }

    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: (res) => {
        // 检查是否至少允许了一个模板
        const hasAccept = tmplIds.some(id => res[id] === 'accept');

        if (hasAccept) {
          this.setData({ 'settings.notification': true });
          wx.showToast({ title: '订阅成功', icon: 'success' });
          console.log('【模拟API】: 通知后端保存用户的订阅状态为: 开启');
        } else {
          // 用户点了取消或拒绝
          this.setData({ 'settings.notification': false });
          wx.showToast({ title: '您取消了授权', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('订阅失败', err);
        this.setData({ 'settings.notification': false }); // 强制拨回关闭状态
        
        // 常见错误：用户曾经勾选了"总是保持以上选择"并拒绝，或者关闭了总开关
        if (err.errCode === 20004) {
          wx.showModal({
            title: '提示',
            content: '您似乎关闭了消息订阅主开关，请在设置中打开',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '授权失败，请重试', icon: 'none' });
        }
      }
    });
  },

  // 处理具体内容显示开关
  handleDetailChange(e) {
    const isOpen = e.detail.value;
    this.setData({ 'settings.detail': isOpen });
    console.log(`【模拟API】: 更新详情显示状态到后端, 当前状态: ${isOpen}`);
  }
});