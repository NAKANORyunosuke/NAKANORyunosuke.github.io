---
layout: project
title: "MCYR Timetable Maker (Django)"
date: 2025-12-06
period: "2025/9 - 2025/12"
role: "要件定義 / 設計 / 実装 / 運用"
tech:
  - Python 3.12
  - Django 5.1
  - Django REST Framework
  - Celery
  - django-allauth (Google OAuth)
  - SortableJS
  - WeasyPrint
  - Redis
repo_url: "(非公開リポジトリ)"
hero: "/assets/img/portfolio/mcyr-timetable/hero.png"
tags: ["Django","Celery","Scheduling","WeasyPrint","Google Sheets","SortableJS"]
summary: "Google Forms → Sheets の回答を取り込み, ドラッグ&ドロップで講演編成を行い, PDF/PNG/CSVにエクスポートできる社内向けタイムテーブルメーカー. "
permalink: /portfolio/mcyr-timetable/
published: false
---

## 概要
学会/イベント向けの講演編成を効率化する内部アプリ. Google Forms → Google Sheets に集計された応募データを, サーバー側の取込パイプラインで `StagingSubmission` に蓄積・差分判定し, ブラウザ上の日付×時間×会場グリッドへドラッグ&ドロップで割り当てる. PDF/PNG/CSV/TSVで配布用の資料を生成でき, Googleドメイン制限＋承認フローで社内のみ利用可能. 

- 目的: 非エンジニアの事務局が安全かつ素早く編成・校正・配布まで完了できるようにする
- 効果: 手作業の重複/ミスを削減し, 並行イベントの編成・エクスポートを即時に実施
- 利用者: 事務局メンバー(Editor), 閲覧のみのレビュワー(Viewer), 管理者(Admin)

## 現状
- 状態: 本番運用中. 編成・出力・インポートの基本機能は実装済み. 
- 権限: Google OAuth のドメイン制限＋承認必須. 承認前ユーザーは `/accounts/pending-approval/` へ誘導. 
- 取込: Google Sheets API の同期/非同期取り込みに対応. Celery Beatで定期実行も可能. 
- エクスポート: WeasyPrint が導入済み環境では PDF/PNG を生成. 未導入時は 503 を返し原因を通知. 
- 運用: Windows 向けの `start_prod_services.bat` で migrate/collectstatic/celery/runserver を一括起動. 
- 監視: JSON ログを Cloud Logging 相当へ転送可能な構成. 取込タスクのステータスは管理画面とUIトーストで通知. 

## 主要機能
- 認証/承認: Google OAuth(django-allauth)＋カスタムUserの `role`/`is_approved` 制御. 
- 編成UI: SortableJS でスピーカーをグリッドへ D&D. セルごとに version を持ち, 重複/上限/ロックをサーバー側で検証. 
- エクスポート: `/api/export/pdf?format=pdf|png|csv|tsv` で配布用データを生成. ファイル名・日付フィルタ指定に対応. 
- 取込パイプライン: Celery タスク `run_import_job` が Sheets → `StagingSubmission` → `Speaker/Submission` へ差分反映. 
- API: RESTエンドポイントで編成/マスタ/取込/エクスポートを提供. CSRF対応の fetch で UI と連携. 
- ロギング: python-json-logger による JSON ログ出力. 環境変数は `.env.local` に集約. 

### 詳細ユースケース
- Google Forms で受けた応募結果を自動/手動で取り込み, 未マッピング行だけを差分表示し, 採択/棄却を判断してステージング. 
- 採択済みスピーカーを日付・時間・会場セルへ配置し, タイムラインの競合や重複を防止. 
- エクスポート前に PDF/PNG プレビューでレイアウトを確認し, 即時に CSV/TSV をダウンロードして別システムへ連携. 
- Editor が作業中でも Viewer は閲覧のみで安全に参照. Admin はユーザー承認とマスタデータの更新を担当. 

## 画面フロー
1) Google OAuth でログイン(許可ドメインのみ承認可能)
2) 承認後, 編成トップで日付/時間/会場グリッドをロード
3) 左ペインのスピーカーをセルへドラッグ＆ドロップ(並び替え・解除も可能)
4) 必要に応じて取込データビューで Sheets 行を確認
5) エクスポート画面から PDF/PNG/CSV/TSV をダウンロード

ヒント: WeasyPrint のネイティブ依存が未導入の場合, PDF/PNGエクスポートは 503 を返し CSV/TSV のみ利用可能です. 

## データ/処理フロー
- Google Sheets → StagingSubmission → Speaker/Submission/SubmissionFile への差分反映
- Day/TimeSlot/Venue/SessionCell のグリッド構造に Assignment を紐付け, version で楽観ロック
- CSV/TSV は UTF-8(BOM付) でダウンロード. PDF/PNG は WeasyPrint でサーバーレンダリング

