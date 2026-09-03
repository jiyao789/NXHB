"use strict";
const { httpPost } = require('../../../utils/http');
const { uploadLocal } = require('../../../utils/uploadFile');
function errMsg(e) {
    if (e == null) {
        return '未知错误';
    }
    if (typeof e === 'string') {
        return e;
    }
    return e.message || e.msg || (e.data && String(e.data)) || '提交失败';
}
async function uploadLocalImagePaths(paths) {
    if (!paths || paths.length === 0) {
        return [];
    }
    const urls = [];
    for (let i = 0; i < paths.length; i++) {
        const u = await uploadLocal(paths[i]);
        urls.push(u);
    }
    return urls;
}
Page({
    data: {
        safeAreaTop: 0,
        safeAreaBottom: 0,
        scrollTop: 0,
        isSubmitting: false,
        formData: {
            feedbackContent: '',
            feedbackPhone: '',
            skillContent: '',
            skillPhone: '',
        },
        feedbackImages: [],
        skillImages: [],
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20,
            safeAreaBottom: sysInfo.safeArea.bottom ? sysInfo.screenHeight - sysInfo.safeArea.bottom : 20
        });
    },
    onPageScroll(e) {
        this.setData({
            scrollTop: e.scrollTop
        });
    },
    handleBack() {
        wx.navigateBack();
    },
    onInput(e) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;
        this.setData({
            [`formData.${field}`]: value
        });
    },
    handleUploadImage(e) {
        const type = e.currentTarget.dataset.type;
        const currentList = type === 'feedback' ? this.data.feedbackImages : this.data.skillImages;
        wx.chooseImage({
            count: 9 - currentList.length,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const newList = [...currentList, ...res.tempFilePaths];
                if (type === 'feedback') {
                    this.setData({ feedbackImages: newList });
                }
                else {
                    this.setData({ skillImages: newList });
                }
            },
        });
    },
    removeImage(e) {
        const type = e.currentTarget.dataset.type;
        const index = e.currentTarget.dataset.index;
        const currentList = type === 'feedback' ? this.data.feedbackImages : this.data.skillImages;
        currentList.splice(index, 1);
        if (type === 'feedback') {
            this.setData({ feedbackImages: currentList });
        }
        else {
            this.setData({ skillImages: currentList });
        }
    },
    handlePreviewImage(e) {
        const type = e.currentTarget.dataset.type;
        const index = e.currentTarget.dataset.index;
        const list = type === 'feedback' ? this.data.feedbackImages : this.data.skillImages;
        wx.previewImage({
            urls: list,
            current: list[index],
        });
    },
    async handleSubmit() {
        const { formData, feedbackImages, skillImages } = this.data;
        const hasFeedback = formData.feedbackContent.trim() || feedbackImages.length > 0;
        const hasSkill = formData.skillContent.trim() || skillImages.length > 0;
        if (!hasFeedback && !hasSkill) {
            wx.showToast({ title: '请至少填写一项反馈或特长', icon: 'none' });
            return; // 把 return 单独写
        }
        if (formData.feedbackPhone && !/^1[3-9]\d{9}$/.test(formData.feedbackPhone)) {
            wx.showToast({ title: '需求反馈电话格式不正确', icon: 'none' });
            return; // 把 return 单独写
        }
        if (hasSkill && (!formData.skillPhone || !/^1[3-9]\d{9}$/.test(formData.skillPhone.trim()))) {
            wx.showToast({ title: '填写特长时请填写有效联系电话', icon: 'none' });
            return;
        }
        this.setData({ isSubmitting: true });
        wx.showLoading({ title: '正在提交...', mask: true });
        try {
            let feedbackErr = null;
            let skillErr = null;
            if (hasFeedback) {
                try {
                    const imageList = await uploadLocalImagePaths(feedbackImages);
                    await httpPost('/user/feedback/submit', {
                        feedbackContent: (formData.feedbackContent || '').trim(),
                        imageList,
                    }, { hideErrorToast: true });
                }
                catch (e) {
                    feedbackErr = e;
                }
            }
            if (hasSkill) {
                try {
                    const imageList = await uploadLocalImagePaths(skillImages);
                    await httpPost('/user/ability-feedback/submit', {
                        abilities: (formData.skillContent || '').trim(),
                        imageList,
                        phone: formData.skillPhone.trim(),
                    }, { hideErrorToast: true });
                }
                catch (e) {
                    skillErr = e;
                }
            }
            wx.hideLoading();
            const fbOk = !hasFeedback || !feedbackErr;
            const skOk = !hasSkill || !skillErr;
            if (fbOk && skOk) {
                wx.showToast({ title: '提交成功', icon: 'success' });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            }
            else if (hasFeedback && hasSkill) {
                if (!feedbackErr && skillErr) {
                    wx.showModal({
                        title: '部分提交成功',
                        content: '需求反馈已提交，特长提交失败：' + errMsg(skillErr),
                        showCancel: false,
                        success: () => wx.navigateBack(),
                    });
                }
                else if (feedbackErr && !skillErr) {
                    wx.showModal({
                        title: '部分提交成功',
                        content: '特长已提交，需求反馈失败：' + errMsg(feedbackErr),
                        showCancel: false,
                        success: () => wx.navigateBack(),
                    });
                }
                else {
                    wx.showModal({
                        title: '提交失败',
                        content: errMsg(feedbackErr) + '；' + errMsg(skillErr),
                        showCancel: false,
                    });
                }
            }
            else {
                wx.showModal({
                    title: '提交失败',
                    content: errMsg(feedbackErr || skillErr),
                    showCancel: false,
                });
            }
        }
        catch (e) {
            wx.hideLoading();
            wx.showModal({
                title: '提交失败',
                content: errMsg(e),
                showCancel: false,
            });
        }
        finally {
            this.setData({ isSubmitting: false });
        }
    }
});
