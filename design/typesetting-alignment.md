| 項目 | MathJax (表示数式) | コードハイライト | 意図・ノート |
| --- | --- | --- | --- |
| フォント | Latin Modern Math（MathJax既定） + fallbacks (`Spectral`, serif) | IBM Plex Mono | Math とコードで異なる骨格を維持しつつ、見出し・本文（Spectral / IBM Plex Sans）と親和性のある組み合わせ。 |
| 色 | 本文色 `#F2F5F8`、アクセント `#7FD1B9` を強調に使用 | 本文色 `#F2F5F8`、キーワード `#7FD1B9`、コメント `#9BA0A8` | コントラスト比 4.5:1 以上を確保し、ハイライトはアクセントカラーで統一。 |
| 背景 | 本文と同じ、余白のみ調整（最大幅 900px） | `--color-code-bg` = `#111925`、枠線 `#1F2935`、角丸 2px | 数式は本文の流れに溶け込み、コードは暗い面で独立させる。 |
| 行間・余白 | `line-height: 1.65`、`margin-bottom` を段落と同一 (`calc(1.5 * leading)`) | `line-height: 1.6`、上下マージン `var(--space-3)` | 数式・コードが 8pt グリッドに揃うよう共通リズムを使用。 |
| 幅 | `max-width: clamp(600px, 56vw, 900px)` | `max-width: clamp(600px, 56vw, 900px)` | 「600–900px の可変幅」要件を両方に適用。 |
| 遷移 | アニメーションなし（prefers-reduced-motion で固定） | 遷移・アニメなし | 動きによる認知負荷を排除。 |
