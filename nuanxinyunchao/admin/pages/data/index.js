const { getAdminOverview } = require('../../api/adminStatistics.js');

function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  str = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
  for (let i = 0; i < str.length; i += 3) {
    const char1 = str.charCodeAt(i);
    const char2 = str.charCodeAt(i + 1);
    const char3 = str.charCodeAt(i + 2);
    const enc1 = char1 >> 2;
    const enc2 = ((char1 & 3) << 4) | (char2 >> 4);
    const enc3 = ((char2 & 15) << 2) | (char3 >> 6);
    const enc4 = char3 & 63;
    if (isNaN(char2)) output += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    else if (isNaN(char3)) output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    else output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

Page({
  data: {
    titleImages: {
      site: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/title_site.png',
      group: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/title_group.png',
      active: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/title_active.png',
    },
    siteData: { total: 0 },
    siteChartList: [],
    employmentData: {
      groups: []
    },
    chartSvgUrl: '',
    chartLabels: [],
    currentActiveTab: 0,
    activeTabs: [
      {
        name: '阵地',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_site.png',
        activeIcon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_site_active.png',
      },
      {
        name: '用户',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_user.png',
        activeIcon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_user_active.png',
      },
      {
        name: '活动',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_activity.png',
        activeIcon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_activity_active.png',
      },
      {
        name: '服务',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_service.png',
        activeIcon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/data/tab_service_active.png',
      }
    ],
    activeData: {
      totalAct: 0,
      totalRed: 0,
      list: [
        { name: '新华路街道', act: 25, red: 650 },
        { name: '华阳路街道', act: 18, red: 480 },
      ]
    },
    workerTotal: 0
  },

  onLoad() {
    this.fetchOverviewData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // index for active
      })
    }
  },

  async fetchOverviewData() {
    try {
      wx.showLoading({ title: '加载数据中' });
      const res = await getAdminOverview();
      wx.hideLoading();
      if (res && res.code === 200 && res.data) {
        const { merchant, worker, active } = res.data;
        
        // 1. 阵地 (merchant)
        const merchantTotal = merchant.total || 0;
        this.setData({
          'siteData.total': merchantTotal
        });
        this.initChartList(merchant.nestCount || 0, merchant.friendlyPlanCount || 0, merchantTotal);

        // 2. 新就业群体 (worker)
        const groupsMap = {
          '外卖员': { color: '#e3699e' },
          '快递员': { color: '#5181eb' },
          '网约车司机': { color: '#fee851' },
          '货车司机': { color: '#bce838' },
          '主播': { color: '#ff9754' }
        };
        const newGroups = [];
        let visualTotal = 0;
        if (worker.details) {
          worker.details.forEach(item => {
            if (groupsMap[item.name]) {
              visualTotal += item.count;
              newGroups.push({
                name: item.name,
                color: groupsMap[item.name].color,
                count: item.count
              });
            }
          });
        }
        this.setData({
          'employmentData.groups': newGroups,
          'workerTotal': visualTotal
        });
        this.updateChartData();

        // 3. 活跃看板 (active)
        let sumAct = 0;
        let sumRed = 0;
        if (active.list) {
          active.list.forEach(item => {
            sumAct += (item.act || 0);
            sumRed += (item.red || 0);
          });
        }
        this.setData({
          'activeData.totalAct': sumAct, 
          'activeData.totalRed': sumRed,
          'activeData.list': active.list ? active.list.slice(0, 2) : []
        });
      }
    } catch(err) {
      wx.hideLoading();
      console.error('Fetch overview err:', err);
      this.initChartList(0, 0, 0);
      this.updateChartData();
    }
  },

  initChartList(nestCount = 0, friendlyCount = 0, total = 0) {
    const getBarWidth = (val, text = '') => {
      const maxValue = Math.max(total, nestCount, friendlyCount, 10);
      let percentage = 0;
      if (maxValue > 0) percentage = (val / maxValue) * 100;
      const minWidth = text.length > 3 ? 25 : 14;
      return `${Math.min(Math.max(percentage, minWidth), 100)}%`;
    };

    const list = [
      { label: '阵地\n总数', type: 'simple', value: total, barColor: '#fb923c', textColor: '#ffffff', width: getBarWidth(total, String(total)) },
      { label: '暖新\n巢', type: 'simple', value: nestCount, barColor: '#ffab78', textColor: '#ffffff', width: getBarWidth(nestCount, String(nestCount)) },
      { label: '暖新\n友好\n计划', type: 'simple', value: friendlyCount, barColor: '#fce787', textColor: '#d97706', width: getBarWidth(friendlyCount, String(friendlyCount)) }
    ];
    this.setData({ siteChartList: list });
  },

  updateChartData() {
    const visualOrder = ['快递员', '主播', '货车司机', '网约车司机', '外卖员'];
    const map = new Map(this.data.employmentData.groups.map(g => [g.name, g]));
    const visualTotal = this.data.workerTotal;
    
    let currentAngle = -90;
    const processed = [];

    if (visualTotal > 0) {
      visualOrder.forEach((name) => {
        const item = map.get(name);
        if (item && item.count > 0) {
          let sweepAngle = (item.count / visualTotal) * 360;
          const start = currentAngle;
          let end = currentAngle + sweepAngle;
          if (sweepAngle >= 360) end = start + 359.99;
          
          processed.push({
            ...item,
            percent: Math.round((item.count / visualTotal) * 100),
            startAngle: start,
            endAngle: end
          });
          currentAngle += sweepAngle;
        }
      });
    } else {
      processed.push({
        name: '暂无数据',
        color: '#e5e7eb',
        percent: 0,
        startAngle: -90,
        endAngle: 269.99
      });
    }

    const size = 100;
    const center = 50;
    const radius = 40;
    const strokeWidth = 10;

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)),
      };
    };

    const makeArc = (startAngle, endAngle) => {
      const start = polarToCartesian(center, center, radius, endAngle);
      const end = polarToCartesian(center, center, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    let paths = '';
    let defs = '';

    processed.forEach((item, index) => {
      const gradId = `grad_${index}`;
      const d = makeArc(item.startAngle, item.endAngle);
      const headPoint = polarToCartesian(center, center, radius, item.startAngle);
      const tailPoint = polarToCartesian(center, center, radius, item.endAngle);

      defs += `
        <linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${headPoint.x}" y1="${headPoint.y}" x2="${tailPoint.x}" y2="${tailPoint.y}">
          <stop offset="0%" stop-color="${item.color}" stop-opacity="1" />
          <stop offset="60%" stop-color="${item.color}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="${item.color}" stop-opacity="0.4" />
        </linearGradient>
      `;
      // Changed stroke-linecap to butt so there are no rounded overlaps when full
      paths += `<path d="${d}" fill="none" stroke="url(#${gradId})" stroke-width="${strokeWidth}" stroke-linecap="butt" />`;
    });

    const svgXml = `
      <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>${defs}</defs>
        ${paths}
      </svg>
    `;
    const chartSvgUrl = `data:image/svg+xml;base64,${base64Encode(svgXml)}`;

    const chartLabels = processed.filter(item => item.percent > 0).map(item => {
      const labelAngle = item.startAngle + (item.endAngle - item.startAngle) / 2;
      const angleRad = labelAngle * Math.PI / 180.0;
      const rPercent = 40;
      const x = 50 + rPercent * Math.cos(angleRad);
      const y = 50 + rPercent * Math.sin(angleRad);
      const rotate = labelAngle + 90;

      return {
        text: `${item.percent}%`,
        color: item.color,
        x: x.toFixed(2),
        y: y.toFixed(2),
        rotate: rotate.toFixed(2),
      };
    });

    this.setData({ chartSvgUrl, chartLabels });
  },

  handleTabClick(e) {
    this.setData({ currentActiveTab: e.currentTarget.dataset.index });
  },

  handleToActiveBoard() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/data/active_board/index'
    });
  },

  handleToEmploymentDetails() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/data/employment_group/index'
    });
  },

  handleToSiteOverview() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/data/site_overview/index'
    });
  }
});
