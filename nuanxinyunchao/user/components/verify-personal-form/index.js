"use strict";
Component({
    properties: {
        name: { type: String, value: '' },
        phone: { type: String, value: '' },
        code: { type: String, value: '' },
        certImages: { type: Array, value: [] },
        isPartyMember: { type: Boolean, value: false },
        countdown: { type: Number, value: 0 },
        invitationCode: { type: String, value: '' }
    },
    methods: {
        /* ---- 职业证件上传 (多图，最多6张) ---- */
        onUploadCert() {
            const remaining = 6 - this.properties.certImages.length;
            if (remaining <= 0) return;
            wx.chooseMedia({
                count: remaining,
                mediaType: ['image'],
                sizeType: ['compressed'],
                success: (res) => {
                    const newPaths = res.tempFiles.map(f => f.tempFilePath);
                    this.triggerEvent('certChanged', { paths: newPaths });
                }
            });
        },
        onDeleteCert(e) {
            const index = e.currentTarget.dataset.index;
            this.triggerEvent('certDeleted', { index });
        },
        onPreviewCert(e) {
            const index = e.currentTarget.dataset.index;
            const images = this.properties.certImages;
            if (images.length > 0) {
                wx.previewImage({
                    current: images[index],
                    urls: images
                });
            }
        },
        /* ---- 表单 input 事件 ---- */
        onName(e) { this.triggerEvent('fieldChange', { field: 'name', value: e.detail.value }); },
        onPhone(e) { this.triggerEvent('fieldChange', { field: 'phone', value: e.detail.value }); },
        onCode(e) { this.triggerEvent('fieldChange', { field: 'code', value: e.detail.value }); },
        onInvitationCode(e) { this.triggerEvent('fieldChange', { field: 'invitationCode', value: e.detail.value }); },
        onToggleParty() { this.triggerEvent('toggleParty'); },
        /* ---- 发送验证码 ---- */
        onSendCode() { this.triggerEvent('sendCode'); }
    }
});
