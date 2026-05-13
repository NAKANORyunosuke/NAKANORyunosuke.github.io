---
layout: post
title_ja: "Risa-Asir の cluster 版を入れた"
description_ja: "OpenXM の distributed computation API を使って, Docker Compose 上で cluster 実行を組んだ記録"
categories: [programming]
tags: [Risa/Asir, Docker, OpenXM]
lang: ja
---

# Risa-Asir の cluster 版を入れた

## 概要

Risa/Asir を Docker 上で単一コンテナ利用するだけでなく, 複数 worker を使う cluster 版も `https://github.com/NAKANORyunosuke/Risa-Asir-container` に入れた.

主な変更点は, Docker Compose を使った cluster 実行導線を追加したことと, その後に構成を `single/` と `cluster/` に整理したこと.

## 何を作ったか

最終的な構成はこうなった.

- `cluster/compose.yml`
- `cluster/run_example.sh`
- `cluster/scripts/worker-entrypoint.sh`
- `cluster/examples/compose_cluster_2workers.rr`
- `cluster/examples/compose_cluster_4workers.rr`
- `cluster/.generated/`

使い方としては,

```bash
./cluster/run_example.sh
./cluster/run_example.sh 3
./cluster/run_example.sh 8 --keep
```

のように worker 数を渡すと, `cluster/run_example.sh` が必要な compose と Asir script を動的生成して実行する.

## 先に読んだ公式リファレンス

実装前に, Risa/Asir 側の分散実行 API を把握するために OpenXM / Asir の manual をかなり読んだ.

### 1. `OpenXM`

まず全体像として, Asir の distributed computation が OpenXM の上に載っていることを確認した.

OpenXM の説明では,

- client が server に仕事を依頼する
- server は stack machine として動く
- 計算結果は自動では返らず, stack に積まれたまま
- client 側が明示的に結果取得を要求する

というモデルが説明されている.

ここを先に読むと, 後続の `ox_*` API がかなり理解しやすい.

### 2. `Functions for distributed computation`

次に, Asir manual の distributed computation 章の目次を見て, どの API があるかを洗った.

特に確認したのは次の関数群.

- `ox_launch`, `ox_launch_nox`, `ox_shutdown`
- `ox_launch_generic`
- `ox_rpc`
- `ox_push_cmd`
- `ox_pop_local`
- `ox_get`
- `ox_select`
- `generate_port`, `try_bind_listen`, `try_connect`, `try_accept`, `register_server`

ここで「高水準 API だけでなく, socket を自分で張る低水準 API もある」と分かったのが大きかった.

### 3. `generate_port`, `try_bind_listen`, `try_connect`, `try_accept`, `register_server`

最終的にいちばん効いたのはこの節だった.

manual ではこれらを, client と server の通信を確立するための primitive と説明している.

内容を要約すると,

- `try_bind_listen(port)` は bind と listen を行う
- `try_accept(socket, port)` は接続要求を accept する
- `register_server(control_socket, control_port, server_socket, server_port)` は control / server socket の組を Asir に登録する

という役割分担.

さらに manual の例では, `ox_launch` を別で起動してから,

1. `CSocket=try_bind_listen(CPort);`
2. `SSocket=try_bind_listen(SPort);`
3. `CSocket=try_accept(CSocket,CPort);`
4. `SSocket=try_accept(SSocket,SPort);`
5. `register_server(CSocket,CPort,SSocket,SPort);`

という順でつなぐ例が載っている.

今回の cluster 実装は, まさにこの流儀を Docker compose に移したものになっている.

### 4. `ox_launch_generic`

`ox_launch_generic(host, launcher, server, use_unix, use_ssh, use_x, conn_to_serv)` も読んだ.

特に重要だったのは `conn_to_serv` の説明で,

- `conn_to_serv = 1` なら client 側が `bind/listen`, 起動された process 側が `connect`
- `conn_to_serv = 0` なら逆

という接続方向の切り替えがある.

今回の最終実装では `ox_launch_generic()` 自体を直接使ってはいないが, 「Asir 側が listen して worker 側が connect する」という設計が妥当だと判断する時の材料になった.

### 5. `ox_asir`

`ox_asir` が Asir のほぼ全機能を OpenXM server として提供することも確認した.

これで worker 側は単なる shell script ではなく, 実体としては `ox_asir` を話す server だと理解できた.

### 6. `ox_pop_local`, `ox_get`, `ox_select`, `ox_push_cmd`

結果回収まわりはこの 4 つを重点的に読んだ.

manual には, `ox_pop_local()` は data が無ければ block するとあり, それを避けるために

1. `ox_push_cmd(number,258)` で `SM_popSerializedLocalObject` を送る
2. `ox_select()` で ready な process を調べる
3. `ox_get()` で ready なものだけ回収する

という組み合わせが説明されている.

これは cluster 実装でそのまま採用した.

つまり今回の回収ロジックは,

- 単純な `ox_pop_local()` の直列待ち

