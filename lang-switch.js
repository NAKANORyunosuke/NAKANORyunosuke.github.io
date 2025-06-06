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

	// 日本語版要素を表示 or 非表示
	document.querySelectorAll('.lang-ja').forEach(el => {
		// block 要素・inline 要素問わず「表示させる」なら 'block' か '' かを使えますが、
		// ここでは要素がブロック系 (div, ul, h1 など) を想定し 'block' として明示します。
		el.style.display = (lang === 'ja') ? 'block' : 'none';
	});
	// 英語版要素を表示 or 非表示
	document.querySelectorAll('.lang-en').forEach(el => {
		el.style.display = (lang === 'en') ? 'block' : 'none';
	});

	// <select> の値も更新
	const selector = document.getElementById('lang-select');
	if (selector) selector.value = lang;
}

// ===== ハンバーガーメニュー開閉 =====
function toggleMenu() {
	document.getElementById('sidebar').classList.toggle('open');
}

// ===== 初回読み込み時の言語判定 =====
window.addEventListener("DOMContentLoaded", () => {
	const cookieLang	 = getCookie('lang');
	const browserLang	= navigator.language.startsWith('ja') ? 'ja' : 'en';
	const lang				 = cookieLang || browserLang;

	setLanguage(lang);
});
