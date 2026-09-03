Component({
  properties: {
    selected: {
      type: Number,
      value: 0
    },
    role: {
      type: String,
      value: 'user' // admin | service | user
    }
  },
  data: {
    color: "#999999",
    selectedColor: "#FFD700",
    configs: {
      admin: [
        {
          pagePath: "/nuanxinyunchao/admin/pages/rank/index",
          iconPath: "/nuanxinyunchao/admin/static/tabbar/rank.png",
          selectedIconPath: "/nuanxinyunchao/admin/static/tabbar/rank-active.png",
          text: "排名"
        },
        {
          pagePath: "/nuanxinyunchao/admin/pages/data/index",
          iconPath: "/nuanxinyunchao/admin/static/tabbar/data.png",
          selectedIconPath: "/nuanxinyunchao/admin/static/tabbar/data-active.png",
          text: "数据"
        },
        {
          pagePath: "/nuanxinyunchao/admin/pages/review/index",
          iconPath: "/nuanxinyunchao/admin/static/tabbar/review.png",
          selectedIconPath: "/nuanxinyunchao/admin/static/tabbar/review-active.png",
          text: "审核"
        }
      ],
      service: [
        {
          pagePath: "/nuanxinyunchao/service/pages/index/index",
          iconPath: "/nuanxinyunchao/service/static/tabbar/home.png",
          selectedIconPath: "/nuanxinyunchao/service/static/tabbar/home-active.png",
          text: "首页"
        },
        {
          pagePath: "/nuanxinyunchao/service/pages/create/index",
          iconPath: "/nuanxinyunchao/service/static/tabbar/create.png",
          selectedIconPath: "/nuanxinyunchao/service/static/tabbar/create-active.png",
          text: "创建"
        },
        {
          pagePath: "/nuanxinyunchao/service/pages/qrcode/index",
          iconPath: "/nuanxinyunchao/service/static/tabbar/code.png",
          selectedIconPath: "/nuanxinyunchao/service/static/tabbar/code.png",
          text: "",
          isBulge: true
        },
        {
          pagePath: "/nuanxinyunchao/service/pages/message/index",
          iconPath: "/nuanxinyunchao/service/static/tabbar/message.png",
          selectedIconPath: "/nuanxinyunchao/service/static/tabbar/message-active.png",
          text: "消息"
        },
        {
          pagePath: "/nuanxinyunchao/service/pages/mine/index",
          iconPath: "/nuanxinyunchao/service/static/tabbar/user.png",
          selectedIconPath: "/nuanxinyunchao/service/static/tabbar/user-active.png",
          text: "我的"
        }
      ],
      user: [
        {
          pagePath: "/nuanxinyunchao/user/pages/index/index",
          iconPath: "/nuanxinyunchao/user/static/tabbar/home.png",
          selectedIconPath: "/nuanxinyunchao/user/static/tabbar/home-active.png",
          text: "首页"
        },
        {
          pagePath: "/nuanxinyunchao/user/pages/map/index",
          iconPath: "/nuanxinyunchao/user/static/tabbar/map.png",
          selectedIconPath: "/nuanxinyunchao/user/static/tabbar/map-active.png",
          text: "地图"
        },
        {
          pagePath: "/nuanxinyunchao/user/pages-sub/qrcode/index",
          iconPath: "/nuanxinyunchao/user/static/tabbar/code.png",
          selectedIconPath: "/nuanxinyunchao/user/static/tabbar/code.png",
          isBulge: true,
          text: ""
        },
        {
          pagePath: "/nuanxinyunchao/user/pages/hot/index",
          iconPath: "/nuanxinyunchao/user/static/tabbar/hot.png",
          selectedIconPath: "/nuanxinyunchao/user/static/tabbar/hot-active.png",
          text: "热门"
        },
        {
          pagePath: "/nuanxinyunchao/user/pages/mine/index",
          iconPath: "/nuanxinyunchao/user/static/tabbar/user.png",
          selectedIconPath: "/nuanxinyunchao/user/static/tabbar/user-active.png",
          text: "我的"
        }
      ]
    },
    list: []
  },
  lifetimes: {
    attached() {
      this.autoSetTabState();
    }
  },
  methods: {
    autoSetTabState() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return;
      
      const route = '/' + currentPage.route;
      const { configs } = this.data;
      
      // 遍历所有角色配置，匹配当前路由
      for (const role in configs) {
        const list = configs[role];
        const index = list.findIndex(item => item.pagePath === route);
        if (index > -1) {
          this.setData({
            role: role,
            list: list,
            selected: index
          });
          return;
        }
      }
      
      // 如果没匹配到，回退到属性值或默认值
      this.updateList();
    },
    updateList() {
      const { role, configs } = this.data;
      this.setData({
        list: configs[role] || configs['user']
      });
    },
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;
      const item = this.data.list[index];

      if (item.isBulge) {
        wx.navigateTo({
          url,
          fail: (err) => {
            console.error('跳转失败:', err);
          }
        });
        return;
      }
      
      // 注意：在这种模式下，跳转必须是绝对路径
      wx.reLaunch({
        url,
        fail: (err) => {
          console.error('reLaunch失败:', err);
        }
      });
    }
  }
});
