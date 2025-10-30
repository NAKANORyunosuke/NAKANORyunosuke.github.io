"use strict";
(function () {
    var _a, _b;
    const tocContainer = document.querySelector('[data-toc]');
    const tocList = tocContainer === null || tocContainer === void 0 ? void 0 : tocContainer.querySelector('[data-toc-list]');
    const contentRoot = document.querySelector('.content-area');
    if (!tocContainer || !tocList || !contentRoot) {
        return;
    }
    function isHidden(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }
        if (element.closest('[hidden]')) {
            return true;
        }
        let current = element;
        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }
    function headingLanguage(heading) {
        if (!(heading instanceof HTMLElement)) {
            return null;
        }
        if (heading.dataset.tocLang) {
            return heading.dataset.tocLang;
        }
        if (heading.classList.contains('lang-ja')) {
            return 'ja';
        }
        if (heading.classList.contains('lang-en')) {
            return 'en';
        }
        const container = heading.closest('.lang-ja, .lang-en');
        if (container instanceof HTMLElement) {
            if (container.classList.contains('lang-ja')) {
                return 'ja';
            }
            if (container.classList.contains('lang-en')) {
                return 'en';
            }
        }
        return null;
    }
    function collectHeadings(lang) {
        return Array.from(contentRoot.querySelectorAll('h2, h3')).filter((heading) => {
            if (!(heading instanceof HTMLElement)) {
                return false;
            }
            if (heading.hasAttribute('data-toc-exclude')) {
                return false;
            }
            if (heading.closest('[data-toc-ignore]')) {
                return false;
            }
            const explicitLang = headingLanguage(heading);
            if (explicitLang && explicitLang !== lang) {
                return false;
            }
            if (isHidden(heading)) {
                return false;
            }
            return true;
        });
    }
    function slugify(text, index, slugCounts) {
        const normalized = text
            .trim()
            .toLowerCase()
            .replace(/[\s\u3000]+/g, '-')
            .replace(/[^a-z0-9\-ぁ-んーァ-ン一-龠]/g, '');
        const base = normalized || `section-${index}`;
        const count = (slugCounts.get(base) || 0) + 1;
        slugCounts.set(base, count);
        return count > 1 ? `${base}-${count}` : base;
    }
    function currentLanguage() {
        var _a, _b, _c;
        return ((_c = (_b = (_a = document.documentElement) === null || _a === void 0 ? void 0 : _a.dataset) === null || _b === void 0 ? void 0 : _b.lang) !== null && _c !== void 0 ? _c : document.documentElement.getAttribute('lang')) || 'ja';
    }
    function cleanText(raw) {
        return raw.trim().replace(/\s+/g, ' ');
    }
    function resolveLabel(heading, lang) {
        var _a;
        const preferred = heading.querySelector(`.lang-${lang}`);
        if ((preferred === null || preferred === void 0 ? void 0 : preferred.textContent) && cleanText(preferred.textContent)) {
            return cleanText(preferred.textContent);
        }
        const dataAttr = heading.getAttribute(`data-label-${lang}`);
        if (dataAttr) {
            return cleanText(dataAttr);
        }
        const fallback = (_a = heading.textContent) !== null && _a !== void 0 ? _a : '';
        return cleanText(fallback);
    }
    let observer = null;
    function buildToc(lang) {
        const headings = collectHeadings(lang);
        if (headings.length === 0) {
            tocContainer.setAttribute('hidden', 'true');
            tocList.innerHTML = '';
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            return;
        }
        tocContainer.removeAttribute('hidden');
        tocList.innerHTML = '';
        const slugCounts = new Map();
        const tocEntries = [];
        const fragment = document.createDocumentFragment();
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = slugify(heading.textContent || '', index, slugCounts);
            }
            const item = document.createElement('li');
            item.className = 'site-toc__item';
            const link = document.createElement('a');
            link.className = 'site-toc__link';
            link.href = `#${heading.id}`;
            link.textContent = resolveLabel(heading, lang);
            item.appendChild(link);
            fragment.appendChild(item);
            tocEntries.push({ heading, link });
        });
        tocList.appendChild(fragment);
        if (observer) {
            observer.disconnect();
        }
        const tocLinks = tocEntries.map((entry) => entry.link);
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                const targetId = entry.target.id;
                tocLinks.forEach((link) => {
                    if (link.hash === `#${targetId}`) {
                        link.setAttribute('aria-current', 'true');
                    }
                    else {
                        link.removeAttribute('aria-current');
                    }
                });
            });
        }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
        headings.forEach((heading) => observer.observe(heading));
    }
    buildToc(currentLanguage());
    document.addEventListener('preferredlanguagechange', (event) => {
        var _a;
        const nextLang = ((_a = event.detail) === null || _a === void 0 ? void 0 : _a.lang) || currentLanguage();
        buildToc(nextLang);
    });
})();
