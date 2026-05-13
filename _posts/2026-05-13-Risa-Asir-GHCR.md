---
layout: post
title_ja: "Risa-Asir を GHCR.io で使えるようにした"
description_ja: "Risa-Asir の Docker image を GHCR.io に公開し, 利用導線を整えた記録"
categories: [programming]
tags: [Risa/Asir, Docker, GHCR]
lang: ja
---

# Risa-Asir を GHCR.io で使えるようにした

## 概要

GitHub 上の `https://github.com/NAKANORyunosuke/Risa-Asir-container` で公開している Docker image を, GitHub Container Registry, つまり `ghcr.io` から pull できるようにした. MSFDで濱田先生から教えていただいたがずっと放置していて急に思い立ち実施した.

主な変更点は, GitHub Actions での publish workflow を追加したことと, base image を Ubuntu 24.04 に固定したことの 2 点.

## 何を入れたか

### 1. GitHub Actions での publish workflow

`.github/workflows/publish-ghcr.yml` を追加した.

やっていることはシンプルで,

1. `actions/checkout` で source tree を checkout
2. `docker/setup-buildx-action` で Buildx を有効化
3. `docker/login-action` で `ghcr.io` に login
4. `docker/metadata-action` で tag と OCI label を生成
5. `docker/build-push-action` で build して push

という流れ.

image 名は `ghcr.io/${{ github.repository }}` を使うので, `https://github.com/NAKANORyunosuke/Risa-Asir-container` では最終的に

```text
ghcr.io/nakanoryunosuke/risa-asir-container
```

になる.

tag は `latest` に加えて, branch 名や Git tag に応じたものを出すようにした.

- `latest`
- branch 名 tag
- Git tag

## 2. GHCR 用の入口を別ディレクトリに分けた

ローカル build 前提の導線と, 公開済み image 利用の導線を混ぜたくなかったので, `ghcr/` を別に切った.

追加したのは次.

- `ghcr/pull.sh`
- `ghcr/single/run.sh`
- `ghcr/cluster/run_example.sh`
- `ghcr/README.md`

`ghcr/` 配下の script は, 既存の `single/` と `cluster/` を再利用しつつ, `RISA_ASIR_IMAGE=ghcr.io/nakanoryunosuke/risa-asir-container:latest` を差し込む薄い wrapper にしている.

この構成にした理由は, ローカル build 用と公開 image 用で責務を分けたいから. `single/` と `cluster/` は引き続きローカル開発の入口, `ghcr/` は配布済み image の入口, という整理にした.

## 3. `RISA_ASIR_IMAGE` を受けられるようにした

`single/build.sh`, `single/run.sh`, `single/delete.sh`, `cluster/compose.yml` を少し直して, image 名を環境変数で差し替えられるようにした.

既定値は従来どおり `risa-asir:latest` だが, GHCR 利用時は次のように切り替えられる.

```bash
RISA_ASIR_IMAGE=ghcr.io/nakanoryunosuke/risa-asir-container:latest ./single/run.sh
RISA_ASIR_IMAGE=ghcr.io/nakanoryunosuke/risa-asir-container:latest ./cluster/run_example.sh 4
```

## 4. `.dockerignore` を追加した

build context に不要なものが入りすぎないように, `.dockerignore` を追加した.

主に除外したのは次.

- `.git`
- `.codex`
- `.generated`
- `cluster/.generated`
- log 類

GHCR publish は GitHub Actions 上で毎回走るので, build context を軽くしておくのは効果が大きい.

## なぜ `ubuntu:latest` をやめて `24.04` に固定したか

GHCR publish を流した時, `apt-get install` が GitHub Actions 上で失敗した.

`https://github.com/NAKANORyunosuke/Risa-Asir-container` で管理している Dockerfile はもともと `ubuntu:latest` で動いていたが, `latest` は Ubuntu の現行系列に追従するので, ある日突然 package 構成や依存関係が変わる. Dockerfile に大量の package を積んでいる今回の image では, それがそのまま build failure につながる.

なので `FROM ubuntu:24.04` に固定した.

これで少なくとも,

- どの Ubuntu 系列で build するのか
- apt package 名がどの repository を前提にしているのか

が明確になった.

## 使い方

publish 後は次で pull できる.

```bash
docker pull ghcr.io/nakanoryunosuke/risa-asir-container:latest
```

そのまま shell に入るなら:

```bash
docker run -it --rm ghcr.io/nakanoryunosuke/risa-asir-container:latest bash
```

`https://github.com/NAKANORyunosuke/Risa-Asir-container` を clone した作業ディレクトリを mount して使うなら:

```bash
docker run -it --rm -v "$PWD:/workspace" -w /workspace ghcr.io/nakanoryunosuke/risa-asir-container:latest bash
```

`https://github.com/NAKANORyunosuke/Risa-Asir-container` に含めた補助 script を使うなら:

```bash
./ghcr/pull.sh
./ghcr/single/run.sh
./ghcr/cluster/run_example.sh 4
```

## 所感

今回の整理で,

- ローカル build して試す導線
- GHCR から pull して使う導線
- GitHub Actions で publish する導線

が分離できた.

特に `ghcr/` を別に切ったのは良かった. README の説明も整理しやすいし, 利用者にとっても「自分で build するのか, すでに公開された image を使うのか」が分かりやすい.

また, `ubuntu:latest` を 24.04 に pin したのは, GHCR 公開を前提にするとかなり重要だった. 手元だけで動く Dockerfile と, CI 上で継続的に build できる Dockerfile は別物だと改めて感じた.

## 参考文献

- GitHub Docs, "Working with the Container registry"  
  https://docs.github.com/packages/getting-started-with-github-container-registry/about-github-container-registry
- GitHub Docs, "Publishing Docker images"  
  https://docs.github.com/en/actions/publishing-packages/publishing-docker-images
- GitHub Docs, "Publish Docker images"  
  https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images
- zembutsu, "GitHub Container Registry(ghcr.io)にDockerイメージをpushする手順"  
  https://qiita.com/zembutsu/items/1effae6c39ceae3c3d0a

<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで. </p>
<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>
