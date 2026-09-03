"use strict";
Page({
    data: {
        safeAreaTop: 20,
        currentBannerIndex: 0,
        bannerList: [
            { id: 1, imgUrl: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png' },
            { id: 2, imgUrl: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png' },
            { id: 3, imgUrl: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png' },
            { id: 4, imgUrl: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png' }
        ],
        detailInfo: {
            id: 0,
            name: '加载中...',
            openTime: '--',
            address: '定位中...',
            phone: '--',
            latitude: 0,
            longitude: 0,
            images: []
        },
        serviceList: [],
        // --- 预约抽屉相关状态 ---
        showAppointment: false, // 控制抽屉显示隐藏
        activeService: null,    // 当前选中的服务项
        scheduleOptions: [],    // 预约时间段列表
        selectedScheduleId: null, // 选中的时间段ID
        isSubmitting: false,    // 是否正在提交预约
        isPreview: false,
        previewData: null
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20 });
        const passedName = options.name ? decodeURIComponent(options.name) : '';
        const passedAddress = options.address ? decodeURIComponent(options.address) : '';
        const passedPhone = options.phone ? decodeURIComponent(options.phone) : '';
        const passedOpenTime = options.openTime ? decodeURIComponent(options.openTime) : '';
        
        if (passedName) {
            this.setData({ 'detailInfo.name': passedName });
        }
        if (passedAddress) {
            this.setData({ 'detailInfo.address': passedAddress });
        }
        if (passedPhone) {
            this.setData({ 'detailInfo.phone': passedPhone });
        }
        if (passedOpenTime) {
            this.setData({ 'detailInfo.openTime': passedOpenTime });
        }
        const lat = options.lat ? Number(options.lat) : 31.21;
        const lng = options.lng ? Number(options.lng) : 121.42;
        this.fetchNearestServiceCenter(lat, lng, passedName, passedAddress, passedPhone, passedOpenTime);

        if (options.isPreview === 'true' && options.data) {
            try {
                const previewData = JSON.parse(decodeURIComponent(options.data));
                this.setData({
                    isPreview: true,
                    previewData
                });
            } catch (err) {
                console.error('解析预览数据失败', err);
            }
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    onBannerChange(e) {
        this.setData({ currentBannerIndex: e.detail.current });
    },
    openMap() {
        if (!this.data.detailInfo.latitude || !this.data.detailInfo.longitude) {
            wx.showToast({ title: '坐标信息缺失', icon: 'none' });
            return;
        }
        wx.openLocation({
            latitude: this.data.detailInfo.latitude,
            longitude: this.data.detailInfo.longitude,
            name: this.data.detailInfo.name,
            address: this.data.detailInfo.address
        });
    },
    toggleCollection() {
        wx.showToast({
            title: '收藏成功',
            icon: 'success'
        });
    },
    toggleLike(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.serviceList[index];
        const key = `serviceList[${index}].liked`;
        this.setData({
            [key]: !item.liked
        });
    },
    fetchNearestServiceCenter(_lat, _lng, passedName, passedAddress, passedPhone, passedOpenTime) {
        wx.showLoading({ title: '加载中...' });
        setTimeout(() => {
            const mockResponse = {
                code: 200,
                data: {
                    siteInfo: {
                        id: 101,
                        name: passedName || '北新泾街道党群服务中心',
                        address: passedAddress || '上海市长宁区新华路359号',
                        distance: '158m',
                        openTime: passedOpenTime || '周一至周日 08:30-20:00',
                        phone: passedPhone || '021-52190377',
                        latitude: 31.2185,
                        longitude: 121.4225,
                        images: [
                            'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png',
                            'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png'
                        ]
                    },
                    activities: [
                        { time: '10:00-11:30', day: ['周一', '周三'], content: '义务理发、测量血压', price: 0, liked: false },
                        { time: '12:00-13:30', day: ['每天'], content: '骑手爱心午餐（凭工作证）', price: 10.0, liked: true },
                        { time: '08:30-20:00', day: [''], content: '提供冷热水、微波炉、手机充电', price: 0, liked: true },
                        { time: '14:00-16:00', day: ['周五'], content: '法律援助咨询服务', price: 0, liked: false }
                    ]
                }
            };
            if (this.data.isPreview && this.data.previewData) {
                const p = this.data.previewData;
                const previewItem = {
                    time: `${p.activityStartTime}-${p.activityEndTime}`,
                    day: p.activityWeekly || [], // 直接使用数组
                    content: p.activityName,
                    intro: p.activityIntro,
                    price: p.needPoints ? Number(p.activityPoints) : 0,
                    liked: false,
                    isPreview: true
                };
                mockResponse.data.activities.unshift(previewItem);

                if (p.cover) {
                    mockResponse.data.siteInfo.images = [p.cover];
                    this.setData({
                        bannerList: [{ id: 1, imgUrl: p.cover }]
                    });
                }
            }

            this.setData({
                detailInfo: mockResponse.data.siteInfo,
                serviceList: mockResponse.data.activities
            }, () => {
                // 如果是预览模式，自动打开第一个（即预览项）的抽屉
                if (this.data.isPreview) {
                    const firstItem = this.data.serviceList[0];
                    this.handleOpenAppointment({
                        currentTarget: {
                            dataset: { item: firstItem }
                        }
                    });
                }
            });
            wx.hideLoading();
        }, 800);
    },
    // --- 新增：空方法，用于阻止滑动穿透 ---
    preventTouchMove() {
        return;
    },

    // --- 新增：打开预约抽屉 ---
    handleOpenAppointment(e) {
        const item = e.currentTarget.dataset.item;

        this.setData({
            activeService: item,
            showAppointment: true
        });
        // 模拟根据服务ID获取可预约时间段
        this.fetchServiceSchedulesApi(item.id || 1);
    },

    // --- 新增：关闭预约抽屉 ---
    closeAppointment() {
        this.setData({ showAppointment: false });
    },

    // --- 新增：选择预约时间 ---
    selectSchedule(e) {
        const id = e.currentTarget.dataset.id;
        this.setData({ selectedScheduleId: id });
    },

    // --- 新增：模拟API - 获取服务排期 ---
    fetchServiceSchedulesApi(serviceId) {
        wx.showLoading({ title: '加载排期...' });
        
        // 如果是预览模式，基于选中的活动周期动态生成排期
        if (this.data.isPreview && this.data.activeService && this.data.activeService.isPreview) {
            const selectedDays = this.data.activeService.day || [];
            const mockSchedules = selectedDays.map((day, index) => ({
                id: index + 1,
                day: day,
                date: '待定',
                time: this.data.activeService.time || '10:00 - 16:00',
                status: '余量充足',
                available: true
            }));

            setTimeout(() => {
                this.setData({
                    scheduleOptions: mockSchedules,
                    selectedScheduleId: mockSchedules.length > 0 ? mockSchedules[0].id : null
                });
                wx.hideLoading();
            }, 400);
            return;
        }

        // 默认模拟逻辑...
        setTimeout(() => {
            const mockSchedules = [
                { id: 1, day: '周一', date: '04.06', time: '10:00 - 16:00', status: '余量充足', available: true },
                { id: 2, day: '周三', date: '04.08', time: '10:00 - 16:00', status: '仅剩3位', available: true },
                { id: 3, day: '周五', date: '04.10', time: '10:00 - 16:00', status: '已满', available: false }
            ];
            this.setData({
                scheduleOptions: mockSchedules,
                selectedScheduleId: mockSchedules[0].id // 默认选中第一个
            });
            wx.hideLoading();
        }, 400);
    },

    // --- 新增：模拟API - 提交预约 ---
    confirmAppointment() {
        if (!this.data.selectedScheduleId) {
            return wx.showToast({ title: '请选择预约时间', icon: 'none' });
        }

        this.setData({ isSubmitting: true });
        // 这里可以结合 this.data.activeService 和 this.data.selectedScheduleId 发送请求

        // 模拟提交请求
        setTimeout(() => {
            this.setData({
                isSubmitting: false,
                showAppointment: false
            });
            wx.showToast({
                title: '预约成功',
                icon: 'success',
                duration: 2000
            });
        }, 800);
    }
});
