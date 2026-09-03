"use strict";
Component({
    properties: {
        currentStep: { type: Number, value: 0 },
        isAgreed: { type: Boolean, value: false }
    },
    methods: {
        onToggleAgree() { this.triggerEvent('toggleAgree'); },
        onService() { this.triggerEvent('protocol', { type: 'service' }); },
        onPrivacy() { this.triggerEvent('protocol', { type: 'privacy' }); },
        onNext() { this.triggerEvent('next'); },
        onLogin() { this.triggerEvent('login'); }
    }
});
