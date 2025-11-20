"use strict";
const LANGUAGE_COOKIE = 'lang';
const LANGUAGE_STORAGE_KEY = 'preferred-lang';
const COOKIE_LIFETIME_DAYS = 30;
function isLanguage(value) {
    return value === 'ja' || value === 'en';
}
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
    if (!document.cookie) {
        return null;
    }
    const parts = document.cookie.split(';');
    for (const rawPart of parts) {
        const part = rawPart.trim();
        if (!part) {
            continue;
        }
        const separator = part.indexOf('=');
        if (separator === -1) {
            continue;
        }
        if (part.slice(0, separator) === name) {
            return decodeURIComponent(part.slice(separator + 1));
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
        // localStorage is unavailable (private mode, etc.)
    }
}
function loadStoredLanguage() {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isLanguage(stored)) {
            return stored;
        }
    }
    catch (_a) {
        // localStorage is unavailable
    }
    const cookie = getCookie(LANGUAGE_COOKIE);
    if (isLanguage(cookie)) {
        return cookie;
    }
    return null;
}
function detectBrowserLanguage() {
    const sources = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
    for (const value of sources) {
        if (typeof value === 'string' && value.toLowerCase().startsWith('ja')) {
            return 'ja';
        }
    }
    return 'en';
}
function applyLanguage(lang) {
    storeLanguage(lang);
    const root = document.documentElement;
    if (root.getAttribute('lang') !== lang) {
        root.setAttribute('lang', lang);
    }
    if (root.getAttribute('data-lang') !== lang) {
        root.setAttribute('data-lang', lang);
    }
    const selector = document.getElementById('lang-select');
    if (selector && selector.value !== lang) {
        selector.value = lang;
    }
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
document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('lang-select');
    if (selector) {
        selector.addEventListener('change', (event) => {
            const target = event.target;
            if (!target) {
                return;
            }
            const value = target.value;
            if (isLanguage(value)) {
                applyLanguage(value);
            }
        });
    }
    const urlLang = getUrlLanguage();
    if (urlLang) {
        applyLanguage(urlLang);
        return;
    }
    const stored = loadStoredLanguage();
    if (stored) {
        applyLanguage(stored);
        return;
    }
    const fallback = detectBrowserLanguage();
    applyLanguage(fallback);
});
