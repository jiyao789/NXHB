const { publishContent, addOrUpdateDraft, deleteDraft } = require('../../api/creator.js');
const { getSiteNests } = require('../../api/adminStatistics.js');

Page({
  data: {
    safeAreaTop: 20,
    publishType: 0,
    navTitle: '我要发布',
    // 条件状态控制
    isGloryLink: false,
    isCoupon: false,
    showSubtitle: false,
    showContent: false,
    showImages: false,
    showPreview: false,
    isLearning: false,
    isOfficial: false,
    isActivity: false,
    isNeedYou: false,
    isFormDirty: false, // 标记内容是否被修改

    // 占位符文本
    mainTitlePlaceholder: '',
    contentPlaceholder: '',

    // 表单数据
    formData: {
      cover: '',
      title1: '',
      summary: '',
      mainTitle: '',
      subtitle: '',
      link: '',
      content: '',
      images: [],

      // 优惠券专用
      scope: 'all',          // 'all' | 'specific'
      couponType: 'discount', // 'discount' | 'reduction' | 'voucher'
      pointsValue: '',
      discountValue: '',
      thresholdValue: '',
      reductionValue: '',
      voucherValue: '',
      productName: '',
      startTime: '',
      endTime: '',
      validDays: '',
      totalCount: '',
      notes: '',

      // 新增：活动专用字段
      activityName: '',
      activityIntro: '',
      activityStartDate: '',
      activityEndDate: '',
      activityWeekly: [], // 改为数组多选
      activityStartTime: '',
      activityEndTime: '',
      activityInventory: '',
      needPoints: 1, // 1表示是，0表示否
      activityPoints: '',

      // 新增：我们需要你专用字段
      tag: '',
      needYouStartDate: '',
      needYouEndDate: '',
      needYouStartTime: '',
      needYouEndTime: '',
      needYouAddress: '',
      needYouTarget: '',
      needYouRequirement: '',
      needYouContact: '',
      needYouAward: '',
      needYouInventory: '',
      isTop: false, // 是否推送到顶部轮播
      id: '', // 新增：用于编辑更新的记录 ID
      partyCenterId: '',
      partyCenterName: ''
    },
    userInfo: {},
    showPartyCenterDrawer: false,
    partySearchKey: '',
    partyCenters: [], // 原始全量列表
    filteredPartyCenters: [], // 搜索后的过滤列表
    showPointsRuleModal: false,
    pointsRuleTitle: '积分兑换规则',
    pointsRuleContent: '',
    showWeeklyDrawer: false,
    weekOptions: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    showTagDrawer: false,
    tagOptions: ['社区服务', '医疗辅助', '环境整治']
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : (sysInfo.statusBarHeight || 20)
    });

    if (options.type) {
      this.initFormState(Number(options.type));
    } else {
      this.initFormState(0);
    }

    // 获取缓存中的用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });

    // --- 新增：处理编辑回填逻辑 ---
    if (options.data) {
      try {
        const item = JSON.parse(decodeURIComponent(options.data));
        console.log('>>> 检测到回填数据:', item);
        this.fillForm(item);
      } catch (e) {
        console.error('解析回填数据失败:', e);
      }
    }
  },

  // 新增：回填表单数据
  fillForm(item) {
    if (!item) return;
    const { type, publishType } = item;
    const isCoupon = (type === 'coupon' || publishType === 8);
    const isDraft = !!item.mainTitle || !!item.activityName; // 简单判定是否为草稿表单数据

    let newFormData = { ...this.data.formData };

    if (isDraft) {
      // 1. 如果是草稿，直接合并 (因为存入时就是完整的 formData)
      newFormData = { ...newFormData, ...item };
    } else {
      // 2. 如果是正式记录回填 (兼容逻辑)
      newFormData = {
        ...newFormData,
        id: item.id || '',
        mainTitle: item.title || '',
        cover: item.raw ? (JSON.parse(item.raw.extJson || '{}').cover || '') : '',
        isTop: item.isTop || false
      };

      if (isCoupon) {
        const raw = item.raw || {};
        newFormData.content = raw.description || '';
        newFormData.couponType = raw.templateType === 2 ? 'discount' : (raw.templateType === 1 ? 'reduction' : 'voucher');
        newFormData.pointsValue = String(raw.pointsRequired || '');
        newFormData.discountValue = String(raw.couponValue || '');
        newFormData.thresholdValue = String(raw.minConsume || '');
        newFormData.reductionValue = String(raw.couponValue || '');
        newFormData.voucherValue = String(raw.couponValue || '');
        newFormData.productName = raw.productName || '';
        newFormData.scope = raw.useScope === 2 ? 'specific' : 'all';
        newFormData.startTime = (raw.fixedStartTime || '').split(' ')[0];
        newFormData.endTime = (raw.fixedEndTime || '').split(' ')[0];
        newFormData.validDays = String(raw.daysAfterAcquire || '');
        newFormData.totalCount = String(raw.totalQuantity || '');
        newFormData.notes = raw.description || raw.notes || '';
      }
    }

    this.setData({ formData: newFormData });
  },

  // 切换适用范围
  changeScope(e) {
    const scope = e.currentTarget.dataset.scope;
    this.setData({ 'formData.scope': scope });
  },

  // 切换优惠券类型
  changeType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'formData.couponType': type });
  },

  // 日期选择处理
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 初始化类型状态 (等价于 Vue 中的 computed)
  initFormState(type) {
    const isGloryLink = type === 6;
    const isCoupon = type === 8;
    const isOfficial = type === 10;
    const isActivity = type === 4;
    const isNeedYou = type === 2; // 新增：我们需要你类型

    // 新增：统筹顶部导航栏标题
    let title = '我要发布';
    if (isOfficial) title = '官方通知';
    else if (type === 0) title = '学习内容发布';
    else if (isCoupon) title = '优惠券发布';
    else if (isActivity) title = '发布活动';
    else if (isNeedYou) title = '我们需要你';

    this.setData({
      publishType: type,
      navTitle: title, // 赋值标题
      isGloryLink,
      isLearning: type === 0,
      isCoupon,
      isOfficial,
      isActivity,
      isNeedYou, // 赋值我们需要你状态
      // 官方通知(10)、我们需你(2)、活动(4)、等显示副标题 (官方通知现在不显示副标题)
      showSubtitle: false, // 我们需要你不再使用通用副标题
      showContent: [0, 10].includes(type), // 2 也不再使用通用正文
      showImages: type !== 6 && type !== 4 && type !== 2, // 4 和 2 都不用通用图片上传
      showPreview: type !== 6,
      mainTitlePlaceholder: isNeedYou ? '输入您要发布的启事标题' : (isOfficial ? '输入您要发布的图文标题' : (isGloryLink ? '输入与您要链接的公众号文章标题' : '输入您要发布的图文标题')),
      contentPlaceholder: isOfficial ? '发给所有友好商家的官方通知' : (type === 0 ? '输入您想发布的图文内容， 海报或视频会更丰富喔！' : '输入你想发布的文字内容，如果是长图会更丰富噢！')
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;

    // 新增拦截：将库存和活动积分也加入纯数字校验
    if (field === 'pointsValue' || field === 'totalCount' || field === 'validDays' || field === 'activityInventory' || field === 'activityPoints' || field === 'needYouAward' || field === 'needYouInventory') {
      value = value.replace(/\D/g, "");
    }

    if (field === 'discountValue' || field === 'reductionValue' || field === 'thresholdValue' || field === 'voucherValue') {
      value = value.replace(/[^\d.]/g, "");
      const parts = value.split(".");
      if (field === 'discountValue' && parts[0].length > 1) {
        parts[0] = parts[0].substring(0, 1);
      }
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      } else if (parts.length === 2 && parts[1].length > 1) {
        value = parts[0] + "." + parts[1].substring(0, 1);
      } else if (parts.length === 2) {
        value = parts[0] + "." + parts[1];
      } else {
        value = parts[0];
      }
    }

    this.setData({
      [`formData.${field}`]: value,
      isFormDirty: true // 内容已修改
    });

    const numericFields = ['pointsValue', 'totalCount', 'validDays', 'discountValue', 'reductionValue', 'thresholdValue', 'voucherValue'];
    if (numericFields.includes(field)) {
      return value;
    }
  },

  handleBack() {
    // 如果内容被修改过且尚未发布，询问是否保存草稿
    if (this.data.isFormDirty) {
      wx.showModal({
        title: '温馨提示',
        content: '内容尚未发布，是否保存为草稿？',
        cancelText: '不保存',
        confirmText: '保存草稿',
        success: (res) => {
          if (res.confirm) {
            this.saveAsDraft();
          } else {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 核心逻辑：保存为草稿
  saveAsDraft() {
    const { formData, publishType } = this.data;
    const payload = {
      publishType: publishType,
      contentJson: JSON.stringify(formData) // 序列化整个表单
    };

    wx.showLoading({ title: '保存中...', mask: true });
    addOrUpdateDraft(payload).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '存入我的发布', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1000);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  chooseCover() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({ 'formData.cover': res.tempFilePaths[0] });
      }
    });
  },

  chooseImages() {
    const currentLen = this.data.formData.images.length;
    wx.chooseMedia({
      count: 9 - currentLen,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(item => item.tempFilePath);
        this.setData({
          'formData.images': [...this.data.formData.images, ...newImages]
        });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.formData.images;
    images.splice(index, 1);
    this.setData({ 'formData.images': images });
  },

  showPointsModal(e) {
    const type = e.currentTarget.dataset.type || 'merchant';
    let title = '积分兑换规则';
    let content = '';

    if (type === 'activity') {
      content = '兑换示例（所需积分上下幅度不超过10%）：\n\n' +
        '衣物缝补（小件）、手机贴膜等，所需30积分\n' +
        '电瓶车基础维修（补胎、调试）、免费理发等，所需50积分\n' +
        '电瓶车深度检修、衣物缝补（大件）等，所需100积分\n' +
        '可依此类推\n\n' +
        '支持学习/讲座/政策咨询等类目免积分参与';
    } else {
      content = '兑换示例（所需积分上下幅度不超过10%）：\n\n' +
        '商户10元代金券/满30减15元/9折券，所需50积分\n' +
        '商户20元代金券/满50减30元/8.5折券，所需100积分\n' +
        '商户50元代金券/满100减50元/8折券，所需200积分\n' +
        '可依此类推';
    }

    this.setData({
      showPointsRuleModal: true,
      pointsRuleTitle: title,
      pointsRuleContent: content
    });
  },

  hidePointsModal() {
    this.setData({ showPointsRuleModal: false });
  },

  validateForm() {
    const {
      title1, mainTitle, subtitle, content, link,
      scope, couponType, discountValue, thresholdValue, reductionValue, voucherValue, productName,
      pointsValue, startTime, endTime, validDays, totalCount
    } = this.data.formData;
    const { isCoupon, isActivity, showSubtitle, showContent, isGloryLink } = this.data;

    if (isActivity) {
      const { activityName, activityIntro, activityStartDate, activityEndDate, activityWeekly, activityStartTime, activityEndTime, activityInventory, needPoints, activityPoints, cover } = this.data.formData;
      if (!cover) { wx.showToast({ title: '请上传活动封面图', icon: 'none' }); return false; }
      if (!(activityName && activityName.trim())) { wx.showToast({ title: '请输入活动名称', icon: 'none' }); return false; }
      if (!(activityIntro && activityIntro.trim())) { wx.showToast({ title: '请输入活动介绍', icon: 'none' }); return false; }
      if (!activityStartDate || !activityEndDate) { wx.showToast({ title: '请选择活动周期', icon: 'none' }); return false; }
      if (!activityWeekly || activityWeekly.length === 0) { wx.showToast({ title: '请选择每周重复日期', icon: 'none' }); return false; }
      if (!activityStartTime || !activityEndTime) { wx.showToast({ title: '请选择活动时间段', icon: 'none' }); return false; }
      if (!activityInventory) { wx.showToast({ title: '请设置库存人数', icon: 'none' }); return false; }
      if (needPoints === 1 && !activityPoints) { wx.showToast({ title: '请输入消耗积分', icon: 'none' }); return false; }
      return true;
    }

    if (this.data.isNeedYou) {
      const { mainTitle, tag, needYouStartDate, needYouEndDate, needYouStartTime, needYouEndTime, needYouAddress, needYouTarget, needYouRequirement, needYouContact, needYouAward, needYouInventory } = this.data.formData;
      if (!(mainTitle && mainTitle.trim())) { wx.showToast({ title: '请输入启事标题', icon: 'none' }); return false; }
      if (!tag) { wx.showToast({ title: '请选择服务类型', icon: 'none' }); return false; }
      if (!needYouStartDate || !needYouEndDate) { wx.showToast({ title: '请选择日期范围', icon: 'none' }); return false; }
      if (!needYouStartTime || !needYouEndTime) { wx.showToast({ title: '请选择具体时间', icon: 'none' }); return false; }
      if (!(needYouAddress && needYouAddress.trim())) { wx.showToast({ title: '请输入地址信息', icon: 'none' }); return false; }
      if (!(needYouTarget && needYouTarget.trim())) { wx.showToast({ title: '请输入招募对象', icon: 'none' }); return false; }
      if (!(needYouRequirement && needYouRequirement.trim())) { wx.showToast({ title: '请输入要求内容', icon: 'none' }); return false; }
      if (!(needYouContact && needYouContact.trim())) { wx.showToast({ title: '请输入联系方式', icon: 'none' }); return false; }
      if (!(needYouAward && needYouAward.trim())) { wx.showToast({ title: '请输入奖励机制', icon: 'none' }); return false; }
      if (!needYouInventory) { wx.showToast({ title: '请输入人数限制(0为不限制)', icon: 'none' }); return false; }
      return true;
    }

    if (isCoupon) {
      if (!this.data.formData.cover) { wx.showToast({ title: '请上传优惠券展示图', icon: 'none' }); return false; }
      if (!mainTitle.trim()) { wx.showToast({ title: '请输入优惠券名称', icon: 'none' }); return false; }
      if (!pointsValue) { wx.showToast({ title: '请输入兑换所需积分', icon: 'none' }); return false; }
      if (scope === 'specific' && !(productName && productName.trim())) {
        wx.showToast({ title: '请输入指定的商品名称', icon: 'none' });
        return false;
      }
      if (couponType === 'discount') {
        const dv = parseFloat(discountValue);
        if (!discountValue || isNaN(dv) || dv <= 0 || dv >= 10) {
          wx.showToast({ title: '折扣力度需为0~10之间的数字', icon: 'none' });
          return false;
        }
      } else if (couponType === 'reduction') {
        if (!thresholdValue || !reductionValue) { wx.showToast({ title: '请输入满减门槛及金额', icon: 'none' }); return false; }
        if (parseFloat(reductionValue) >= parseFloat(thresholdValue)) {
          wx.showToast({ title: '减免金额不能大于门槛金额', icon: 'none' });
          return false;
        }
      } else if (couponType === 'voucher') {
        if (!voucherValue || parseFloat(voucherValue) <= 0) { wx.showToast({ title: '请输入有效的代金金额', icon: 'none' }); return false; }
      }
      if (!startTime || !endTime) { wx.showToast({ title: '请选择使用期限', icon: 'none' }); return false; }
      const start = startTime.replace(/-/g, '/');
      const end = endTime.replace(/-/g, '/');
      if (new Date(start).getTime() > new Date(end).getTime()) {
        wx.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' });
        return false;
      }
      if (!validDays || parseInt(validDays) <= 0) { wx.showToast({ title: '请输入正确的有效天数', icon: 'none' }); return false; }
      if (!totalCount || parseInt(totalCount) <= 0) { wx.showToast({ title: '请输入正确的发行总量', icon: 'none' }); return false; }
    } else {
      if (!mainTitle.trim()) { wx.showToast({ title: '请输入主标题', icon: 'none' }); return false; }
      if (showContent && !content.trim()) { wx.showToast({ title: '请输入正文内容', icon: 'none' }); return false; }
      if (isGloryLink && !link.trim()) { wx.showToast({ title: '请输入公众号链接', icon: 'none' }); return false; }
    }
    return true;
  },

  handlePreview() {
    if (!this.validateForm()) return;
    const { formData, isLearning, isCoupon, isOfficial, isActivity } = this.data;

    if (isActivity) {
      // 活动预览跳转
      const paramData = {
        activityName: formData.activityName,
        activityIntro: formData.activityIntro,
        activityWeekly: formData.activityWeekly,
        activityStartTime: formData.activityStartTime,
        activityEndTime: formData.activityEndTime,
        activityPoints: formData.activityPoints,
        needPoints: formData.needPoints,
        cover: formData.cover
      };

      wx.navigateTo({
        url: `./mode/surroundings?isPreview=true&name=${encodeURIComponent(formData.partyCenterName || '')}&address=${encodeURIComponent(formData.partyCenterAddress || '')}&phone=${encodeURIComponent(formData.partyCenterPhone || '')}&openTime=${encodeURIComponent(formData.partyCenterOpenTime || '')}&data=${encodeURIComponent(JSON.stringify(paramData))}`
      });
      return;
    }

    if (this.data.isNeedYou) {
      // “我们需要你”预览：跳转至专属详情页
      const pointsMatch = formData.needYouAward ? formData.needYouAward.match(/\d+/) : null;
      const paramData = {
        title: formData.mainTitle,
        image: formData.cover,
        dateRange: `${formData.needYouStartDate} ~ ${formData.needYouEndDate}`,
        timeDesc: `${formData.needYouStartTime} ~ ${formData.needYouEndTime}`,
        location: formData.needYouAddress || '上海市长宁区北新泾街道',
        contactPhone: formData.needYouContact,
        points: pointsMatch ? parseInt(pointsMatch[0]) : 200,
        orgName: formData.partyCenterName || '北新泾街道党群服务中心', // 预览时使用所选中心或默认机构名
        type: 1 // 预览默认为“招募中”
      };
      wx.navigateTo({
        url: `./mode/needyou?isPreview=true&data=${encodeURIComponent(JSON.stringify(paramData))}`
      });
      return;
    }

    if (isLearning) {
      // 学习内容预览专线
      const userInfo = wx.getStorageSync('userInfo') || {};
      const previewData = {
        title: formData.mainTitle || '未命名标题',
        fullText: formData.content || '暂无内容',
        orgName: userInfo.nickname || '北新泾街道党群服务中心',
        orgLogo: userInfo.avatar || 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
        editTime: '刚刚',
        mediaList: (formData.images || []).map(url => ({
          url,
          is_video: url.toLowerCase().match(/\.(mp4|mov|m4v|3gp|avi|flv)$/) !== null
        }))
      };
      wx.setStorageSync('previewData', previewData);
      wx.navigateTo({
        url: './mode/study/index?isPreview=true',
        events: {
          submitFromPreview: () => { this.handleSubmit(); }
        }
      });
      return;
    }

    if (isOfficial) {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const previewData = {
        title: formData.mainTitle || '官方通知',
        fullText: formData.content || '暂无内容',
        orgName: userInfo.nickname || '北新泾街道党群服务中心',
        orgLogo: userInfo.avatar || 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
        editTime: '刚刚',
        mediaList: (formData.images || []).map(url => ({
          url,
          is_video: url.toLowerCase().match(/\.(mp4|mov|m4v|3gp|avi|flv)$/) !== null
        }))
      };
      wx.setStorageSync('previewData', previewData);
      wx.navigateTo({
        url: './mode/message/index?isPreview=true&isOfficial=true',
        events: {
          submitFromPreview: () => { this.handleSubmit(); }
        }
      });
      return;
    }

    if (isCoupon) {
      const formData = this.data.formData;
      const userInfo = wx.getStorageSync('userInfo') || {};
      const shopName = userInfo.name || '店铺名称未知';
      const couponType = formData.couponType;
      const isSpecific = formData.scope === 'specific';
      let amountTitle = '';
      let couponTypeName = '';
      if (couponType === 'discount') {
        amountTitle = `${formData.discountValue || '0'}折`;
        couponTypeName = '折扣券';
      } else if (couponType === 'reduction') {
        amountTitle = `满${formData.thresholdValue || '0'}减${formData.reductionValue || '0'}`;
        couponTypeName = '满减券';
      } else if (couponType === 'voucher') {
        amountTitle = `${formData.voucherValue || '0'}元`;
        couponTypeName = '代金券';
      }
      let scopeText = isSpecific ? `仅限于购买：${formData.productName || '指定商品'}` : '店铺所有商品通用';
      const paramData = {
        title: formData.mainTitle || '优惠券名称',
        avatar: formData.cover || 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
        amount: amountTitle,
        price: formData.pointsValue || '0',
        shopName: shopName,
        scope: scopeText,
        validDate: `${formData.startTime || '未设置'} 至 ${formData.endTime || '未设置'}`,
        rules: formData.notes ? formData.notes.split('\n') : ['本单发票由商家提供', '不兑现、不找零'],
        couponTypeName
      };
      wx.navigateTo({
        url: `./mode/coupon?data=${encodeURIComponent(JSON.stringify(paramData))}`
      });
    } else {
      wx.showToast({ title: '图文预览功能开发中', icon: 'none' });
    }
  },

  // --- 新增：活动专属处理方法 ---
  toggleWeeklyDrawer() {
    this.setData({ showWeeklyDrawer: !this.data.showWeeklyDrawer });
  },

  selectWeekly(e) {
    const week = e.currentTarget.dataset.week;
    let activityWeekly = this.data.formData.activityWeekly || [];
    const index = activityWeekly.indexOf(week);
    if (index > -1) {
      activityWeekly.splice(index, 1);
    } else {
      activityWeekly.push(week);
    }
    // 排序以保持 周一到周日 的顺序
    const order = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    activityWeekly.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    this.setData({ 'formData.activityWeekly': activityWeekly });
  },

  // 服务类型抽屉逻辑
  toggleTagDrawer() {
    this.setData({ showTagDrawer: !this.data.showTagDrawer });
  },

  selectTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      'formData.tag': tag,
      showTagDrawer: false,
      isFormDirty: true
    });
  },

  changeNeedPoints(e) {
    const val = Number(e.currentTarget.dataset.val);
    this.setData({ 'formData.needPoints': val });
  },

  uploadSingleImage(filePath) {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const token = wx.getStorageSync('token') || (app.globalData && app.globalData.token);

      const { directUrl } = require('../../utils/http.js');

      // 优先使用的专用 OSS 上传地址 (支持目录分类)
      const ossUrl = directUrl + '/auth/c/oss/upload?module=article';
      // 备用的通用上传地址 (Snowy 默认动态接口)
      const fallbackUrl = directUrl + '/dev/file/uploadDynamicReturnUrl';

      const doUpload = (url, isFallback) => {
        wx.uploadFile({
          url: url,
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
              if (data.code === 200 || data.code === 0) {
                resolve(data.data.url || data.data);
              } else {
                if (!isFallback) {
                  console.warn('OSS 上传失败，尝试降级上传...');
                  doUpload(fallbackUrl, true);
                } else {
                  console.error('降级上传依然失败:', data);
                  reject(data);
                }
              }
            } catch (e) {
              if (!isFallback) {
                doUpload(fallbackUrl, true);
              } else {
                reject(e);
              }
            }
          },
          fail: (err) => {
            if (!isFallback) {
              doUpload(fallbackUrl, true);
            } else {
              console.error('wx.uploadFile 失败:', err);
              reject(err);
            }
          }
        });
      };

      doUpload(ossUrl, false);
    });
  },

  async handleSubmit() {
    if (!this.validateForm()) return;
    const { publishType } = this.data;
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = userInfo.userId;

    wx.showLoading({ title: '处理图片中...', mask: true });

    let payload = {
      ...this.data.formData,
      publishType: publishType
    };

    const needsUpload = (url) => {
      if (!url) return false;
      if (url.startsWith('http://tmp/') || url.startsWith('wxfile://')) return true;
      if (url.startsWith('http')) return false; // 真实网络图片
      return true; // 其他情况，尝试上传
    };

    try {
      // 上传封面
      if (needsUpload(payload.cover)) {
        payload.cover = await this.uploadSingleImage(payload.cover);
      }
      // 上传图集
      if (payload.images && payload.images.length > 0) {
        const uploadedImages = [];
        for (let img of payload.images) {
          if (needsUpload(img)) {
            uploadedImages.push(await this.uploadSingleImage(img));
          } else {
            uploadedImages.push(img);
          }
        }
        payload.images = uploadedImages;
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '图片上传失败，请重试', icon: 'none' });
      return;
    }

    // 注入用户唯一标识，确保“谁发布谁查看”
    if (userId) {
      if (publishType === 4) {
        // 活动表后台对应字段为 publisherId，同时补全 createUser 标准审计字段
        payload.publisherId = userId;
        payload.createUser = userId;
      } else if (publishType === 8) {
        // 优惠券后台对应字段为 merchantId
        payload.merchantId = userId;
      } else {
        // 文章、招募、学习等后台统一使用 createUser
        payload.createUser = userId;
      }
    }

    // --- 修复：核心校验补全 ---
    // 后端 DTO 强制要求 mainTitle 不能为空。
    // 对于活动类型 (4)，将 activityName 赋给 mainTitle
    if (publishType === 4 && !payload.mainTitle) {
      payload.mainTitle = payload.activityName;
    }
    // 对于招募类型 (2)，虽然 WXML 已经绑定了 mainTitle，但为了保险起见，这里做个兜底

    console.log('--- 准备提交数据 ---', payload);
    wx.showLoading({ title: '发布中...', mask: true });

    publishContent(payload).then(res => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });

      // 发布成功后，尝试清理对应的草稿
      deleteDraft({ publishType: payload.publishType }).catch(() => { });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('发布失败:', err);
    });
  },

  // 切换顶部轮播状态
  toggleTop(e) {
    this.setData({ 'formData.isTop': e.detail.value });
  },

  // --- 党群中心选择逻辑 ---

  togglePartyCenterDrawer() {
    const show = !this.data.showPartyCenterDrawer;
    this.setData({ showPartyCenterDrawer: show });

    // 打开时且列表为空时加载数据
    if (show && this.data.partyCenters.length === 0) {
      this.loadPartyCenters();
    }
  },

  async loadPartyCenters() {
    wx.showLoading({ title: '加载中心列表...' });
    try {
      const res = await getSiteNests();
      if (res && res.data && Array.isArray(res.data)) {
        this.setData({
          partyCenters: res.data,
          filteredPartyCenters: res.data
        });
      }
    } catch (err) {
      console.error('加载党群中心失败:', err);
      wx.showToast({ title: '加载中心失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onPartySearchInput(e) {
    const key = e.detail.value;
    const filtered = this.data.partyCenters.filter(item =>
      item.name.toLowerCase().includes(key.toLowerCase()) ||
      (item.address && item.address.includes(key))
    );
    this.setData({
      partySearchKey: key,
      filteredPartyCenters: filtered
    });
  },

  clearPartySearch() {
    this.setData({
      partySearchKey: '',
      filteredPartyCenters: this.data.partyCenters
    });
  },

  selectPartyCenter(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      'formData.partyCenterId': item.id,
      'formData.partyCenterName': item.name,
      'formData.partyCenterAddress': item.address,
      'formData.partyCenterPhone': item.phone,
      'formData.partyCenterOpenTime': item.openTime,
      showPartyCenterDrawer: false
    });
  }
});