---
layout: post
title_ja: "Risa/Asirのインストール"
description_ja: "Risa/Asirのインストール解説"
categories: [programming]
tags: [Risa/Asir]
lang: ja
---

# <span class="lang-ja reveal-on-scroll">Risa/Asirのインストール</span><span class="lang-en">Installation of Risa/Asir</span>
Risa/Asirをインストールしようと思い, <a href="https://qiita.com/satoshin_astonish/items/9c1f5beff7275dadf0d4">この記事</a>を参考にしたが, 色々パッケージが足りなかったため追加したDockerfileを公開する. 

## <span class="lang-ja reveal-on-scroll">Dockerfile</span><span class="lang-en">Dockerfile</span>

```Dockerfile
FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive
ENV CPPFLAGS="-I/usr/include/tirpc"
ENV LDFLAGS="-ltirpc"

RUN apt-get update && \
    apt-get install -y \
    build-essential \
    automake \
    autoconf \
    bison \
    flex \
    libtool \
    pkg-config \
    wget \
    make \
    file \
    libtirpc-dev \
    libgmp-dev \
    libmpfr-dev \
    libmpc-dev \
    libx11-dev \
    libxext-dev \
    libxmu-dev \
    libxaw7-dev \
    libice-dev \
    libsm-dev \
    libncurses-dev \
    perl \
    texinfo \
    sharutils \
    latex2html \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /
RUN wget https://www.math.kobe-u.ac.jp/pub/OpenXM/head/openxm-head.tar.gz -O openxm-head.tar.gz && \
    tar -xzf openxm-head.tar.gz && \
    rm openxm-head.tar.gz

WORKDIR /OpenXM/src
RUN make
RUN make install

WORKDIR /OpenXM/rc
RUN make install || true

CMD ["/bin/bash"]
```

## <span class="lang-ja reveal-on-scroll">なぜ失敗するか</span><span class="lang-en">Why failure</span>

1. **`rpc/rpc.h` が glibc から消えている**
   - 古い `asir2000` のソースは `<rpc/rpc.h>` に依存しているが, 最近のUbuntuではglibcからONC RPCが削除されている. 
   - そのため, 元記事どおりにパッケージを入れてもヘッダが見つからず, 
     ```C
     fatal error: rpc/rpc.h: No such file or directory
     ```
     でコンパイルが止まる. 
   - 対策として, `libtirpc-dev` を入れた上で
     ```sh
     CPPFLAGS="-I/usr/include/tirpc"
     LDFLAGS="-ltirpc"
     ```
     を環境変数として設定し, `rpc/rpc.h` を `tirpc` 越しに参照できるようにしている. 

2. **OpenXMのソースが想定している古いUnixツールが抜けている**
   - OpenXMは各種の `configure` / `make` の内部で, 以下のような古いツールやドキュメント系コマンドに依存している:
     - `file`(`/usr/bin/file`) … configure の判定に使用
     - `texinfo` … info ドキュメント生成
     - `sharutils` … uuencode / shar 展開
     - `latex2html` … LaTeX 文書から HTML を作るスクリプト
   - これらが無いと `configure` が途中で失敗したり(特に `asir-doc`, `gnuplot` 周り), その後の `make all` が連鎖的に落ちる. 
   - 上のDockerfileではこれらを明示的に `apt-get install` することで, OpenXMの古いビルドスクリプトの前提をすべて満たすようにしている. 

3. **X11 + 数学ライブラリの開発パッケージが不足している**
   - `asir2018` や gnuplot 連携部分は, X11 関連と多倍長演算ライブラリに強く依存する:
     - `libx11-dev`, `libxext-dev`, `libxmu-dev`, `libxaw7-dev`, `libice-dev`, `libsm-dev`
     - `libgmp-dev`, `libmpfr-dev`, `libmpc-dev`
   - これらが無い状態だと, `pari` や `asir2018` のリンク時に未解決シンボルやヘッダ欠落で失敗する. 
   - そのため, X11 系と GMP/MPFR/MPC の dev パッケージをまとめて入れて, `pari`・`gmp`・`asir2018` のビルドが通るようにしている. 

<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで. </p>
<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>
