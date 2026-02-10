---
layout: post
title_ja: "Risa/Asirのインストール2"
description_ja: "Risa/Asirのインストール解説"
categories: [programming]
tags: [Risa/Asir]
lang: ja
published: false
---

# <span class="lang-ja reveal-on-scroll">Risa/Asirのインストール2</span><span class="lang-en">Installation of Risa/Asir2</span>
2026年2月9日, 東北大学で開催された第5回保型形式小集会で聴講しているときにメールで神戸大学の高山信毅先生から[https://github.com/openxm-org/OpenXM](https://github.com/openxm-org/OpenXM)と[https://github.com/openxm-org/OpenXM_contrib2](https://github.com/openxm-org/OpenXM_contrib2)からソースをダウンロードすることを推奨する旨のメールを頂いた. お伝え頂いた日本大学の濱田龍義先生ありがとうございます.  
このページでは[Risa/Asirのインストール](https://nakanoryunosuke.github.io/programming/2025/11/21/Risa-Asir-Install.html)の内容を指摘していただいた内容で再構成し, 最低限必要なパッケージをインストールするようにしたdockerfileを公開する.

## <span class="lang-ja reveal-on-scroll">ビルド成功までの最低限のDockerfile</span><span class="lang-en">Minimal Dockerfile for Successful Builds</span>
```dockerfile
FROM ubuntu:latest

RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    git \
    build-essential \
    autoconf \
    curl \
    libncurses5-dev \
    libncursesw5-dev \
    libncurses-dev \
    libtinfo-dev \
    bison \
    file \
    flex \
    xorg-dev

RUN git clone https://github.com/openxm-org/OpenXM
RUN git clone https://github.com/openxm-org/OpenXM_contrib2


WORKDIR /OpenXM/src
RUN make configure
RUN make install

WORKDIR /OpenXM/rc
RUN make && mkdir ~/bin && cp openxm ~/bin


CMD ["/bin/bash"]
```
次のコマンドを実行しビルドした.
```build_container.sh
DOCKER_BUILDKIT=1 docker build . 2>&1 | tee build.log
```
この時点でビルドは成功したが, いくつかエラーが出ていたため, 恐らく使用している中で不都合が出てくると思われる.
```
grep -nEi 'not found|command not found|No such file or directory|cannot find' build.log > error.log
```
でnot foundであるエラーを抽出して対応する.
### コマンドが存在しない系
```error.log
md5.sh: not found
uudecode: command not found
javac (java compiler) is not found in your search path
ptex: not found
pstoimg: not found
makeinfo is not found
```

### pkg-config による依存パッケージ未検出系
```erorr.log
Package 'libcerf', required by 'virtual:world', not found
Package 'cairo', required by 'virtual:world', not found
Package 'pango', required by 'virtual:world', not found
Package 'pangocairo', required by 'virtual:world', not found
Package 'glib-2.0', required by 'virtual:world', not found
Package 'Qt5Core', required by 'virtual:world', not found
Package 'Qt5Gui', required by 'virtual:world', not found
Package 'Qt5Network', required by 'virtual:world', not found
Package 'Qt5Svg', required by 'virtual:world', not found
Package 'Qt5PrintSupport', required by 'virtual:world', not found
Package 'QtCore', required by 'virtual:world', not found
Package 'QtGui', required by 'virtual:world', not found
Package 'QtNetwork', required by 'virtual:world', not found
Package 'QtSvg', required by 'virtual:world', not found
```

#### 追加パッケージ
- `texinfo`
    - `configure` が必須条件とする場合があるそうなので必須.
- `sharutils`
    - 古い配布形式を復元するためのツール.
- `ghostscript`
- `netpbm`
    - LaTeX → HTML変換時にpost scriptを画像化するコマンド, 必須ではないがドキュメント生成が不完全になる.
- `texlive-lang-japanese`
    - 日本語ドキュメント生成専用. 不要なら導入しなくても良い
- `default-jdk`
    - Java. 不要なら導入しなくても良い

#### その他対応
`md5.sh: not found`は`PATH`に`/OpenXM/bin`を通すことにより解決.


### configure スクリプトの異常実行系
```error.log
./configure: line 2703: 0: command not found
```

### 上記の結果ファイルが不足している系
```error.log
gzip: help-ja.tgz: No such file or directory
gzip: help-en.tgz: No such file or directory
```

<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで. </p>
<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>
