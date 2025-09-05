---
layout: project
title: "Twitchサブスク連携Discord Bot"
date: 2025-09-05
period: "2025/08/05 - 2025/09/05"
role: "設計 / 実装 / 運用"
tech:
  - Python 3.12
  - py-cord 2.6.1
  - FastAPI
  - APScheduler
  - twitchAPI 4.5.0
  - Uvicorn
  - Windows Server
  - Let’s Encrypt (win-acme)
  - Nginx (Reverse Proxy)
repo_url: "https://github.com/NAKANORyunosuke/NeiBot"
hero: "/assets/img/portfolio/twitch-discord-bot/hero.png"
tags: ["Discord","Twitch","OAuth2","Bot","FastAPI","Uvicorn","Nginx","ReverseProxy","EventSub"]
summary: "Twitchサブスクの状態をEventSubとスケジューラで監視し, Discord側のロールとチャンネルを完全自動化. OAuth認証からWebhook反映, 本番環境のリバースプロキシ構築までを実装. "
permalink: /portfolio/twitch-discord-bot/
published: true
---

## プロジェクト概要
Twitchのサブスク限定Discordサーバー向けに, サブスク認証とロール/チャンネル管理を全自動化.   
視聴者は `/link` コマンドからOAuth認可を行うだけでロール付与が完了し, EventSub(Webhook)により再サブや解約も即時反映される. 

- **目的:** 手動によるサブスク確認・ロール付与をゼロにし, 運用負荷とミスを排除すること  
- **成果:** サブスクTier別ロール/チャンネル自動整備, 再サブ検知・解約検知, 月次再リンクDMと未解決再送, 参加時の自動DM, HTTPS対応までを実現

## 実装内容
- `/link` スラッシュコマンドで認可URLを生成し, OAuth完了後にTierロールを自動付与  
- FastAPIエンドポイント  
  - `GET /twitch_callback` でトークン交換とリンク保存  
  - `POST /twitch_eventsub` で `channel.subscribe` / `channel.subscription.message` / `channel.subscription.end` を処理  
- APSchedulerで月初リマインドと7日後の未解決再送を自動化  
- サーバー参加時の未リンク者へ自動DMを送信し, 連携を促す  
- サブスクTierに応じたロール・カテゴリ・チャンネルを動的生成し, アクセス権を管理  
- Windows Server上でUvicornをポート8000で起動し, NginxでTLS終端したリバースプロキシ構成を実現

## インフラ構成
- Discord BotとFastAPIを同一プロセス内で稼働し, Uvicornを別スレッドで起動  
- NginxがHTTPS(443)を受け持ち, `/twitch_callback` と `/twitch_eventsub` をUvicornへプロキシ  
- win-acmeによるLet’s Encrypt証明書を自動更新し, Nginxに適用

<div class="mermaid" markdown="0">
flowchart LR
  C[Client] -->|HTTPS 443| N["Nginx (TLS終端)"]
  N -->|/twitch_callback| U["Uvicorn :8000 (FastAPI)"]
  N -->|/twitch_eventsub| U
  U --> F["FastAPI<br/>OAuth Callback / EventSub"]
  N -->|/| W["将来のWeb UI"]

  subgraph Host
    N
    U
    F
    W
  end

  N -.付与.-> H1[X-Forwarded-Proto]
  N -.付与.-> H2[X-Forwarded-For]
  N -.付与.-> H3[Host]
</div>

<div class="mermaid" markdown="0">
%%{init: {
  "flowchart": { "htmlLabels": true, "useMaxWidth": true, "nodeSpacing": 25, "rankSpacing": 35 },
  "themeVariables": { "fontFamily": "Noto Sans JP, Meiryo, Arial, sans-serif" }
}}%%
flowchart TD

subgraph Layer1["インフラ"]
  WS["Windows Server"]
  Nginx["Nginx<br/>(Reverse Proxy＋SSL)"]
  Uvicorn["Uvicorn<br/>(FastAPI 実行)"]
end

subgraph Layer2["FastAPI"]
  CB[/ GET /twitch_callback /]
  ES[/ POST /twitch_eventsub /]
  VERIFY["アクセストークン検証<br/>サブスク確認"]
end

subgraph Layer3["Twitch API"]
  AUTH["OAuth2 認証"]
  SUBS["サブスク情報取得"]
end

subgraph Layer4["Storage (venv JSON)"]
  TOKENS["token.json"]
  USERS["linked_users.json"]
end

subgraph Layer5["Bot (py-cord)"]
  CMD["スラッシュコマンド処理"]
  ROLE_OPS["ロール付与・剥奪"]
end

subgraph Layer6["Discord サーバー"]
  U[ユーザー]
  SC[/Slash Command/]
  SUBROLE["@Subscriber ロール"]
end

%% フロー
U -->|/link 実行| SC --> CMD
CMD -->|認証URL生成| AUTH
AUTH --> CB
ES --> VERIFY
CB --> VERIFY --> SUBS
VERIFY --> USERS
VERIFY --> ROLE_OPS --> SUBROLE

CMD --> USERS
FastAPI --> TOKENS
WS --> Nginx --> Uvicorn --> CB
Nginx --> Uvicorn --> ES
</div>

## 運用とセキュリティ
- HSTS・HTTPSリダイレクトを導入して安全なOAuthフローを提供  
- 不正アクセス対策としてアクセス制御とログ監視を実施

GitHub: [NAKANORyunosuke/NeiBot]({{ page.repo_url }})
