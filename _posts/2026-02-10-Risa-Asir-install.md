---  
layout: post  
title_ja: "Risa/Asirのインストール2"  
description_ja: "Risa/Asirのインストール解説"  
categories: [programming]  
tags: [Risa/Asir]  
lang: ja  
published: true  
---  
  
2026年2月9日, 東北大学で開催された第5回保型形式小集会で聴講しているとき, メールで神戸大学の高山信毅先生から[https://github.com/openxm-org/OpenXM](https://github.com/openxm-org/OpenXM)と[https://github.com/openxm-org/OpenXM_contrib2](https://github.com/openxm-org/OpenXM_contrib2)からソースをダウンロードすることを推奨する旨のメールを頂いた. お伝え頂いた日本大学の濱田龍義先生ありがとうございます.  
本稿では[Risa/Asirのインストール](https://nakanoryunosuke.github.io/programming/2025/11/21/Risa-Asir-Install.html)の内容を指摘していただいた内容で再構成し, 最低限必要なパッケージをインストールするようにしたdockerfileを公開する. また, この最低限のdockerfileはビルドが最後まで通るという意味であるため, 本稿ではエラーを洗い出した道程と追加したパッケージに関しても記述する.  
完全版Dockerfileに関しては[GitHub](https://github.com/NAKANORyunosuke/Risa-Asir-container)にも公開しておく.  
  
## ビルド成功までの最低限のDockerfile  
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
    xorg-dev \  
    && apt-get clean \  
    && rm -rf /var/lib/apt/lists/*  
  
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
DOCKER_BUILDKIT=1 docker build --no-cache -t risa-asir . 2>&1 | tee build.log  
```  
この時点でビルドは成功したが, いくつかエラーが出ていたため, 恐らく使用している中で不都合が出てくると思われる.  
```  
grep -nEi 'not found|command not found|No such file or directory|cannot find' build.log > error.log  
```  
でnot foundであるエラーを抽出して対応する.  
#### コマンドが存在しない系  
```error.log  
md5.sh: not found  
uudecode: command not found  
javac (java compiler) is not found in your search path  
ptex: not found  
pstoimg: not found  
makeinfo is not found  
```  
  
#### pkg-config による依存パッケージ未検出系  
```error.log  
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
以下, 優先度が高い順に記載する.  
- `pkg-config`  
    - ライブラリのコンパイル, リンク時の設定情報を取得するための補助ツール. 依存関係の検出に広く用いられるため必須.  
- `texinfo`  
    - `configure` が必須条件とする場合があるため必須.  
- `texlive-extra-utils`  
    - `kpsexpand`, `kpsewhich` などを提供する. `configure` が TeX のインストール先検出に用いるため事実上必須.  
- `texi2html`  
    - Texinfo を HTML に変換するためのツール. ドキュメント生成時に使用されるためほぼ必須.  
- `libcerf-dev`  
    - 複素誤差関数(Cerf 関数)を提供する開発用ライブラリ. 数値計算機能の有効化に必要なため必須.  
- `libcerf2`  
    - `libcerf` の実行時ライブラリ. `libcerf-dev` と併せて導入する必要があるため必須.  
- `sharutils`  
    - 古い配布形式(shar アーカイブ)を復元するためのツール.  
- `texlive-latex-recommended`  
    - LaTeX の基本的なクラス, パッケージ集合. ドキュメント生成の最低限として必要.  
- `libgd-dev`  
    - GD ライブラリの開発ヘッダ. 画像出力や `texi2html`/gnuplot 関連の機能有効化に必要.  
- `libgd3`  
    - GD ライブラリの実行時パッケージ. `libgd-dev` が有効にする機能の実行時依存として必要.  
- `libpng-dev`  
    - PNG 画像処理の開発ヘッダ. GD, gnuplot, ドキュメント生成系で画像出力を扱う際に必要.  
- `libjpeg-dev`  
    - JPEG 画像処理の開発ヘッダ. 画像変換や描画系機能を有効化する際に必要.  
- `libcairo2-dev`  
    - gnuplot の pdfcairo, pngcairo, svgcairo 端末用描画ライブラリ. 高品質な PDF, PNG, SVG 出力を行う場合に必要.  
- `libpango1.0-dev`  
    - フォントレイアウト用ライブラリ. cairo と組み合わせて高品質な文字描画を行う場合に必要.  
- `libglib2.0-dev`  
    - pango, cairo の基盤ライブラリ. 描画系依存を有効化するために必要.  
- `qtbase5-dev`  
    - gnuplot の Qt 端末(`set term qt`)用. GUI 表示を行う場合に必要.  
- `libqt5svg5-dev`  
    - Qt による SVG 描画サポート. gnuplot の Qt, SVG 出力を利用する場合に必要.  
- `netpbm`  
    - LaTeX → HTML 変換時に PostScript 出力を画像化するためのコマンド. 導入しない場合, ドキュメント生成結果が不完全になることがある.  
- `texlive-latex-extra`  
    - LaTeX 拡張パッケージ群. 導入しない場合でもビルドは通るが, ドキュメント生成が途中で失敗することがあるため推奨.  
- `texlive-fonts-recommended`  
    - 標準的な追加フォント群. PDF, HTML 出力時の互換性向上のため推奨.  
- `qttools5-dev`  
    - Qt 補助ツール群. Qt 端末を完全に利用する場合に有用.  
- `texlive-xetex`  
    - XeTeX, XeLaTeX を提供する. Unicode, 日本語対応を含む近代的な LaTeX 処理を行う場合に有用.  
- `texlive-lang-japanese`  
    - 日本語ドキュメント生成用の TeX 環境. 日本語文書を生成しない場合は不要.  
- `latex2html`  
    - LaTeX 文書を HTML に変換するためのツール. ドキュメント生成用途. 必須ではない.  
- `ghostscript`  
    - PostScript, PDF 処理用ユーティリティ. LaTeX → HTML 変換時に間接的に利用される. 必須ではない.  
- `default-jdk`  
    - Java 開発キット. Java を用いる機能を使用しない場合は不要.  
- `nkf`  
    - 文字コード変換ユーティリティ. 日本語文書処理や文字コードの正規化に用いられる. 必須ではない.  
  
  
#### その他対応  
`md5.sh: not found`は`PATH`に`/OpenXM/bin`を通すことにより解決.  
  
  
#### configure スクリプトの異常実行系  
```error.log  
./configure: line 2703: 0: command not found  
```  
`md5.sh`はOpenXMが提供するスクリプトで, インストール後は`/OpenXM/bin`に置かれるためPATHを追加して解決した.  
  
  
## 完全版Dockerfile  
```dockerfile  
FROM ubuntu:latest  
  
RUN apt-get update && apt-get upgrade -y && apt-get install -y \  
    \  
    # ----- 最優先：ビルドそのものに必須 -----  
    build-essential \  
    autoconf \  
    bison \  
    flex \  
    file \  
    curl \  
    git \  
    pkg-config \  
    \  
    # ----- 数値計算・OpenXM 本体依存 -----  
    libcerf2 \  
    libcerf-dev \  
    \  
    # ----- 端末・UI・gnuplot 関連 -----  
    libncurses5-dev \  
    libncursesw5-dev \  
    libncurses-dev \  
    libtinfo-dev \  
    xorg-dev \  
    \  
    # ----- gd（画像/texi2html/gnuplot 等で検出されがち）-----  
    libgd-dev \  
    libgd3 \  
    libpng-dev \  
    libjpeg-dev \  
    \  
    # ----- gnuplot 高品質描画（cairo / pango）-----  
    libcairo2-dev \  
    libpango1.0-dev \  
    libglib2.0-dev \  
    \  
    # ----- gnuplot Qt 端末（GUI）-----  
    qtbase5-dev \  
    qttools5-dev \  
    libqt5svg5-dev \  
    \  
    # ----- configure / doc 判定で必須になりがち -----  
    texinfo \  
    texi2html \  
    sharutils \  
    \  
    # ----- TeX 検出・kpsexpand（最重要 TeX ユーティリティ） -----  
    texlive-extra-utils \  
    \  
    # ----- LaTeX基本環境（doc 生成の最低ライン） -----  
    texlive-latex-recommended \  
    texlive-fonts-recommended \  
    \  
    # ----- LaTeX拡張（doc が途中で死ぬのを防ぐ） -----  
    texlive-latex-extra \  
    \  
    # ----- XeTeX / Unicode（日本語・近代 LaTeX） -----  
    texlive-xetex \  
    texlive-lang-japanese \  
    \  
    # ----- LaTeX→HTML / 画像変換系 -----  
    latex2html \  
    ghostscript \  
    netpbm \  
    \  
    # ----- 補助ツール -----  
    nkf \  
    default-jdk \  
    \  
    && apt-get clean \  
    && rm -rf /var/lib/apt/lists/*  
  
  
RUN git clone https://github.com/openxm-org/OpenXM  
RUN git clone https://github.com/openxm-org/OpenXM_contrib2  
  
  
WORKDIR /OpenXM/src  
ENV PATH="/OpenXM/bin:${PATH}"  
RUN make configure  
RUN make install  
  
WORKDIR /OpenXM/rc  
RUN make && mkdir ~/bin && cp openxm ~/bin  
  
WORKDIR /  
CMD ["/bin/bash"]  
```  
  
<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで. </p>  
<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>  