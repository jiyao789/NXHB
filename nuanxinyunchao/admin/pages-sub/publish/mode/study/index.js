"use strict";
Page({
    data: {
        safeAreaTop: 0,
        detailData: {}
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20
        });
        if (options.isPreview) {
            const data = wx.getStorageSync('previewData');
            this.setData({ detailData: data });
        }
        else if (options.data) {
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
    handleBack() {
        wx.navigateBack();
    },
    handleJoin() {
        wx.showToast({
            title: '参加成功',
            icon: 'success'
        });
    },
    handlePublish() {
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel && eventChannel.emit) {
            eventChannel.emit('submitFromPreview');
            wx.navigateBack();
        } else {
            wx.showToast({ title: '预览模式已失效', icon: 'none' });
        }
    },
    fetchDetailData(id) {
        wx.showLoading({ title: '加载中...' });
        const mockData = {
            1: {
                orgName: '长宁区新时代文明实践中心',
                title: '“情暖社区”志愿服务活动',
                fullText: '为进一步弘扬志愿精神，我们将开展“情暖社区”志愿服务活动。欢迎大家积极参与，共同建设美好家园。\n\n活动内容：社区环境整治、垃圾分类宣传等。\n活动时间：本周日上午 9:00-11:30\n集合地点：长宁区新时代文明实践中心广场',
                editTime: '2小时前'
            },
            2: {
                orgName: '强国同学汇',
                title: '社区助老服务日',
                fullText: '我们需要志愿者走进孤寡老人家中，陪他们聊聊天，帮他们打扫一下卫生。你的点滴付出，将是老人们一整天的温暖。\n\n活动时间：本周六下午 14:00-16:00\n报名限制：已通过实名认证的志愿者。',
                editTime: '5小时前'
            },
            3: {
                orgName: '北新泾街道党群服务中心',
                title: '"城市啄木鸟"，志愿者招募',
                fullText: '关于招募:希望通过广大新兴领域小伙伴们的帮助，发现城市中需要我们改进的地方，通过拍照、描述的方式上传，我们会吸取建议意见进行改进，让城市更美好。\n\n招募对象:全体用户\n\n暖新奖励:100积分\n\n参与地点:长宁区全域\n\n参与方式:点击下方"立即加入"即可参与并上传图文。',
                editTime: '2小时前'
            },
            4: {
                orgName: '强国同学汇',
                title: '社区助老服务日',
                fullText: '我们需要志愿者走进孤寡老人家中，陪他们聊聊天，帮他们打扫一下卫生。你的点滴付出，将是老人们一整天的温暖。\n\n活动时间：本周六下午 14:00-16:00\n报名限制：已通过实名认证的志愿者。',
                editTime: '5小时前'
            }
        };
        setTimeout(() => {
            this.setData({
                detailData: { ...this.data.detailData, ...(mockData[id] || mockData[1]) }
            });
            wx.hideLoading();
        }, 400);
    }
});
