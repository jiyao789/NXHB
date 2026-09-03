const { httpGet, httpPost } = require('../../../../utils/http');
const taskReward_1 = require('../../../../utils/taskReward');

Page({
    data: {
        safeAreaTop: 0,
        detailData: {},
        taskInfo: {
            active: false,
            type: '',
            countdown: 10,
            isCompleted: false
        }
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20
        });
        if (options.data) {
            try {
                const passedData = JSON.parse(decodeURIComponent(options.data));
                this.setData({
                    'detailData.image': passedData.image,
                    'detailData.id': passedData.id
                });
                this.fetchDetailData(passedData.id);
            }
            catch (e) {
                console.error('参数解析失败', e);
            }
        }
        else {
            this.fetchDetailData(1);
        }
    },
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
            // 适配分包库扁平路径
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
    async handleJoin() {
        if (!this.data.detailData.id) return;
        wx.showLoading({ title: '报名中...' });
        try {
            await httpPost('/biz/volunteer/activity/signup', { id: this.data.detailData.id });
            wx.showToast({
                title: '报名成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('报名失败', error);
        } finally {
            wx.hideLoading();
        }
    },
    async fetchDetailData(id) {
        wx.showLoading({ title: '加载中...' });
        try {
            const res = await httpGet('/biz/volunteer/activity/detail', { id });
            if (res) {
                const editTime = res.updateTime || res.createTime || '';
                const fullText = res.recruitRequirement || res.remarks || '无';
                
                let imagesList = [];
                if (res.images) {
                    try {
                        imagesList = JSON.parse(res.images);
                    } catch (e) {
                        imagesList = [res.images];
                    }
                }
                
                const startDateStr = res.startDate ? res.startDate.split(' ')[0] : '';
                const endDateStr = res.endDate ? res.endDate.split(' ')[0] : '';
                const timeRange = `${startDateStr} ${res.startTime || ''} 至 ${endDateStr} ${res.endTime || ''}`.trim();

                const now = new Date();
                let inTimeRange = true;
                if (res.startDate) {
                    const datePart = res.startDate.split(' ')[0];
                    const startTimeStr = this.formatTime(res.startTime);
                    const startTime = new Date(datePart + ' ' + startTimeStr);
                    if (now < startTime) inTimeRange = false;
                }
                if (res.endDate) {
                    const datePart = res.endDate.split(' ')[0];
                    const endTimeStr = this.formatTime(res.endTime);
                    const endTime = new Date(datePart + ' ' + endTimeStr);
                    if (now > endTime) inTimeRange = false;
                }

                this.setData({
                    detailData: {
                        ...this.data.detailData,
                        orgName: res.orgName || '暖新组织',
                        title: res.title,
                        fullText: fullText,
                        editTime: editTime.split(' ')[0] || editTime,
                        image: res.image || this.data.detailData.image,
                        imagesList: imagesList,
                        location: res.location || '待定',
                        timeRange: timeRange === '至' ? '长期有效' : timeRange,
                        remarks: res.remarks || '无',
                        awardMechanism: res.awardMechanism || (res.rewardPoints ? `${res.rewardPoints}积分` : '无'),
                        acceptStatus: res.acceptStatus === 0 ? '已接单' : '待接单',
                        inTimeRange: inTimeRange
                    }
                });
            }
        } catch (error) {
            console.error('获取详情失败', error);
        } finally {
            wx.hideLoading();
        }
    },
    formatTime(timeStr) {
        if (!timeStr) return '00:00:00';
        const parts = timeStr.split(':');
        while (parts.length < 3) {
            parts.push('00');
        }
        return parts.join(':');
    }
});
