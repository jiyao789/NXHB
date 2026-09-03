import { submitFeedback } from '../../../api/user.js';

Page({

  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    categories: [
      { label: '功能异常', value: 'func' },
      { label: '投诉建议', value: 'complain' },
      { label: '产品建议', value: 'advice' },
      { label: '其他', value: 'other' }
    ],
    selected: '',
    content: '',
    images: [],
    phone: '',
    MAX_IMAGE_COUNT: 6
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
  },

  handleBack() {
    wx.navigateBack();
  },

  // 选择问题类型
  handleCategorySelect(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ selected: val });
  },

  // 绑定问题描述输入
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 绑定手机号输入
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 添加图片
  addImage() {
    const { images, MAX_IMAGE_COUNT } = this.data;
    const remain = MAX_IMAGE_COUNT - images.length;

    if (remain <= 0) {
      wx.showToast({
        title: `最多上传 ${MAX_IMAGE_COUNT} 张图片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...images, ...newImages]
        });
      },
      fail: (err) => {
        console.warn('chooseMedia fail:', err);
      }
    });
  },

  // 预览图片
  preview(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  // 删除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '删除图片',
      content: '确定删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const images = this.data.images;
          images.splice(index, 1);
          this.setData({ images });
        }
      }
    });
  },

  // 提交表单
  async submit() {
    const { selected, content, images, phone } = this.data;

    if (!selected) {
      return wx.showToast({ title: '请选择问题类型', icon: 'none' });
    }

    if (!content || !content.trim()) {
      return wx.showToast({ title: '请填写问题描述', icon: 'none' });
    }

    wx.showLoading({ title: '提交中...', mask: true });

    try {
      // 1. 类型映射
      const typeMap = {
        'func': 1,
        'complain': 3,
        'advice': 4,
        'other': 5
      };
      const feedbackType = typeMap[selected] || 5;

      // 2. 截取内容作为标题
      const trimContent = content.trim();
      let title = trimContent.substring(0, 10);
      if (trimContent.length > 10) {
        title += '...';
      }

      // 3. 将本地图片转换为 base64
      const fs = wx.getFileSystemManager();
      const base64Images = [];
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const tempPath = images[i];
          if (tempPath.startsWith('http') || tempPath.startsWith('data:image')) {
            base64Images.push(tempPath);
          } else {
            const base64Data = fs.readFileSync(tempPath, 'base64');
            base64Images.push('data:image/jpg;base64,' + base64Data);
          }
        }
      }

      // 4. 构建后台所需参数
      const param = {
        feedbackType: feedbackType,
        title: title,
        content: trimContent,
        submitterPhone: phone || '',
        images: JSON.stringify(base64Images),
        priority: 1
      };

      const res = await submitFeedback(param);
      
      wx.hideLoading();
      if (res && (res.code === 200 || res.code === 0)) {
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: (res && (res.msg || res.message)) || '提交失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('提交反馈异常:', err);
      wx.showToast({ title: '提交异常，请稍后重试', icon: 'none' });
    }
  }
});