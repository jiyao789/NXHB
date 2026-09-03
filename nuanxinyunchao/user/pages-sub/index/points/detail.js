"use strict";
const article_1 = require("../../../api/article");
const image_url_1 = require("../../../utils/imageUrl");
const biz_id_1 = require("../../../utils/bizId");
Page({
    data: {
        safeAreaTop: 0,
        loading: true,
        article: null,
        minReadSeconds: 15,
        countdownSeconds: 15,
        isReadCompleted: false,
    },
    _visibleSince: null,
    _totalDwellMs: 0,
    _readCompleteSent: false,
    _dwellInterval: null,
    _visualTimer: null,
    /** biz_article 主键（Snowflake 超长，禁止 Number） */
    _articleIdStr: '',
    _contentType: 0,
    _isVideo: false,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20,
        });
        const idStr = (0, biz_id_1.normalizeBizEntityId)(options.id);
        if (!idStr) {
            this.setData({ loading: false });
            wx.showToast({ title: '无效的文章', icon: 'none' });
            return;
        }
        this._articleIdStr = idStr;
        const t = options.type != null ? parseInt(String(options.type), 10) : 0;
        this._contentType = Number.isFinite(t) ? t : 0;
        this._isVideo = options.isVideo === '1' || options.isVideo === 1;
        this.fetchDetail(idStr, this._contentType);
    },
    onShow() {
        this._visibleSince = Date.now();
        this.startDwellCheck();
        this.startVisualTimer();
    },
    onHide() {
        this.stopDwellCheck();
        this.stopVisualTimer();
        this.accumulateDwell();
        this.trySubmitReadComplete();
    },
    onUnload() {
        this.stopDwellCheck();
        this.stopVisualTimer();
        this.accumulateDwell();
        this.trySubmitReadComplete();
    },
    startVisualTimer() {
        this.stopVisualTimer();
        if (this.data.isReadCompleted) return;
        this._visualTimer = setInterval(() => {
            let next = this.data.countdownSeconds - 1;
            if (next <= 0) {
                next = 0;
                this.setData({ countdownSeconds: next, isReadCompleted: true });
                this.stopVisualTimer();
                this.trySubmitReadComplete();
            } else {
                this.setData({ countdownSeconds: next });
            }
        }, 1000);
    },
    stopVisualTimer() {
        if (this._visualTimer) {
            clearInterval(this._visualTimer);
            this._visualTimer = null;
        }
    },
    startDwellCheck() {
        this.stopDwellCheck();
        this._dwellInterval = setInterval(() => {
            this.trySubmitReadComplete();
        }, 4000);
    },
    stopDwellCheck() {
        if (this._dwellInterval != null) {
            clearInterval(this._dwellInterval);
            this._dwellInterval = null;
        }
    },
    accumulateDwell() {
        if (this._visibleSince != null) {
            this._totalDwellMs += Date.now() - this._visibleSince;
            this._visibleSince = null;
        }
    },
    /** 含当前这次前台可见片段，避免仅依赖 onHide 入账导致停留统计偏少 */
    peekDwellSeconds() {
        let ms = this._totalDwellMs;
        if (this._visibleSince != null) {
            ms += Date.now() - this._visibleSince;
        }
        return Math.floor(ms / 1000);
    },
    async trySubmitReadComplete() {
        if (this._readCompleteSent || !this._articleIdStr) {
            return;
        }
        const minSec = this.data.minReadSeconds || 15;
        let dwellSeconds = this.peekDwellSeconds();
        if (this.data.isReadCompleted && dwellSeconds < minSec) {
            dwellSeconds = minSec;
        }
        if (typeof dwellSeconds !== 'number' || isNaN(dwellSeconds) || dwellSeconds < minSec) {
            return;
        }
        this._readCompleteSent = true;
        try {
            const r = await (0, article_1.completeArticleReadApi)({
                articleId: String(this._articleIdStr),
                dwellSeconds: Math.floor(dwellSeconds),
                dwell_seconds: Math.floor(dwellSeconds) // 兼容可能的下划线映射配置
            });
            if (r && r.awarded === true && r.pointsGranted > 0) {
                wx.showToast({ title: `+${r.pointsGranted}积分`, icon: 'none' });
            }
            else if (r && r.awarded === false && r.message) {
                wx.showToast({ title: r.message, icon: 'none', duration: 3500 });
            }
        }
        catch (e) {
            // 如果是 415 等参数校验或者严重逻辑错误，不要再无限重试了
            if (e && (e.code === 415 || e.code === 400)) {
                console.warn('read/complete 校验失败，停止重试', e);
            } else {
                this._readCompleteSent = false;
                console.warn('read/complete', e);
            }
        }
    },
    async fetchDetail(id, contentType) {
        this.setData({ loading: true });
        try {
            const settled = await Promise.allSettled([
                (0, article_1.getArticleDetailApi)({ id, type: contentType }),
                (0, article_1.getArticleDetailExtraApi)({ id }),
            ]);
            const detailOutcome = settled[0];
            const extraOutcome = settled[1];
            if (detailOutcome.status !== 'fulfilled') {
                throw detailOutcome.reason;
            }
            const res = detailOutcome.value;
            let extra = null;
            if (extraOutcome.status === 'fulfilled') {
                extra = extraOutcome.value;
            }
            const stats = res.stats ? Object.assign({}, res.stats) : {};
            if (extra) {
                stats.like = extra.likes != null ? extra.likes : 0;
                stats.isLiked = !!extra.isLiked;
                stats.isStarred = !!extra.isFavorited;
                if (extra.minReadSeconds != null) {
                    this.setData({ minReadSeconds: extra.minReadSeconds });
                    if (!this.data.isReadCompleted) {
                        this.setData({ countdownSeconds: extra.minReadSeconds });
                    }
                }
            }
            else {
                stats.like = stats.like != null ? stats.like : 0;
                stats.isLiked = !!stats.isLiked;
                stats.isStarred = !!stats.isStarred;
            }
            if (stats.share == null) {
                stats.share = 0;
            }
            let rawContent = res.content || '<p style="text-align:center;color:#999;margin-top:50rpx;">内容正在采集或抓取失败</p>';
            
            const imageList = [];
            const videoList = [];
            const mediaList = [];

            if (res.images && Array.isArray(res.images) && res.images.length > 0) {
                res.images.forEach(mediaUrl => {
                    const normalizedUrl = (0, image_url_1.normalizeImageUrl)(mediaUrl);
                    if (normalizedUrl.match(/\.(mp4|mov|m4v|3gp|avi|flv)(\?.*)?$/i)) {
                        videoList.push(normalizedUrl);
                        mediaList.push({ url: normalizedUrl, is_video: true });
                    } else {
                        imageList.push(normalizedUrl);
                        mediaList.push({ url: normalizedUrl, is_video: false });
                    }
                });
            }

            // 处理可能包含的 \n 等富文本
            rawContent = rawContent.replace(/\n/g, '<br/>');
            const withUrls = this.normalizeImgSrc(rawContent);
            const formattedContent = this.formatContent(withUrls);
            const allImages = this.extractImageUrls(withUrls);
            
            // 将顶部的图片也加入到预览列表中
            if (imageList.length > 0) {
                allImages.unshift(...imageList);
            }

            this.setData({
                loading: false,
                article: {
                    id: res.id,
                    title: res.mainTitle || res.title,
                    content: formattedContent,
                    videos: videoList,
                    allImages,
                    mediaList,
                    stats,
                },
            });
        }
        catch (err) {
            console.error('获取详情失败', err);
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    normalizeImgSrc(html) {
        if (!html)
            return '';
        return html.replace(/<img([^>]*?)src\s*=\s*(["'])([^"']+)\2/gi, (_, pre, q, src) => {
            const abs = (0, image_url_1.normalizeImageUrl)(src.trim());
            return `<img${pre} src=${q}${abs}${q}`;
        });
    },
    formatContent(html) {
        if (!html)
            return '';
        return html
            .replace(/<img/gi, '<img style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:8rpx;"')
            .replace(/<table/gi, '<table style="max-width:100%;"');
    },
    handleContentTap() {
        const article = this.data.article;
        if (!article)
            return;
        const allImages = article.allImages;
        if (allImages && allImages.length > 0) {
            wx.previewImage({
                current: allImages[0],
                urls: allImages,
            });
        }
    },
    extractImageUrls(html) {
        if (!html)
            return [];
        const urls = [];
        const reg = /<img [^>]*src=['"]([^'"]+)['"][^>]*>/gi;
        let match;
        while ((match = reg.exec(html))) {
            urls.push(match[1]);
        }
        return urls;
    },
    handleBack() {
        wx.navigateBack();
    },
    async handleInteract(e) {
        if (this._isInteracting) return;
        this._isInteracting = true;
        const type = parseInt(e.currentTarget.dataset.type, 10);
        if (!this.data.article || !this._articleIdStr) {
            this._isInteracting = false;
            return;
        }
        const originalStats = Object.assign({}, this.data.article.stats);
        const article = Object.assign({}, this.data.article, {
            stats: Object.assign({}, this.data.article.stats),
        });
        if (type === 1) {
            try {
                const r = await (0, article_1.toggleArticleFavoriteApi)({
                    articleId: this._articleIdStr,
                    isVideo: this._isVideo,
                });
                article.stats.isStarred = !!(r && r.isFavorited);
                wx.showToast({ title: article.stats.isStarred ? '已收藏' : '已取消收藏', icon: 'none' });
                this.setData({ article });
            }
            catch (err) {
                console.error(err);
                article.stats = originalStats;
                this.setData({ article });
            }
            this._isInteracting = false;
            return;
        }
        if (type === 2) {
            try {
                const r = await (0, article_1.toggleArticleLikeApi)({ articleId: this._articleIdStr });
                if (r) {
                    article.stats.isLiked = !!r.isLiked;
                    article.stats.like = r.likes != null ? r.likes : article.stats.like;
                }
                this.setData({ article });
            }
            catch (err) {
                console.error(err);
                article.stats = originalStats;
                this.setData({ article });
            }
            this._isInteracting = false;
        }
    },
    onShareAppMessage() {
        const article = this.data.article;
        const id = this._articleIdStr || (article ? article.id : '');
        const t = this._contentType;
        const v = this._isVideo ? 1 : 0;
        return {
            title: (article && article.title) || '分享学习内容',
            path: `/nuanxinyunchao/user/pages-sub/index/points/detail?id=${encodeURIComponent(String(id))}&type=${t}&isVideo=${v}`,
        };
    },
});
