"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScrollAnimations = initScrollAnimations;
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window) || animatedElements.length === 0)
        return;
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    animatedElements.forEach((el, index) => {
        el.style.transitionDelay = `${(index % 5) * 100}ms`;
        observer.observe(el);
    });
}
