"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lang_switch_1 = require("./components/lang-switch");
const menu_1 = require("./components/menu");
const last_updated_1 = require("./components/last-updated");
const animations_1 = require("./components/animations");
function renderMathIfReady() {
    const render = window.renderMathInElement;
    if (typeof render !== 'function')
        return;
    render(document.body, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
        strict: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'code', 'pre'],
    });
}
function initMathRender() {
    if (document.readyState !== 'loading')
        renderMathIfReady();
    document.addEventListener('DOMContentLoaded', renderMathIfReady);
    window.addEventListener('load', renderMathIfReady);
}
document.addEventListener('DOMContentLoaded', () => {
    (0, lang_switch_1.initLangSwitch)();
    (0, menu_1.initMenuToggle)();
    (0, last_updated_1.initLastUpdated)();
    (0, animations_1.initScrollAnimations)();
    initMathRender();
});
