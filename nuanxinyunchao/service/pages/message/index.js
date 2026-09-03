import { getSystemMessage, getNotificationPage } from '../../api/notification';

Page({
  data: {
    isLoading: true,
    messageList: [],
    userInfo: {}
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 如果这是 TabBar 页面，需触发自定义 TabBar 更新选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelectedFromRoute();
    }
    const userInfo = wx.getStorageSync('service_userInfo') || {};
    this.setData({ userInfo });
  },

  // 时间格式化
  formatMessageTime(dateStr) {
    if (!dateStr) return '--:--';
    let date = new Date(dateStr.replace(/-/g, '/'));
    if (Number.isNaN(date.getTime())) {
      date = new Date(dateStr.replace(' ', 'T'));
    }
    if (Number.isNaN(date.getTime())) {
      const timeMatch = dateStr.match(/\d{2}:\d{2}/);
      return timeMatch ? timeMatch[0] : dateStr.slice(0, 10);
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    if (isYesterday) {
      return '昨天';
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  async fetchRealMessages() {
    let sysDesc = '当前暂无系统消息哦~';
    let sysTime = '';
    try {
      const sysRes = await getSystemMessage();
      if (sysRes && sysRes.data && sysRes.data.length > 0) {
        // Sort to get the most recent message
        const sorted = sysRes.data.sort((a, b) => {
          const timeA = new Date(a.time.replace(/-/g, '/').replace('T', ' ')).getTime();
          const timeB = new Date(b.time.replace(/-/g, '/').replace('T', ' ')).getTime();
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
        sysDesc = sorted[0].title || sysDesc;
        sysTime = sorted[0].time;
      }
    } catch (e) {
      console.error(e);
    }

    let offDesc = '暂无最新官方通知';
    let offTime = '';
    try {
      const offRes = await getNotificationPage({ current: 1, size: 1 });
      if (offRes && offRes.data && offRes.data.records && offRes.data.records.length > 0) {
        offDesc = offRes.data.records[0].title || offDesc;
        offTime = offRes.data.records[0].publishedAt || offRes.data.records[0].createTime;
      }
    } catch (e) {
      console.error(e);
    }

    return [
      {
        title: '系统消息',
        desc: sysDesc,
        rawTime: sysTime,
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/message/icon_sys.png',
      },
      {
        title: '官方通知',
        desc: offDesc,
        rawTime: offTime,
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/message/icon_official.png',
      }
    ];
  },

  // 获取数据
  async loadData() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    try {
      const userInfo = wx.getStorageSync('service_userInfo') || {};
      const data = await this.fetchRealMessages();
      let messageList = data.map(item => ({
        ...item,
        displayTime: this.formatMessageTime(item.rawTime)
      }));
      
      if (userInfo.role === 'merchant') {
        messageList = messageList.filter(item => item.title !== '系统消息');
      }

      this.setData({ messageList });
    } catch (e) {
      console.error(e);
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }
  },

  // 处理点赞跳转
  handleLike() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/message/like/index'
    });
  },

  // 处理收藏跳转
  handleStar() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/message/collection/index'
    });
  },

  handleToDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (item.title === '系统消息') {
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/message/system?item=${encodeURIComponent(JSON.stringify(item))}`
      });
    } else if (item.title === '官方通知') {
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/message/official/index`
      });
    } else {
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/message/detail?item=${encodeURIComponent(JSON.stringify(item))}`
      });
    }
  }
});