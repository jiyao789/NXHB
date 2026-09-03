const { getSiteOverview, getSiteMapMarkers } = require('../../../api/adminStatistics');

Page({
  data: {
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,

    totalSites: '0',
    trendValue: '0.0%',

    cards: {
      nxc: { count: '0个' },
      shop: { count: '0家', trend: '0.0%' }
    },

    chartData: [],
    activeIndex: -1, 
    lineSvgUrl: '',
    mapLatitude: 31.216,
    mapLongitude: 121.425,
    displayMarkers: [],
  },

  onLoad() {
    this.initSystemInfo();
    this.fetchData();
    this.fetchMapData();
  },

  async fetchData() {
    try {
      const res = await getSiteOverview();
      if (res.code === 200 && res.data) {
        const d = res.data;
        this.setData({
          totalSites: (d.totalSites || 0).toLocaleString(),
          trendValue: d.trendValue || '0.0%',
          'cards.nxc.count': (d.nest?.count || 0) + '个',
          'cards.shop.count': (d.shop?.count || 0) + '家',
          'cards.shop.trend': d.shop?.trend || '0.0%',
          chartData: d.chartData || []
        }, () => {
          this.updateChart();
        });
      }
    } catch(err) {
      console.error('Failed to load site overview:', err);
    }
  },

  async fetchMapData() {
    try {
      const res = await getSiteMapMarkers();
      if (res.code === 200 && res.data) {
        const markerData = res.data;
        const targetWidth = 15;
        const imageAspectRatio = 34 / 18;
        const targetHeight = Math.round(targetWidth / imageAspectRatio);
        
        const displayMarkers = markerData.map((item, index) => {
          const icon = item.categoryId === 'store' ? 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_logo_white.png' : 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_map.png';
          
          return {
            id: index + 1,
            latitude: item.latitude,
            longitude: item.longitude,
            width: targetWidth,
            height: targetHeight,
            iconPath: '/nuanxinyunchao/admin/static/app/icons/20x20.png',
            joinCluster: true,
            customCallout: { display: 'ALWAYS', anchorY: -2, anchorX: 0 },
            customData: { icon: icon, title: item.title || item.label }
          };
        });
        
        let mapLatitude = 31.216;
        let mapLongitude = 121.425;
        if (displayMarkers.length > 0) {
          mapLatitude = displayMarkers[0].latitude;
          mapLongitude = displayMarkers[0].longitude;
        }
        
        this.setData({ displayMarkers, mapLatitude, mapLongitude });
      }
    } catch(err) {
      console.error('Failed to load map markers:', err);
    }
  },

  initSystemInfo() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: sysInfo.statusBarHeight,
      safeAreaTop: sysInfo.statusBarHeight
    });
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  },

  updateChart() {
    const { chartData } = this.data;
    if (!chartData || chartData.length === 0) return;
    
    // 1. 计算所有节点的百分比坐标 (0-100%)
    // Let's find the max value to dynamically scale the Y-axis
    let maxVal = Math.max(...chartData.map(d => d.value), 10);
    // Add 10% padding to max value
    maxVal = maxVal * 1.1;

    const points = chartData.map((item, index) => {
      const x = 8 + (index * (85 / (chartData.length > 1 ? chartData.length - 1 : 1)));
      // y is scaled based on maxVal
      const y = 85 - ((item.value / maxVal) * 70); 
      return { ...item, x, y }; 
    });

    // 2. 生成贝滑曲线路径 (纯折线，不带圆点)
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // 3. 构建最精简的 SVG，使用 non-scaling-stroke 确保线宽在任何拉伸下保持一致
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}' fill='none' stroke='#ec5b13' stroke-width='3' stroke-linecap='round' vector-effect='non-scaling-stroke' /></svg>`;

    // 4. 标准安全的 Base64 转码
    const svgBase64 = wx.arrayBufferToBase64(new Uint8Array([...unescape(encodeURIComponent(svg))].map(c => c.charCodeAt(0))).buffer);
    const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;

    this.setData({
      chartData: points, // 更新带有 x, y 的数据到视图
      lineSvgUrl: svgUrl
    });
  },

  handleColClick(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ 
      activeIndex: this.data.activeIndex === index ? -1 : index 
    });
  },

  navigateToNestList() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/data/nest_list/index'
    });
  },

  navigateToShopList() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/data/shop_list/index'
    });
  },

  handleBack() { wx.navigateBack(); },
  openMap() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/data/site_overview/map/index'
    });
  }
});
