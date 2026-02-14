export type Language = 'ja' | 'en';

const LANGUAGE_COOKIE = 'lang';
const LANGUAGE_STORAGE_KEY = 'preferred-lang';
const COOKIE_LIFETIME_DAYS = 30;
const LANGUAGE_EVENT = 'preferredlanguagechange';

const LANGUAGE_LABELS: Record<Language, string> = {
  ja: '日本語',
  en: 'English',
};

function isLanguage(value: string | null): value is Language {
  return value === 'ja' || value === 'en';
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (!document.cookie) return null;
  const parts = document.cookie.split(';');
  for (const raw of parts) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return null;
}

function storeLanguage(lang: Language): void {
  setCookie(LANGUAGE_COOKIE, lang, COOKIE_LIFETIME_DAYS);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* localStorage unavailable */
  }
}

function loadStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    /* ignore */
  }
  const cookie = getCookie(LANGUAGE_COOKIE);
  return isLanguage(cookie) ? cookie : null;
}

function detectBrowserLanguage(): Language {
  const sources = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const value of sources) {
    if (typeof value === 'string' && value.toLowerCase().startsWith('ja')) {
      return 'ja';
    }
  }
  return 'en';
}

function getUrlLanguage(): Language | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    return isLanguage(lang) ? lang : null;
  } catch {
    return null;
  }
}

function updateDocumentLanguage(lang: Language): void {
  const html = document.documentElement;
  if (html.getAttribute('lang') !== lang) html.setAttribute('lang', lang);
  if (html.getAttribute('data-lang') !== lang) html.setAttribute('data-lang', lang);

  document.querySelectorAll<HTMLSelectElement>('[data-lang-select]').forEach((selector) => {
    if (selector.value !== lang) selector.value = lang;
  });

  document.dispatchEvent(new CustomEvent<Language>(LANGUAGE_EVENT, { detail: lang }));
}

function chooseInitialLanguage(): Language {
  const urlLang = getUrlLanguage();
  if (urlLang) return urlLang;

  const stored = loadStoredLanguage();
  if (stored) return stored;

  return detectBrowserLanguage();
}

export function initLangSwitch(): void {
  const selectors = Array.from(document.querySelectorAll<HTMLSelectElement>('[data-lang-select]'));
  const initial = chooseInitialLanguage();
  storeLanguage(initial);
  updateDocumentLanguage(initial);

  selectors.forEach((selector) => {
    selector.setAttribute('aria-label', 'Select language');
    selector.setAttribute('title', 'Select language');
    selector.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement | null;
      if (!target) return;
      const value = target.value;
      if (!isLanguage(value)) return;
      storeLanguage(value);
      updateDocumentLanguage(value);
    });
  });
}

export { LANGUAGE_EVENT, LANGUAGE_LABELS };
