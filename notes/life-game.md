---
layout: default
title: ライフゲーム
description: "Conway's Game of Life."
lang: ja
---

# <span class="lang-ja">ライフゲーム</span><span class="lang-en">Game of Life</span>

<button id="start-life-game" type="button" onclick="start()">平面</button>
<button id="start-life-game" type="button" onclick="start({isTorus:true})">トーラス</button>
<button onclick="pause()">Pause</button>
<button onclick="resume()">Resume</button>
<button onclick="stop()">Stop</button>
<canvas id="life-game-box"></canvas>
<style src="../assets/main.css"></style>
<script src="../assets/js/life-game.js"></script>



<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで。</p>
<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>
