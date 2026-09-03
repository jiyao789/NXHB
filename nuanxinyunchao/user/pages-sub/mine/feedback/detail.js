"use strict";
const feedback_1 = require("../../../api/feedback");

Page({
    data: {
        safeAreaInsetsTop: 20,
        STATUS: {
            SUBMITTED: 1,
            REPLIED: 2,
            DONE: 3
        },
        loading: true,
        currentStatus: 1,
        resultData: {
            id: '',
            submitTime: '',
            submitContent: '',
            replyTime: '',
            replyContent: '',
            finishTime: ''
        }
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        const initialData = {
            id: options.id || '',
            submitContent: decodeURIComponent(options.content || ''),
            submitTime: options.time || ''
        };
        this.setData({ resultData: Object.assign({}, this.data.resultData, initialData) });
        if (options.id) {
            this.fetchResultDetail(options.id, initialData.submitContent, initialData.submitTime, Number(options.status));
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    async fetchResultDetail(feedbackId, initialContent, initialTime, initialStatus) {
        this.setData({ loading: true });
        try {
            const res = await (0, feedback_1.getFeedbackDetailApi)({ id: feedbackId });
            const detailData = res || {};
            
            // 后端状态: 0:待处理, 1:处理中, 2:已解决/已采纳, 3:已关闭
            // 映射到 UI 进度条状态
            let uiStatus = this.data.STATUS.SUBMITTED;
            if (detailData.status === 1) {
                uiStatus = this.data.STATUS.REPLIED;
            } else if (detailData.status === 2 || detailData.status === 3) {
                uiStatus = this.data.STATUS.DONE;
            } else if (detailData.status === undefined) {
                 // 兜底，防止接口异常时状态丢失，利用传过来的 initialStatus 映射
                 if (initialStatus === 1) uiStatus = this.data.STATUS.REPLIED;
                 if (initialStatus === 2 || initialStatus === 3) uiStatus = this.data.STATUS.DONE;
            }
            
            const newData = {
                id: detailData.id || feedbackId,
                submitTime: detailData.createTime || initialTime,
                submitContent: detailData.content || initialContent,
                replyTime: detailData.replyTime || '',
                replyContent: detailData.replyContent || '',
                finishTime: detailData.updateTime || ''
            };
            
            this.setData({
                currentStatus: uiStatus,
                resultData: newData,
                loading: false
            });
        } catch (err) {
            console.error('获取需求反馈详情失败:', err);
            this.setData({ loading: false });
        }
    },
    handleFeedbackAgain() {
        wx.navigateTo({
            url: '/nuanxinyunchao/user/pages-sub/index/help/index',
        });
    }
});
