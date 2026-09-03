"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unocss_1 = require("unocss");
exports.default = (0, unocss_1.defineConfig)({
    content: {
        filesystem: [
            '**/*.wxml'
        ]
    },
    presets: [
        (0, unocss_1.presetIcons)({
            scale: 1.2,
            warn: true,
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            },
        }),
    ]
});
