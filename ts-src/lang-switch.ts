// ===== クッキー設定／取得用関数 =====
function setCookie(name: string, value: string, days: number): void {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name: string): string | null {
	return document.cookie
		.split('; ')
		.reduce<string | null>((r, v) => {
			const parts = v.split('=');
			return parts[0] === name ? decodeURIComponent(parts[1]) : r;
		}, null);
}

// ===== 言語切り替え関数 =====
function setLanguage(lang: 'ja' | 'en'): void {
	// クッキーに保存
	setCookie('lang', lang, 30);

	// DOM中の .lang-ja/.lang-en を切り替え
	document.querySelectorAll<HTMLElement>('.lang-ja').forEach(el => {
		el.style.setProperty('display', lang === 'ja' ? 'block' : 'none', 'important');
	});

	document.querySelectorAll<HTMLElement>('.lang-en').forEach(el => {
		el.style.setProperty('display', lang === 'en' ? 'block' : 'none', 'important');
	});

	// プルダウンの選択値を合わせる
	const selector = document.getElementById('lang-select') as HTMLSelectElement | null;
	if (selector) {
		selector.value = lang;
	}
}

/**
 * URL のクエリ文字列から lang パラメータを取得
 * 例: https://example.com/?lang=en → 'en'
 */
function getUrlLang(): 'ja' | 'en' | null {
	const params = new URLSearchParams(window.location.search);
	const l = params.get('lang');
	if (l === 'ja' || l === 'en') {
		return l;
	}
	return null;
}

// ===== 初回読み込み時の言語判定 =====
window.addEventListener('DOMContentLoaded', () => {
	const urlLang = getUrlLang();
	if (urlLang) {
		setLanguage(urlLang);
		return;
	}

	const cookieLang = getCookie('lang');
	const browserLang: 'ja' | 'en' = navigator.language.startsWith('ja') ? 'ja' : 'en';
	const initialLang = (cookieLang === 'ja' || cookieLang === 'en') ? cookieLang : browserLang;

	setLanguage(initialLang);
});
