import { getCouponPage } from '../../api/coupon.js';
import { getClientUserPage } from '../../api/user.js';

Page({
  data: {
    statusBarHeight: 20,
    isMerchant: false,
    isLoading: false,

    // 状态分类
    statusTabs: [
      { name: '全部', value: 'all' },
      { name: '待审核', value: '0' },
      { name: '已通过', value: '1' },
      { name: '未通过', value: '2' },
    ],
    currentStatus: 'all',
    showReasonDrawer: false,
    currentReason: '',
    currentItem: null,

    // 内容分类
    typeTabs: [],
    currentType: 'coupon', // 默认选中劵类

    // 真实数据列表
    rawList: [],
    // 渲染用的列表数据
    filteredList: [],
    // 下拉刷新状态
    refresherTriggered: false
  },


  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const userInfo = wx.getStorageSync('service_userInfo') || {};
    // 修正：项目统一使用 rolesId (5:商户, 6:街道)
    const rolesId = userInfo.rolesId;
    const isMerchant = rolesId === 0;

    const streetTabs = [
      { name: '劵类', value: 'coupon' },
      { name: '入驻申请', value: 'application' }
    ];
    const merchantTabs = [
      { name: '劵类', value: 'coupon' }
    ];

    const pendingLabel = isMerchant ? '审核中' : '待审核';
    const statusTabs = [
      { name: '全部', value: 'all' },
      { name: pendingLabel, value: '0' },
      { name: '未通过', value: '2' },
      { name: '已通过', value: '1' },
    ];

    const currentTabs = isMerchant ? merchantTabs : streetTabs;

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isMerchant,
      typeTabs: currentTabs,
      currentType: 'coupon',
      statusTabs: statusTabs
    });
  },

  onShow() {
    // 显式清空列表，让用户感知到正在“刷新”
    this.setData({
      rawList: [],
      filteredList: []
    });
    this.fetchData();
  },

  async fetchData() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });
    wx.showLoading({ title: '获取中...' });

    try {
      if (this.data.currentType === 'coupon') {
        const params = {
          size: 100 // 当前获取全量，后端已做 merchantId 过滤
        };
        // 如果是商户，只看自己的
        if (this.data.isMerchant) {
          const userInfo = wx.getStorageSync('service_userInfo') || {};
          // 修正：项目中的用户 ID 字段名为 userId
          if (userInfo.userId) {
            params.merchantId = userInfo.userId;
          }
        }

        // 增加：状态过滤联动后端
        if (this.data.currentStatus !== 'all') {
          params.auditStatus = Number(this.data.currentStatus);
        }

        const res = await getCouponPage(params);
        if (res && res.data && res.data.records) {
          const raw = res.data.records.map(item => {
            let couponTypeName = '通用券';
            const types = { 1: '满减券', 2: '折扣券', 3: '代金券' };
            couponTypeName = types[item.templateType] || '优惠券';

            return {
              id: item.id,
              type: 'coupon',
              title: item.couponName,
              time: item.createTime || '加载中...',
              location: item.merchantName || '商户发布',
              status: item.auditStatus === null ? 0 : Number(item.auditStatus),
              couponTypeName: couponTypeName,
              rejectReason: item.auditReply || '',

              // --- 补全详情页所需字段 ---
              merchantName: item.merchantName,
              address: item.merchantAddress,
              leaderName: item.merchantContact,
              unifiedCode: item.merchantCreditCode,

              // --- 优惠券核心属性 (详情展示用) ---
              couponValue: item.couponValue,
              minConsume: item.minConsume,
              totalQuantity: item.totalQuantity,
              validityType: item.validityType,
              fixedStartTime: item.fixedStartTime,
              fixedEndTime: item.fixedEndTime,
              daysAfterAcquire: item.daysAfterAcquire,
              useScope: item.useScope,
              productName: item.productName,

              raw: item
            };
          });
          this.setData({ rawList: raw });
        } else {
          this.setData({ rawList: [] });
        }
      } else if (this.data.currentType === 'application') {
        const userInfo = wx.getStorageSync('service_userInfo') || {};
        const params = {
          size: 100
          // 移除 rolesId 过滤，以便同时获取商户(0)和党群中心(7)的入驻申请
        };

        // 动态状态映射
        if (this.data.currentStatus === '0') {
          params.userStatus = 'DISABLED'; // 待审核
        } else if (this.data.currentStatus === '1') {
          params.userStatus = 'ENABLE';   // 已通过
        } else if (this.data.currentStatus === '2') {
          params.userStatus = 'DISABLED'; // 未通过通常也是禁用状态，后端会配合过滤
        }

        // 地域隔离核心：带上当前管理员所属街道 ID
        if (userInfo.orgId) {
          params.orgId = userInfo.orgId;
        }

        const res = await getClientUserPage(params);
        if (res && res.data && res.data.records) {
          const raw = res.data.records.map(item => {
            let ext = {};
            try { ext = JSON.parse(item.extJson || '{}'); } catch (e) { }
            return {
              id: item.id,
              type: 'application',
              title: ext.shopName || item.name || '待审批商户',
              merchantName: ext.shopName || item.name,
              address: ext.address || '',
              leaderName: ext.contactName || '',
              phone: ext.contactPhone || item.account,
              unifiedCode: ext.creditCode || '',
              time: item.createTime || '',
              location: '商户入驻申请',
              // 修正：完善全状态映射
              status: item.userStatus === 'ENABLE' ? 1 : (ext.auditReply ? 2 : 0),
              couponTypeName: '入驻申请',
              rejectReason: ext.auditReply || '',
              raw: item
            };
          });
          this.setData({ rawList: raw });
        } else {
          this.setData({ rawList: [] });
        }
      }
      this.filterData();
    } catch (err) {
      console.error('获取列表失败', err);
      this.setData({ rawList: [] });
      this.filterData();
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  switchStatus(e) {
    const val = e.currentTarget.dataset.val;
    if (this.data.currentStatus === val) return;

    // 切换状态时重新请求后端，实现真正的隔离和实时数据
    this.setData({
      currentStatus: val,
      rawList: [],      // 清空原始数据
      filteredList: []  // 立即清空渲染列表，防止残留
    }, () => {
      this.fetchData();
    });
  },

  switchType(e) {
    const val = e.currentTarget.dataset.val;
    // 切换内容类型时立即清空所有列表数据
    this.setData({
      currentType: val,
      rawList: [],
      filteredList: []
    });
    this.fetchData();
  },

  filterData() {
    const { rawList, currentStatus } = this.data;

    const list = rawList.filter(item => {
      if (currentStatus === 'all') return true;
      return String(item.status) === currentStatus;
    }).map(item => {
      let statusName = '';
      let statusColorClass = '';
      if (item.status === 1) {
        statusName = '已通过';
        statusColorClass = 'status-green';
      } else if (item.status === 0) {
        statusName = this.data.isMerchant ? '审核中' : '待审核';
        statusColorClass = 'status-yellow';
      } else if (item.status === 2) {
        statusName = '未通过';
        statusColorClass = 'status-red';
      }

      return {
        ...item,
        statusName,
        statusColorClass
      };
    });

    this.setData({ filteredList: list });
  },

  async onRefresh() {
    if (this.data.isLoading) return;
    this.setData({
      refresherTriggered: true
    });
    await this.fetchData();
    this.setData({
      refresherTriggered: false
    });
  },

  toDetail(e) {

    const { item } = e.currentTarget.dataset;
    // 1. 街道身份且待审核 -> 跳转详情页
    if (!this.data.isMerchant && item.status === 0) {
      wx.navigateTo({
        url: `/nuanxinyunchao/service/pages-sub/create/audit-detail/index?data=${encodeURIComponent(JSON.stringify(item))}`
      });
      return;
    }

    // 2. 任何身份点击未通过 -> 显示原因
    if (item.status === 2) {
      this.setData({
        currentItem: item,
        currentReason: item.rejectReason || '非常抱歉，您的申请由于资料不全或信息有误，暂时无法通过审核。请检查并修改后再试。',
        showReasonDrawer: true
      });
    }
  },

  closeReasonDrawer() {
    this.setData({ showReasonDrawer: false });
  },

  handleResubmit() {
    const { currentItem } = this.data;
    if (!currentItem) return;
    this.closeReasonDrawer();
    const publishType = currentItem.type === 'application' ? 4 : (currentItem.type === 'coupon' ? 8 : 0);
    wx.navigateTo({
      url: `/nuanxinyunchao/service/pages-sub/create/publish?type=${publishType}&isEdit=true&data=${encodeURIComponent(JSON.stringify(currentItem))}`
    });
  }
});