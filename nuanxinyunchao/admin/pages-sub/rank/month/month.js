const { getMerchantRankDetail } = require('../../../api/adminStatistics.js');

Page({
  data: {
    safeAreaTop: 0,
    merchantId: '',
    month: '',
    statusList: [],
    overviewList: [],
    loading: false
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const safeTop = systemInfo.safeArea ? systemInfo.safeArea.top : (systemInfo.statusBarHeight || 0);
    const merchantId = options.id != null ? String(options.id) : '';
    const month = options.month ? decodeURIComponent(options.month) : '';
    const prefetched = options.prefetched === '1';
    const facilityName = options.name ? decodeURIComponent(options.name) : '';
    const isMerchant = !facilityName.includes('党群');

    this.setData({ safeAreaTop: safeTop, merchantId, month, isMerchant });

    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && typeof eventChannel.on === 'function') {
      eventChannel.on('planData', (data) => {
        if (data) {
          this.processAndSetData({
            statusCounts: data.statusCounts,
            overviewList: data.overviewList
          });
        }
      });
    }

    if (merchantId && !prefetched) {
      this.fetchMonthlyData(merchantId, month, true);
    }
  },

  handleBack() {
    wx.navigateBack({ delta: 1 });
  },

  fetchMonthlyData(merchantId, month, showLoading) {
    if (this.data.loading) {
      return;
    }
    this.setData({ loading: true });
    if (showLoading) {
      wx.showLoading({ title: '加载中...' });
    }

    const params = { id: merchantId };
    if (month) {
      params.month = month;
    }

    getMerchantRankDetail(params)
      .then((res) => {
        const plan = (res.data && res.data.planProgress) || {};
        this.processAndSetData({
          statusCounts: plan.statusCounts,
          overviewList: plan.overviewList
        });
      })
      .catch((err) => {
        console.error('fetchMonthlyData failed', err);
      })
      .finally(() => {
        if (showLoading) {
          wx.hideLoading();
        }
        this.setData({ loading: false });
      });
  },

  processAndSetData(data) {
    const counts = Array.isArray(data.statusCounts) ? data.statusCounts : [0, 0, 0];
    const ended = Number(counts[0]) || 0;
    const processing = Number(counts[1]) || 0;
    const pending = Number(counts[2]) || 0;

    const statusTemplate = [
      {
        title: '进行中',
        type: 'ongoing',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/ongoing_icon.png',
        color: '#FF9500',
        count: processing
      },
      {
        title: '已结束',
        type: 'finished',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/finished_icon.png',
        color: '#34C759',
        count: ended
      },
      {
        title: '待完成',
        type: 'pending',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/ongoing_icon.png',
        color: '#F96841',
        count: pending
      }
    ];

    const statusList = statusTemplate;

    const rawList = Array.isArray(data.overviewList) ? data.overviewList : [];
    const overviewList = rawList.map((item, index) => {
      const iconType = Number(item.icon);
      const isCoupon = [3, 4, 5].includes(iconType);
      return {
        id: item.id != null ? item.id : index + 1,
        title: item.title != null ? String(item.title) : '',
        subTitle: item.subTitle != null ? String(item.subTitle) : '',
        status: item.status != null ? String(item.status) : '',
        iconPath: this.getIconPath(iconType),
        statusColor: this.getStatusColor(item.status),
        isCoupon: isCoupon,
        isMerchant: this.data.isMerchant
      };
    });

    this.setData({ statusList, overviewList });
  },

  getIconPath(iconType) {
    const type = Number(iconType);
    const map = {
      0: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon0.png',
      1: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon1.png',
      3: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon3.png',
      4: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon4.png',
      5: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon5.png'
    };
    return map[type] != null ? map[type] : map[1];
  },

  getStatusColor(status) {
    const map = {
      进行中: '#FFA227',
      已结束: '#B8D605',
      待完成: '#F96841'
    };
    return map[status] || '#999999';
  },

  showCouponRule(e) {
    const rule = e.currentTarget.dataset.rule || '暂无详细使用须知';
    wx.showModal({
      title: '使用须知',
      content: rule,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#FF9500'
    });
  }
});
