const LANGUAGE_COOKIE = 'lang';
const LANGUAGE_STORAGE_KEY = 'preferred-lang';
const COOKIE_LIFETIME_DAYS = 30;

type Language = 'ja' | 'en';

type NullableString = string | null;

function isLanguage(value: NullableString): value is Language {
  return value === 'ja' || value === 'en';
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): NullableString {
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

function storeLanguage(lang: Language): void {
  setCookie(LANGUAGE_COOKIE, lang, COOKIE_LIFETIME_DAYS);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage is unavailable (private mode, etc.)
  }
}

function loadStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) {
      return stored;
    }
  } catch {
    // localStorage is unavailable
  }

  const cookie = getCookie(LANGUAGE_COOKIE);
  if (isLanguage(cookie)) {
    return cookie;
  }

  return null;
}

function detectBrowserLanguage(): Language {
  const sources: string[] = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages as string[]
    : [navigator.language];

  for (const value of sources) {
    if (typeof value === 'string' && value.toLowerCase().startsWith('ja')) {
      return 'ja';
    }
  }

  return 'en';
}

function applyLanguage(lang: Language): void {
  storeLanguage(lang);

  const root = document.documentElement;
  if (root.getAttribute('lang') !== lang) {
    root.setAttribute('lang', lang);
  }
  if (root.getAttribute('data-lang') !== lang) {
    root.setAttribute('data-lang', lang);
  }

  const selector = document.getElementById('lang-select') as HTMLSelectElement | null;
  if (selector && selector.value !== lang) {
    selector.value = lang;
  }
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

document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('lang-select') as HTMLSelectElement | null;

  if (selector) {
    selector.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement | null;
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
