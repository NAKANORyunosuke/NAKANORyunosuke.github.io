import { LANGUAGE_EVENT, Language } from './lang-switch';

const THEME_STORAGE_KEY = 'preferred-theme';
type Theme = 'light' | 'dark';

const THEME_LABELS: Record<Language, { toDark: string; toLight: string }> = {
  ja: { toDark: 'ダークモードに切り替え', toLight: 'ライトモードに切り替え' },
  en: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
};

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function getPreferredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* ignore storage access failures and fall back to system preference */
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

function currentLanguage(): Language {
  const lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'ja';
  return lang === 'en' ? 'en' : 'ja';
}

function applyTheme(theme: Theme, button: HTMLButtonElement | null): void {
  const root = document.documentElement;
  root.classList.toggle('dark-mode', theme === 'dark');

  if (!button) return;
  const labels = THEME_LABELS[currentLanguage()];
  const label = theme === 'dark' ? labels.toLight : labels.toDark;
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  const icon = button.querySelector<HTMLElement>('.theme-btn__icon i');
  if (icon) {
    icon.classList.remove('ri-moon-line', 'ri-sun-line');
    icon.classList.add(theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line');
  }
}

export function initThemeToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('.theme-btn');
  let currentTheme = getPreferredTheme();
  applyTheme(currentTheme, button);

  if (!button) return;

  button.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    persistTheme(currentTheme);
    applyTheme(currentTheme, button);
  });

  document.addEventListener(LANGUAGE_EVENT, () => {
    applyTheme(currentTheme, button);
  });
}
