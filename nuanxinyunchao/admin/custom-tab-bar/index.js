Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "pages/rank/index",
        iconPath: "/nuanxinyunchao/admin/static/tabbar/rank.png",
        selectedIconPath: "/nuanxinyunchao/admin/static/tabbar/rank-active.png",
        text: "排名"
      },
      {
        pagePath: "pages/data/index",
        iconPath: "/nuanxinyunchao/admin/static/tabbar/data.png",
        selectedIconPath: "/nuanxinyunchao/admin/static/tabbar/data-active.png",
        text: "数据"
      },
      {
        pagePath: "pages/review/index",
        iconPath: "/nuanxinyunchao/admin/static/tabbar/review.png",
        selectedIconPath: "/nuanxinyunchao/admin/static/tabbar/review-active.png",
        text: "审核"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = '/' + this.data.list[data.index].pagePath;
      if (this.data.selected === data.index) {
        return;
      }
      wx.reLaunch({ url });
    }
  }
});
