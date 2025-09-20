"use strict";

const LANGUAGE_COOKIE = "lang";
const LANGUAGE_STORAGE_KEY = "preferred-lang";

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  if (!document.cookie) return null;

  const parts = document.cookie.split(";");
  let value = null;

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator) === name) {
      value = decodeURIComponent(part.slice(separator + 1));
    }
  }

  return value;
}

function storeLanguage(lang) {
  setCookie(LANGUAGE_COOKIE, lang, 30);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (_) {
    // localStorage is not available (private mode, etc.)
  }
}

function loadStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "ja" || stored === "en") {
      return stored;
    }
  } catch (_) {
    // localStorage is not available
  }

  const cookie = getCookie(LANGUAGE_COOKIE);
  if (cookie === "ja" || cookie === "en") {
    return cookie;
  }

  return null;
}

function applyLanguage(lang) {
  const normalized = lang === "ja" ? "ja" : "en";
  storeLanguage(normalized);

  const root = document.documentElement;
  root.setAttribute("lang", normalized);
  root.setAttribute("data-lang", normalized);

  const selector = document.getElementById("lang-select");
  if (selector && selector.value !== normalized) {
    selector.value = normalized;
  }
}

function getUrlLang() {
  try {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    return lang === "ja" || lang === "en" ? lang : null;
  } catch (_) {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("lang-select");
  if (selector) {
    selector.addEventListener("change", (event) => {
      const value = event.target && event.target.value;
      if (value === "ja" || value === "en") {
        applyLanguage(value);
      }
    });
  }

  const urlLang = getUrlLang();
  if (urlLang) {
    applyLanguage(urlLang);
    return;
  }

  const stored = loadStoredLanguage();
  if (stored) {
    applyLanguage(stored);
    return;
  }

  const fallback = navigator.language && navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
  applyLanguage(fallback);
});
