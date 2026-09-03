"use strict";
const mine_1 = require("../../../api/mine");

Page({
    data: {
        safeAreaInsetsTop: 20,
        scrollTop: 0,
        progressNodes: [
            { value: 1 },
            { value: 3 },
            { value: 7 },
            { value: 15 },
            { value: 23 }
        ],
        currentFinished: 0,
        orderCount: 0,
        completedCount: 0,
        points: 0,
        rewardList: [
            {
                title: '初出茅庐',
                desc: '成功完成一次志愿活动',
                status: '领取',
                icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/honor/honor_icon1.png'
            },
            {
                title: '乐于助人',
                desc: '成功帮助街道完成救助',
                status: '待解锁',
                icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/honor/honor_icon2.png'
            },
            {
                title: '宠物达人',
                desc: '找到一只失踪动物',
                status: '待解锁',
                icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/honor/honor_icon3.png'
            }
        ],
        progressWidth: '0%'
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        this.fetchHonorData();
    },
    async fetchHonorData() {
        try {
            wx.showLoading({ title: '加载中...' });
            const userInfo = wx.getStorageSync('userInfo') || {};
            const userId = userInfo.id || '';
            const [overview, activities] = await Promise.all([
                mine_1.getMineOverviewApi(),
                mine_1.getActivityListApi(userId)
            ]);
            
            const points = overview && overview.points || 0;
            const activityList = activities || [];
            
            const volunteerOrders = activityList.filter(item => item.type === 2);
            const orderCount = volunteerOrders.filter(item => item.status === 0 || item.status === 1).length;
            const completedCount = volunteerOrders.filter(item => item.status === 1).length;
            
            // Check cache for task 1 received status
            const taskOneReceived = wx.getStorageSync('honor_task_1_received') || false;
            let taskOneStatus = '待解锁';
            if (taskOneReceived) {
                taskOneStatus = '已领取';
            } else if (completedCount >= 1) {
                taskOneStatus = '领取';
            }
            
            const updateKey = `rewardList[0].status`;
            
            this.setData({
                orderCount,
                completedCount,
                points,
                currentFinished: orderCount,
                [updateKey]: taskOneStatus
            }, () => {
                this.calculateProgress();
            });
        } catch (e) {
            console.error(e);
            wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    },
    onPageScroll(e) {
        this.setData({ scrollTop: e.scrollTop });
    },
    handleBack() {
        wx.navigateBack();
    },
    calculateProgress() {
        const val = this.data.currentFinished;
        const nodes = this.data.progressNodes.map(n => n.value);
        if (val <= nodes[0]) {
            this.setData({ progressWidth: '0%' });
            return;
        }
        if (val >= nodes[nodes.length - 1]) {
            this.setData({ progressWidth: '100%' });
            return;
        }
        let i = 0;
        for (i = 0; i < nodes.length - 1; i++) {
            if (val >= nodes[i] && val < nodes[i + 1]) {
                break;
            }
        }
        const segmentPercent = (val - nodes[i]) / (nodes[i + 1] - nodes[i]);
        const totalPercent = ((i + segmentPercent) / (nodes.length - 1)) * 100;
        this.setData({ progressWidth: totalPercent + '%' });
    },
    handleReceive(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.rewardList[index];
        if (item.status !== '领取') {
            if (item.status === '待解锁') {
                wx.showToast({ title: '达成要求后即可解锁', icon: 'none' });
            }
            return;
        }
        wx.showLoading({ title: '领取中...' });
        setTimeout(() => {
            wx.hideLoading();
            // 局部更新数组中的某个状态
            const updateKey = `rewardList[${index}].status`;
            this.setData({ [updateKey]: '已领取' });
            
            if (index === 0) {
                wx.setStorageSync('honor_task_1_received', true);
            }
            
            wx.showToast({
                title: '领取成功',
                icon: 'success',
                duration: 2000
            });
        }, 800);
    }
});
