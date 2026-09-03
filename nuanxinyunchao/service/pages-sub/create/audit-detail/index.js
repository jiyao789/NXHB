import { enableUser, rejectUser } from '../../../api/user.js';
import { auditCoupon } from '../../../api/coupon.js';

Page({
  data: {
    statusBarHeight: 20,
    detail: {},
    showRejectDrawer: false,
    rejectReason: ''
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });

    if (options.data) {
      try {
        const detail = JSON.parse(decodeURIComponent(options.data));
        // 日期优化：截断冗余的 00:00:00 时间后缀，仅显示年月日
        if (detail.fixedStartTime) {
          detail.fixedStartTime = detail.fixedStartTime.split(' ')[0];
        }
        if (detail.fixedEndTime) {
          detail.fixedEndTime = detail.fixedEndTime.split(' ')[0];
        }
        this.setData({ detail });
      } catch (e) {
        console.error('Parse data error', e);
      }
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  async handleApprove() {
    const { detail } = this.data;
    wx.showLoading({ title: '提交中' });
    
    try {
      let res;
      if (detail.type === 'application') {
        res = await enableUser(detail.id);
      } else {
        // 优惠券审计通过 (auditStatus: 1)
        res = await auditCoupon({ 
          id: detail.id, 
          auditStatus: 1,
          auditReply: '审核通过'
        });
      }

      if (res.code === 200 || res.code === 0) {
        wx.hideLoading();
        wx.showToast({ title: '已通过审核', icon: 'success' });
        
        // 发送更新列表的消息
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel && eventChannel.emit) {
          eventChannel.emit('refreshList');
        }

        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        wx.showToast({ title: res.message || '通过失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '系统繁忙', icon: 'none' });
    }
  },

  handleReject() {
    this.setData({ showRejectDrawer: true });
  },

  onReasonInput(e) {
    this.setData({ rejectReason: e.detail.value });
  },

  closeDrawer() {
    this.setData({ showRejectDrawer: false });
  },

  async submitReject() {
    const { detail, rejectReason } = this.data;
    if (!rejectReason.trim()) {
      wx.showToast({
        title: '请填写驳回原因',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '提交中' });
    try {
      let res;
      if (detail.type === 'application') {
        // 商户入驻驳回
        res = await rejectUser({ 
          id: detail.id, 
          auditReply: rejectReason 
        });
      } else {
        // 优惠券驳回 (auditStatus: 2)
        res = await auditCoupon({ 
          id: detail.id, 
          auditStatus: 2, 
          auditReply: rejectReason 
        });
      }

      if (res.code === 200 || res.code === 0) {
        wx.hideLoading();
        this.setData({ showRejectDrawer: false });
        wx.showToast({ title: '已驳回', icon: 'success' });
        
        // 发送更新列表的消息
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel && eventChannel.emit) {
          eventChannel.emit('refreshList');
        }

        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        wx.showToast({ title: res.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '系统繁忙', icon: 'none' });
    }
  }
});
