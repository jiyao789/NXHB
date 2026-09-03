"use strict";
const taskReward_1 = require("../../utils/taskReward");
const hot_1 = require("../../api/hot");
const normalizeImageUrl_1 = require("../../utils/normalizeImageUrl");
const { httpGet } = require("../../utils/http");
const FALLBACK_BANNERS = [
    'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/volunteer/banner1.png',
    'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/volunteer/banner2.png'
];
Page({
    data: {
        scrollTop: 0,
        currentBannerIndex: 0,
        showLandmarkMenu: false,
        showActivityMenu: false,
        selectedLandmarks: [],
        selectedActivities: [],
        landmarkOptions: ['暖新巢', '友好商户'],
        activityOptions: ['活动', '服务', '优惠'],
        bannerList: FALLBACK_BANNERS,
        rankList: [],
        filteredRankList: [],
        taskInfo: {
            active: false,
            type: '',
            countdown: 15,
            isCompleted: false
        },
        searchKeyword: "",
        searchResults: [],
        showSearchResults: false,
        isSearching: false,
        searchTimer: null
    },
    onLoad() {
    },
    onHide() {
        if (this.data.taskInfo.active) {
            (0, taskReward_1.snapshotActiveTaskFromPage)(this.data.taskInfo, this.data.taskInfo.countdown);
        }
        this.stopTimer();
    },
    onUnload() {
        this.stopTimer();
    },
    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            if (this.data.taskInfo.countdown > 0) {
                const next = this.data.taskInfo.countdown - 1;
                this.setData({
                    'taskInfo.countdown': next
                });
                (0, taskReward_1.persistActiveTask)({ countdown: next });
            }
            else {
                this.stopTimer();
                this.setData({
                    'taskInfo.isCompleted': true
                });
                (0, taskReward_1.markTaskCompletedAndClaim)();
            }
        }, 1000);
    },
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },
    handleBackToTasks() {
        const pages = getCurrentPages();
        const targetPath = 'pages-sub/index/checkin/index';
        const fullUrl = '/' + targetPath;
        console.log('[Task] Current Stack Routes:', pages.map(p => p.route));
        wx.removeStorageSync('activeTask');
        this.setData({ 'taskInfo.active': false });
        this.stopTimer();
        let delta = -1;
        for (let i = pages.length - 1; i >= 0; i--) {
            const currRoute = pages[i].route;
            if (currRoute.includes('checkin/index') && i !== pages.length - 1) {
                delta = pages.length - 1 - i;
                console.log('[Task] Found Task Center at stack index:', i, 'delta:', delta);
                break;
            }
        }
        if (delta > 0) {
            wx.navigateBack({ delta });
        }
        else {
            console.log('[Task] Task Center not in stack, opening new page:', fullUrl);
            wx.navigateTo({ url: fullUrl });
        }
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 3
            });
        }
        const activeTask = wx.getStorageSync('activeTask');
        if (activeTask && activeTask.active) {
            this.setData({
                'taskInfo.active': true,
                'taskInfo.type': activeTask.type,
                'taskInfo.countdown': activeTask.countdown !== undefined ? activeTask.countdown : (activeTask.type === 'browse_hot' ? 15 : 0),
                'taskInfo.isCompleted': activeTask.isCompleted || false
            });
            if (activeTask.type === 'browse_hot' && !this.data.taskInfo.isCompleted && !this.timer) {
                this.startTimer();
            }
        }
        else {
            this.setData({
                'taskInfo.active': false
            });
            this.stopTimer();
        }
        this.loadHotPage();
    },
    fetchLocation() {
        return new Promise((resolve) => {
            wx.getLocation({
                type: 'gcj02',
                success: (res) => resolve({ userLat: res.latitude, userLng: res.longitude }),
                fail: () => resolve({})
            });
        });
    },
    async loadHotPage() {
        wx.showLoading({ title: '加载中...', mask: true });
        try {
            const loc = await this.fetchLocation();
            const query = {};
            if (loc.userLat != null && loc.userLng != null) {
                query.userLat = loc.userLat;
                query.userLng = loc.userLng;
            }
            const [bannerRaw, listRaw] = await Promise.all([
                httpGet('/biz/volunteer/activity/page', { current: 1, size: 5, isTop: 1 }),
                (0, hot_1.getHotDiscoverListApi)(query)
            ]);
            const norm = normalizeImageUrl_1.normalizeImageUrl;
            const records = (bannerRaw && bannerRaw.records) ? bannerRaw.records : [];
            const bannerUrls = records.map((item, index) => {
                return norm(item.image || `https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/volunteer/banner${(index % 2) + 1}.png`);
            }).filter((u) => !!u);
            const bannerList = bannerUrls.length > 0 ? bannerUrls : FALLBACK_BANNERS;
            const rankList = (Array.isArray(listRaw) ? listRaw : []).map((row) => this.mapDiscoverRow(row, norm));
            this.setData({
                bannerList,
                rankList,
                currentBannerIndex: 0
            }, () => this.filterData());
        }
        catch (e) {
            console.error(e);
            wx.showToast({ title: '加载失败', icon: 'none' });
            this.setData({
                bannerList: FALLBACK_BANNERS
            }, () => this.filterData());
        }
        finally {
            wx.hideLoading();
        }
    },
    mapDiscoverRow(row, norm) {
        const tags = Array.isArray(row.tags)
            ? row.tags
                .map((t) => ({
                text: (t === null || t === void 0 ? void 0 : t.text) || '',
                type: (t === null || t === void 0 ? void 0 : t.type) || ''
            }))
                .filter((t) => !!t.text)
            : [];
        const rawType = row.type || '';
        const type = rawType === '党群服务中心' ? '暖新巢' : rawType;
        return {
            id: row.id,
            image: norm((row.image || '')),
            title: row.title || '',
            tags,
            category: row.category || '',
            area: row.area || '',
            hotCount: row.hotCount != null ? row.hotCount : 0,
            status: row.status || '',
            distance: row.distance || '',
            type,
            subType: row.subType || '',
            detailScene: row.detailScene || (type === '暖新巢' ? 'warm' : 'merchant')
        };
    },
    onPageScroll(e) {
        this.setData({ scrollTop: e.scrollTop });
    },
    onBannerChange(e) {
        this.setData({ currentBannerIndex: e.detail.current });
    },
    toggleMenu(e) {
        const type = e.currentTarget.dataset.type;
        if (type === 'landmark') {
            this.setData({
                showLandmarkMenu: !this.data.showLandmarkMenu,
                showActivityMenu: false
            });
        }
        else {
            this.setData({
                showActivityMenu: !this.data.showActivityMenu,
                showLandmarkMenu: false
            });
        }
    },
    closeDropdown() {
        this.setData({
            showLandmarkMenu: false,
            showActivityMenu: false
        });
    },
    selectOption(e) {
        const type = e.currentTarget.dataset.type;
        const opt = e.currentTarget.dataset.opt;
        let currentList = type === 'landmark' ? [...this.data.selectedLandmarks] : [...this.data.selectedActivities];
        const index = currentList.indexOf(opt);
        if (index > -1) {
            currentList.splice(index, 1);
        }
        else {
            currentList.push(opt);
        }
        if (type === 'landmark') {
            this.setData({ selectedLandmarks: currentList });
        }
        else {
            this.setData({ selectedActivities: currentList });
        }
        this.filterData();
    },
    filterData() {
        const { selectedLandmarks, selectedActivities, rankList } = this.data;
        const source = Array.isArray(rankList) ? rankList : [];
        const filtered = source.filter((item) => {
            const matchLandmark = selectedLandmarks.length === 0 || selectedLandmarks.includes(item.type);
            if (selectedActivities.length === 0) {
                return matchLandmark;
            }
            if (!item.subType) {
                return false;
            }
            const matchActivity = selectedActivities.includes(item.subType);
            return matchLandmark && matchActivity;
        });
        this.setData({ filteredRankList: filtered });
    },
    handleShopClick(e) {
        const item = e.currentTarget.dataset.item;
        const taskParam = this.data.taskInfo.active ? `&fromTask=${this.data.taskInfo.type}` : '';
        if (item.type === '友好商户') {
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${item.id}${taskParam}`
            });
        }
        else if (item.type === '暖新巢') {
            const scene = item.detailScene === 'party' ? 'party' : 'warm';
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/hot/surroundings?id=${item.id}&name=${encodeURIComponent(item.title)}&address=${encodeURIComponent(item.area)}&scene=${scene}${taskParam}`
            });
        }
    },
    hideSearchResults() {
        this.setData({ showSearchResults: false });
    },
    onSearchFocus() {
        this.setData({ showSearchResults: true });
        if (this.data.searchResults.length === 0) {
            this.fetchSearchResults(this.data.searchKeyword || '');
        }
    },
    onSearchInput(e) {
        const keyword = e.detail.value;
        this.setData({ searchKeyword: keyword, showSearchResults: true });
        if (this.data.searchTimer) {
            clearTimeout(this.data.searchTimer);
        }
        const timer = setTimeout(() => {
            this.fetchSearchResults(keyword);
        }, 300);
        this.setData({ searchTimer: timer });
    },
    async fetchSearchResults(keyword) {
        this.setData({ isSearching: true });
        try {
            const loc = await this.fetchLocation();
            const query = {};
            if (keyword) {
                query.keyword = keyword;
            }
            if (loc.userLat != null && loc.userLng != null) {
                query.userLat = loc.userLat;
                query.userLng = loc.userLng;
            }
            const raw = await (0, hot_1.getHotDiscoverListApi)(query);
            const list = Array.isArray(raw) ? raw : ((raw && raw.records) || (raw && raw.data) || (raw && raw.rows) || []);
            const norm = normalizeImageUrl_1.normalizeImageUrl;
            const searchResults = list.map((row) => this.mapDiscoverRow(row, norm));
            this.setData({ searchResults, isSearching: false });
        } catch (e) {
            console.error('[hot search] failed', e);
            this.setData({ isSearching: false });
        }
    },
    onSelectSearchResult(e) {
        const item = e.currentTarget.dataset.item;
        this.hideSearchResults();
        if (!item || !item.id) return;
        this.handleShopClick({ currentTarget: { dataset: { item } } });
    }
});
