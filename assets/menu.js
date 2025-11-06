"use strict";
const MENU_ICON_OPEN = '☰';
const MENU_ICON_CLOSE = '✕';
const MENU_LABELS = {
    ja: { open: 'メニューを開く', close: 'メニューを閉じる' },
    en: { open: 'Open menu', close: 'Close menu' }
};
function currentLanguage() {
    const lang = document.documentElement.getAttribute('data-lang') ||
        document.documentElement.getAttribute('lang') ||
        'ja';
    return lang === 'en' ? 'en' : 'ja';
}
function updateMenuButton(button, isOpen) {
    const lang = currentLanguage();
    const labels = MENU_LABELS[lang];
    button.textContent = isOpen ? MENU_ICON_CLOSE : MENU_ICON_OPEN;
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? labels.close : labels.open);
}
function toggleMenu() {
    const nav = document.getElementById('primary-nav');
    const button = document.querySelector('.menu-btn');
    if (!nav || !(button instanceof HTMLButtonElement))
        return;
    const isOpen = nav.classList.toggle('is-open');
    updateMenuButton(button, isOpen);
}
document.addEventListener('preferredlanguagechange', () => {
    const button = document.querySelector('.menu-btn');
    if (!(button instanceof HTMLButtonElement))
        return;
    const nav = document.getElementById('primary-nav');
    const isOpen = !!(nav === null || nav === void 0 ? void 0 : nav.classList.contains('is-open'));
    updateMenuButton(button, isOpen);
});
document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.menu-btn');
    if (!(button instanceof HTMLButtonElement))
        return;
    const nav = document.getElementById('primary-nav');
    if (!nav)
        return;
    const isOpen = nav.classList.contains('is-open');
    updateMenuButton(button, isOpen);
});
