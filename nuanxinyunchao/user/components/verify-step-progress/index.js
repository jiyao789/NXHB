"use strict";
Component({
    properties: {
        current: { type: Number, value: 0 }
    },
    methods: {
        onStep0() {
            if (this.properties.current > 0) {
                this.triggerEvent('jump', { step: 0 });
            }
        },
        onStep1() {
            if (this.properties.current > 1) {
                this.triggerEvent('jump', { step: 1 });
            }
        }
    }
});
