---
layout: project
title: "Twitchサブスク連携Discord Bot"
date: 2025-08-09
period: "2025/08/05 – 2025/08/08"
role: "設計 / 実装 / 運用"
tech:
  - Python 3.12
  - py-cord 2.6.1
  - twitchAPI 4.5.0
  - FastAPI
  - Windows Server
  - Let’s Encrypt (win-acme)
  - Nginx (Reverse Proxy)
repo_url: "https://github.com/NAKANORyunosuke/NeiBot"
hero: "/assets/img/portfolio/twitch-discord-bot/hero.png"
tags: [Discord, Twitch, OAuth2, Bot, FastAPI, Nginx, ReverseProxy]
summary: "Twitchのサブスク状況を自動判定し, Discordロールの付与/剥奪を自動化. OAuthリダイレクト〜API連携〜ロール更新, 本番環境のリバースプロキシ構築までをエンドツーエンドで実装. "
---

## プロジェクト概要
Twitchのサブスク限定Discordサーバー向けに, サブスク会員の認証とロール管理を自動化するBotを構築.   
認証フローからロール付与までを完全自動化し, さらにNginxによるリバースプロキシ構築で本番運用を安定化. 

- **目的:** 手動でのサブスク確認・ロール付与作業をゼロにし, 管理者負担を削減
- **成果:** サブスクTier別ロール付与, 失効時の自動剥奪 / HTTPS対応でOAuth要件を満たし, 安定した24時間稼働を実現

## 実装内容
- スラッシュコマンド `/link` 実装（認可URL生成とユーザーへの送信）
- Twitch OAuth 2.0 Authorization Code Flow 実装（`state`でDiscordユーザーを安全特定）
- FastAPIによるコールバック処理, トークン交換, Helix API呼び出し
- サブスクTier取得とDiscordロール付与/更新（py-cord）
- JSONによるDiscord ID ↔ Twitchアカウント紐付け管理（将来のDB化を見越した設計）
- Let’s Encrypt（win-acme）によるHTTPS化
- **Nginxリバースプロキシ構築**（TLS終端, パスベース振り分け, X-Forwardedヘッダ設定）
  - `/` → 将来的なWeb UI（管理画面）用
  - `/callback` → FastAPI（Twitch OAuthコールバック）
  - HTTP→HTTPSリダイレクト, HSTS適用

## 技術スタック
- **言語:** Python 3.12  
  - Discordのapiの都合上Pythonを採用.
- **主要ライブラリ:**  
  - **py-cord 2.6.1** — Discord Bot 機能の実装に使用. スラッシュコマンドやロール管理, イベントハンドリングを担当.   
  - **twitchAPI 4.5.0** — Twitch Helix API 呼び出しや OAuth 2.0 認証処理を簡潔に実装可能に. 
- **Web:** FastAPI（OAuthコールバック処理）  
  高速・非同期対応の Python 製 Web フレームワーク. Twitch 認証のコールバックエンドポイントを実装し, 非同期処理で API 応答の遅延を最小化. 
- **API:**  
  - **Twitch Helix API** — ユーザー情報およびサブスク状態（Tier判定）を取得.   
  - **Discord API** — ロールの付与・剥奪, ユーザー情報取得など Bot 側の管理操作を実現. 
- **インフラ:** Windows Server, Nginx, win-acme  
  - **Windows Server** — 常時稼働環境として利用.   
  - **Nginx** — リバースプロキシとして FastAPI へのルーティングと TLS 終端を担当.   
  - **win-acme** — Let's Encrypt 証明書を自動取得・更新し, HTTPS 対応を維持. 

## 処理フロー
1. Discordで `/link` 実行 → BotがTwitch認可URLを返す（`state=DiscordUserID`）
2. ユーザーがTwitchで認可 → サーバーの`/callback`に`code`と`state`が渡される
3. コールバック処理で`code`→トークン交換, Helix APIでユーザー＆サブスク状況確認
4. BotがDiscord APIを使い該当ユーザーにロール付与/更新（Tier別対応）

<div class="mermaid" markdown="0">
%%{init: {'startOnLoad': true, 'securityLevel': 'loose'}}%%
flowchart TD
  U["ユーザー"] -->|/link 実行| D["Discord Bot (py-cord)"]
  D -->|Twitch認可URLを返信<br/>state=DiscordUserID| U
  U -->|認可| T["Twitch 認証ページ"]
  T -->|redirect: ?code & state| F["FastAPI /callback"]
  F -->|code→token交換| O["OAuth Token Endpoint"]
  F -->|Helix API| H["Twitch Helix<br/>(/users, /subscriptions)"]
  F -->|サブスク状況| S["紐付けストア<br/>JSON/DB"]
  F -->|Discord API| B["Discord Bot"]
  B -->|ロール付与/更新| G["Discord Guild"]

  classDef srv fill:#eef,stroke:#669,stroke-width:1px,color:#123;
  classDef api fill:#efe,stroke:#393,stroke-width:1px,color:#060;
  classDef store fill:#ffe,stroke:#cc9,stroke-width:1px,color:#630;

  class F srv
  class H,O api
  class S store
</div>

<div class="mermaid" markdown="0">
flowchart LR
  C[Client] -->|HTTPS 443| N["Nginx (TLS終端)"];
  N -->|/| W["将来のWeb UI / 静的配信 など"];
  N -->|/callback| A["FastAPI :8000"];

  subgraph Host
    N
    A
    W[(任意: :8001 など)]
  end

  N -.付与.-> H1[X-Forwarded-Proto];
  N -.付与.-> H2[X-Forwarded-For];
  N -.付与.-> H3[Host];
</div>



## リポジトリ
- GitHub: [NAKANORyunosuke/NeiBot]({{ page.repo_url }})
