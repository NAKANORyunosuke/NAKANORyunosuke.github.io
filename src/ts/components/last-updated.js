"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLastUpdated = initLastUpdated;
function formatWithPadding(value) {
    return String(value).padStart(2, '0');
}
function initLastUpdated() {
    const lastJa = document.getElementById('last-updated-ja');
    const lastEn = document.getElementById('last-updated-en');
    if (!lastJa && !lastEn)
        return;
    const d = new Date(document.lastModified);
    const yyyy = d.getFullYear();
    const mm = formatWithPadding(d.getMonth() + 1);
    const dd = formatWithPadding(d.getDate());
    const hh = formatWithPadding(d.getHours());
    const mi = formatWithPadding(d.getMinutes());
    if (lastJa) {
        lastJa.textContent = `${yyyy}年${mm}月${dd}日 ${hh}:${mi}`;
    }
    if (lastEn) {
        lastEn.textContent = `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    }
}
