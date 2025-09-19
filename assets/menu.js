"use strict";
const SIDEBAR_SELECTOR = '#sidebar';

function toggleMenu() {
  const nav = document.querySelector(SIDEBAR_SELECTOR);
  if (!nav)
    return;
  const isOpen = nav.classList.toggle('open');
  const btn = document.querySelector('.menu-btn');
  if (btn instanceof HTMLElement) {
    btn.textContent = isOpen ? '✕' : '☰';
    btn.setAttribute('aria-expanded', String(isOpen));
  }
}

window.addEventListener('resize', () => {
  const nav = document.querySelector(SIDEBAR_SELECTOR);
  const btn = document.querySelector('.menu-btn');
  if (!nav || !(btn instanceof HTMLElement))
    return;
  if (window.innerWidth >= 900) {
    nav.classList.remove('open');
    btn.textContent = '☰';
    btn.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.menu-btn');
  if (btn instanceof HTMLElement) {
    btn.textContent = '☰';
    btn.setAttribute('aria-expanded', 'false');
  }

  document.querySelectorAll('#sidebar .nav-group').forEach((group) => {
    const toggle = group.querySelector('.nav-toggle');
    if (!(toggle instanceof HTMLElement))
      return;
    const defaultOpen = group.dataset.defaultOpen !== 'false';
    group.classList.toggle('collapsed', !defaultOpen);
    toggle.setAttribute('aria-expanded', String(defaultOpen));
    toggle.addEventListener('click', () => {
      const collapsed = group.classList.toggle('collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
  });
});
