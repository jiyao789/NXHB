import { getSystemMessage, clearRemind } from '../../api/notification';

Page({
  data: {
    statusBarHeight: 20,
    messageList: []
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
  },

  onShow() {
    this.fetchData();
  },

  async fetchData() {
    try {
      const res = await getSystemMessage();
      if (res && res.data) {
        this.setData({
          messageList: res.data || []
        });
      }
    } catch(e) {
      console.error('Failed to fetch system messages', e);
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.messageList.find(i => i.id === id);
    if (!item) return;

    if (item.type === 'street_redemption') {
      const detailItem = {
        id: item.id,
        title: item.title,
        displayTime: item.time,
        desc: `项目：${item.projectName}\n日期：${item.date}\n时间：${item.slotTime}\n用户姓名：${item.userName}`,
        image: item.image
      };
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/message/detail?item=${encodeURIComponent(JSON.stringify(detailItem))}`
      });
    } else if (item.type === 'street_merchant') {
      const auditData = {
        id: item.id,
        type: 'application',
        merchantName: item.merchantName || '未知商户',
        address: item.address || '',
        leaderName: item.leaderName || '',
        phone: item.phone || '',
        unifiedCode: item.unifiedCode || '',
        time: item.time,
        status: item.auditStatus === 'ENABLE' ? 1 : (item.auditReply ? 2 : 0)
      };
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/create/audit-detail/index?data=${encodeURIComponent(JSON.stringify(auditData))}`
      });
    } else if (item.type === 'street_coupon') {
      const auditData = {
        id: item.id,
        type: 'coupon',
        couponTypeName: item.coupon ? item.coupon.typeText : '优惠券',
        title: item.coupon ? item.coupon.title : '未命名券',
        couponValue: item.coupon ? item.coupon.value : '0',
        minConsume: item.coupon && item.coupon.minConsume ? item.coupon.minConsume : 0,
        totalQuantity: item.coupon && item.coupon.totalQuantity !== undefined ? item.coupon.totalQuantity : 9999,
        validityType: 1,
        fixedStartTime: item.time,
        fixedEndTime: item.coupon ? item.coupon.validUntil : '',
        daysAfterAcquire: 0,
        useScope: 1,
        merchantName: item.merchantName || '未知商户',
        address: item.address || '',
        leaderName: item.leaderName || '',
        unifiedCode: item.unifiedCode || '',
        time: item.time,
        status: Number(item.auditStatus || 0),
        raw: {
            templateType: item.coupon && item.coupon.typeText === '折扣券' ? 2 : 1
        }
      };
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/create/audit-detail/index?data=${encodeURIComponent(JSON.stringify(auditData))}`
      });
    } else if (item.type === 'admin_remind') {
      clearRemind().catch(e => console.error(e));
      wx.navigateTo({
        url: '/nuanxinyunchao/service/pages-sub/create/audit-list'
      });
    }
  }
});
