"use strict";
const taskReward_1 = require("../../../utils/taskReward");
const { httpGet } = require('../../../utils/http');
Page({
    data: {
        safeAreaTop: 0,
        currentBannerIndex: 0,
        activeFilter: null,
        bannerList: [],
        list: [],
        regionList: [],
        selectedRegion: '',
        selectedType: '',
        taskInfo: {
            active: false,
            type: '',
            countdown: 10,
            isCompleted: false
        }
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20
        });
        this.initData();
    },
    // ... skipping onShow to onBannerChange ...
    onShow() {
        const activeTask = wx.getStorageSync('activeTask');
        if (activeTask && activeTask.active && activeTask.type === 'browse_volunteer') {
            this.setData({
                'taskInfo.active': true,
                'taskInfo.type': activeTask.type,
                'taskInfo.countdown': activeTask.countdown !== undefined ? activeTask.countdown : 10,
                'taskInfo.isCompleted': activeTask.isCompleted || false
            });
            if (!this.data.taskInfo.isCompleted && !this.timer) {
                this.startTimer();
            }
        } else {
            this.setData({ 'taskInfo.active': false });
            this.stopTimer();
        }
    },
    onHide() {
        if (this.data.taskInfo.active) {
            (0, taskReward_1.snapshotActiveTaskFromPage)(this.data.taskInfo, this.data.taskInfo.countdown);
        }
        this.stopTimer();
    },
    onUnload() {
        if (this.data.taskInfo.active) {
            (0, taskReward_1.snapshotActiveTaskFromPage)(this.data.taskInfo, this.data.taskInfo.countdown);
        }
        this.stopTimer();
    },
    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            if (this.data.taskInfo.countdown > 0) {
                const next = this.data.taskInfo.countdown - 1;
                this.setData({
                    'taskInfo.countdown': next
                });
                (0, taskReward_1.persistActiveTask)({ countdown: next });
            }
            else {
                this.stopTimer();
                this.setData({
                    'taskInfo.isCompleted': true
                });
                (0, taskReward_1.markTaskCompletedAndClaim)();
            }
        }, 1000);
    },
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },
    handleBackToTasks() {
        const pages = getCurrentPages();
        wx.removeStorageSync('activeTask');
        this.setData({ 'taskInfo.active': false });
        this.stopTimer();

        let delta = -1;
        for (let i = pages.length - 1; i >= 0; i--) {
            const currRoute = pages[i].route;
            // 适配当前仓库路径特征
            if (currRoute.includes('checkin/index') && i !== pages.length - 1) {
                delta = pages.length - 1 - i;
                break;
            }
        }

        if (delta > 0) {
            wx.navigateBack({ delta });
        } else {
            wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/checkin/index' });
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    onBannerChange(e) {
        this.setData({
            currentBannerIndex: e.detail.current
        });
    },
    toggleFilter(e) {
        const type = e.currentTarget.dataset.type;
        this.setData({
            activeFilter: this.data.activeFilter === type ? null : type
        });
    },
    closeFilter() {
        this.setData({ activeFilter: null });
    },
    handleRegionSelect(e) {
        const region = e.currentTarget.dataset.region;
        this.setData({
            selectedRegion: region,
            activeFilter: null // close dropdown
        });
        this.fetchActivities();
    },
    handleTypeSelect(e) {
        const type = e.currentTarget.dataset.type;
        this.setData({
            selectedType: type,
            activeFilter: null // close dropdown
        });
        this.fetchActivities();
    },
    async fetchRegions() {
        try {
            const res = await httpGet('/api/webapp/auth/c/getStreetList');
            let regionOptions = (res || []).map(item => {
                let shortName = item.name.replace('上海市长宁区', '').replace('街道', '').replace('镇', '');
                return {
                    id: item.id,
                    name: shortName,
                    fullName: item.name
                };
            });
            regionOptions.unshift({ id: '', name: '全部区域', fullName: '' });
            this.setData({ regionList: regionOptions });
        } catch (error) {
            console.error('获取区域失败', error);
        }
    },
    async fetchActivities() {
        wx.showLoading({ title: '加载中...' });
        try {
            const params = {
                current: 1,
                size: 20
            };
            if (this.data.selectedRegion) {
                // If "全部区域" is selected, selectedRegion is empty string
                params.region = this.data.selectedRegion;
            }
            if (this.data.selectedType) {
                // 如果选择了服务类型，通过 tag 字段传递给后端
                params.tag = this.data.selectedType;
            }
            const res = await httpGet('/biz/volunteer/activity/page', params);
            
            const activities = ((res && res.records) || []).map(item => ({
                id: item.id,
                orgName: item.orgName,
                avatar: item.orgAvatar,
                category: item.category,
                status: item.acceptStatus,
                type: item.recruitStatus,
                title: item.title,
                tag: item.tag,
                image: item.image,
                location: item.location,
                time: item.activityTime
            }));

            this.setData({
                list: activities
            });
        } catch (error) {
            console.error('获取列表失败', error);
            wx.showToast({ title: '获取列表失败', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    },
    async fetchBanners() {
        try {
            const res = await httpGet('/biz/volunteer/activity/page', { current: 1, size: 5, isTop: 1 });
            const records = (res && res.records) || [];
            if (records.length > 0) {
                const banners = records.map((item, index) => ({
                    id: item.id,
                    imgUrl: item.image || `https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/volunteer/banner${(index % 2) + 1}.png`
                }));
                this.setData({ bannerList: banners });
            } else {
                this.setData({ bannerList: [] });
            }
        } catch (error) {
            console.error('获取轮播图失败', error);
        }
    },
    async initData() {
        this.setData({ bannerList: [] });
        
        await this.fetchBanners();
        await this.fetchRegions();
        await this.fetchActivities();
    },
    handleItemClick(e) {
        const item = e.currentTarget.dataset.item;
        const dataStr = encodeURIComponent(JSON.stringify(item));
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/index/volunteer/detail/detail?data=${dataStr}`
        });
    },
    handleBannerClick(e) {
        const item = e.currentTarget.dataset.item;
        const dataStr = encodeURIComponent(JSON.stringify({
            id: item.id,
            image: item.imgUrl
        }));
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/index/volunteer/banner_detail/banner_detail?data=${dataStr}`
        });
    }
});
