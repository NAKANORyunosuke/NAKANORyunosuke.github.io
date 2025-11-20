"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lang_switch_1 = require("./components/lang-switch");
const menu_1 = require("./components/menu");
const last_updated_1 = require("./components/last-updated");
const animations_1 = require("./components/animations");
document.addEventListener('DOMContentLoaded', () => {
    (0, lang_switch_1.initLangSwitch)();
    (0, menu_1.initMenuToggle)();
    (0, last_updated_1.initLastUpdated)();
    (0, animations_1.initScrollAnimations)();
});
