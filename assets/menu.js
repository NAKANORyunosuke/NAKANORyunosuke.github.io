"use strict";
const SIDEBAR_SELECTOR = '#sidebar';
const MENU_CLOSED_ICON = '☰';
const MENU_OPEN_ICON = '✕';
const NAV_BREAKPOINT = 900;

const groups = [];

function updateMenuButton(isOpen) {
  const btn = document.querySelector('.menu-btn');
  if (btn instanceof HTMLElement) {
    btn.textContent = isOpen ? MENU_OPEN_ICON : MENU_CLOSED_ICON;
    btn.setAttribute('aria-expanded', String(isOpen));
  }
}

function toggleMenu() {
  const nav = document.querySelector(SIDEBAR_SELECTOR);
  if (!nav)
    return;
  const isOpen = nav.classList.toggle('open');
  updateMenuButton(isOpen);
}

function applyNavMode() {
  const nav = document.querySelector(SIDEBAR_SELECTOR);
  if (!nav)
    return;
  const isMobile = window.innerWidth < NAV_BREAKPOINT;
  nav.classList.toggle('mobile-nav', isMobile);

  groups.forEach((entry) => {
    const { group, toggle } = entry;
    if (isMobile) {
      group.classList.remove('collapsed');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-disabled', 'true');
    }
    else {
      const collapsed = group.dataset.collapsed === 'true';
      group.classList.toggle('collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.removeAttribute('aria-disabled');
    }
  });
}

function initializeNavGroups() {
  document.querySelectorAll('#sidebar .nav-group').forEach((group) => {
    const toggle = group.querySelector('.nav-toggle');
    if (!(toggle instanceof HTMLElement))
      return;
    const defaultOpen = group.dataset.defaultOpen !== 'false';
    const initialCollapsed = !defaultOpen;
    group.dataset.collapsed = String(initialCollapsed);
    group.classList.toggle('collapsed', initialCollapsed);
    toggle.setAttribute('aria-expanded', String(!initialCollapsed));
    toggle.addEventListener('click', () => {
      if (document.querySelector(SIDEBAR_SELECTOR)?.classList.contains('mobile-nav'))
        return;
      const nextCollapsed = group.classList.toggle('collapsed');
      group.dataset.collapsed = String(nextCollapsed);
      toggle.setAttribute('aria-expanded', String(!nextCollapsed));
    });
    groups.push({ group, toggle });
  });
}

window.addEventListener('resize', () => {
  const nav = document.querySelector(SIDEBAR_SELECTOR);
  if (nav && window.innerWidth >= NAV_BREAKPOINT) {
    nav.classList.remove('open');
    updateMenuButton(false);
  }
  applyNavMode();
});

window.addEventListener('DOMContentLoaded', () => {
  updateMenuButton(false);
  initializeNavGroups();
  applyNavMode();
});
