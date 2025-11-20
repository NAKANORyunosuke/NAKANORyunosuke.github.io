"use strict";
(() => {
  // src/ts/components/lang-switch.ts
  var LANGUAGE_COOKIE = "lang";
  var LANGUAGE_STORAGE_KEY = "preferred-lang";
  var COOKIE_LIFETIME_DAYS = 30;
  var LANGUAGE_EVENT = "preferredlanguagechange";
  var LANGUAGE_LABELS = {
    ja: "\u65E5\u672C\u8A9E",
    en: "English"
  };
  function isLanguage(value) {
    return value === "ja" || value === "en";
  }
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
  function getCookie(name) {
    if (!document.cookie) return null;
    const parts = document.cookie.split(";");
    for (const raw of parts) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
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
    } catch (e) {
    }
  }
  function loadStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(stored)) return stored;
    } catch (e) {
    }
    const cookie = getCookie(LANGUAGE_COOKIE);
    return isLanguage(cookie) ? cookie : null;
  }
  function detectBrowserLanguage() {
    const sources = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const value of sources) {
      if (typeof value === "string" && value.toLowerCase().startsWith("ja")) {
        return "ja";
      }
    }
    return "en";
  }
  function getUrlLanguage() {
    try {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get("lang");
      return isLanguage(lang) ? lang : null;
    } catch (e) {
      return null;
    }
  }
  function updateDocumentLanguage(lang) {
    const html = document.documentElement;
    if (html.getAttribute("lang") !== lang) html.setAttribute("lang", lang);
    if (html.getAttribute("data-lang") !== lang) html.setAttribute("data-lang", lang);
    const selector = document.getElementById("lang-select");
    if (selector && selector.value !== lang) selector.value = lang;
    document.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: lang }));
  }
  function chooseInitialLanguage() {
    const urlLang = getUrlLanguage();
    if (urlLang) return urlLang;
    const stored = loadStoredLanguage();
    if (stored) return stored;
    return detectBrowserLanguage();
  }
  function initLangSwitch() {
    const selector = document.getElementById("lang-select");
    const initial = chooseInitialLanguage();
    storeLanguage(initial);
    updateDocumentLanguage(initial);
    if (selector) {
      selector.setAttribute("aria-label", "Select language");
      selector.setAttribute("title", "Select language");
      selector.addEventListener("change", (event) => {
        const target = event.target;
        if (!target) return;
        const value = target.value;
        if (!isLanguage(value)) return;
        storeLanguage(value);
        updateDocumentLanguage(value);
      });
    }
  }

  // src/ts/components/menu.ts
  var MENU_ICON_OPEN = "\u2630";
  var MENU_ICON_CLOSE = "\u2715";
  var NAV_ID = "primary-nav";
  var MENU_LABELS = {
    ja: { open: "\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F", close: "\u30E1\u30CB\u30E5\u30FC\u3092\u9589\u3058\u308B" },
    en: { open: "Open menu", close: "Close menu" }
  };
  function updateMenuButton(button, isOpen, lang) {
    const labels = MENU_LABELS[lang] || MENU_LABELS.ja;
    button.textContent = isOpen ? MENU_ICON_CLOSE : MENU_ICON_OPEN;
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? labels.close : labels.open);
  }
  function closeMenu(nav, button, lang) {
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      updateMenuButton(button, false, lang);
    }
  }
  function initMenuToggle() {
    const nav = document.getElementById(NAV_ID);
    const button = document.querySelector(".menu-btn");
    if (!nav || !button) return;
    const getCurrentLanguage = () => {
      const lang = document.documentElement.getAttribute("data-lang") || document.documentElement.getAttribute("lang") || "ja";
      return lang === "en" ? "en" : "ja";
    };
    const initialLang = getCurrentLanguage();
    updateMenuButton(button, nav.classList.contains("is-open"), initialLang);
    button.addEventListener("click", () => {
      const lang = getCurrentLanguage();
      const isOpen = nav.classList.toggle("is-open");
      updateMenuButton(button, isOpen, lang);
    });
    nav.addEventListener("click", (event) => {
      const target = event.target;
      if (!target) return;
      if (target.tagName.toLowerCase() === "a" && window.matchMedia("(max-width: 980px)").matches) {
        closeMenu(nav, button, getCurrentLanguage());
      }
    });
    document.addEventListener(LANGUAGE_EVENT, (event) => {
      const lang = event.detail || getCurrentLanguage();
      const isOpen = nav.classList.contains("is-open");
      updateMenuButton(button, isOpen, lang);
      button.setAttribute("title", LANGUAGE_LABELS[lang] || LANGUAGE_LABELS.ja);
    });
  }

  // src/ts/components/last-updated.ts
  function formatWithPadding(value) {
    return String(value).padStart(2, "0");
  }
  function initLastUpdated() {
    const lastJa = document.getElementById("last-updated-ja");
    const lastEn = document.getElementById("last-updated-en");
    if (!lastJa && !lastEn) return;
    const d = new Date(document.lastModified);
    const yyyy = d.getFullYear();
    const mm = formatWithPadding(d.getMonth() + 1);
    const dd = formatWithPadding(d.getDate());
    const hh = formatWithPadding(d.getHours());
    const mi = formatWithPadding(d.getMinutes());
    if (lastJa) {
      lastJa.textContent = `${yyyy}\u5E74${mm}\u6708${dd}\u65E5 ${hh}:${mi}`;
    }
    if (lastEn) {
      lastEn.textContent = `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    }
  }

  // src/ts/components/animations.ts
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(".reveal-on-scroll");
    if (!("IntersectionObserver" in window) || animatedElements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
    );
    animatedElements.forEach((el, index) => {
      el.style.transitionDelay = `${index % 5 * 100}ms`;
      observer.observe(el);
    });
  }

  // src/ts/main.ts
  function renderMathIfReady() {
    const render = window.renderMathInElement;
    if (typeof render !== "function") return;
    render(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false,
      strict: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "code", "pre"]
    });
  }
  function initMathRender() {
    if (document.readyState !== "loading") renderMathIfReady();
    document.addEventListener("DOMContentLoaded", renderMathIfReady);
    window.addEventListener("load", renderMathIfReady);
  }
  document.addEventListener("DOMContentLoaded", () => {
    initLangSwitch();
    initMenuToggle();
    initLastUpdated();
    initScrollAnimations();
    initMathRender();
  });
})();
//# sourceMappingURL=main.js.map
