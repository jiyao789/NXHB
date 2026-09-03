import { getServerHomePlanDetail, deleteServerHomePlan } from '../../api/serverHome.js';

Page({
  data: {
    safeAreaTop: 0,
    statusList: [],
    overviewList: [],
    isManageMode: false,
    selectedIds: [],
    showUsageModal: false,
    usageContent: ''
  },

  onLoad() {
    // 1. 获取安全区高度
    const systemInfo = wx.getSystemInfoSync();
    const safeTop = systemInfo.safeArea ? systemInfo.safeArea.top : systemInfo.statusBarHeight;
    this.setData({ safeAreaTop: safeTop || 0 });

    // 2. 加载月度数据
    this.loadMonthlyData();
  },

  // 返回上一页
  handleBack() {
    if (this.data.isManageMode) {
      this.setData({ isManageMode: false, selectedIds: [] });
      return;
    }
    wx.navigateBack({ delta: 1 });
  },

  // 加载数据
  async loadMonthlyData() {
    const app = getApp();
    const role = (app.globalData && app.globalData.userInfo && app.globalData.userInfo.role) || 'street';
    const isMerchant = role === 'merchant';

    wx.showLoading({ title: '加载中...' });

    try {
      const res = await getServerHomePlanDetail();
      if (res.code === 200 && res.data) {
        let rawData = res.data;
        // 商户去掉了“待完成”，后端返回的是 [进行中, 已结束]
        // 街镇目前还是 [已结束, 进行中, 待完成] -> month.js需要兼容
        if (isMerchant) {
          // 商户直接使用，statusTemplate 正好对应 [进行中, 已结束]
          this.processAndSetData(rawData, isMerchant);
        } else {
          // 街镇需要转换一下 [已结束, 进行中, 待完成] -> statusTemplate 是 [进行中, 已结束]
          // 确保 idx 0 是 进行中，idx 1 是 已结束
          let counts = rawData.statusCounts || [0, 0, 0];
          rawData.statusCounts = [counts[1], counts[0], counts[2]];
          this.processAndSetData(rawData, isMerchant);
        }
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 核心：在 JS 层处理所有颜色和图标映射
  processAndSetData(data, isMerchant) {
    // 1. 处理顶部状态卡片
    const statusTemplate = [
      { title: '进行中', type: 'ongoing', icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/ongoing_icon.png', color: '#FF9500' },
      { title: '已结束', type: 'finished', icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/finished_icon.png', color: '#34C759' }
    ];

    const processedStatusList = statusTemplate.map((item, idx) => ({
      ...item,
      count: data.statusCounts[idx] || 0
    }));

    // 2. 处理列表数据，且过滤掉“待完成”
    const processedOverviewList = data.overviewList
      .filter(item => item.status !== '待完成')
      .map(item => ({
        ...item,
        iconPath: this.getIconPath(item.icon),
        statusColor: this.getStatusColor(item.status)
      }));

    // 3. 统一渲染
    this.setData({
      statusList: processedStatusList,
      overviewList: processedOverviewList
    });
  },

  // 切换管理模式
  handleManage() {
    this.setData({
      isManageMode: !this.data.isManageMode,
      selectedIds: []
    });
  },

  // 选择/取消选择单项
  toggleSelectItem(e) {
    const id = e.currentTarget.dataset.id;
    let selectedIds = [...this.data.selectedIds];
    const index = selectedIds.indexOf(id);
    if (index > -1) {
      selectedIds.splice(index, 1);
    } else {
      selectedIds.push(id);
    }
    this.setData({ selectedIds });
  },

  // 全选/取消全选
  toggleSelectAll() {
    if (this.data.selectedIds.length === this.data.overviewList.length) {
      this.setData({ selectedIds: [] });
    } else {
      const allIds = this.data.overviewList.map(i => i.id);
      this.setData({ selectedIds: allIds });
    }
  },

  // 删除操作
  handleDelete() {
    const { selectedIds, overviewList } = this.data;
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '提示',
      content: `确定要删除选中的 ${selectedIds.length} 项吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            // 这里我们一个一个调用删除接口，或者后端提供批量接口。
            // 目前后端是 id 接收单个参数。
            for (let id of selectedIds) {
              await deleteServerHomePlan({ id });
            }
            wx.hideLoading();
            wx.showToast({ title: '删除成功' });
            this.setData({ isManageMode: false, selectedIds: [] });
            this.loadMonthlyData(); // 重新加载数据
          } catch (e) {
            wx.hideLoading();
            wx.showToast({ title: '部分删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 获取图标路径辅助函数
  getIconPath(iconType) {
    switch (iconType) {
      case 1: return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon1.png';
      case 2: return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon0.png';
      case 3: return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon3.png';
      case 4: return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon4.png';
      case 5: return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon5.png';
      default: return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/monthly/icon1.png';
    }
  },

  // 显示使用须知弹窗
  handleShowUsage(e) {
    if (this.data.isManageMode) return; // 管理模式下不弹窗
    const content = e.currentTarget.dataset.content;
    if (content) {
      this.setData({
        showUsageModal: true,
        usageContent: content
      });
    }
  },

  // 关闭使用须知弹窗
  handleCloseUsage() {
    this.setData({
      showUsageModal: false,
      usageContent: ''
    });
  },

  // 获取状态颜色辅助函数
  getStatusColor(status) {
    switch (status) {
      case '进行中': return '#FFA227';
      case '已结束': return '#B8D605';
      case '待完成': return '#F96841';
      default: return '#999999';
    }
  }
});