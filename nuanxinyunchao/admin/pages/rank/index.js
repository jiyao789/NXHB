const { getRankMerchants, getRankUsers } = require('../../api/adminStatistics.js');
const { resolveMediaUrl } = require('../../utils/http.js');

const DEFAULT_AVATAR = 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/rank_icon.png';

const RANK_GROUP_TEMPLATE = [
  {
    titleImg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/title_flag.png',
    iconImg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/flag_icon.png',
    list: []
  },
  {
    titleImg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/title_user.png',
    iconImg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/user_icon.png',
    list: []
  },
  {
    titleImg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/title_information.png',
    iconImg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/icon_information.png'
  }
];

function mapRankItem(item) {
  const avatarRaw = item.avatar != null ? String(item.avatar).trim() : '';
  return {
    id: item.id,
    name: item.name != null ? String(item.name) : '',
    avatar: resolveMediaUrl(avatarRaw) || DEFAULT_AVATAR,
    score: item.count != null ? Number(item.count) : 0
  };
}

Page({
  data: {
    currentTab: 1,
    topButtons: [
      {
        name: '服务端',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/icon_service.png',
        appId: 'wx4901f591f50b49dd',
        path: 'pages/index/index'
      },
      {
        name: '管理端',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/rank/icon_admin.png'
      }
    ],
    rankGroups: RANK_GROUP_TEMPLATE,
    showPublishPopup: false,
    currentPopupBg: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/create/publish_pop_bg.png',
    currentPublishList: [
      { name: '官方通知', type: 10 },
      { name: '学习', type: 0 },
      { name: '我们需要你', type: 2 },
      { name: '活动', type: 4 },
      { name: '我们的荣耀时刻', type: 6 }
    ],
    rankLoading: false
  },

  onShow() {
    this.loadRankData();
  },

  loadRankData() {
    if (this.data.rankLoading) {
      return;
    }
    this.setData({ rankLoading: true });

    Promise.all([getRankMerchants(), getRankUsers()])
      .then(([merchantRes, userRes]) => {
        const merchants = Array.isArray(merchantRes.data) ? merchantRes.data : [];
        const users = Array.isArray(userRes.data) ? userRes.data : [];
        const groups = RANK_GROUP_TEMPLATE.map((g, idx) => {
          if (idx === 0) {
            return { ...g, list: merchants.map(mapRankItem).slice(0, 5) };
          }
          if (idx === 1) {
            return { ...g, list: users.map(mapRankItem).slice(0, 5) };
          }
          return { ...g };
        });
        this.setData({ rankGroups: groups });
      })
      .catch((err) => {
        console.error('loadRankData failed', err);
      })
      .finally(() => {
        this.setData({ rankLoading: false });
      });
  },

  handleTopBtnClick(e) {
    const { btn, index } = e.currentTarget.dataset;
    if (index === this.data.currentTab) return;

    if (btn.appId) {
      wx.navigateToMiniProgram({
        appId: btn.appId,
        path: btn.path,
        fail() {
          wx.showToast({ title: '跳转失败', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '没有配置appId', icon: 'none' });
    }
  },

  handleItemClick(e) {
    const { item, groupindex, index } = e.currentTarget.dataset;

    if (groupindex === 1) {
      wx.navigateTo({
        url: `/nuanxinyunchao/admin/pages-sub/rank/user_detail/index?id=${item.id}&name=${encodeURIComponent(item.name)}&avatar=${encodeURIComponent(item.avatar)}&score=${item.score}`
      });
      return;
    }

    if (groupindex === 0) {
      wx.navigateTo({
        url: `/nuanxinyunchao/admin/pages-sub/rank/site_detail?id=${item.id}&rank=${index + 1}`,
        fail: (err) => {
          console.error('跳转失败', err);
          wx.showToast({ title: '页面开发中', icon: 'none' });
        }
      });
      return;
    }

    wx.showToast({ title: '资讯榜暂未开放', icon: 'none' });
  },

  handlePublish() {
    this.setData({ showPublishPopup: true });
  },

  togglePublishPopup() {
    this.setData({ showPublishPopup: !this.data.showPublishPopup });
  },

  handleFinalPublish(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ showPublishPopup: false });
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/publish/publish?type=${type}`
    });
  },

  preventBubble() { },

  handleManage() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/rank/publish/publish'
    });
  }
});
