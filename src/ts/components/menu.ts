import { LANGUAGE_EVENT, Language, LANGUAGE_LABELS } from './lang-switch';

const MENU_ICON_OPEN = '☰';
const MENU_ICON_CLOSE = '✕';
const NAV_ID = 'primary-nav';

const MENU_LABELS: Record<Language, { open: string; close: string }> = {
  ja: { open: 'メニューを開く', close: 'メニューを閉じる' },
  en: { open: 'Open menu', close: 'Close menu' },
};

function updateMenuButton(button: HTMLButtonElement, isOpen: boolean, lang: Language): void {
  const labels = MENU_LABELS[lang] || MENU_LABELS.ja;
  button.textContent = isOpen ? MENU_ICON_CLOSE : MENU_ICON_OPEN;
  button.setAttribute('aria-expanded', String(isOpen));
  button.setAttribute('aria-label', isOpen ? labels.close : labels.open);
}

function closeMenu(nav: HTMLElement, button: HTMLButtonElement, lang: Language): void {
  if (nav.classList.contains('is-open')) {
    nav.classList.remove('is-open');
    updateMenuButton(button, false, lang);
  }
}

export function initMenuToggle(): void {
  const nav = document.getElementById(NAV_ID) as HTMLElement | null;
  const button = document.querySelector<HTMLButtonElement>('.menu-btn');
  if (!nav || !button) return;

  const getCurrentLanguage = (): Language => {
    const lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'ja';
    return lang === 'en' ? 'en' : 'ja';
  };

  const initialLang = getCurrentLanguage();
  updateMenuButton(button, nav.classList.contains('is-open'), initialLang);

  button.addEventListener('click', () => {
    const lang = getCurrentLanguage();
    const isOpen = nav.classList.toggle('is-open');
    updateMenuButton(button, isOpen, lang);
  });

  nav.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.tagName.toLowerCase() === 'a' && window.matchMedia('(max-width: 980px)').matches) {
      closeMenu(nav, button, getCurrentLanguage());
    }
  });

  document.addEventListener(LANGUAGE_EVENT, (event) => {
    const lang = (event as CustomEvent<Language>).detail || getCurrentLanguage();
    const isOpen = nav.classList.contains('is-open');
    updateMenuButton(button, isOpen, lang);
    button.setAttribute('title', LANGUAGE_LABELS[lang] || LANGUAGE_LABELS.ja);
  });
}
