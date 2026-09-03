"use strict";
const couponApi = require("../../../api/coupon");
const normalizeImageUrl = require("../../../utils/normalizeImageUrl").normalizeImageUrl;
const tokenManager = require("../../../utils/token").tokenManager;
const taskReward = require("../../../utils/taskReward");

const FALLBACK_COVER = "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png";

Page({
    data: {
        safeAreaInsetsTop: 20,
        loading: true,
        detail: null,
        templateIdStr: "",
        ledgerIdStr: "",
        isFavorited: false,
    },
    _exchangeLock: false,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        let idRaw = options && options.id != null ? String(options.id).trim() : "";
        try {
            if (idRaw)
                idRaw = decodeURIComponent(idRaw);
        }
        catch (_e) {
            /* ignore */
        }
        let ledgerRaw = options && options.ledgerId != null ? String(options.ledgerId).trim() : "";
        try {
            if (ledgerRaw)
                ledgerRaw = decodeURIComponent(ledgerRaw);
        }
        catch (_e2) {
            /* ignore */
        }
        this.setData({
            templateIdStr: idRaw,
            ledgerIdStr: ledgerRaw,
        });
        if (idRaw || ledgerRaw) {
            void this.fetchCouponDetail(idRaw, ledgerRaw);
        }
        else {
            this.setData({ loading: false });
            wx.showToast({ title: "缺少优惠券信息", icon: "none" });
        }
    },
    onShow() {
        const idRaw = String(this.data.templateIdStr || "").trim();
        const ledgerRaw = String(this.data.ledgerIdStr || "").trim();
        if ((!idRaw && !ledgerRaw) || this.data.loading)
            return;
        const d = this.data.detail;
        if (tokenManager.getToken() && d && d.pointsBalance == null) {
            void this.fetchCouponDetail(idRaw, ledgerRaw);
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    async fetchCouponDetail(idRaw, ledgerIdRaw) {
        this.setData({ loading: true });
        const idAsk = typeof idRaw === "string" ? idRaw : "";
        const ledgerAsk =
            ledgerIdRaw !== undefined && ledgerIdRaw !== null ? String(ledgerIdRaw).trim() : "";
        if (!idAsk && !ledgerAsk) {
            this.setData({ loading: false });
            wx.showToast({ title: "缺少优惠券信息", icon: "none" });
            return;
        }
        try {
            const raw = await couponApi.getCouponTemplateDetailApi(idAsk, ledgerAsk || undefined);
            const coverSrc = normalizeImageUrl(raw && raw.coverImageUrl ? raw.coverImageUrl : "");
            const usageRuleLines = raw && raw.usageRuleLines ? raw.usageRuleLines : [];
            let btnText = raw.pointsRequired + '积分兑换';
            let btnClass = 'bg-FF6B00 text-white';
            if (!raw.canExchange) {
                if (raw.reasonMessage && raw.reasonMessage.indexOf('积分不足') !== -1) {
                    btnText = raw.pointsRequired + '积分兑换';
                } else {
                    btnText = raw.reasonMessage || '暂不可兑换';
                }
                btnClass = 'bg-gray-200 text-gray-500';
            }
            const detail = Object.assign({}, raw, {
                coverImageUrlResolved: coverSrc || FALLBACK_COVER,
                usageRuleLines,
                btnText,
                btnClass
            });
            const tplBack =
                raw && raw.couponTemplateId != null ? String(raw.couponTemplateId).trim() : "";
            const patch = {
                detail,
                loading: false,
            };
            if (tplBack)
                patch.templateIdStr = tplBack;
            
            // 获取收藏状态
            if (tokenManager.getToken() && tplBack) {
                try {
                    const isFavorited = await couponApi.checkCouponFavoriteApi(tplBack);
                    patch.isFavorited = isFavorited;
                } catch (e) {
                    console.warn("[mine/coupon/detail] check favorite failed", e);
                }
            }
            
            this.setData(patch);
        }
        catch (e) {
            console.error("[mine/coupon/detail]", e);
            this.setData({ loading: false, detail: null });
        }
    },
    async handleExchangeTap() {
        const tplId =
            this.data.detail && this.data.detail.couponTemplateId != null
                ? String(this.data.detail.couponTemplateId).trim()
                : String(this.data.templateIdStr || "").trim();
        if (!tplId) {
            wx.showToast({ title: "缺少优惠券信息", icon: "none" });
            return;
        }
        if (!tokenManager.getToken()) {
            const loginModal = this.selectComponent("#global-login-modal");
            if (loginModal) {
                loginModal.open("");
            }
            else {
                wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            }
            return;
        }
        const d = this.data.detail;
        if (!d || !d.canExchange) {
            const msg = d && d.reasonMessage ? d.reasonMessage : "暂不可兑换";
            wx.showToast({ title: msg, icon: "none", duration: 2500 });
            return;
        }
        if (this._exchangeLock)
            return;
        this._exchangeLock = true;
        wx.showLoading({ title: "兑换中...", mask: true });
        try {
            await couponApi.exchangeCouponTemplateApi(tplId);
            wx.showToast({ title: "兑换成功", icon: "success" });
            await taskReward.tryClaimRedeemTaskReward();
            await this.fetchCouponDetail(String(this.data.templateIdStr || "").trim(), String(this.data.ledgerIdStr || "").trim());
        }
        catch (e) {
            console.error("[mine/coupon/detail] exchange", e);
        }
        finally {
            wx.hideLoading();
            this._exchangeLock = false;
        }
    },
    
    async handleFavoriteTap() {
        const tplId =
            this.data.detail && this.data.detail.couponTemplateId != null
                ? String(this.data.detail.couponTemplateId).trim()
                : String(this.data.templateIdStr || "").trim();
        
        if (!tplId) {
            wx.showToast({ title: "缺少优惠券信息", icon: "none" });
            return;
        }
        
        if (!tokenManager.getToken()) {
            const loginModal = this.selectComponent("#global-login-modal");
            if (loginModal) {
                loginModal.open("");
            } else {
                wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            }
            return;
        }
        
        const d = this.data.detail;
        const title = d && d.couponName ? d.couponName : "";
        const coverImage = d && d.coverImageUrlResolved ? d.coverImageUrlResolved : "";
        
        wx.showLoading({ title: "处理中...", mask: true });
        try {
            const result = await couponApi.toggleCouponFavoriteApi(tplId, title, coverImage);
            this.setData({ isFavorited: result });
            wx.showToast({ 
                title: result ? "收藏成功" : "取消收藏", 
                icon: result ? "success" : "none" 
            });
        } catch (e) {
            console.error("[mine/coupon/detail] favorite", e);
            wx.showToast({ title: "操作失败", icon: "none" });
        } finally {
            wx.hideLoading();
        }
    },
});
