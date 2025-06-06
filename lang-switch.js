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

	document.querySelectorAll('.lang-ja').forEach(el => {
		el.style.display = (lang === 'ja') ? 'block' : 'none';
	});
	document.querySelectorAll('.lang-en').forEach(el => {
		el.style.display = (lang === 'en') ? 'block' : 'none';
	});

	const selector = document.getElementById('lang-select');
	if (selector) selector.value = lang;
}

// ページ読み込み時にブラウザ言語を判定して setLanguage を呼ぶ
window.addEventListener('DOMContentLoaded', () => {
	const userLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
	setLanguage(userLang);
});


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
