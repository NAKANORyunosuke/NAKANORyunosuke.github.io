---
layout: project
title: "Twitchサブスク連携Discord Bot"
date: 2025-08-09
period: "2025/08/05 – 2025/08/17"
role: "設計 / 実装 / 運用"
tech:
  - Python 3.12
  - py-cord 2.6.1
  - twitchAPI 4.5.0
  - FastAPI
  - Uvicorn
  - Windows Server
  - Let’s Encrypt (win-acme)
  - Nginx (Reverse Proxy)
repo_url: "https://github.com/NAKANORyunosuke/NeiBot"
hero: "/assets/img/portfolio/twitch-discord-bot/hero.png"
tags: ["Discord","Twitch","OAuth2","Bot","FastAPI","Uvicorn","Nginx","ReverseProxy"]
summary: "Twitchのサブスク状況を自動判定し, Discordロールの付与/剥奪を自動化. OAuthリダイレクト〜API連携〜ロール更新, 本番環境のリバースプロキシ構築までをエンドツーエンドで実装."
permalink: /portfolio/twitch-discord-bot/
published: true
---

## プロジェクト概要
Twitchのサブスク限定Discordサーバー向けに, サブスク認証とロール管理を全自動化した.  
OAuth認可〜コールバック〜サブスクTier判定〜ロール付与/剥奪までを一気通貫で実装し, Uvicorn + Nginx リバースプロキシにより本番環境を安定稼働させた.  
さらに, 月初の再リンク要求や未リンク者への自動DMなど運用オペレーションも自動化した.  

- **目的:** 手動によるサブスク確認・ロール付与作業をゼロとし, 管理負荷とヒューマンエラーを削減すること  
- **成果:** サブスクTier別ロール自動付与・失効時の自動剥奪, HTTPS対応(win-acme), 24h稼働の安定運用, 運用リマインドの自動化を実現

## 変更点(2025-08-17)
- 月初の自動再リンク要求(streak維持・tier変動検出 / `relink_required` フラグ連動)  
- 未リンク者の自動DM(参加時 / 1週間後のフォロー)  
- Uvicornを利用したFastAPI実行(アプリ内で`uvicorn.run(app, host="0.0.0.0", port=8000)`を別スレッドで起動)  
- Nginx + Uvicorn の本番構成(TLS終端とアプリ分離により安定稼働)  
- JSONスキーマ拡張 / データ差分検知  
- セキュリティ強化(アクセス制御・HSTS・ログ監視)  

## 実装内容
- `/link` スラッシュコマンドを実装(認可URL生成・ephemeral返信)  
- Twitch OAuth 2.0 認可コードフローを導入(`state=DiscordUserID`で安全突合)  
- FastAPI `/twitch_callback` をUvicornによりアプリ内スレッドで常駐稼働  
- サブスクTier取得とロール付与/剥奪(py-cord)  
- JSONストアによるユーザー管理(将来的DB化を見越した設計)  
- Let’s Encrypt + Nginx による HTTPS / Proxy 構成  

## 技術スタック
- **言語:** Python 3.12  
- **主要ライブラリ:**  
  - py-cord 2.6.1 — Discord Bot機能  
  - twitchAPI 4.5.0 — OAuth2 + Helix API  
  - FastAPI — コールバック処理  
  - Uvicorn — ASGIサーバ(アプリ内スレッドで起動)  
- **インフラ:** Windows Server, Nginx, win-acme  

## インフラ構成
- Uvicornはアプリ内で起動し, Discord Botと同一プロセスの別スレッドとして`:8000`をリッスンする  
- Nginxが443(HTTPS)を受け持ち, `/callback`リクエストをUvicornにリバースプロキシする  
- win-acmeが証明書自動更新(Let’s Encrypt)を担い, Nginxに反映する  
- Discord Bot (py-cord) は独立プロセスとして稼働する  

<div class="mermaid" markdown="0">
flowchart LR
  C[Client] -->|HTTPS 443| N["Nginx (TLS終端)"];
  N -->|/callback| U["Uvicorn :8000 (FastAPI)"];
  U --> F["FastAPI<br/>OAuth Callback"];
  N -->|/| W["将来のWeb UI"];

  subgraph Host
    N
    U
    F
    W
  end

  N -.付与.-> H1[X-Forwarded-Proto];
  N -.付与.-> H2[X-Forwarded-For];
  N -.付与.-> H3[Host];
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
  CB[/ /twitch_callback /]
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
CB --> VERIFY --> SUBS
VERIFY --> USERS
VERIFY --> ROLE_OPS --> SUBROLE

CMD --> USERS
FastAPI --> TOKENS
WS --> Nginx --> Uvicorn --> CB
</div>


## 運用とセキュリティ
- Uvicorn + Nginx 構成により, 外部公開と内部アプリを分離した  
- HSTS / HTTPSリダイレクトを導入し, 安全な認証フローを保証した  
- 不正アクセス対策として, 軽量BAN機構とログ監視を導入した  

GitHub: [NAKANORyunosuke/NeiBot]({{ page.repo_url }})
