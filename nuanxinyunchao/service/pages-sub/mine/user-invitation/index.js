import { getUserInvitationList, generateUserInvitation, deleteUserInvitations, getUserInvitationDetail } from '../../../api/auth.js';
import drawQrcode from '../../../utils/weapp-qrcode.js';

// 用户端小程序 AppID
const USER_APPID = 'wxd316de2464744992';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    selectedRole: null,
    list: [],
    isRefreshing: false,
    showQrModal: false,
    qrModalItem: {},
    qrBigImagePath: '',
    showDetailModal: false,
    detailData: null,
    roleOptions: [
      { id: 1, name: '外卖员' },
      { id: 2, name: '快递员' },
      { id: 3, name: '网约车司机' },
      { id: 4, name: '货车司机' },
      { id: 5, name: '主播' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
    this.fetchList();
  },

  handleBack() {
    wx.navigateBack();
  },

  selectRole(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedRole: id });
  },

  // 获取列表
  async fetchList() {
    this.setData({ isRefreshing: true });
    try {
      const res = await getUserInvitationList({
        current: 1,
        size: 50
      });
      if (res.code === 200 || res.code === 0) {
        this.setData({ 
          list: res.data.records || [] 
        });
        // 延迟绘制列表中的小二维码
        setTimeout(() => this.drawSmallQrCodes(), 300);
      }
    } catch (err) {
      console.error('获取列表失败', err);
    } finally {
      this.setData({ isRefreshing: false });
    }
  },

  // 生成邀请码
  async handleGenerate() {
    if (!this.data.selectedRole) {
      return wx.showToast({ title: '请选择身份', icon: 'none' });
    }

    wx.showLoading({ title: '生成中...' });
    try {
      const res = await generateUserInvitation({
        rolesId: this.data.selectedRole
      });
      if (res.code === 200 || res.code === 0) {
        wx.showToast({ title: '生成成功', icon: 'success' });
        this.setData({ selectedRole: null });
        this.fetchList();
      } else {
        wx.showToast({ title: res.msg || '生成失败', icon: 'none' });
      }
    } catch (err) {
      console.error('生成失败', err);
    }
  },

  // 删除记录
  async handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这条邀请记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            const delRes = await deleteUserInvitations([id]);
            if (delRes.code === 200 || delRes.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.fetchList();
            }
          } catch (err) {
            console.error('删除失败', err);
          }
        }
      }
    });
  },

  // 复制邀请码
  handleCopy(e) {
    const code = e.currentTarget.dataset.code;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '邀请码已复制' });
      }
    });
  },

  // 查看注册人详情
  async showDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await getUserInvitationDetail(id);
      wx.hideLoading();
      if (res.code === 200 || res.code === 0) {
        this.setData({ showDetailModal: true, detailData: res.data });
      } else {
        wx.showToast({ title: res.msg || '获取详情失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('获取详情失败', err);
    }
  },

  // 关闭详情弹窗
  hideDetail() {
    this.setData({ showDetailModal: false, detailData: null });
  },

  // 预览证件图片
  previewDetailImage(e) {
    const url = e.currentTarget.dataset.url;
    const detail = this.data.detailData;
    let urls = [];
    if (detail && detail.userInfo) {
      if (detail.userInfo.certImages && detail.userInfo.certImages.length > 0) {
        urls = detail.userInfo.certImages;
      } else if (detail.userInfo.certImage) {
        urls = [detail.userInfo.certImage];
      }
    }
    wx.previewImage({ current: url, urls });
  },

  // 构造二维码内容（小程序路径格式）
  _buildQrContent(item) {
    return `https://nuanxinyuncao.life.code.lab/invite?code=${item.invitationCode}&role=${item.rolesId}`;
  },

  // 绘制列表中的小二维码并转为图片
  drawSmallQrCodes() {
    const list = this.data.list;
    list.forEach((item, index) => {
      const canvasId = `qr-small-${item.id}`;
      try {
        const query = this.createSelectorQuery();
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0] || !res[0].node) return;
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = wx.getWindowInfo().pixelRatio;
            canvas.width = 40 * dpr;
            canvas.height = 40 * dpr;
            ctx.scale(dpr, dpr);
            
            drawQrcode({
              canvas,
              canvasId,
              width: 40,
              padding: 2,
              text: this._buildQrContent(item),
              callback: () => {
                // 绘制完成后转为图片，用image展示避免canvas原生组件滚动漂移
                setTimeout(() => {
                  wx.canvasToTempFilePath({
                    canvas,
                    success: (tempRes) => {
                      const key = `list[${index}].qrImagePath`;
                      this.setData({ [key]: tempRes.tempFilePath });
                    },
                    fail: () => {}
                  });
                }, 100);
              }
            });
          });
      } catch (err) {
        // 忽略单个二维码绘制失败
      }
    });
  },

  // 展示二维码弹窗
  showQrCode(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ showQrModal: true, qrModalItem: item, qrBigImagePath: '' });
    
    // 延迟绘制大二维码并转为图片
    setTimeout(() => {
      const query = this.createSelectorQuery();
      query.select('#qr-big')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = 220 * dpr;
          canvas.height = 220 * dpr;
          ctx.scale(dpr, dpr);

          drawQrcode({
            canvas,
            canvasId: 'qr-big',
            width: 220,
            padding: 10,
            text: this._buildQrContent(item),
            callback: () => {
              // 转为图片展示，避免canvas原生组件漂移
              setTimeout(() => {
                wx.canvasToTempFilePath({
                  canvas,
                  success: (tempRes) => {
                    this.setData({ qrBigImagePath: tempRes.tempFilePath });
                  },
                  fail: () => {}
                });
              }, 100);
            }
          });
        });
    }, 200);
  },

  // 关闭二维码弹窗
  hideQrCode() {
    this.setData({ showQrModal: false, qrModalItem: {}, qrBigImagePath: '' });
  },

  // 保存二维码到相册
  saveQrCode() {
    const filePath = this.data.qrBigImagePath;
    if (!filePath) {
      wx.showToast({ title: '二维码未生成', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '保存失败，请检查权限', icon: 'none' });
      }
    });
  }
})
