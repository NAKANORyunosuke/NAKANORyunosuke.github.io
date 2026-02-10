import { initLangSwitch } from './components/lang-switch';
import { initMenuToggle } from './components/menu';
import { initLastUpdated } from './components/last-updated';
import { initScrollAnimations } from './components/animations';
import { initCodeCopy } from './components/code-copy';

function renderMathIfReady(): void {
  const render = (window as unknown as { renderMathInElement?: Function }).renderMathInElement;
  if (typeof render !== 'function') return;

  render(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
    ],
    throwOnError: false,
    strict: false,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'code', 'pre'],
  });
}

function initMathRender(): void {
  if (document.readyState !== 'loading') renderMathIfReady();
  document.addEventListener('DOMContentLoaded', renderMathIfReady);
  window.addEventListener('load', renderMathIfReady);
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitch();
  initMenuToggle();
  initLastUpdated();
  initScrollAnimations();
  initCodeCopy();
  initMathRender();
});
