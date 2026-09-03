import { getArticleDetail } from '../../api/notification';

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

  formatTime(dateStr) {
    if (!dateStr) return '刚刚';
    if (dateStr === '刚刚') return dateStr;
    // Handle iOS parsing issue and strip timezone/milliseconds
    const date = new Date(dateStr.replace(/-/g, '/').replace('T', ' ').replace(/\.\d+/, ''));
    if (isNaN(date.getTime())) return dateStr;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  },

  onLoad(options) {
    // 获取状态栏高度
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
            time: data.editTime ? this.formatTime(data.editTime) : '刚刚',
            sender: data.orgName || '华阳路街道社区党群服务中心',
            orgLogo: data.orgLogo || 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
            mediaList: data.mediaList || []
          }
        });
      }
    } else if (options.item) {
      try {
        const item = JSON.parse(decodeURIComponent(options.item));

        // 映射多媒体列表
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
            time: this.formatTime(item.displayTime || item.rawTime),
            sender: item.sender || '华阳路街道社区党群服务中心',
            content: item.desc || '',
            image: item.image || '',
            mediaList: mediaList
          }
        });
      } catch (e) {
        console.error('解析参数失败', e);
      }
    } else if (options.id) {
      this.fetchDetail(options.id);
    }
  },

  async fetchDetail(id) {
    try {
      const res = await getArticleDetail(id);
      if (res && res.data) {
        const item = res.data;
        let mediaList = [];
        if (item.coverImage) {
          mediaList.push({
            url: item.coverImage,
            is_video: item.coverImage.toLowerCase().match(/\.(mp4|mov|m4v|3gp|avi|flv)$/) !== null
          });
        }
        
        if (item.extJson) {
          try {
            const ext = JSON.parse(item.extJson);
            if (ext.images && ext.images.length > 0) {
              ext.images.forEach(img => {
                if (!mediaList.find(m => m.url === img)) {
                  mediaList.push({
                    url: img,
                    is_video: img.toLowerCase().match(/\.(mp4|mov|m4v|3gp|avi|flv)$/) !== null
                  });
                }
              });
            }
          } catch(e){}
        }

        this.setData({
          message: {
            ...this.data.message,
            id: item.id || id,
            title: item.title || '系统通知',
            time: this.formatTime(item.publishedAt || item.createTime),
            sender: item.author || '系统通知',
            content: item.content || item.summary || '',
            image: item.coverImage || '',
            mediaList: mediaList
          }
        });
      }
    } catch (e) {
      console.error('获取详情失败', e);
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  // 处理预览页的发布点击
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
    // 这里处理跳转链接逻辑，例如使用 wx.navigateTo 或 wx.navigateToMiniProgram
  }
});