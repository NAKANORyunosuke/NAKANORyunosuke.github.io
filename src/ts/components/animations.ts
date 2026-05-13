export function initScrollAnimations(): void {
  const animatedElements = document.querySelectorAll<HTMLElement>('.reveal-on-scroll');
  if (!('IntersectionObserver' in window) || animatedElements.length === 0) return;

  // Arm the CSS-only reveal styles. They are gated on this class so content stays
  // visible when JS is disabled or IntersectionObserver is unsupported.
  document.documentElement.classList.add('scroll-reveal-ready');

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: '0px', threshold: 0.1 },
  );

  animatedElements.forEach((el, index) => {
    el.style.transitionDelay = `${(index % 5) * 100}ms`;
    observer.observe(el);
  });
}
