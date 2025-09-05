---
layout: project
title: "Twitch連携 管理UI（Django）"
date: 2025-09-05
period: "2025/08/20 - 2025/09/05"
role: "設計 / 実装"
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
permalink: /portfolio/twitch-discord-admin/
published: true
---

## 概要
Twitchログイン（django-allauth）で認証されたスタッフのみが利用できる, DiscordロールDMの一括配布ツール.   
Bot（py-cord + FastAPI）の管理APIと安全に連携し, メッセージテンプレート `{user}` の置換や未知プレースホルダの事前エラーを備える. 

- 目的: 運営が非技術者でも安全・簡単にロール対象へ告知DMを送れるようにする
- 効果: 案内・告知の即時配布, 誤送信・設定ミスの抑制, 添付ファイル付き配信の省力化

## 主要機能
- 認証: Twitchログイン（django-allauth）
    - 許可Twitchログイン名はスタッフ（`is_staff`）へ自動昇格
- 権限: `is_staff` のみアクセス可能（非スタッフは 403）
- 送信: 指定ロールの全メンバーへDM一括送信
    - 添付ファイル対応（最大 8MB, Discord DM 制限に準拠）
    - テンプレ置換: メッセージ中の `{user}` を各メンバーの表示名へ置換
    - バリデーション: 未対応の `{...}` が含まれていれば送信前にエラー
- 連携: Bot 管理API（Bearer 認証）からサーバー/ロール一覧を取得

## 画面フロー
1) Twitch でログイン  
2) 管理トップから「ロールDM送信」を開く  
3) サーバーとロール, メッセージ, （任意で）添付ファイルを指定  
4) 送信ボタンでキュー投入（Bot 側が順次送信・ログ記録）

ヒント: `{user}` は各メンバーの表示名に置換されます. 未対応の `{...}` が含まれるとフォームでエラーになります. 

## Bot 管理API連携
- 認証: `Authorization: Bearer <ADMIN_API_TOKEN>`
- エンドポイント:
    - `GET /guilds` … 参加中サーバー一覧
    - `GET /roles?guild_id=<id>` … 指定サーバーのロール一覧
    - `POST /send_role_dm` … ロールDM送信ジョブをキュー投入
- エラーハンドリング:
    - メッセージ中に未知の `{...}` が含まれていれば 400 を返却
    - 送信処理はBot側で0.3秒間隔で順次DM. 失敗（DM閉鎖等）はログに記録

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
- Web: Twitchログイン＋スタッフ昇格（許可ログイン名のみ）で画面アクセスを制限
- API: Bot 側は Bearer トークンで保護し, Web からのみ正規リクエスト
- 入力: メッセージのテンプレ置換は {user} のみ許可, 未知 {...} は送信前にブロック
- 送信: ファイルはDjangoで受領後に公開URLを生成, BotがDLしてDMに添付

### セットアップ / 実行
- 事前: Bot（FastAPI）がローカル :8000 で稼働
- 設定:
    - venv/token.json に admin_api_token と bot_admin_api_base を記載（未設定時は http://127.0.0.1:8000 を利用）
    - 許可Twitchログイン名は環境変数 ALLOWED_TWITCH_LOGINS（カンマ区切り）または token.json の twitch_login/twitch_name 読み取りにより自動昇格
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
- アクセス: http://127.0.0.1:8001

### 実装ハイライト

- 認証/権限: django-allauth + ログイン時シグナルで is_staff を昇格
- 連携: requests で Bot 管理APIへ（Bearer付与, タイムアウト・エラーハンドリング）
- UX: サーバー/ロールの動的選択, 未対応 {...} の即時バリデーション, ヒント表示
- 保守性: 設定値は基本 venv/token.json から集約読込

### 関連
- 本体: Twitchサブスク連携Discord Bot
- リポジトリ: [NAKANORyunosuke/NeiBot]({{ page.repo_url }})