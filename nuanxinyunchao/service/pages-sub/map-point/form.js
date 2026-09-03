const { httpGet, httpPost } = require('../../utils/http');

Page({
  data: {
    id: '',
    formData: {
      name: '',
      latitude: '',
      longitude: '',
      phone: '',
      businessHours: '',
      description: '',
      images: ''
    },
    submitting: false,
    showNameRule: false,
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
    if (options.id) {
      this.setData({ id: options.id });
      wx.setNavigationBarTitle({ title: '编辑点位' });
      const item = wx.getStorageSync('mapPointEdit');
      if (item && String(item.id) === String(options.id)) {
        this.setData({
          formData: {
            name: item.name || '',
            latitude: item.latitude || '',
            longitude: item.longitude || '',
            phone: item.phone || '',
            businessHours: item.businessHours || '',
            description: item.description || '',
            images: item.images || ''
          }
        });
      }
    }
  },
  
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.latitude': res.latitude,
          'formData.longitude': res.longitude,
          'formData.address': res.address // optional
        });
      }
    });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        this.uploadSingleImage(filePath).then(url => {
          this.setData({ 'formData.images': url });
        }).catch(err => {
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },
  
  removeImage() {
    this.setData({ 'formData.images': '' });
  },

  uploadSingleImage(filePath) {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const token = wx.getStorageSync('service_token') || (app.globalData && app.globalData.token);
      
      const { getDirectUrl } = require('../../utils/http.js');
      const directUrl = getDirectUrl();
      
      // 本地文件上传接口
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

  toggleNameRule() {
    this.setData({ showNameRule: !this.data.showNameRule });
  },

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

    const businessHours = `${dayStr} ${tempStartTime}-${tempEndTime}`;
    this.setData({
      'formData.businessHours': businessHours,
      showHoursDrawer: false
    });
  },

  validateForm() {
    const { name, latitude, longitude } = this.data.formData;
    if (!name.trim()) { wx.showToast({ title: '请输入点位名称', icon: 'none' }); return false; }
    if (!latitude || !longitude) { wx.showToast({ title: '请选择经纬度', icon: 'none' }); return false; }
    
    // Naming rule validation
    if (name.includes('卫生间') || name.includes('就餐点') || name.includes('就餐') || name.includes('厕所')) {
       // Just general check
    }
    
    return true;
  },

  async handleSubmit() {
    if (!this.validateForm() || this.data.submitting) return;
    
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });
    
    const url = this.data.id ? '/api/webapp/biz/mapPoint/edit' : '/api/webapp/biz/mapPoint/add';
    const payload = { ...this.data.formData, type: 3 };
    if (this.data.id) {
      payload.id = this.data.id;
    }
    
    try {
      await httpPost(url, payload);
      wx.showToast({ title: '保存成功', icon: 'success' });
      const pages = getCurrentPages();
      if (pages.length > 1) {
        const prevPage = pages[pages.length - 2];
        prevPage.setData({ isRefresh: true });
      }
      setTimeout(() => { wx.navigateBack(); }, 1500);
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '保存失败', icon: 'none' });
      this.setData({ submitting: false });
    } finally {
      wx.hideLoading();
    }
  }
});
