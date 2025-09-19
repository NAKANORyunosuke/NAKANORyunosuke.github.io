"use strict";

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .reduce((result, part) => {
      const [key, val] = part.split('=');
      return key === name ? decodeURIComponent(val) : result;
    }, null);
}

function setLanguage(lang) {
  setCookie('lang', lang, 30);

  document.querySelectorAll('.lang-ja').forEach((el) => {
    el.style.setProperty('display', lang === 'ja' ? 'block' : 'none', 'important');
  });
  document.querySelectorAll('.lang-en').forEach((el) => {
    el.style.setProperty('display', lang === 'en' ? 'block' : 'none', 'important');
  });

  const selector = document.getElementById('lang-select');
  if (selector && selector.value !== lang) {
    selector.value = lang;
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
