"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_LABELS = exports.LANGUAGE_EVENT = void 0;
exports.initLangSwitch = initLangSwitch;
const LANGUAGE_COOKIE = 'lang';
const LANGUAGE_STORAGE_KEY = 'preferred-lang';
const COOKIE_LIFETIME_DAYS = 30;
const LANGUAGE_EVENT = 'preferredlanguagechange';
exports.LANGUAGE_EVENT = LANGUAGE_EVENT;
const LANGUAGE_LABELS = {
    ja: '日本語',
    en: 'English',
};
exports.LANGUAGE_LABELS = LANGUAGE_LABELS;
function isLanguage(value) {
    return value === 'ja' || value === 'en';
}
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
    if (!document.cookie)
        return null;
    const parts = document.cookie.split(';');
    for (const raw of parts) {
        const trimmed = raw.trim();
        if (!trimmed)
            continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1)
            continue;
        if (trimmed.slice(0, eq) === name) {
            return decodeURIComponent(trimmed.slice(eq + 1));
        }
    }
    return null;
}
function storeLanguage(lang) {
    setCookie(LANGUAGE_COOKIE, lang, COOKIE_LIFETIME_DAYS);
    try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
    catch (_a) {
        /* localStorage unavailable */
    }
}
function loadStoredLanguage() {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isLanguage(stored))
            return stored;
    }
    catch (_a) {
        /* ignore */
    }
    const cookie = getCookie(LANGUAGE_COOKIE);
    return isLanguage(cookie) ? cookie : null;
}
function detectBrowserLanguage() {
    const sources = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const value of sources) {
        if (typeof value === 'string' && value.toLowerCase().startsWith('ja')) {
            return 'ja';
        }
    }
    return 'en';
}
function getUrlLanguage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        return isLanguage(lang) ? lang : null;
    }
    catch (_a) {
        return null;
    }
}
function updateDocumentLanguage(lang) {
    const html = document.documentElement;
    if (html.getAttribute('lang') !== lang)
        html.setAttribute('lang', lang);
    if (html.getAttribute('data-lang') !== lang)
        html.setAttribute('data-lang', lang);
    const selector = document.getElementById('lang-select');
    if (selector && selector.value !== lang)
        selector.value = lang;
    document.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: lang }));
}
function chooseInitialLanguage() {
    const urlLang = getUrlLanguage();
    if (urlLang)
        return urlLang;
    const stored = loadStoredLanguage();
    if (stored)
        return stored;
    return detectBrowserLanguage();
}
function initLangSwitch() {
    const selector = document.getElementById('lang-select');
    const initial = chooseInitialLanguage();
    storeLanguage(initial);
    updateDocumentLanguage(initial);
    if (selector) {
        selector.setAttribute('aria-label', 'Select language');
        selector.setAttribute('title', 'Select language');
        selector.addEventListener('change', (event) => {
            const target = event.target;
            if (!target)
                return;
            const value = target.value;
            if (!isLanguage(value))
                return;
            storeLanguage(value);
            updateDocumentLanguage(value);
        });
    }
}
