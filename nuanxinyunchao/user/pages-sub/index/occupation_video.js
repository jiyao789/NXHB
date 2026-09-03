const taskReward = require("../../utils/taskReward");

Page({
  data: {
    safeAreaTop: 20,
    isLiked: false,
    isFavorited: false,
    taskCountdown: 0,
    taskActive: false,
    pageData: {
      title: "",
      imgUrl: "",
      date: "",
      content: "",
      author: "",
      avatar: ""
    },
    contentLines: []
  },

  timer: null,
  _taskCode: "",

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20
    });

    if (options && Object.keys(options).length > 0) {
      const content = decodeURIComponent(options.content || "");
      this.setData({
        "pageData.title": decodeURIComponent(options.title || ""),
        "pageData.imgUrl": decodeURIComponent(options.imgUrl || ""),
        "pageData.date": decodeURIComponent(options.date || ""),
        "pageData.content": content,
        "pageData.author": decodeURIComponent(options.author || ""),
        "pageData.avatar": decodeURIComponent(options.avatar || ""),
        contentLines: content ? content.split("\n") : []
      });
    }

    const activeTask = wx.getStorageSync("activeTask");
    if (activeTask && activeTask.active && activeTask.type === "watch_video") {
      this._taskCode = activeTask.taskCode || "";
      const cd = activeTask.countdown != null ? Number(activeTask.countdown) : 30;
      this.setData({ taskActive: !activeTask.isCompleted, taskCountdown: cd > 0 ? cd : 30 });
      if (!activeTask.isCompleted) {
        this.startTaskTimer();
      }
    }
  },

  onUnload() {
    this.persistVideoTask();
    this.stopTaskTimer();
  },

  onHide() {
    this.persistVideoTask();
    this.stopTaskTimer();
  },

  persistVideoTask() {
    const activeTask = taskReward.getActiveTask();
    if (activeTask && activeTask.active && activeTask.type === "watch_video") {
      taskReward.persistActiveTask({
        countdown: this.data.taskCountdown,
        isCompleted: this.data.taskCountdown <= 0 && !this.data.taskActive
      });
    }
  },

  startTaskTimer() {
    this.stopTaskTimer();
    this.timer = setInterval(() => {
      if (this.data.taskCountdown > 0) {
        const next = this.data.taskCountdown - 1;
        this.setData({ taskCountdown: next });
        (0, taskReward.persistActiveTask)({ countdown: next });
      } else {
        this.stopTaskTimer();
        this.setData({ taskActive: false });
        (0, taskReward.markTaskCompletedAndClaim)();
      }
    }, 1000);
  },

  stopTaskTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleLike() {
    this.setData({ isLiked: !this.data.isLiked });
  },

  handleFavorite() {
    this.setData({ isFavorited: !this.data.isFavorited });
  }
});
