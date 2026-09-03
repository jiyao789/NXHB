Page({
  doRegister() {
    wx.showToast({
      title: '注册成功',
      icon: 'success'
    });
    // 注册成功后跳转到登录页
    setTimeout(() => {
      wx.navigateTo({
        url: '/nuanxinyunchao/admin/pages-fg/login/login',
      });
    }, 1500);
  }
});
