"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMenuToggle = initMenuToggle;
const lang_switch_1 = require("./lang-switch");
const MENU_ICON_OPEN = '☰';
const MENU_ICON_CLOSE = '✕';
const NAV_ID = 'primary-nav';
const MENU_LABELS = {
    ja: { open: 'メニューを開く', close: 'メニューを閉じる' },
    en: { open: 'Open menu', close: 'Close menu' },
};
function updateMenuButton(button, isOpen, lang) {
    const labels = MENU_LABELS[lang] || MENU_LABELS.ja;
    button.textContent = isOpen ? MENU_ICON_CLOSE : MENU_ICON_OPEN;
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? labels.close : labels.open);
}
function closeMenu(nav, button, lang) {
    if (nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        updateMenuButton(button, false, lang);
    }
}
function initMenuToggle() {
    const nav = document.getElementById(NAV_ID);
    const button = document.querySelector('.menu-btn');
    if (!nav || !button)
        return;
    const getCurrentLanguage = () => {
        const lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'ja';
        return lang === 'en' ? 'en' : 'ja';
    };
    const initialLang = getCurrentLanguage();
    updateMenuButton(button, nav.classList.contains('is-open'), initialLang);
    button.addEventListener('click', () => {
        const lang = getCurrentLanguage();
        const isOpen = nav.classList.toggle('is-open');
        updateMenuButton(button, isOpen, lang);
    });
    nav.addEventListener('click', (event) => {
        const target = event.target;
        if (!target)
            return;
        if (target.tagName.toLowerCase() === 'a' && window.matchMedia('(max-width: 980px)').matches) {
            closeMenu(nav, button, getCurrentLanguage());
        }
    });
    document.addEventListener(lang_switch_1.LANGUAGE_EVENT, (event) => {
        const lang = event.detail || getCurrentLanguage();
        const isOpen = nav.classList.contains('is-open');
        updateMenuButton(button, isOpen, lang);
        button.setAttribute('title', lang_switch_1.LANGUAGE_LABELS[lang] || lang_switch_1.LANGUAGE_LABELS.ja);
    });
}
