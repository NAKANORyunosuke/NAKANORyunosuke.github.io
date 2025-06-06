// ===== クッキー設定／取得用関数 =====
function setCookie(name, value, days) {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name) {
	return document.cookie.split('; ').reduce((r, v) => {
		const parts = v.split('=');
		return parts[0] === name ? decodeURIComponent(parts[1]) : r;
	}, null);
}

// ===== 言語切り替え関数 =====
function setLanguage(lang) {
    // クッキーに保存
    setCookie('lang', lang, 30);

    // DOM中の .lang-ja/.lang-en を切り替え
    document.querySelectorAll('.lang-ja').forEach(el => {
      if (lang === 'ja') {
        // 日本語版を表示 (必要なら !important もつけておく)
        el.style.setProperty('display', 'block', 'important');
      } else {
        // 日本語版を隠す
        el.style.setProperty('display', 'none', 'important');
      }
    });
    document.querySelectorAll('.lang-en').forEach(el => {
        if (lang === 'en') {
          // 英語版を表示
          el.style.setProperty('display', 'block', 'important');
        } else {
          // 英語版を隠す
          el.style.setProperty('display', 'none', 'important');
        }
    });

    // プルダウンの選択値を合わせる
    const selector = document.getElementById('lang-select');
    if (selector) selector.value = lang;
}

// ===== 初回読み込み時の言語判定 =====
window.addEventListener('DOMContentLoaded', () => {
    // 先に sidebar を読み込む menu.js が走る想定 → その後に以下が実行される
    const cookieLang = getCookie('lang');
    const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
    const lang = cookieLang || browserLang;
    setLanguage(lang);
});
