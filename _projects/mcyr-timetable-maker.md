---
layout: project
title: "MCYR Timetable Maker (Django)"
date: 2026-03-22
period: "2025/09 - 2026/03 (運用継続)"
role: "要件整理 / 設計 / 実装 / 運用改善 / 保守"
tech:
  - Python 3.12
  - Django 5.1
  - Django REST Framework
  - Celery + Redis
  - django-allauth (Google OAuth)
  - Google Sheets / Drive API
  - WeasyPrint / pypdf / ReportLab
  - SortableJS / Select2 / SweetAlert2
  - SQLite / PostgreSQL (DATABASE_URL切替)
repo_url: "(非公開リポジトリ)"
hero: "/assets/img/portfolio/mcyr-timetable/hero.png"
tags: ["Django","Celery","Scheduling","Google Sheets","WeasyPrint","Import Reconciliation"]
summary: "Google Forms/Sheets由来の応募データを2ソース照合で取り込み、講演編成・マスタ修正・講究録PDF生成までを一体化した学会運営向けWebサービス。"
permalink: /portfolio/mcyr-timetable/
published: false
---

## 概要
MCYR Timetable Maker は、学会・研究会向けの「講演データ統合 + タイムテーブル編成 + 配布物出力」を一気通貫で扱う業務システムです。  
単なる編成UIではなく、以下を1サービス内で完結させています。

- Google OAuth + 承認フローによる利用者管理
- 2ソース（登壇者シート / テクニカルレポートシート）取り込みと照合課題管理
- ドラッグ&ドロップ編成（時間枠/会場/カテゴリ制約付き）
- 講演者・投稿のマスタ修正と講演者統合
- PDF/PNG/HTML/CSV/TSV出力
- TeXバンドル生成と講究録PDFの非同期ジョブ生成

## 背景と課題
- 事務局運用で、応募データ整形・突合作業・編成・配布資料化が分断されていた
- 同姓同名や表記揺れにより、手動照合でミスが起きやすかった
- 編成後の配布資料（一覧PDF・講究録PDF）作成が別作業で重かった
- 運用担当が非エンジニア中心のため、Web画面上で閉じる必要があった

## 解決したこと
- 取込から配布資料生成まで同一データモデル上で処理し、作業導線を一本化
- 2ソース照合時に自動マッチング（メール / ローマ字名 / 母語名）と課題化を分離
- 課題は画面で `link_existing / create_new / ignore` を選べる運用に設計
- 編成ロジックに業務制約（重複禁止・時間上限・参加可能日・ポスター専用）を実装
- 講究録PDFをCeleryジョブ化し、進捗・再利用・失敗時リカバリを実装

## サービス全体構成
### アプリ構成
- `apps.accounts`: カスタムUser（role/is_approved）
- `apps.core`: 認可Mixin・DRF Permission・OAuthミドルウェア・Wikiビュー
- `apps.imports`: 2ソース取込、ステージング、照合課題、列マッピング、取込設定
- `apps.scheduling`: 日付/会場/時間枠/編成セル/割当、出力、設定画面、講究録ジョブ
- `apps.speakers`: 講演者API、講演者統合（merge）と統合ログ
- `apps.submissions`: 投稿API、参加可能日・技術レポート情報管理
- `apps.tags`: 講演者タグ管理

### 画面構成
- `/` 編成画面（Program Builder）
- `/settings/` 編成設定画面（出力/カテゴリ/日程/会場/取込設定）
- `/operations/master-edit/` マスタ修正（講演者・投稿編集、講演者統合）
- `/operations/reconciliation/` 照合課題解決
- `/wiki/` `/wiki/user/` `/wiki/dev/` 運用・開発向けWiki

## 主要機能
### 1. 認証・承認・権限
- Google OAuth（django-allauth）を利用
- 許可ドメインを `ALLOWED_LOGIN_EMAIL_DOMAINS` で制御
- `is_approved` 未承認ユーザーは `/accounts/pending-approval/` へリダイレクト
- APIは `IsApprovedUser` を基本ゲートにし、更新系一部は `IsAdminUser` 制御
- OAuth開始/コールバックの構造化ログ、redirect正規化ミドルウェアを実装

