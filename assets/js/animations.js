document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal-on-scroll');
    animatedElements.forEach((el, index) => {
        // Add a small delay based on index if multiple elements are in the same container
        // This is a simple heuristic; for more complex grids, we might want manual delays
        el.style.transitionDelay = `${(index % 5) * 100}ms`;
        observer.observe(el);
    });
});
