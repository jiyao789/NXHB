Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    isPreview: false,
    message: {
      id: '',
      title: '',
      time: '',
      content: '',
      sender: '华阳路街道社区党群服务中心',
      orgLogo: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
      image: '',
      mediaList: [],
      link: ''
    }
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isPreview: !!options.isPreview
    });

    if (options.isPreview) {
      const data = wx.getStorageSync('previewData');
      if (data) {
        this.setData({
          message: {
            ...this.data.message,
            title: data.title || '官方通知',
            content: data.fullText || '',
            time: data.editTime || '刚刚',
            sender: data.orgName || '华阳路街道社区党群服务中心',
            orgLogo: data.orgLogo || 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
            mediaList: data.mediaList || []
          }
        });
      }
    } else if (options.item) {
      try {
        const item = JSON.parse(decodeURIComponent(options.item));
        let mediaList = [];
        if (item.image) {
          mediaList.push({
            url: item.image,
            is_video: item.image.toLowerCase().match(/\.(mp4|mov|m4v|3gp|avi|flv)$/) !== null
          });
        }

        this.setData({
          message: {
            ...this.data.message,
            id: item.id || '1',
            title: item.title || '系统通知',
            time: item.displayTime || item.rawTime || '刚刚',
            sender: item.sender || '华阳路街道社区党群服务中心',
            content: item.desc || '',
            image: item.image || '',
            mediaList: mediaList
          }
        });
      } catch (e) {
        console.error('解析参数失败', e);
      }
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handlePublish() {
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && eventChannel.emit) {
      eventChannel.emit('submitFromPreview');
      wx.navigateBack();
    } else {
      wx.showToast({
        title: '预览模式已失效',
        icon: 'none'
      });
    }
  },

  openLink(e) {
    const url = e.currentTarget.dataset.url;
    console.log('Open:', url);
  }
});