### 2. 2ソース取り込み + 照合
- `source_mode=dual` 前提（singleは廃止）
- `speaker` と `report` の2シートを取得し、行単位でマッチング
- スコアリング基準:
  - `email_exact` (100)
  - `roman_name_exact` (95)
  - `native_name_exact` (90)
- 高信頼でもコア項目不一致（email/roman/native/organisation）は自動確定せず課題化
- 未照合・曖昧・低信頼・不一致を `ImportReconciliationIssue` として保持
- 過去解決済み課題の再利用（自動解決）を実装

### 3. ステージング → コア反映
- `StagingSubmission` に正規化payload + row_hashを保存
- `promote_staging_to_core` で Speaker / Submission / SubmissionFile を反映
- 空値で既存値を消さない保全ロジック
- 削除行検知（`mark_deleted_rows` / `remove_deleted_records`）
- 取り込み履歴は `ImportJob` にサマリー・メタデータ保存

### 4. 照合課題解決UI
- 課題一覧 + diff表示 + 解決アクション
- フィールドごとに `report` / `speaker` の採用元を選択可能
- `resolve` アクションで既存紐付け / 新規作成 / 無視を反映
- speaker側課題は `ignore` のみ許可するなど運用ルールを実装

### 5. 編成UI（Program Builder）
- SortableJSベースのドラッグ&ドロップ割当
- 日付タブ・会場列・時間枠行のグリッド
- セル単位の `version` による楽観ロック
- カテゴリ一括更新（time slot単位）
- キャンセル済み投稿の非表示、管理者のみ含めるオプション
- 講演者詳細パネル・フィルタ・未割当一覧を提供

### 6. 編成制約バリデーション
`AssignmentSerializer` で業務ルールを集約:
- ロック枠への操作禁止
- 同一セル内の重複講演者禁止
- `max_talks` / `max_duration_minutes` 超過禁止
- カテゴリ別複数割当可否（`SessionCategoryPreference`）
- ポスターのみ希望者の配置先制約
- `preferred_days` と開催日の照合による参加可能日チェック

### 7. 出力機能
- `GET /api/export/pdf/` で多形式出力:
  - `pdf`, `png`, `html`, `csv`, `tsv`, `tex`, `tex_pdf`
- 出力表示設定:
  - 発表者名、所属、希望分野、カテゴリ、キーワード、DLリンク表示等
  - 空行/空会場非表示
  - カテゴリ表示名カスタマイズ・非表示制御
- CSV/TSVは UTF-8 BOM 付きで出力
- WeasyPrint未利用環境ではPDF/PNGを503で明示的に失敗させる設計

### 8. 講究録PDFジョブ
- `ProceedingsExportJob` モデルで状態/進捗/成果物を管理
- Celeryタスク `run_proceedings_export_job` で非同期生成
- 進捗（current/total/percent/stage/message）をAPIで返却
- 既存成果物の再利用（cache key）を設定で有効化可能
- TeXテンプレート（header/footer含む）を設定画面から編集可能
- Google DriveからPDF収集、ページ番号付与、マージ処理まで実装

### 9. マスタ修正
- 講演者検索（氏名/所属/メール/タイトル）
- 講演者プロフィール編集
- 投稿編集（要旨・キーワード・参加可能日・技術レポートURL・キャンセル等）
- 講演者統合（重複整理）:
  - タグ移管
  - 重複投稿統合
  - 割当移管
  - 統合ログ記録（SpeakerMergeLog）

### 10. 設定画面
- 出力設定
- カテゴリ設定（global扱い、複数割当可否、表示ラベル）
- 開催日・会場・会場アイコン差し替え
- 希望分野カラー設定
- 取込ソース設定（speaker/report）
- 列マッピング設定（source別）