ではなく,

- `ox_push_cmd(258)` 済み worker を `ox_select()` で監視し
- ready 順に `ox_get()` で受け取る

形にしている.

この設計にした理由は, 公式 manual がまさにその使い方を推奨しているから.

## 実装方針

### master は listen 側

`cluster/run_example.sh` が生成する Asir script では, 各 worker に対して

- control port
- server port

を決めて, master 側で `try_bind_listen()` を呼ぶ.

そのあと worker から来る control / server の 2 本の接続を `try_accept()` し, `register_server()` で Asir process id に束ねる.

### worker は connect 側

worker 側は `cluster/scripts/worker-entrypoint.sh` で `ox_launch` helper を実行する.

ここでやっていることは,

- master がまだ listen していなければ retry
- listen が始まったら control / server 両方へ接続
- `ox_asir` をぶら下げる

という流れ.

この retry loop は manual にはそのままは書かれていないが, Docker compose では起動順と ready 状態が完全には一致しないので, 実運用上ほぼ必須だった.

### worker 数は動的生成

最初は 2 worker / 4 worker の固定 sample を置いていたが, 最終的には `cluster/run_example.sh N` で任意 worker 数に対応させた.

これに合わせて,

- `cluster/.generated/compose.cluster.generated.yml`
- `cluster/.generated/compose_cluster_example.generated.rr`

を実行時に生成するようにした.

固定 sample の `cluster/examples/compose_cluster_2workers.rr` と `cluster/examples/compose_cluster_4workers.rr` は, 参考用として残している.

## 実装して分かったこと

### 1. `asir ./file.rr` ではなく `load("...")$`

最初に少しハマったのがこれ.

Asir は `asir ./file.rr` のような引数実行ではなく, `load("...")$` で読む前提だった.

なので runner では stdin から

```asir
load("/workspace/cluster/.generated/compose_cluster_example.generated.rr")$
quit;
```

を流す形にしている.

### 2. `--build` を既定にしない方がよい

cluster 実行は `https://github.com/NAKANORyunosuke/Risa-Asir-container` を clone した作業ディレクトリ全体を `/workspace` に bind mount しているので, script や sample の修正だけなら image rebuild は不要.

そのため `cluster/run_example.sh` は, build なしを既定にして, 必要な時だけ `--build` を付ける仕様にした.

### 3. root に全部置くと分かりづらい

cluster 実装が一通り揃った段階で, root 直下に

- 単一コンテナ用 script
- cluster 用 script
- GHCR 用 script

が混ざってしまった.

そこで `single/`, `cluster/`, `ghcr/` に分け直した.

この整理で, 単一コンテナ用と cluster 用の入口が見分けやすくなった.

## 実行例

手元で cluster を起動する最短はこれ.

```bash
./cluster/run_example.sh 4
```

worker 数を 3 に変えてもそのまま動く.

```bash
./cluster/run_example.sh 3
```

実際, 3 worker で

- worker 接続完了
- `registered worker ids`
- `All results collected.`

まで通ることを確認した.

## まとめ

今回の cluster 版は, 「Risa/Asir が thread pool を持っているか」というより, OpenXM の client / server 通信を Docker compose 上で組み立てた実装になった.

設計の芯になったのは, manual にある次の 2 点だった.

- `register_server()` まで含めた低水準の接続確立手順
- `ox_select()` と `ox_get()` を使った非 block 回収手順

Asir の distributed computation は古いが, API の責務はかなり明確で, manual を素直に読むと実装方針も自然に決まった. 今回はそこを Docker 向けに置き換えた, という感触が強い.

## 参考文献

- Asir User's Manual, "OpenXM"  
  https://www.asir.org/manuals/html-eg/man_143.html
- Asir User's Manual, "Functions for distributed computation"  
  https://www.asir.org/manuals/html-eg/man_150.html
- Asir User's Manual, "`ox_launch_generic`"  
  https://www.asir.org/manuals/html-eg/man_152.html
- Asir User's Manual, "`generate_port`, `try_bind_listen`, `try_connect`, `try_accept`, `register_server`"  
  https://www.asir.org/manuals/html-eg/man_153.html
- Asir User's Manual, "`ox_asir`"  
  https://www.asir.org/manuals/html-eg/man_154.html
- Asir User's Manual, "`ox_pop_cmo`, `ox_pop_local`"  
  https://www.asir.org/manuals/html-eg/man_158.html
- Asir User's Manual, "`ox_push_cmd`, `ox_sync`"  
  https://www.asir.org/manuals/html-eg/man_159.html
- Asir User's Manual, "`ox_get`"  
  https://www.asir.org/manuals/html-eg/man_160.html
- Asir User's Manual, "`ox_select`"  
  https://www.asir.org/manuals/html-eg/man_162.html
- Asir User's Manual, Table of Contents  
  https://www.asir.org/manuals/html-eg/man_toc.html

<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで. </p>
<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>
