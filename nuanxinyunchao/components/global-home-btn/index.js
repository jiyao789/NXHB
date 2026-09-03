// nuanxinyunchao/components/global-home-btn/index.js
Component({
  data: {
    x: 0, // 核心修复：永远锚定在左侧 (x=0)
    y: 450,
    isExpanded: false,
    isVisible: false
  },
  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync();
      this.pxRatio = sysInfo.windowWidth / 750;
      this.H = sysInfo.windowHeight;

      const pages = getCurrentPages();
      if (!pages.length) return;
      const route = pages[pages.length - 1].route;
      const isSub = route.includes('admin/') ||
        route.includes('service/') ||
        route.includes('user/');
      const isHome = route === 'pages/index/index';

      // 默认初始位置在屏幕中下方
      let initY = this.H - (250 * this.pxRatio);
      const pos = wx.getStorageSync('GLOBAL_BTN_POS');
      if (pos) initY = pos.y;

      this.setData({
        isVisible: isSub && !isHome,
        x: 0,
        y: initY
      });
    }
  },
  methods: {
    onPositionChange(e) {
      if (e.detail.source === 'touch') {
        this._lastY = e.detail.y;
      }
    },
    onDragStart() {
      this.setData({ isDragging: true });
    },
    onDragEnd() {
      this.setData({ isDragging: false });
      if (this.data.isExpanded) return;

      const currentY = this._lastY !== undefined ? this._lastY : this.data.y;
      let finalY = currentY;
      const topSafe = 100 * this.pxRatio;
      const bottomSafe = this.H - (200 * this.pxRatio);

      if (finalY < topSafe) finalY = topSafe;
      if (finalY > bottomSafe) finalY = bottomSafe;

      // 强制将 X 设为 0（弹回左侧），仅记录 Y 轴偏移
      this.setData({ x: 0, y: finalY });
      wx.setStorageSync('GLOBAL_BTN_POS', { x: 0, y: finalY });
    },
    toggleExpand() {
      if (!this.data.isExpanded) {
        this.setData({ isExpanded: true, x: 0 }); // 展开时保证 x=0
      } else {
        this.confirmReturn();
      }
    },
    closeExpand() {
      this.setData({ isExpanded: false, x: 0 });
    },
    confirmReturn() {
      wx.showModal({
        title: '提示',
        content: '确认退出当前界面并返回长宁智慧党建？',
        confirmColor: '#ff6f27',
        success: (res) => {
          if (res.confirm) {
            wx.reLaunch({ url: '/pages/index/index' });
          } else {
            this.closeExpand();
          }
        }
      });
    }
  }
});
