"use strict";
const feedback_1 = require("../../../api/feedback");

Page({
    data: {
        safeAreaInsetsTop: 20,
        loading: true,
        list: []
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
    },
    onShow() {
        // 每次显示页面时重新拉取数据，以保证详情页返回后数据刷新
        this.fetchFeedbackList();
    },
    handleBack() {
        wx.navigateBack();
    },
    async fetchFeedbackList() {
        this.setData({ loading: true });
        try {
            const res = await (0, feedback_1.getFeedbackListApi)();
            const records = Array.isArray(res) ? res : ((res && res.records) || (res && res.rows) || []);
            
            const formattedList = records.map(item => {
                let statusText = '待处理';
                let statusClass = 'border-FF6B6B text-FF6B6B'; // 红色
                
                // 需求进度状态 (0: 待处理, 1: 处理中, 2: 已解决/已采纳, 3: 已关闭)
                if (item.status === 1) {
                    statusText = '处理中';
                    statusClass = 'border-F5A623 text-F5A623'; // 橙色
                } else if (item.status === 2) {
                    statusText = '已解决';
                    statusClass = 'border-7AC786 text-7AC786'; // 绿色
                } else if (item.status === 3) {
                    statusText = '已关闭';
                    statusClass = 'border-999999 text-999999'; // 灰色
                }
                
                return {
                    id: item.id,
                    content: item.content || '',
                    time: item.createTime || '',
                    status: item.status,
                    statusText,
                    statusClass
                };
            });
            
            this.setData({
                list: formattedList,
                loading: false
            });
        } catch (err) {
            console.error('获取需求反馈列表失败:', err);
            this.setData({ loading: false });
        }
    },
    handleDetail(e) {
        const item = e.currentTarget.dataset.item;
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/mine/feedback/detail?id=${item.id}&content=${encodeURIComponent(item.content)}&time=${item.time}&status=${item.status}`,
        });
    }
});
