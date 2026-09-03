const article_1 = require("../../../api/article");
const biz_id_1 = require("../../../utils/bizId");
Page({
    data: {
        safeAreaTop: 0,
        loading: true,
        article: null
    },
    _articleIdStr: '',
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20
        });
        const idStr = (0, biz_id_1.normalizeBizEntityId)(options.id);
        if (!idStr) {
            this.setData({ loading: false });
            wx.showToast({ title: '无效的文章', icon: 'none' });
            return;
        }
        this._articleIdStr = idStr;
        this.fetchDetail(idStr);
    },
    async fetchDetail(id) {
        this.setData({ loading: true });
        try {
            const settled = await Promise.allSettled([
                (0, article_1.getArticleDetailApi)({ id, type: 6 }),
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
            }
            else {
                stats.like = stats.like != null ? stats.like : 0;
                stats.isLiked = !!stats.isLiked;
                stats.isStarred = !!stats.isStarred;
            }
            if (stats.share == null) {
                stats.share = 0;
            }
            const rawContent = res.content || '<p style="text-align:center;color:#999;margin-top:50rpx;">内容正在采集或抓取失败</p>';
            const formattedContent = this.formatContent(rawContent);
            const allImages = this.extractImageUrls(rawContent);
            
            this.setData({
                loading: false,
                article: {
                    id: res.id,
                    title: res.mainTitle || res.title,
                    content: formattedContent,
                    allImages: allImages,
                    stats
                }
            });
        }
        catch (err) {
            console.error('获取详情失败', err);
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    /**
     * 恢复 HTML 整体渲染，并注入响应式样式
     */
    formatContent(html) {
        if (!html) return '';
        // 注入全局图片样式，确保自适应宽度
        return html
            .replace(/<img/gi, '<img style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:8rpx;"')
            .replace(/<table/gi, '<table style="max-width:100%;"');
    },
    /**
     * 点击内容区域预览图片库
     */
    handleContentTap() {
        const { allImages } = this.data.article;
        if (allImages && allImages.length > 0) {
            wx.previewImage({
                current: allImages[0],
                urls: allImages
            });
        }
    },
    /**
     * 提取图片用于预览
     */
    extractImageUrls(html) {
        if (!html) return [];
        const urls = [];
        const reg = /<img [^>]*src=['"]([^'"]+)[^>]*>/gi;
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
        const type = parseInt(e.currentTarget.dataset.type, 10);
        if (!this.data.article || !this._articleIdStr)
            return;
        const originalStats = Object.assign({}, this.data.article.stats);
        const article = Object.assign({}, this.data.article, {
            stats: Object.assign({}, this.data.article.stats),
        });
        
        if (type === 0) {
            article.stats.share++;
            this.setData({ article });
            return;
        }
        
        if (type === 1) {
            try {
                const r = await (0, article_1.toggleArticleFavoriteApi)({
                    articleId: this._articleIdStr,
                    isVideo: false,
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
        }
    },
    onShareAppMessage() {
        const article = this.data.article;
        const id = this._articleIdStr || (article ? article.id : '');
        return {
            title: (article && article.title) || '分享一篇文章',
            path: '/nuanxinyunchao/user/pages-sub/index/glory/detail?id=' + id
        };
    }
});
