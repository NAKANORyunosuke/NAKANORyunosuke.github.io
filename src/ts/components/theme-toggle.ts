const THEME_STORAGE_KEY = 'preferred-theme';
type Theme = 'light' | 'dark';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function getPreferredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch (error) {
    // Ignore storage access failures and fall back to system preference.
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage access failures.
  }
}

function applyTheme(theme: Theme, button: HTMLButtonElement | null): void {
  const root = document.documentElement;
  root.classList.toggle('dark-mode', theme === 'dark');

  if (!button) return;
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  button.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

  const icon = button.querySelector<HTMLElement>('.theme-btn__icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
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
}
