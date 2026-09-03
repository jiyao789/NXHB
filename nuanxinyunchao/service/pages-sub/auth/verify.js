import { getPhoneValidCode, registerMerchant, getLoginUserInfo } from '../../api/auth.js';
import { getStreetList } from '../../api/user.js';

Page({
  data: {
    safeAreaTop: 0,
    isSubmitting: false,
    countdown: 0,
    formData: {
      shopName: '',
      creditCode: '',
      address: '',
      locationName: '',
      latitude: '',
      longitude: '',
      addressDetail: '',
      contactName: '',
      contactPhone: '',
      mobile: '',
      password: '',
      code: '',
      rolesId: 0, // 默认商户
      invitationCode: '', // 党群邀请码
      openingHours: '', // 营业时间
    },
    showNoticeModal: false,
    isAgreed: false,
    validCodeReqNo: '',
    streetList: [], // 街道名称列表 ( Picker 用)
    orgs: [], // 原始组织机构数据
    streetIndex: null, // 当前选中的街道索引
    // --- 营业时间抽屉相关数据 ---
    showHoursDrawer: false,
    weekOptions: [
      { label: '一', value: 1, selected: false },
      { label: '二', value: 2, selected: false },
      { label: '三', value: 3, selected: false },
      { label: '四', value: 4, selected: false },
      { label: '五', value: 5, selected: false },
      { label: '六', value: 6, selected: false },
      { label: '日', value: 7, selected: false }
    ],
    tempStartTime: '09:00',
    tempEndTime: '18:00'
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    
    // 支持从参数中引导角色 (例如 role=7 代表党群中心)
    let initialRolesId = 0; // 默认商户
    if (options && options.role === '7') {
      initialRolesId = 7;
    }

    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 0,
      showNoticeModal: true,
      'formData.rolesId': initialRolesId
    });
    this.fetchOrgs();
  },

  async fetchOrgs() {
    try {
      // 切换为拉取 roles_id=6 的街道管理员列表（后端已处理地理全称映射）
      const res = await getStreetList();
      if (res.code === 200 || res.code === 0) {
        const streetOrgs = res.data || [];
        const streetList = streetOrgs.map(item => item.name);
        
        this.setData({
          orgs: streetOrgs,
          streetList: streetList
        });
        console.log('街道全称加载成功:', streetList);
      }
    } catch (err) {
      console.error('获取街道列表失败', err);
    }
  },

  handleStreetChange(e) {
    const index = e.detail.value;
    const selectedOrg = this.data.orgs[index];
    this.setData({
      streetIndex: index,
      'formData.orgId': selectedOrg.id
    });
  },

  handleBack() {
    wx.navigateBack();
  },

  confirmNotice() {
    this.setData({ showNoticeModal: false });
  },

  toggleAgree() {
    this.setData({ isAgreed: !this.data.isAgreed });
  },

  navToAgreement() {
    wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview?type=service' });
  },

  navToPrivacy() {
    wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview?type=privacy' });
  },

  switchRole(e) {
    const role = parseInt(e.currentTarget.dataset.role);
    this.setData({
      'formData.rolesId': role,
      'formData.invitationCode': ''
    });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // --- 营业时间抽屉逻辑 ---
  openHoursDrawer() {
    this.setData({ showHoursDrawer: true });
  },

  closeHoursDrawer() {
    this.setData({ showHoursDrawer: false });
  },

  toggleWeek(e) {
    const index = e.currentTarget.dataset.index;
    const { weekOptions } = this.data;
    weekOptions[index].selected = !weekOptions[index].selected;
    this.setData({ weekOptions });
  },

  onStartTimeChange(e) {
    this.setData({ tempStartTime: e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ tempEndTime: e.detail.value });
  },

  confirmHours() {
    const { weekOptions, tempStartTime, tempEndTime } = this.data;
    const selectedWeeks = weekOptions.filter(w => w.selected);
    
    if (selectedWeeks.length === 0) {
      return wx.showToast({ title: '请选择营业日期', icon: 'none' });
    }

    let dayStr = '';
    if (selectedWeeks.length === 7) {
      dayStr = '每天';
    } else {
      dayStr = selectedWeeks.map(w => '周' + w.label).join(',');
    }

    const openingHours = `${dayStr} ${tempStartTime}-${tempEndTime}`;
    this.setData({
      'formData.openingHours': openingHours,
      showHoursDrawer: false
    });
  },

  // --- 地图选点核心逻辑 ---
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        console.log('地图选点成功:', res);
        this.setData({
          'formData.address': res.address,      // 标准地址 (如: 长宁区江苏路XXX号)
          'formData.locationName': res.name,    // 点位名称 (如: 某某商务楼)
          'formData.latitude': res.latitude,    // 纬度
          'formData.longitude': res.longitude,  // 经度
        });
      },
      fail: (err) => {
        console.warn('地图选点取消或失败:', err);
      }
    });
  },

  async handleSendCode() {
    const phone = this.data.formData.mobile;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
    }

    wx.showLoading({ title: '发送中...' });
    try {
      const res = await getPhoneValidCode({ 
        phone: phone,
        isRegister: true
      });
      wx.hideLoading();
      if (res.code === 200 || res.code === 0) {
        wx.showToast({ title: '验证码已发送', icon: 'success' });
        this.setData({ 
          validCodeReqNo: res.data,
          countdown: 60 
        });
        this.timer = setInterval(() => {
          if (this.data.countdown > 1) {
            this.setData({ countdown: this.data.countdown - 1 });
          } else {
            clearInterval(this.timer);
            this.setData({ countdown: 0 });
          }
        }, 1000);
      } else {
        wx.showToast({ title: res.msg || '获取失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      // 报错展示已由 http.js 拦截器统一处理，此处仅负责逻辑阻断
      console.warn('获取验证码失败:', err);
    }
  },

  async handleSubmit() {
    const { formData, isAgreed, validCodeReqNo } = this.data;
    const isPartyCenter = formData.rolesId === 7;

    if (!formData.shopName) return wx.showToast({ title: isPartyCenter ? '请输入中心全称' : '请输入商户名称', icon: 'none' });
    
    if (!isPartyCenter) {
      if (!formData.creditCode || formData.creditCode.length !== 18) {
        return wx.showToast({ title: '请输入18位信用代码', icon: 'none' });
      }
    } else {
      if (!formData.invitationCode) {
        return wx.showToast({ title: '请输入邀请码', icon: 'none' });
      }
    }

    if (!formData.contactName) return wx.showToast({ title: '请输入负责人姓名', icon: 'none' });
    if (!formData.orgId) return wx.showToast({ title: '请选择所属街道', icon: 'none' });
    if (!formData.mobile) return wx.showToast({ title: '请输入登录手机号', icon: 'none' });
    if (!formData.password) return wx.showToast({ title: '请设置密码', icon: 'none' });
    if (!formData.code) return wx.showToast({ title: '请输入验证码', icon: 'none' });
    if (!formData.openingHours) return wx.showToast({ title: '请选择营业时间', icon: 'none' });
    if (!isAgreed) return wx.showToast({ title: '请仔细阅读协议', icon: 'none' });

    this.setData({ isSubmitting: true });

    const registerParam = {
      name: formData.shopName,
      phone: formData.mobile,
      account: formData.mobile,
      password: formData.password,
      code: formData.code,
      validCodeReqNo: validCodeReqNo,
      invitationCode: formData.invitationCode,
      device: 'MINI_PROGRAM',
      rolesId: formData.rolesId,
      orgId: formData.orgId,
      // --- 补全精准定位模型 ---
      latitude: formData.latitude,
      longitude: formData.longitude,
      locationName: formData.locationName,
      address: formData.address,
      addressDetail: formData.addressDetail,
      extendInfo: {
        shopName: formData.shopName,
        creditCode: formData.creditCode,
        address: formData.address,
        addressDetail: formData.addressDetail,
        locationName: formData.locationName,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone || formData.mobile, // 默认业务电话为登录手机
        source: 'service_provider_app',
        invitationCode: formData.invitationCode,
        openingHours: formData.openingHours
      }
    };

    try {
      const regRes = await registerMerchant(registerParam);
      if (regRes.code === 200 || regRes.code === 0) {
        // 重要：如果后端开启了审核机制，返回的 token 可能是 null
        const token = regRes.data;
        
        if (!token) {
          this.setData({ 
            isAuditing: true,
            isSubmitting: false 
          });
          return;
        }

        wx.setStorageSync('service_token', token);
        const app = getApp();
        app.globalData.token = token;

        // 注册成功后自动执行单次登录信息查询
        const userRes = await getLoginUserInfo();
        this.setData({ isSubmitting: false });

        if (userRes.code === 200 || userRes.code === 0) {
          const authResult = userRes.data;
          // 3. 构建多角色用户信息对象 (标准化结构，对齐 logo.js 逻辑)
          const userInfo = {
            userId: authResult.userId,
            username: authResult.account,
            nickname: authResult.name,
            role: authResult.rolesId === 6 ? 'street' : (authResult.rolesId === 0 ? 'merchant' : (authResult.rolesId === 7 ? 'party-center' : 'user')),
            avatar: authResult.avatar || 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
            phone: authResult.phone,
            rolesId: authResult.rolesId,
            orgName: authResult.orgName,
            address: authResult.address,
            contactName: authResult.contactName,
            contactPhone: authResult.contactPhone,
            realNameStatus: authResult.realNameStatus || '已认证',
            certValidity: authResult.certValidity || '2030-10-15',
            createTime: authResult.createTime || '',
            birthday: authResult.birthday || '',
            homeAddress: authResult.homeAddress || authResult.address || '',
            signature: authResult.signature || '',
            openingHours: authResult.openingHours || '',
            imageCollection: Array.isArray(authResult.imageCollection) ? authResult.imageCollection : JSON.parse(authResult.imageCollection || '[]')
          };

          app.globalData.userInfo = userInfo;
          wx.setStorageSync('service_userInfo', userInfo);
          
          wx.showToast({ title: '入驻申请成功', icon: 'success' });
          setTimeout(() => {
            wx.reLaunch({ url: '/nuanxinyunchao/service/pages/index/index' });
          }, 1500);
        }
      } else {
        this.setData({ isSubmitting: false });
        wx.showToast({ title: regRes.msg || '注册失败', icon: 'none' });
      }
    } catch (err) {
      this.setData({ isSubmitting: false });
      // 报错展示已由 http.js 拦截器统一处理
      console.warn('登录/注册提交失败:', err);
    }
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  }
})
