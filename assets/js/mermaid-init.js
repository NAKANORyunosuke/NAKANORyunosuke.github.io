/**
 * Mermaid init with light/dark auto theme and live switching.
 * - OSの配色に追従（prefers-color-scheme）
 * - 配色変更時に図を再レンダリング
 * - 手動切替: window.setMermaidTheme('default'|'dark')
 */
(function () {
  function currentTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
  }

  function init(theme) {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: theme
      });
    }
  }

  function rerender(theme) {
    if (!window.mermaid) return;
    window.mermaid.initialize({ startOnLoad: false, theme: theme });

    const blocks = document.querySelectorAll('.mermaid');
    blocks.forEach((el) => {
      // 初回に生テキストを保存しておき、再描画時に戻す
      if (el.getAttribute('data-raw')) {
        el.innerHTML = el.getAttribute('data-raw');
      } else {
        el.setAttribute('data-raw', el.textContent);
      }
    });
    window.mermaid.run({ nodes: blocks });
  }

  // 初回：生テキストを保存
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.mermaid').forEach((el) => {
      if (!el.getAttribute('data-raw')) el.setAttribute('data-raw', el.textContent);
    });
  });

  // Mermaid読み込み後に初期化（読み込み順対策）
  const start = () => init(currentTheme());
  if (window.mermaid) {
    start();
  } else {
    window.addEventListener('mermaidLoaded', start, { once: true });
  }

  // OSの配色変更を監視
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      rerender(e.matches ? 'dark' : 'default');
      document.documentElement.classList.toggle('dark-mermaid', e.matches);
    });
  }

  // 手動トグル用API
  window.setMermaidTheme = function(theme) {
    if (theme !== 'dark' && theme !== 'default') return;
    rerender(theme);
    document.documentElement.classList.toggle('dark-mermaid', theme === 'dark');
  };
})();
