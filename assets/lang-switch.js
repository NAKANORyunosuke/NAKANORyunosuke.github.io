"use strict";

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  if (!document.cookie) return null;

  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .reduce((result, part) => {
      if (result !== null || !part) return result;
      const separator = part.indexOf('=');
      if (separator === -1) return result;
      const key = part.slice(0, separator);
      if (key !== name) return result;
      return decodeURIComponent(part.slice(separator + 1));
    }, null);
}

function setLanguage(lang) {
  const normalized = lang === 'ja' ? 'ja' : 'en';
  setCookie('lang', normalized, 30);

  const root = document.documentElement;
  root.setAttribute('lang', normalized);
  root.setAttribute('data-lang', normalized);

  const selector = document.getElementById('lang-select');
  if (selector && selector.value !== normalized) {
    selector.value = normalized;
  }
}

function getUrlLang() {
  const params = new URLSearchParams(window.location.search);
  const l = params.get('lang');
  return l === 'ja' || l === 'en' ? l : null;
}

document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('lang-select');
  if (selector) {
    selector.addEventListener('change', (event) => {
      const value = event.target.value;
      if (value === 'ja' || value === 'en') {
        setLanguage(value);
      }
    });
  }

  const urlLang = getUrlLang();
  if (urlLang) {
    setLanguage(urlLang);
    return;
  }

  const cookieLang = getCookie('lang');
  const browserLang = navigator.language && navigator.language.startsWith('ja') ? 'ja' : 'en';
  const initialLang = cookieLang === 'ja' || cookieLang === 'en' ? cookieLang : browserLang;
  setLanguage(initialLang);
});
