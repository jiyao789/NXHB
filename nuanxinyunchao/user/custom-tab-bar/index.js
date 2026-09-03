"use strict";
Component({
    data: {
        show: true,
        selected: 0,
        color: "#999999",
        selectedColor: "#FFD700",
        list: [
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
    methods: {
        switchTab(e) {
            const data = e.currentTarget.dataset;
            const url = data.path;
            const index = data.index;
            const item = this.data.list[index];
            if (item.isBulge) {
                wx.navigateTo({
                    url,
                    fail: (err) => {
                        console.error('跳转分包失败:', err);
                    }
                });
                return;
            }
            wx.reLaunch({
                url,
                fail: (err) => {
                    console.error('switchTab失败:', err);
                }
            });
        }
    }
});
