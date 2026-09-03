import { getInvitationList, generateInvitation, deleteInvitations } from '../../../api/auth.js';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    centerName: '',
    list: [],
    isRefreshing: false,
    page: 1,
    size: 50
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

  handleInput(e) {
    this.setData({ centerName: e.detail.value });
  },

  // 获取列表
  async fetchList() {
    this.setData({ isRefreshing: true });
    try {
      const res = await getInvitationList({
        current: this.data.page,
        size: this.data.size
      });
      if (res.code === 200 || res.code === 0) {
        // 后端返回的是 MyBatis Plus 的 Page 对象，数据在 records 中
        this.setData({ 
          list: res.data.records || [] 
        });
      }
    } catch (err) {
      console.error('获取列表失败', err);
    } finally {
      this.setData({ isRefreshing: false });
    }
  },

  // 生成邀请码
  async handleGenerate() {
    if (!this.data.centerName) {
      return wx.showToast({ title: '请输入中心名称', icon: 'none' });
    }

    wx.showLoading({ title: '生成中...' });
    try {
      const res = await generateInvitation({
        centerName: this.data.centerName
      });
      if (res.code === 200 || res.code === 0) {
        wx.showToast({ title: '生成成功', icon: 'success' });
        this.setData({ centerName: '' });
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
            const delRes = await deleteInvitations([id]);
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

  // 复制口令
  handleCopy(e) {
    const code = e.currentTarget.dataset.code;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '邀请码已复制' });
      }
    });
  }
})
