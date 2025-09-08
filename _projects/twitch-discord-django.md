---
layout: project
title: "Twitch連携 管理UI(Django)"
date: 2025-09-05
period: "2025/08/20 - 2025/09/05"
role: "設計 / 実装 / 運用"
tech:
  - Python 3.12
  - Django
  - django-allauth
  - Requests
  - HTML Template
  - Nginx (Reverse Proxy)
repo_url: "https://github.com/NAKANORyunosuke/NeiBot"
hero: "/assets/img/portfolio/twitch-discord-bot/hero.png"
tags: ["Django","Allauth","Admin","Web","FastAPI","Discord"]
summary: "Twitchログインでスタッフを認証し, Discordの指定ロールの全メンバーに一括DMを送る管理UI. ファイル添付, テンプレ置換, 事前バリデーション, Bot管理API連携を実装. "
permalink: /portfolio/twitch-discord-django/
published: true
---

## 概要
Twitchログイン(django-allauth)で認証されたスタッフのみが利用できる, DiscordロールDMの一括配布ツール.   
Bot(py-cord + FastAPI)の管理APIと安全に連携し, メッセージテンプレート `{user}` の置換や未知プレースホルダの事前エラーを備える. 

- 目的: 運営が非技術者でも安全・簡単にロール対象へ告知DMを送れるようにする
- 効果: 案内・告知の即時配布, 誤送信・設定ミスの抑制, 添付ファイル付き配信の省力化

## 現状
- 状態: 基本機能は実装済み, ローカルで連携動作を確認.
- 連携: Django(webadmin) と Bot(py-cord + FastAPI) の管理API連携は確認済み. Authorization: Bearer による保護を実装.
- 送信: 送信ジョブの投入からBotによるDM送信まで確認. 0.3秒間隔で順次送信, DM拒否はログ化.
- 制約: 添付は8MBまで, テンプレは `{user}` のみ対応, 未知の `{...}` はフォームとAPIで事前エラー.
- 前提: `venv/token.json` に `admin_api_token` と `bot_admin_api_base` を設定. 未設定時は `http://127.0.0.1:8000` を利用し, UIのサーバー/ロール選択は空になる.
- 配置: `nginx.conf` に本番ドメインとHTTPSのリバースプロキシ設定を用意. 公開では `/admin/` をブロックし, アプリは `127.0.0.1:8000` と `127.0.0.1:8001` にプロキシ.
- 未実装: 送信進捗の可視化や再送制御の管理UIは未実装.

## 主要機能
- 認証: Twitchログイン(django-allauth)
    - 許可Twitchログイン名はスタッフ(`is_staff`)へ自動昇格
- 権限: `is_staff` のみアクセス可能(非スタッフは 403)
- 送信: 指定ロールの全メンバーへDM一括送信
    - 添付ファイル対応(最大 8MB, Discord DM 制限に準拠)
    - テンプレ置換: メッセージ中の `{user}` を各メンバーの表示名へ置換
    - バリデーション: 未対応の `{...}` が含まれていれば送信前にエラー
- 連携: Bot 管理API(Bearer 認証)からサーバー/ロール一覧を取得

## 画面フロー
1) Twitch でログイン  
2) 管理トップから「ロールDM送信」を開く  
3) サーバーとロール, メッセージ, (任意で)添付ファイルを指定  
4) 送信ボタンでキュー投入(Bot 側が順次送信・ログ記録)

ヒント: `{user}` は各メンバーの表示名に置換されます. 未対応の `{...}` が含まれるとフォームでエラーになります. 

## Bot 管理API連携
- 認証: `Authorization: Bearer <ADMIN_API_TOKEN>`
- エンドポイント:
    - `GET /guilds` … 参加中サーバー一覧
    - `GET /roles?guild_id=<id>` … 指定サーバーのロール一覧
    - `POST /send_role_dm` … ロールDM送信ジョブをキュー投入
- エラーハンドリング:
    - メッセージ中に未知の `{...}` が含まれていれば 400 を返却
    - 送信処理はBot側で0.3秒間隔で順次DM. 失敗(DM閉鎖等)はログに記録

### 送信リクエスト例
```bash
curl -X POST http://127.0.0.1:8000/send_role_dm \
    -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
        "guild_id": 123456789012345678,
        "role_id": 987654321098765432,
        "message": "こんにちは {user} さん！最新情報です. ",
        "file_url": "https://example.com/uploads/info.png"
    }'
```

