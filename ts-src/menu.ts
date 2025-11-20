type SupportedLanguage = 'ja' | 'en';

const MENU_ICON_OPEN = '☰';
const MENU_ICON_CLOSE = '✕';

const MENU_LABELS: Record<SupportedLanguage, { open: string; close: string }> = {
    ja: { open: 'メニューを開く', close: 'メニューを閉じる' },
    en: { open: 'Open menu', close: 'Close menu' }
};

function currentLanguage(): SupportedLanguage {
    const lang =
        document.documentElement.getAttribute('data-lang') ||
        document.documentElement.getAttribute('lang') ||
        'ja';
    return lang === 'en' ? 'en' : 'ja';
}

function updateMenuButton(button: HTMLButtonElement, isOpen: boolean): void {
    const lang = currentLanguage();
    const labels = MENU_LABELS[lang];

    button.textContent = isOpen ? MENU_ICON_CLOSE : MENU_ICON_OPEN;
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? labels.close : labels.open);
}

function toggleMenu(): void {
    const nav = document.getElementById('primary-nav');
    const button = document.querySelector<HTMLButtonElement>('.menu-btn');
    if (!nav || !button) return;

    const isOpen = nav.classList.toggle('is-open');
    updateMenuButton(button, isOpen);
}

document.addEventListener('preferredlanguagechange', () => {
    const button = document.querySelector<HTMLButtonElement>('.menu-btn');
    if (!button) return;

    const nav = document.getElementById('primary-nav');
    const isOpen = Boolean(nav?.classList.contains('is-open'));
    updateMenuButton(button, isOpen);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector<HTMLButtonElement>('.menu-btn');
    if (!button) return;

    const nav = document.getElementById('primary-nav');
    if (!nav) return;

    const isOpen = nav.classList.contains('is-open');
    updateMenuButton(button, isOpen);
});
