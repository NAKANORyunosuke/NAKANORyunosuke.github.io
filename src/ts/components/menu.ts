import { LANGUAGE_EVENT, Language, LANGUAGE_LABELS } from './lang-switch';

const MENU_ICON_OPEN = '☰';
const MENU_ICON_CLOSE = '✕';
const NAV_ID = 'primary-nav';
const NAV_OVERLAY_SELECTOR = '[data-nav-overlay]';
const MOBILE_BREAKPOINT_QUERY = '(max-width: 1120px)';

const MENU_LABELS: Record<Language, { open: string; close: string }> = {
  ja: { open: 'メニューを開く', close: 'メニューを閉じる' },
  en: { open: 'Open menu', close: 'Close menu' },
};

function updateMenuButton(button: HTMLButtonElement, isOpen: boolean, lang: Language): void {
  const labels = MENU_LABELS[lang] || MENU_LABELS.ja;
  button.textContent = isOpen ? MENU_ICON_CLOSE : MENU_ICON_OPEN;
  button.setAttribute('aria-expanded', String(isOpen));
  button.setAttribute('aria-label', isOpen ? labels.close : labels.open);
  button.setAttribute('title', isOpen ? labels.close : labels.open);
}

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    if (el.hasAttribute('hidden')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function syncMenuState(
  nav: HTMLElement,
  overlay: HTMLElement | null,
  button: HTMLButtonElement,
  isOpen: boolean,
  lang: Language,
): void {
  nav.classList.toggle('is-open', isOpen);
  updateMenuButton(button, isOpen, lang);

  if (overlay) {
    overlay.classList.toggle('is-active', isOpen);
    overlay.hidden = !isOpen;
  }

  document.body.classList.toggle('has-open-nav', isOpen);

  if (isOpen) {
    const focusables = getFocusableElements(nav);
    if (focusables.length > 0) {
      window.requestAnimationFrame(() => focusables[0].focus());
    }
  }
}

function closeMenu(nav: HTMLElement, overlay: HTMLElement | null, button: HTMLButtonElement, lang: Language): void {
  if (nav.classList.contains('is-open')) {
    syncMenuState(nav, overlay, button, false, lang);
    button.focus();
  }
}

export function initMenuToggle(): void {
  const nav = document.getElementById(NAV_ID) as HTMLElement | null;
  const button = document.querySelector<HTMLButtonElement>('.menu-btn');
  const overlay = document.querySelector<HTMLElement>(NAV_OVERLAY_SELECTOR);
  if (!nav || !button) return;

  const getCurrentLanguage = (): Language => {
    const lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'ja';
    return lang === 'en' ? 'en' : 'ja';
  };

  const initialLang = getCurrentLanguage();
  syncMenuState(nav, overlay, button, nav.classList.contains('is-open'), initialLang);

  button.addEventListener('click', () => {
    const lang = getCurrentLanguage();
    const isOpen = !nav.classList.contains('is-open');
    syncMenuState(nav, overlay, button, isOpen, lang);
  });

  nav.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('a') && isMobileViewport()) {
      closeMenu(nav, overlay, button, getCurrentLanguage());
    }
  });

  overlay?.addEventListener('click', () => {
    closeMenu(nav, overlay, button, getCurrentLanguage());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu(nav, overlay, button, getCurrentLanguage());
      return;
    }
    if (event.key !== 'Tab' || !nav.classList.contains('is-open') || !isMobileViewport()) {
      return;
    }
    const focusables = getFocusableElements(nav);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || !nav.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobileViewport()) {
      closeMenu(nav, overlay, button, getCurrentLanguage());
    }
  });

  document.addEventListener(LANGUAGE_EVENT, (event) => {
    const lang = (event as CustomEvent<Language>).detail || getCurrentLanguage();
    const isOpen = nav.classList.contains('is-open');
    updateMenuButton(button, isOpen, lang);
    button.setAttribute('data-lang-label', LANGUAGE_LABELS[lang] || LANGUAGE_LABELS.ja);
  });
}