## データモデル（主要）
- 編成軸: `Day`, `TimeSlot`, `Venue`, `SessionCell`, `Assignment`
- 出力設定: `ProgramExportSetting`, `SessionCategoryPreference`, `TopicColorSetting`, `VenueIconVariant`
- 取り込み: `ImportJob`, `StagingSubmission`, `ImportColumnMapping`, `ImportSourceSetting`, `ImportReconciliationIssue`
- 講演者/投稿: `Speaker`, `Submission`, `SubmissionFile`, `SpeakerMergeLog`
- タグ: `Tag`, `SpeakerTag`
- すべてUUID主キー + created_at/updated_atで統一

## API（代表）
- `GET/POST/PATCH/DELETE /api/assignments/`
- `GET/PATCH /api/schedule/`
- `PATCH /api/schedule/bulk-update-category/`
- `POST /api/import/sheets/`
- `GET /api/import/sheets/preview/`
- `GET/PATCH /api/import/reconciliation-issues/` + `.../{id}/resolve/`
- `GET /api/export/pdf/?format=...`
- `POST /api/export/proceedings-jobs/`
- `GET /api/export/proceedings-jobs/{job_id}/`
- `GET /api/export/proceedings-jobs/{job_id}/download/`
- `POST /api/speakers/merge/`

## 運用・保守
### ランチャー/起動導線
- `scripts/runserver_debug.py`
- `scripts/celery_worker_debug.py`
- `scripts/celery_beat_debug.py`
- `scripts/service_launcher_gui.py`（GUI起動）
- `start_prod_services.bat`（migrate/collectstatic/worker/beat/runserver）
- `scripts/ensure_celery_runtime.py`（Redis事前確認・自動起動補助）

### 運用コマンド
- `ops_healthcheck`: 取込健全性チェック
- `ops_cleanup_imports`: 古い取込履歴のクリーンアップ
- `ops_import_verify_merge`: dual取込 + 検証 + 自動マッピング再試行
- `generate_session_cells`: JSON定義から日程/時間枠/セルを生成

## テスト
- Django標準テストでアプリ内に配置
- 22個のテストモジュールでカバー
- 主な対象:
  - 2ソース照合ロジック
  - 取込タスク（再試行/サマリー/自動クローズ）
  - 編成制約（複数割当、参加可能日、ポスター専用）
  - 出力（PDF行構成、TeX/講究録、進捗ジョブ）
  - マスタ修正/統合API
  - 承認・表示制御

## 非機能・セキュリティ
- OAuthドメイン制限 + 承認フラグ
- CSRF保護 + SessionAuth
- JSON構造化ログ（python-json-logger）
- SQLiteロック時の指数バックオフ再試行（取込タスク）
- 設定値は `.env.local` に集約し、機密情報のGit管理を回避

## 技術的ハイライト
- ビジネスルールの中核を Serializer/Service に寄せ、Viewを薄く維持
- 取り込みは「自動確定」と「人手解決」の境界を明示して事故を抑制
- 編成制約をAPI側で強制し、UIの不正操作や同時編集に耐性
- 講究録生成は同期APIから分離し、ジョブ化・進捗化・再利用化を実装
- 管理画面は閲覧専用化/入力補助（アイコン選択等）で運用事故を低減

## 今後の改善余地
- リアルタイム同時編集（WebSocket）と差分通知
- 編成履歴のバージョン管理とロールバックUI
- 取込照合の説明可能性向上（スコア根拠の可視化）
- 出力テンプレートのノーコード編集範囲拡大

## スクリーンショット候補（ポートフォリオ掲載用）
- 編成画面（D&D、未割当リスト、日付タブ）
- マスタ修正画面（講演者編集 + 投稿編集 + 統合）
- 照合課題画面（diff比較と解決操作）
- 設定画面（出力/取込マッピング/会場アイコン）
- 講究録PDFジョブ進捗UI
- 管理画面（ユーザー承認、取込ジョブ、講究録ジョブ）