### セキュリティ
- Web: Twitchログイン＋スタッフ昇格(許可ログイン名のみ)で画面アクセスを制限
- API: Bot 側は Bearer トークンで保護し, Web からのみ正規リクエスト
- 入力: メッセージのテンプレ置換は {user} のみ許可, 未知 {...} は送信前にブロック
- 送信: ファイルはDjangoで受領後に公開URLを生成, BotがDLしてDMに添付

### セットアップ / 実行
- 事前: Bot(py-cord + FastAPI)がローカル :8000 で稼働
- 設定:
    - venv/token.json に admin_api_token と bot_admin_api_base を記載(未設定時は http://127.0.0.1:8000 を利用)
    - 許可Twitchログイン名は環境変数 ALLOWED_TWITCH_LOGINS(カンマ区切り)または token.json の twitch_login/twitch_name 読み取りにより自動昇格
- インストール:
```bash
pip install -r requirements.txt
```
- 起動:
```bash
cd webadmin
python manage.py migrate
python manage.py runserver 127.0.0.1:8001
```

- Bot 管理API 設定: `venv/token.json` に `admin_api_token`, `bot_admin_api_base` を設定. 既定の接続先は `http://127.0.0.1:8000`.
- Twitch クレデンシャル: `venv/token.json` または環境変数 `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` を使用. allauth へ自動反映.
- スタッフ昇格: `ALLOWED_TWITCH_LOGINS` に含まれる Twitch ログインでのサインインで `is_staff` を自動付与.
- 送信仕様: `{user}` は送信時に表示名へ置換. 未知プレースホルダは 400 を返す. 添付は 8MB まで.
- 保存場所: 添付は `MEDIA_ROOT/uploads` に保存し, `file_url` と `file_path` を Bot へ引き渡す.
- 運用補助: `python manage.py bootstrap_inbox` で DB テーブルを初期化. `python manage.py bootstrap_twitch_app` で SocialApp を作成.

<div class="mermaid" markdown="0" style="font-size:20px; overflow-x:auto; max-width:100%;">
%%{init: {
  "flowchart": { "htmlLabels": true, "useMaxWidth": true, "nodeSpacing": 35, "rankSpacing": 45 },
  "themeVariables": { "fontFamily": "Noto Sans JP, Meiryo, Arial, sans-serif", "fontSize": "20px" }
}}%%
flowchart LR
  Staff["Staff(User)"] --> UI["Django /broadcast"]
  UI -->|GET /guilds| GAPI["Bot Admin API /guilds"]
  GAPI --> UI
  UI -->|GET /roles?guild_id| RAPI["Bot Admin API<br/>/roles"]
  RAPI --> UI
  UI -->|POST /send_role_dm| PAPI["Bot Admin API<br/>/send_role_dm"]
  PAPI --> BOT["Bot(py-cord)<br/>queue"]
  BOT --> LOOP["notify_role_members<br/>0.3s interval"]
  LOOP --> DM["DM to Role Members"]
  subgraph Uploads
    UI --> SAVE["Save attachment<br/>to MEDIA uploads"]
    SAVE -->|file_url + file_path| PAPI
  end
</div>

<br>

<div class="mermaid" markdown="0" style="font-size:20px; overflow-x:auto; max-width:100%;">
%%{init: {
  "flowchart": { "htmlLabels": true, "useMaxWidth": true, "nodeSpacing": 35, "rankSpacing": 45 },
  "themeVariables": { "fontFamily": "Noto Sans JP, Meiryo, Arial, sans-serif", "fontSize": "20px" }
}}%%
flowchart LR
  U["User"] --> ALLAUTH["allauth<br/>Twitch login"]
  ALLAUTH --> CB["Callback"]
  CB --> SIG["user_logged_in<br/>signal"]
  SIG --> CK["Check<br/>ALLOWED_TWITCH_LOGINS"]
  CK -->|allowed| STAFF["set is_staff = True"]
  CK -->|not allowed| NOOP["no change"]
</div>

- アクセス: <a href="https://neige-subscription.com/">https://neige-subscription.com/</a>

### 実装ハイライト

- 認証/権限: django-allauth + ログイン時シグナルで is_staff を昇格
- 連携: requests で Bot 管理APIへ(Bearer付与, タイムアウト・エラーハンドリング)
- UX: サーバー/ロールの動的選択, 未対応 {...} の即時バリデーション, ヒント表示
- 保守性: 設定値は基本 venv/token.json から集約読込

### 関連
- 本体: Twitchサブスク連携Discord Bot
- リポジトリ: [NAKANORyunosuke/NeiBot]({{ page.repo_url }})
