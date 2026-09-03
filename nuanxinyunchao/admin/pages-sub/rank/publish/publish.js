import { getMyPublishPage, deletePublish } from '../../../api/creator.js';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    isMerchant: false,

    currentTab: 0, // 0: 已发布, 1: 未发布
    currentSubTab: 'all',

    subTabs: [],
    filteredList: [],
    rawList: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();

    // 强制为街道模式，不进行用户角色判断
    const isMerchant = false;

    const streetSubTabs = [
      { name: '我们的荣耀时刻', value: 'glory' },
      { name: '我们需要你', value: 'needyou' },
      { name: '活动', value: 'activity' },
      { name: '官方通知', value: 'official' },
      { name: '学习', value: 'study' }
    ];

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isMerchant: isMerchant,
      subTabs: streetSubTabs
    });

    // 获取数据
    this.fetchData();
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(/-/g, '/'));
    if (isNaN(date)) return dateStr;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${y}.${m}.${d} ${h}:${min}`;
  },

  async fetchData() {
    if (this.data.currentTab === 1) {
      // 未发布要求为空
      this.setData({ rawList: [], filteredList: [] });
      return;
    }

    wx.showLoading({ title: '加载中...' });
    try {
      const res = await getMyPublishPage({ current: 1, size: 100 });
      if (res && res.data && res.data.records) {
        const list = res.data.records.map(item => {
          let strType = 'study';
          let iconType = 1;

          if (item.type === 0) { strType = 'study'; iconType = 1; }
          else if (item.type === 6) { strType = 'glory'; iconType = 1; }
          else if (item.type === 10) { strType = 'official'; iconType = 1; }
          else if (item.type === 2) { strType = 'needyou'; iconType = 8; }
          else if (item.type === 4 || item.type === 5) { strType = 'activity'; iconType = 9; }

          return {
            ...item,
            rawType: item.type,
            type: strType,
            status: 0, // 已发布
            displayTime: this.formatTime(item.publishTime),
            iconType: iconType,
            role: 'street',
            icon: this.getIconPath(iconType),
            slideX: 0,
            transition: 'none'
          };
        });
        this.setData({ rawList: list });
        this.filterData();
      }
    } catch (err) {
      console.error('获取列表失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },



  // 获取图标路径辅助函数
  getIconPath(iconType) {
    const baseUrl = 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/';
    switch (iconType) {
      case 1: return `${baseUrl}icon1.png`;
      case 8: return `${baseUrl}icon8.png`;
      case 9: return `${baseUrl}icon9.png`;
      case 3: return `${baseUrl}icon3.png`;
      case 4: return `${baseUrl}icon4.png`;
      case 5: return `${baseUrl}icon5.png`;
      default: return `${baseUrl}icon1.png`;
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleToDetail(e) {
    // 阻止左滑状态下点击详情
    const item = e.currentTarget.dataset.item;
    if (item.slideX < -10) return;
    console.log('跳转详情', item);
  },

  switchMainTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    if (tab === this.data.currentTab) return;
    this.setData({ currentTab: tab });
    this.fetchData();
  },

  toggleSubTab(e) {
    const val = e.currentTarget.dataset.val;
    const current = this.data.currentSubTab;
    this.setData({
      currentSubTab: current === val ? 'all' : val
    });
    this.filterData();
  },

  filterData() {
    const { rawList, isMerchant, currentTab, currentSubTab } = this.data;

    const filtered = rawList.filter(item => {
      // 0. 角色过滤
      if (isMerchant && item.role !== 'merchant') return false;
      if (!isMerchant && item.role !== 'street') return false;

      // 1. 过滤主 Tab (已发布/未发布)
      if (item.status !== currentTab) return false;

      // 2. 过滤二级 Tab ('all' 显示所有)
      if (currentSubTab !== 'all' && item.type !== currentSubTab) return false;

      return true;
    });

    this.setData({ filteredList: filtered });
  },

  // ========== 左滑删除逻辑 ==========
  touchStart(e) {
    if (e.touches.length === 1) {
      this.setData({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY
      });
    }
  },

  touchMove(e) {
    if (e.touches.length === 1) {
      const index = e.currentTarget.dataset.index;
      const moveX = e.touches[0].clientX;
      const moveY = e.touches[0].clientY;
      const disX = this.data.startX - moveX;
      const disY = this.data.startY - moveY;

      // 如果纵向滑动大于横向，认为是页面滚动
      if (Math.abs(disY) > Math.abs(disX)) return;

      const btnWidth = 70; // 删除按钮的预估像素宽度 (140rpx 约等于 70px)
      let slideX = 0;
      if (disX > 0) { // 向左滑动
        slideX = -disX;
        if (slideX < -btnWidth) slideX = -btnWidth;
      } else { // 向右滑动
        slideX = 0;
      }

      const list = this.data.filteredList;
      list[index].slideX = slideX;
      list[index].transition = 'none';
      this.setData({ filteredList: list });
    }
  },

  touchEnd(e) {
    if (e.changedTouches.length === 1) {
      const index = e.currentTarget.dataset.index;
      const endX = e.changedTouches[0].clientX;
      const disX = this.data.startX - endX;
      const disY = this.data.startY - e.changedTouches[0].clientY;

      if (Math.abs(disY) > Math.abs(disX) && Math.abs(disX) < 20) return;

      const btnWidth = 70;
      let slideX = 0;

      // 如果滑动距离超过按钮一半，就展开；否则收起
      if (disX > btnWidth / 2) {
        slideX = -btnWidth;
      } else {
        slideX = 0;
      }

      const list = this.data.filteredList;
      // 复位其他项
      list.forEach((item, i) => {
        if (i !== index) {
          item.slideX = 0;
          item.transition = 'transform 0.3s ease-out';
        }
      });
      list[index].slideX = slideX;
      list[index].transition = 'transform 0.3s ease-out';

      this.setData({ filteredList: list });
    }
  },

  handleDelete(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '提示',
      content: '确定要删除该条发布记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          try {
            await deletePublish({
              id: item.id,
              type: item.rawType,
              category: item.category
            });
            wx.hideLoading(); // 必须在 showToast 前 hideLoading
            wx.showToast({ title: '删除成功' });
            this.fetchData(); // 重新加载数据
          } catch (err) {
            console.error('删除API报错/异常:', err);
            wx.hideLoading();
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        } else {
          // 用户取消，收起删除按钮
          const index = this.data.filteredList.findIndex(i => i.id === item.id);
          if (index > -1) {
            const list = this.data.filteredList;
            list[index].slideX = 0;
            this.setData({ filteredList: list });
          }
        }
      }
    });
  }
});