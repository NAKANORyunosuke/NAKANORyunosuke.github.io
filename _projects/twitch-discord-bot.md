---
layout: project
title: "Twitchサブスク連携Discord Bot"
date: 2025-08-17
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
tags: [Discord, Twitch, OAuth2, Bot, FastAPI, Uvicorn, Nginx, ReverseProxy]
summary: "Twitchのサブスク状況を自動判定し, Discordロールの付与/剥奪を自動化. OAuthリダイレクト〜API連携〜ロール更新, 月初の再リンク要求, 未リンク者への自動DMリマインド, Nginx+Uvicorn構成による本番運用までをエンドツーエンドで実装. "
---

## プロジェクト概要
Twitchのサブスク限定Discordサーバー向けに, **サブスク認証とロール管理を全自動化**.   
OAuth認可〜コールバック〜サブスクTier判定〜ロール付与/剥奪までを一気通貫で実装し, **Uvicorn + Nginx リバースプロキシ**で本番環境を安定稼働させています.   
さらに, **月初の再リンク要求**や**未リンク者への自動DM**など運用オペレーションも自動化しました. 

- **目的:** 手動のサブスク確認・ロール付与作業をゼロにし, 管理負荷とヒューマンエラーを削減  
- **成果:** サブスクTier別ロール自動付与・失効時の自動剥奪 / HTTPS対応（win-acme）/ 24h稼働の安定運用 / 運用リマインド自動化

## 変更点（2025-08-17）
- **月初の自動再リンク要求**（streak維持・tier変動検出 / relink_required フラグ連動）
- **未リンク者の自動DM**（参加時 / 1週間後のフォロー）
- **Uvicornを利用したFastAPI実行**（`python -m uvicorn bot.bot_client:app --host 0.0.0.0 --port 8000`）
- **Nginx + Uvicorn の本番構成**（TLS終端とアプリ分離により安定稼働）
- **JSONスキーマ拡張 / データ差分検知**
- **セキュリティ強化（アクセス制御・HSTS・ログ監視）**

## 実装内容
- `/link` スラッシュコマンド実装
- Twitch OAuth 2.0 認可コードフロー
- FastAPI `/twitch_callback` → **Uvicornで常駐稼働**
- サブスクTier取得とロール付与/剥奪（py-cord）
- JSONストアによるユーザー管理（将来的DB化）
- Let’s Encrypt + Nginx による HTTPS / Proxy 構成

## 技術スタック
- **言語:** Python 3.12  
- **主要ライブラリ:**
  - py-cord 2.6.1 — Discord Bot 機能
  - twitchAPI 4.5.0 — OAuth2 + Helix API
  - FastAPI — コールバック処理
  - Uvicorn — FastAPIを本番稼働させる ASGI サーバ
- **インフラ:** Windows Server, Nginx, win-acme

## インフラ構成
- Uvicornが `:8000` でFastAPIを常駐実行  
- Nginxが443(HTTPS)を受け持ち, `/callback`リクエストをUvicornにリバースプロキシ  
- win-acmeが証明書自動更新（Let’s Encrypt）を担い, Nginxに反映  
- Discord Bot (py-cord) は独立プロセスとして稼働

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

## 運用とセキュリティ
- **Uvicorn + Nginx 構成**で, 外部公開と内部アプリを分離
- **HSTS / HTTPSリダイレクト**で安全な認証フローを保証
- 不正アクセス対策（軽量BAN下地・ログ監視）


GitHub: [NAKANORyunosuke/NeiBot]({{ page.repo_url }})