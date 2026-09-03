import { getMyDraftList, deleteDraft, getMyPublishPage } from '../../api/creator.js';
import {
  getStudyPage,
  getHonorPage,
  getNotificationPage,
  getVolunteerPage,
  getActivityPage,
  getCouponPage,
  getArticlePage
} from '../../api/notification.js';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    isMerchant: false,

    currentTab: 0, // 0: 已发布, 1: 未发布
    currentSubTab: 'all',

    subTabs: [],
    filteredList: [],
    rawList: [],

    // 分页状态
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    isManageMode: false, // 是否开启管理模式 (仅针对草稿)
    
    // 下拉刷新状态 (对应 scroll-view)
    refresherTriggered: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const role = wx.getStorageSync('service_userInfo')?.role || 'street';
    const isMerchant = role === 'merchant';

    const streetSubTabs = [
      { name: '全部', value: 'all' },
      { name: '荣耀时刻', value: 'glory' },
      { name: '我们需要你', value: 'needyou' },
      { name: '活动/服务', value: 'activity' },
      { name: '官方通知', value: 'official' },
      { name: '学习', value: 'study' }
    ];

    const merchantSubTabs = [
      { name: '折扣劵', value: 'discount' },
      { name: '满减劵', value: 'reduction' },
      { name: '代金劵', value: 'voucher' }
    ];

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isMerchant: isMerchant,
      subTabs: isMerchant ? merchantSubTabs : streetSubTabs
    });

    this.loadData();
  },

  onShow() {
    this.refreshData();
  },

  // 组件级下拉刷新 (对应 scroll-view 绑定)
  onRefresh() {
    if (this.data.isLoading) return;
    this.setData({ refresherTriggered: true });
    this.refreshData(() => {
      // 这里的 callback 在 loadData 内部数据返回后调用
      this.setData({ refresherTriggered: false });
    });
  },

  // 组件级上拉加载 (对应 scroll-view 绑定)
  onLoadMore() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ page: this.data.page + 1 }, () => {
        this.loadData();
      });
    }
  },

  // 保持页面级备份 (兼容性)
  onPullDownRefresh() {
    this.onRefresh();
  },

  onReachBottom() {
    this.onLoadMore();
  },

  refreshData(callback) {
    this.setData({
      page: 1,
      hasMore: true,
      rawList: [],
      filteredList: []
    }, () => {
      this.loadData(callback);
    });
  },

  loadData(callback) {
    const { currentTab, isLoading } = this.data;
    if (isLoading) {
      if (callback) callback();
      return;
    }

    if (currentTab === 1) {
      this.fetchDrafts(callback);
    } else {
      this.fetchPublishedItems(callback);
    }
  },

  fetchPublishedItems(callback) {
    const { currentSubTab, isMerchant, page, pageSize, rawList } = this.data;
    const userInfo = wx.getStorageSync('service_userInfo');
    const userId = userInfo?.userId;

    this.setData({ isLoading: true });
    wx.showNavigationBarLoading();

    let apiFunc = null;
    let params = { current: page, size: pageSize };

    if (isMerchant) {
      apiFunc = getCouponPage;
      if (userId) params.merchantId = userId;
      
      const couponTypeMap = {
        'discount': 2,
        'reduction': 1,
        'voucher': 3
      };
      if (currentSubTab !== 'all' && couponTypeMap[currentSubTab]) {
        params.templateType = couponTypeMap[currentSubTab];
      }
    } else {
      // 统一使用“我的发布”统合展示接口
      apiFunc = getMyPublishPage;
      
      const typeMap = {
        'glory': 6,
        'needyou': 2,
        'activity': 4,
        'official': 10,
        'study': 0
      };

      if (currentSubTab !== 'all') {
        params.type = typeMap[currentSubTab];
      }
    }

    apiFunc(params).then(res => {
      const records = res.data?.records || res.data || [];
      const total = res.data?.total !== undefined ? res.data.total : records.length;

      // 在映射时直接处理图标
      const newItems = records.map(item => {
        const card = this.mapToCard(item);
        card.icon = this.getIconPath(card.iconType);
        return card;
      });

      let combinedList = page === 1 ? newItems : rawList.concat(newItems);

      // 二次排序
      combinedList.sort((a, b) => {
        const timeA = new Date(a.displayTime).getTime() || 0;
        const timeB = new Date(b.displayTime).getTime() || 0;
        return timeB - timeA;
      });

      // 判定是否有更多：如果 total 存在则对比，否则根据单页长度判定
      let hasMore = true;
      if (res.data?.total !== undefined) {
        hasMore = combinedList.length < total;
      } else {
        hasMore = records.length >= pageSize;
      }

      this.setData({
        rawList: combinedList,
        filteredList: combinedList,
        hasMore: hasMore,
        isLoading: false
      }, () => {
        wx.hideNavigationBarLoading();
        if (callback) callback();
      });
    }).catch(err => {
      console.error('加载失败', err);
      this.setData({ isLoading: false });
      wx.hideNavigationBarLoading();
      if (callback) callback();
    });
  },

  mapToCard(item) {
    // 优先顺序：通用 title > 票券名 > 活动名 > 招募标题
    const title = item.title || item.couponName || item.activityName || '无标题';
    const time = item.createTime || item.publishedAt || item.publishTime || item.displayTime || '-';

    // 动态判定图标类型
    let iconType = 6; 
    const category = item.category || '';
    const type = item.type; // 统合接口返回的 type (Integer)

    // 如果是通过统合接口加载的 (带有有效的 type 字段)
    if (type !== undefined && type !== null && type !== -1) {
      if (type === 0 || type === 10) iconType = 6; // 学习、通知
      else if (type === 6) iconType = 9; // 荣誉
      else if (type === 2) iconType = 8; // 招募
      else if (type === 4) iconType = 1; // 活动
      else if (type === 5) iconType = 0; // 服务
      else if (type === 8) {
        // 票券推荐，细分 templateType
        const tType = item.templateType;
        if (tType === 1) iconType = 3; // 满减
        else if (tType === 2) iconType = 4; // 折扣
        else if (tType === 3) iconType = 5; // 代金
        else iconType = 3;
      }
    } else {
      // 兼容旧的/零散接口逻辑，或 type 为 -1 时的兜底判定
      const searchStr = (category + (item.typeName || '')).toLowerCase();
      
      // 1. 优惠券
      if (item.couponName || item.templateType || searchStr.includes('劵') || searchStr.includes('票券')) {
        const tType = item.templateType;
        if (searchStr.includes('满减') || tType === 1) iconType = 3;
        else if (searchStr.includes('折扣') || tType === 2) iconType = 4;
        else if (searchStr.includes('代金') || tType === 3) iconType = 5;
        else iconType = 3; 
      }
      // 2. 荣誉时刻
      else if (searchStr.includes('荣耀')) {
        iconType = 9;
      }
      // 3. 招募
      else if (item.recruitStatus !== undefined || searchStr.includes('招募') || searchStr.includes('你需要')) {
        iconType = 8;
      }
      // 4. 活动
      else if (item.maxParticipants !== undefined || searchStr.includes('活动')) {
        iconType = 1;
      }
      // 5. 服务
      else if (searchStr.includes('服务')) {
        iconType = 0;
      }
    }

    return {
      id: item.id,
      title: title,
      displayTime: time,
      iconType: iconType,
      isDraft: false,
      raw: item
    };
  },

  // 修改：切换主 Tab 时立即清空，防止界面残留
  switchMainTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    if (this.data.currentTab === tab) return;
    this.setData({ 
      currentTab: tab,
      rawList: [],
      filteredList: [],
      page: 1,
      hasMore: true,
      isManageMode: false
    }, () => {
      this.loadData();
    });
  },

  fetchDrafts(callback) {
    const { currentSubTab } = this.data;
    this.setData({ isLoading: true, rawList: [], filteredList: [] });

    getMyDraftList().then(res => {
      const typeMap = {
        'glory': 6,
        'needyou': 2,
        'activity': 4,
        'official': 10,
        'study': 0
      };

      const targetType = currentSubTab === 'all' ? null : typeMap[currentSubTab];

      const drafts = (res.data || []).map(item => {
        let content = {};
        try { content = JSON.parse(item.contentJson); } catch (e) { }

        const iconType = this.getIconByType(item.publishType);
        return {
          id: item.id,
          title: '[草稿] ' + (content.mainTitle || content.activityName || '未命名草稿'),
          displayTime: item.updateTime || item.createTime,
          type: this.getTypeStr(item.publishType),
          iconType: iconType,
          icon: this.getIconPath(iconType),
          publishType: item.publishType,
          content: content,
          isDraft: true
        };
      }).filter(item => {
        // 如果是活动/服务页签，需要同时过滤 4 (活动) 和 5 (服务)
        if (currentSubTab === 'activity') {
          return item.publishType === 4 || item.publishType === 5;
        }
        return targetType === null || item.publishType === targetType;
      });

      drafts.sort((a, b) => new Date(b.displayTime).getTime() - new Date(a.displayTime).getTime());

      this.setData({ 
        rawList: drafts,
        filteredList: drafts,
        hasMore: false,
        isLoading: false
      }, () => {
        if (callback) callback();
      });
    }).catch(err => { 
      console.error('获取草稿失败', err);
      this.setData({ isLoading: false });
      if (callback) callback();
    });
  },

  getTypeStr(type) {
    const map = { 0: 'learning', 4: 'activity', 2: 'needyou', 6: 'glory', 8: 'coupon', 10: 'official' };
    return map[type] || 'other';
  },

  getIconByType(type) {
    const map = { 0: 6, 4: 1, 2: 8, 6: 9, 8: 3, 10: 6 };
    return map[type] || 6;
  },

  // 处理图标路径映射
  processIcons() {
    const list = this.data.rawList.map(item => {
      if (item.iconType) {
        return { ...item, icon: this.getIconPath(item.iconType) };
      }
      return item;
    });
    this.setData({ rawList: list });
  },

  // 获取图标路径辅助函数
  getIconPath(iconType) {
    const baseUrl = 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/';
    switch (iconType) {
      case 0: return `${baseUrl}icon0.png`;
      case 1: return `${baseUrl}icon1.png`;
      case 3: return `${baseUrl}icon3.png`;
      case 4: return `${baseUrl}icon4.png`;
      case 5: return `${baseUrl}icon5.png`;
      case 6: return `${baseUrl}icon6.png`;
      case 8: return `${baseUrl}icon8.png`;
      case 9: return `${baseUrl}icon9.png`;
      default: return `${baseUrl}icon6.png`;
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  toggleManageMode() {
    this.setData({ isManageMode: !this.data.isManageMode });
  },

  handleDeleteDraft(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '提示',
      content: '确定要删除该草稿吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true });
          deleteDraft({ publishType: item.publishType }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            this.refreshData();
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  handleToDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (item.isDraft) {
      // 如果是草稿，跳转回发布页并回填数据
      const dataStr = encodeURIComponent(JSON.stringify({
        ...item.content,
        type: item.publishType
      }));
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/create/publish?type=${item.publishType}&data=${dataStr}`
      });
    } else {
      console.log('正式详情跳转', item);
    }
  },

  // 移除旧的重复定义

  toggleSubTab(e) {
    const val = e.currentTarget.dataset.val;
    const current = this.data.currentSubTab;
    this.setData({
      currentSubTab: current === val ? 'all' : val
    }, () => {
      this.refreshData();
    });
  },

  filterData() {
    // 正式记录和草稿目前在拉取时已处理好大部分字段，此处主要做备份或二次简单过滤
    const { rawList } = this.data;
    this.setData({ filteredList: rawList });
  }
});