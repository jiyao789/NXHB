"use strict";
Page({
    data: {
        safeAreaInsetsTop: 20,
        loading: true,
        detail: null,
        isFavorite: false
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        if (options && options.data) {
            try {
                const paramData = JSON.parse(decodeURIComponent(options.data));
                const detailData = {
                    id: 'preview',
                    title: paramData.title || '优惠券',
                    avatar: paramData.avatar || "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png",
                    amount: paramData.amount || 0,
                    price: paramData.price || 0,
                    shopName: paramData.shopName || '默认店铺',
                    scope: paramData.scope,
                    validDate: paramData.validDate,
                    rules: paramData.rules,
                    couponTypeName: paramData.couponTypeName || '优惠券'
                };
                this.setData({ detail: detailData, loading: false });
            } catch (e) {
                console.error("Preview data parse error", e);
                this.setData({ loading: false });
            }
        } else if (options && options.id) {
            this.fetchCouponDetail(options.id);
        } else {
            this.setData({ loading: false });
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    fetchCouponDetail(id) {
        this.setData({ loading: true });
        setTimeout(() => {
            const detailData = {
                id: id,
                amount: 51,
                price: 50,
                avatar: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png",
                shopName: '又喜商店',
                scope: '6店通用',
                validDate: '2023.12.19 至 2026.2.19 23:59',
                rules: [
                    '本单发票由商家提供，详情请咨询商家',
                    '堂食餐前外带均可',
                    '仅限购买门店好利来产品，可叠加使用',
                    '不兑现、不找零',
                    '团购用户不可同时享受商家其他优惠',
                    '发票问题请询问商家'
                ]
            };
            this.setData({
                detail: detailData,
                loading: false
            });
        }, 500);
    },
    toggleFavorite() {
        this.setData({ isFavorite: !this.data.isFavorite });
        wx.showToast({
            title: this.data.isFavorite ? '已收藏' : '已取消',
            icon: 'none'
        });
    }
});
