import { LANGUAGE_EVENT, Language } from './lang-switch';

type CopyState = 'copy' | 'copied';

const COPY_LABELS: Record<Language, { copy: string; copied: string; copyAria: string; copiedAria: string }> = {
  ja: { copy: 'コピー', copied: 'コピー済み', copyAria: 'コードをコピー', copiedAria: 'コピーしました' },
  en: { copy: 'Copy', copied: 'Copied', copyAria: 'Copy code', copiedAria: 'Copied' },
};

const RESET_DELAY_MS = 2000;

function getCurrentLanguage(): Language {
  const lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'ja';
  return lang === 'en' ? 'en' : 'ja';
}

function updateButtonLabels(button: HTMLButtonElement, lang: Language, state: CopyState): void {
  const labels = COPY_LABELS[lang] || COPY_LABELS.ja;
  button.setAttribute('aria-label', state === 'copied' ? labels.copiedAria : labels.copyAria);
  button.setAttribute('title', state === 'copied' ? labels.copied : labels.copy);
}

function createButton(lang: Language): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-copy';
  button.dataset.state = 'copy';
  button.innerHTML =
    '<span class="label-copy lang-ja">コピー</span>' +
    '<span class="label-copy lang-en">Copy</span>' +
    '<span class="label-copied lang-ja">コピー済み</span>' +
    '<span class="label-copied lang-en">Copied</span>';
  updateButtonLabels(button, lang, 'copy');
  return button;
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.left = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallback */
    }
  }
  return fallbackCopy(text);
}

function getCodeText(pre: HTMLElement): string {
  const code = pre.querySelector('code');
  if (code) return code.textContent ?? '';
  return pre.textContent ?? '';
}

export function initCodeCopy(): void {
  const codeElements = Array.from(document.querySelectorAll<HTMLElement>('pre > code'));
  if (codeElements.length === 0) return;

  const timers = new WeakMap<HTMLButtonElement, number>();

  codeElements.forEach((code) => {
    const pre = code.parentElement as HTMLElement | null;
    if (!pre || pre.querySelector('.code-copy')) return;

    pre.classList.add('code-block');
    const button = createButton(getCurrentLanguage());
    pre.appendChild(button);

    button.addEventListener('click', async () => {
      const text = getCodeText(pre);
      if (!text) return;
      const didCopy = await copyText(text);
      if (!didCopy) return;

      button.dataset.state = 'copied';
      updateButtonLabels(button, getCurrentLanguage(), 'copied');

      const existing = timers.get(button);
      if (existing) window.clearTimeout(existing);

      const timeout = window.setTimeout(() => {
        button.dataset.state = 'copy';
        updateButtonLabels(button, getCurrentLanguage(), 'copy');
      }, RESET_DELAY_MS);
      timers.set(button, timeout);
    });
  });

  document.addEventListener(LANGUAGE_EVENT, (event) => {
    const lang = (event as CustomEvent<Language>).detail || getCurrentLanguage();
    document.querySelectorAll<HTMLButtonElement>('.code-copy').forEach((button) => {
      const state = button.dataset.state === 'copied' ? 'copied' : 'copy';
      updateButtonLabels(button, lang, state);
    });
  });
}
