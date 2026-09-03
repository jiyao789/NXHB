import { updateUserInfo, getLoginUserInfo } from '../../../api/auth.js';

const { getDirectUrl } = require('../../../utils/http.js');

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    userInfo: {},
    isEditing: false,
    profileList: [],
    // 营业时间选择器数据
    openingHoursRange: [],
    openingHoursIndex: [],
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

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
    this.initUserInfo();
  },

  initUserInfo() {
    const userInfo = wx.getStorageSync('service_userInfo') || {};
    // 针对服务侧（街道/商户/党群）定制展示字段
    const profileList = [
      { key: 'realNameStatus', label: '认证状态', value: userInfo.realNameStatus || '已认证', readonly: true },
      { key: 'contactPhone', label: '咨询电话', value: userInfo.contactPhone || userInfo.mobile || '' },
    ];

    const isMerchant = userInfo.role === 'merchant' || userInfo.rolesId === 0;
    const isParty = userInfo.rolesId === 7;

    // 入驻时间：街道可以不用有，商户才有，且不可编辑
    if (isMerchant) {
      profileList.push({ key: 'createTime', label: '入驻时间', value: userInfo.createTime || '', readonly: true });
    }

    profileList.push(
      { key: 'address', label: '机构地址', value: userInfo.address || userInfo.homeAddress || '' },
      { key: 'signature', label: '宣传语', value: userInfo.signature || '' }
    );

    // 新增：营业时间 (商户和党群中心)
    if (isMerchant || isParty) {
      let hoursValue = userInfo.openingHours || '每天 09:00-18:00';
      profileList.push({ key: 'openingHours', label: '营业时间', value: hoursValue });
      // 尝试解析并设置抽屉初始状态
      this.parseOpeningHoursToDrawer(hoursValue);
    }

    this.setData({
      userInfo,
      profileList,
      // 为党群中心初始化图片集
      imageCollection: isParty ? (userInfo.imageCollection || []) : []
    });
  },

  handleBack() {
    wx.navigateBack();
  },

  toggleEdit() {
    this.setData({ isEditing: true });
  },

  onInputChange(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`profileList[${index}].value`]: value
    });
  },

  async saveProfile() {
    const { profileList, userInfo, imageCollection } = this.data;

    // 1. 数据校验
    const contactPhone = profileList.find(i => i.key === 'contactPhone').value;
    if (contactPhone && !/^1[3-9]\d{9}$/.test(contactPhone) && !/^0\d{2,3}-?\d{7,8}$/.test(contactPhone)) {
      if (!/^JD_/.test(contactPhone)) {
        return wx.showToast({ title: '联系电话格式不正确', icon: 'none' });
      }
    }

    wx.showLoading({ title: '正在保存...' });

    try {
      // 2. 映射字段到后端接口参数
      const updateParam = {
        avatar: userInfo.avatar,
        contactPhone: profileList.find(i => i.key === 'contactPhone').value,
        homeAddress: profileList.find(i => i.key === 'address').value,
        signature: profileList.find(i => i.key === 'signature').value,
        openingHours: profileList.find(i => i.key === 'openingHours')?.value || '',
        imageCollection: JSON.stringify(imageCollection || [])
      };

      // 3. 调用更新接口
      const updateRes = await updateUserInfo(updateParam);

      if (updateRes.code === 200 || updateRes.code === 0) {
        // 4. 重新获取用户信息刷新缓存
        const userRes = await getLoginUserInfo();
        if (userRes.code === 200 || userRes.code === 0) {
          const authResult = userRes.data;
          const newUserInfo = {
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

          wx.setStorageSync('service_userInfo', newUserInfo);
          this.setData({ isEditing: false });
          this.initUserInfo();
          wx.showToast({ title: '更新成功', icon: 'success' });
        }
      } else {
        wx.showToast({ title: updateRes.msg || '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '请求失败', icon: 'none' });
      console.error(err);
    } finally {
      wx.hideLoading();
    }
  },

  uploadSingleImage(filePath) {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const token = wx.getStorageSync('service_token') || (app.globalData && app.globalData.token);
      const directUrl = getDirectUrl();
      
      const uploadUrl = directUrl + '/dev/file/upload';

      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + token,
          'clientToken': token,
          'token': token
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            console.log('上传图片返回数据', data.data.downloadPath);
            const result = data.data.downloadPath.replace(/^https?:\/\/[^\/]+/, '');
            console.log('上传图片地址', directUrl + result);
            const url = directUrl + result;
            if (data.code === 200 || data.code === 0) {
              resolve(url);
            } else {
              reject(data);
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: (err) => {
          console.error('wx.uploadFile 失败:', err);
          reject(err);
        }
      });
    });
  },

  editAvatar() {
    if (!this.data.isEditing) return;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        try {
          const imageUrl = await this.uploadSingleImage(tempFilePath);
          this.setData({ 'userInfo.avatar': imageUrl });
          wx.hideLoading();
          wx.showToast({ title: '头像上传成功', icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          console.error('头像上传失败', err);
          wx.showToast({ title: '头像上传失败', icon: 'none' });
        }
      }
    });
  },

  // 党群图片集选择
  chooseCollection() {
    if (!this.data.isEditing) return;
    const { imageCollection } = this.data;
    if (imageCollection.length >= 9) {
      return wx.showToast({ title: '最多上传9张图片', icon: 'none' });
    }

    wx.chooseMedia({
      count: 9 - imageCollection.length,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' });
        try {
          const newImages = [];
          for (const file of res.tempFiles) {
            const url = await this.uploadSingleImage(file.tempFilePath);
            newImages.push(url);
          }
          this.setData({
            imageCollection: [...imageCollection, ...newImages]
          });
          wx.hideLoading();
        } catch (err) {
          wx.hideLoading();
          console.error('图片上传失败', err);
          wx.showToast({ title: '图片上传失败', icon: 'none' });
        }
      }
    });
  },

  // 移除图片集中的单张图片
  removeCollectionImg(e) {
    if (!this.data.isEditing) return;
    const { index } = e.currentTarget.dataset;
    const { imageCollection } = this.data;
    imageCollection.splice(index, 1);
    this.setData({ imageCollection });
  },

  // 解析营业时间字符串为抽屉状态
  parseOpeningHoursToDrawer(str) {
    try {
      if (!str) return;
      const parts = str.split(' ');
      if (parts.length < 2) return;
      
      const dayPart = parts[0];
      const timePart = parts[1];
      const times = timePart.split('-');
      
      const weekOptions = this.data.weekOptions.map(opt => ({ ...opt, selected: false }));
      
      if (dayPart === '每天') {
        weekOptions.forEach(opt => opt.selected = true);
      } else if (dayPart.includes('至')) {
        const range = dayPart.split('至');
        const startDay = range[0].replace('周', '');
        const endDay = range[1].replace('周', '');
        const days = ['一', '二', '三', '四', '五', '六', '日'];
        const startIdx = days.indexOf(startDay);
        const endIdx = days.indexOf(endDay);
        if (startIdx > -1 && endIdx > -1) {
          for (let i = startIdx; i <= endIdx; i++) {
            weekOptions[i].selected = true;
          }
        }
      } else {
        const selectedDays = dayPart.split(',').map(d => d.replace('周', ''));
        weekOptions.forEach(opt => {
          if (selectedDays.includes(opt.label)) {
            opt.selected = true;
          }
        });
      }
      
      this.setData({
        weekOptions,
        tempStartTime: times[0] || '09:00',
        tempEndTime: times[1] || '18:00'
      });
    } catch(e) {
      console.error('解析营业时间失败', e);
    }
  },

  // --- 营业时间抽屉逻辑 ---
  openHoursDrawer() {
    if (!this.data.isEditing) return;
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
    const { weekOptions, tempStartTime, tempEndTime, profileList } = this.data;
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
    
    const hIdx = profileList.findIndex(i => i.key === 'openingHours');
    if (hIdx > -1) {
      this.setData({
        [`profileList[${hIdx}].value`]: openingHours,
        showHoursDrawer: false
      });
    }
  }
});