### モジュール構成(要約)
- `apps.core`: ユーザー/権限, 共通設定, JSON ログ. 
- `apps.scheduling`: Day/TimeSlot/Venue/Assignment など編成の中核モデルとREST API. 
- `apps.imports`: Google Sheets 取込, ステージング, 差分判定, Celery タスク定義. 
- `apps.exports`: WeasyPrint/CSV/TSV 生成とファイルレスポンス. 
- `apps.speakers`: Speaker/Submission/SubmissionFile モデルと一覧 API. 

### API 例
- `GET /api/scheduling/cells?day=1`: 日別グリッドを取得. 
- `POST /api/scheduling/assignments`: スピーカーをセルへ割当(version を含む楽観ロック). 
- `POST /api/imports/run_job`: Sheets からの同期/非同期インポートを起動. 
- `GET /api/exports/pdf?format=png&day=1`: 指定日を PNG でダウンロード. 

## セキュリティ
- ドメイン制限 + 承認フラグで社内限定公開. 未承認ユーザーは各APIも拒否. 
- REST権限を `apps.core.auth.IsApprovedUser` で統一し, 管理者のみ一部CRUDを許可. 
- CSRF対策済みの fetch 通信. 環境変数・資格情報は `.env.local` で一元管理. 

## セットアップ / 実行
- 事前: `.env.local.example` をコピーし, DB/Redis/Googleサービスアカウントを設定. 
- インストール:
```powershell
.\.env\Scripts\pip.exe install -r requirements.txt
.\.env\Scripts\python.exe timetable_maker\manage.py migrate
.\.env\Scripts\python.exe timetable_maker\manage.py createsuperuser
```
- 起動:
```powershell
.\.env\Scripts\python.exe scripts\runserver_debug.py
.\.env\Scripts\python.exe scripts\celery_worker_debug.py
.\.env\Scripts\python.exe scripts\celery_beat_debug.py  # 定期取込を行う場合
```
- Windows 運用: `start_prod_services.bat` で migrate → collectstatic → Celery Worker/Beat → runserver を自動実行. 

### 開発補足
- VS Code: `scripts/launch.json` 相当のデバッグ構成を用意し, Django サーバーと Celery Worker を個別デバッグ可能. 
- サンプルデータ: `db.zip` を解凍し `manage.py loaddata` で投入すれば, サンプルの講演/時間割を即確認できる. 
- 環境差異: WeasyPrint 未導入環境では `EXPORT_PDF_AVAILABLE=false` として 503 を返却し, CSV/TSV のみ許可. 

## 実装ハイライト

- **編成UI**: SortableJS + fetch API で D&D 編成. 重複・ロック・定員チェックはサーバー側で検証し, セル単位の version で競合を防止. 
- **エクスポート**: WeasyPrint による PDF/PNG, Python で CSV/TSV. `Content-Disposition` を付与しダウンロード提供. 
- **取込パイプライン**: Celery タスクが Sheets を取得し差分のみ反映. プレビューとステージングで安全に適用. 
- **運用性**: `.env.local` への設定集約, JSON ログ, VS Code デバッグ構成, Windows 向け一括起動バッチを同梱. 

### 技術的工夫
- Assignment の version を用いた楽観ロックで, 複数オペレーターが同じセルを編集しても衝突を検出. 
- 取込タスクは同期(HTTP 直後)/非同期(Celery Queue)を選択でき, 長時間処理をワーカーに逃がす設計. 
- エクスポートはフォーマットごとにストリーミングレスポンスを実装し, 大規模カンファレンスでもタイムアウトしにくい. 

### 今後の拡張案
- 編成履歴のタイムトラベル表示とロールバック機能. 
- セッション同士の依存制約(同一講演者の並行禁止など)の自動検出. 

## スクリーンショット要望
以下の画面キャプチャをご用意いただけると, ポートフォリオ記事に組み込めます. 
- トップページの編成グリッド(ドラッグ＆ドロップ操作が分かる状態)
- 取込データ一覧モーダル(Sheets行の確認画面)
- エクスポートダイアログ(PDF/PNG/CSV切り替えが見える状態)
- 講演者詳細ポップアップ(プロフィール・セッション情報表示)
- Django 管理画面でのユーザー一覧(承認フラグ/ロール確認ができる状態)

提供いただいた参考スクリーンショット例(キャプション案):
- 編成グリッド：並行セッションを色分けし, ドラッグ＆ドロップで配置している様子. 
- 講演者詳細：プロフィールモーダルで担当セッションと所属を確認している様子. 
- PDF/PNG プレビュー：エクスポート画面でプレビューを確認しダウンロードする手前の状態. 
- 管理画面：スタッフの承認状態やロールを一覧で管理している様子. 