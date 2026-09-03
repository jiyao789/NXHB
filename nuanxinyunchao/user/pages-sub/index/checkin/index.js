"use strict";
const signin_1 = require("../../../api/signin");
const task_1 = require("../../../api/task");
const taskReward_1 = require("../../../utils/taskReward");
Page({
    data: {
        safeAreaTop: 0,
        scrollTop: 0,
        userInfo: null,
        taskInfo: null,
        showRules: false,
        isTodaySigned: false
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20
        });
        this.initData();
        this._loaded = true;
    },
    onShow() {
        if (this._loaded) {
            void this.refreshTaskData();
        }
    },
    async refreshTaskData() {
        try {
            const taskData = await this.fetchTaskData();
            this.setData({ taskInfo: taskData });
        }
        catch (e) {
            console.warn('[checkin] refresh tasks failed', e);
        }
    },
    onPageScroll(e) {
        this.setData({
            scrollTop: e.scrollTop
        });
    },
    async initData() {
        wx.showLoading({ title: '加载中...' });
        try {
            const [userData, taskData] = await Promise.all([
                (0, signin_1.getUserSignInDataApi)(),
                this.fetchTaskData()
            ]);
            const isTodaySigned = !!(userData && userData.weekDays && userData.weekDays[0] && userData.weekDays[0].isSigned);
            this.setData({
                userInfo: userData,
                taskInfo: taskData,
                isTodaySigned
            });
        }
        catch (error) {
            console.error(error);
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    fetchTaskData() {
        return (0, task_1.getTodayTaskListApi)().then((raw) => {
            const daily = (raw && Array.isArray(raw.dailyTasks)) ? raw.dailyTasks : [];
            const mappedDaily = daily.slice(0, 5).map((t) => {
                const raskUrl = (0, taskReward_1.resolveTaskPageUrl)(t && t.taskUrl);
                let displayTitle = t && t.title;
                if (displayTitle) {
                    if (displayTitle.includes('收藏一个课程') || displayTitle.includes('查看一次学习文章')) {
                        displayTitle = '查看学习文章并停留30秒';
                    } else if (displayTitle.includes('参与一次课程讨论') || displayTitle.includes('查看一次志愿活动列表')) {
                        displayTitle = '查看志愿活动列表并停留10秒';
                    }
                }
                return {
                    title: displayTitle,
                    points: t && t.points,
                    btnText: (t && t.isCompleted) ? '已完成' : '去完成',
                    icon: t && t.icon,
                    taskId: t && t.id,
                    code: (t && t.code) || (0, taskReward_1.urlToTaskCode)(t && t.taskUrl),
                    raskUrl,
                    isCompleted: t && t.isCompleted
                };
            });
            const st = raw && raw.specialTask;
            const specialTask = st
                ? (() => {
                    const raskUrl = (0, taskReward_1.resolveTaskPageUrl)(st && st.taskUrl);
                    return {
                        title: st && st.title,
                        points: st && st.points,
                        btnText: (st && st.isCompleted) ? '已完成' : '去邀请',
                        icon: st && st.icon,
                        taskId: st && st.id,
                        taskType: st && st.taskType,
                        code: (st && st.code) || (0, taskReward_1.urlToTaskCode)(st && st.taskUrl),
                        raskUrl,
                        isCompleted: st && st.isCompleted
                    };
                })()
                : null;
            return { dailyTasks: mappedDaily, specialTask };
        });
    },
    handleSignIn() {
        if (!this.data.userInfo || this.data.isTodaySigned)
            return;
        wx.showLoading({ title: '签到中...' });
        (0, signin_1.postUserSignInApi)()
            .then((userData) => {
            const isTodaySigned = !!(userData && userData.weekDays && userData.weekDays[0] && userData.weekDays[0].isSigned);
            this.setData({
                userInfo: userData,
                isTodaySigned
            });
            wx.showToast({ title: '签到成功', icon: 'success' });
        })
            .catch((e) => {
            console.error(e);
            // http封装默认会toast，这里只兜底
            wx.showToast({ title: '签到失败', icon: 'none' });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    handleBack() {
        wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' });
    },
    toggleRules() {
        this.setData({
            showRules: !this.data.showRules
        });
    },
    preventTouch() {
        // 阻止弹窗外层滚动
    },
    handleTaskClick(e) {
        const task = e.currentTarget.dataset.item;
        if (task.isCompleted) {
            wx.showToast({ title: '已完成该任务', icon: 'none' });
            return;
        }
        let finalUrl = (0, taskReward_1.resolveTaskPageUrl)(task.raskUrl);
        const meta = (0, taskReward_1.resolveTaskMeta)(task, finalUrl);
        if (meta && meta.type === 'invite') {
            (0, taskReward_1.persistActiveTask)((0, taskReward_1.buildActiveTaskPayload)(task, finalUrl || task.raskUrl, meta));
            wx.showToast({ title: '请点击右上角分享给好友', icon: 'none', duration: 3000 });
            return;
        }
        if (!finalUrl) {
            wx.showToast({ title: '该任务暂不可用', icon: 'none' });
            return;
        }
        if (meta && meta.type === 'watch_video') {
            const params = {
                title: '基层党组织学习贯彻二十届四中全会精神',
                imgUrl: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/occupation_video/video_cover.png',
                date: '刚刚',
                author: '北新泾街道党群服务中心',
                avatar: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/hot/f1.png',
                content: '当代浪潮与南大初心交织\n从红色基因的深邃根脉\n到学术高峰的辉煌之巅\n每一步，都回响着峥嵘岁月里奋进的铿锵足音。'
            };
            const queryString = Object.keys(params)
                .map(key => `${key}=${encodeURIComponent(params[key])}`)
                .join('&');
            finalUrl = `${finalUrl.split('?')[0]}?${queryString}`;
        }
        if (meta) {
            (0, taskReward_1.persistActiveTask)((0, taskReward_1.buildActiveTaskPayload)(task, finalUrl, meta));
        }
        else if (task.taskId || task.id) {
            (0, taskReward_1.persistActiveTask)((0, taskReward_1.buildActiveTaskPayload)(task, finalUrl, { type: 'browse_points', countdown: 30 }));
        }

        // 识别是否为 Tabbar 页面 (适配当前仓库路径规范)
        const tabList = [
            '/nuanxinyunchao/user/pages/index/index',
            '/nuanxinyunchao/user/pages/hot/index',
            '/nuanxinyunchao/user/pages/map/index',
            '/nuanxinyunchao/user/pages/mine/index'
        ];
        const isTab = tabList.some(item => finalUrl.startsWith(item));

        if (isTab) {
            wx.reLaunch({
                url: finalUrl,
                fail: (err) => {
                    console.error('[Task] switchTab failed:', err);
                    wx.reLaunch({ url: finalUrl });
                }
            });
        } else {
            wx.navigateTo({
                url: finalUrl,
                fail: (err) => {
                    console.error('[Task] navigateTo failed:', err);
                    wx.reLaunch({ url: finalUrl });
                }
            });
        }
    },
    onShareAppMessage() {
        const activeTask = (0, taskReward_1.getActiveTask)();
        if (activeTask && activeTask.active && activeTask.type === 'invite' && !activeTask.rewardSubmitted) {
            (0, taskReward_1.persistActiveTask)({ isCompleted: true });
            setTimeout(() => {
                (0, taskReward_1.claimBrowseTaskReward)();
            }, 300);
        }
        return {
            title: '暖新云巢 - 一起来赚积分',
            path: '/nuanxinyunchao/user/pages/index/index'
        };
    }
});
