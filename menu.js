// menu.js

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
      // 読み込んだ HTML を #sidebar-container に挿入
      document.getElementById('sidebar-container').innerHTML = html;
    })
    .catch(err => {
      console.error(err);
    });
}

/**
 * レスポンシブ対応など： メニューを開閉する関数
 * sidebar.html 内の <nav id="sidebar"> を開いたり閉じたりする
 */
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
}

// ページ読み込み時にサイドバーを自動読み込みする
window.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
});