// menu.js（修正後）

/**
 * <div id="sidebar-container"></div> の中に
 * 外部ファイル (sidebar.html) を読み込んで差し込む関数
 */
function loadSidebar() {
  fetch('sidebar.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load sidebar.html: ' + response.status);
      }
      return response.text();
    })
    .then(html => {
      // (A) サイドバーの HTML を #sidebar-container に挿入
      document.getElementById('sidebar-container').innerHTML = html;

      // (B) サイドバー挿入後に改めて言語を切り替える
      //     （lang-switch.js 側で定義済みの getCookie, setLanguage を使います）

      // クッキーに保存された言語（なければ null）
      const cookieLang = getCookie('lang');
      // ブラウザの初期言語（日本語なら 'ja'、それ以外は 'en'）
      const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
      // 優先順位は「クッキー」＞「ブラウザ言語」
      const initialLang = cookieLang || browserLang;

      // ここでサイドバー内の .lang-ja / .lang-en を強制的に切り替える
      setLanguage(initialLang);
    })
    .catch(err => {
      console.error(err);
    });
}

/**
 * ハンバーガーメニュー開閉用の関数
 * sidebar.html 内の <nav id="sidebar"> を開閉します
 */
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
}

// ページ読み込み時にサイドバーを読み込む
window.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
});
