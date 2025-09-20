"use strict";
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar)
        return;
    const isOpen = sidebar.classList.toggle('open');
    const btn = document.querySelector('.menu-btn');
    if (btn instanceof HTMLElement) {
        btn.textContent = isOpen ? '✕' : '☰';
        btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }
}
