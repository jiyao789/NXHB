// src/utils/mockData.js
export const mockData = {
  // Rank Page Data
  rank: {
    siteList: [
      { id: 1, name: '朝阳区云巢A站点', score: 98, rank: 1, address: '北京市朝阳区某某路1号' },
      { id: 2, name: '海淀区云巢B站点', score: 95, rank: 2, address: '北京市海淀区某某路2号' },
      { id: 3, name: '丰台区云巢C站点', score: 90, rank: 3, address: '北京市丰台区某某路3号' }
    ],
    siteDetail: {
      1: {
        id: 1,
        name: '朝阳区云巢A站点',
        score: 98,
        rank: 1,
        address: '北京市朝阳区某某路1号',
        manager: '张三',
        phone: '13800138000',
        facilities: ['空调', '饮水机', '微波炉', '休息椅'],
        services: ['免费热水', '手机充电', '应急药品']
      }
    }
  },
  // Data Page Data
  data: {
    summary: {
      totalSites: 120,
      activeUsers: 3500,
      servicesProvided: 15600
    },
    weeklyStats: [
      { date: '周一', value: 120 },
      { date: '周二', value: 200 },
      { date: '周三', value: 150 },
      { date: '周四', value: 300 },
      { date: '周五', value: 280 },
      { date: '周六', value: 400 },
      { date: '周日', value: 350 }
    ]
  },
  // Review Page Data
  review: {
    pendingList: [
      { id: 101, type: '新增站点', submitter: '李四', time: '2023-10-25 10:00', status: '待审核' },
      { id: 102, type: '信息修改', submitter: '王五', time: '2023-10-26 14:30', status: '待审核' }
    ]
  },
  // User Data
  user: {
    token: 'mock-token-123456',
    userInfo: {
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      nickName: '演示管理员',
      role: 'admin'
    }
  }
};

export const getMockData = (path) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const parts = path.split('.');
      let result = mockData;
      for (const part of parts) {
        if (result && result[part] !== undefined) {
          result = result[part];
        } else {
          result = null;
          break;
        }
      }
      resolve({ code: 200, data: result, msg: 'success' });
    }, 500); // Simulate network delay
  });
};
