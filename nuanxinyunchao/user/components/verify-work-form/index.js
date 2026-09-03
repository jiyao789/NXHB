"use strict";
Component({
    properties: {
        siteName: { type: String, value: '' },
        businessArea: { type: String, value: '' },
        address: { type: String, value: '' }
    },
    methods: {
        /* ---- 文本输入 ---- */
        onSiteName(e) { this.triggerEvent('fieldChange', { field: 'siteName', value: e.detail.value }); },
        onBusinessArea(e) { this.triggerEvent('fieldChange', { field: 'businessArea', value: e.detail.value }); },
        onAddress(e) { this.triggerEvent('fieldChange', { field: 'address', value: e.detail.value }); }
    }
});
