---
layout: post
title_ja: Borwein cubic AGMの数値実験
description: "Borwein cubic AGMの数値計算"
categories: [programming, mathematics]
tags: [Borwein cubic, Julia]
lang: ja
---

## 導入
J. M. Borwein, P. B. Borwein(1991)[^Bor91]で導入された2種2項平均

$$
    \begin{aligned}
        a_{n+1} &= \frac{a_n+2b_n}{3},& b_{n+1} &= \sqrt[3]{b_n \frac{a_n^2+a_nb_n+b_n^2}{3}} &&(0<b <a,\quad a_0 = a,\quad b_0=b )
    \end{aligned}
$$

は共通の極限 $\mathrm{AG}_3(a,b)$ に収束し, Gaussの超幾何級数 $F\left(\frac13,\frac23,1;x\right)$ を用いて表示される:

$$
    \dfrac{a_0}{\mathrm{AG}_3(a_0,b_0)} = F\left(\frac13,\frac23,1;1-\frac{b_0^3}{a_0^3}\right) 
$$

更に, Jacobiの周期公式の類似として, $A_2$-格子上のテータ定数

$$
    \begin{aligned}
        \theta_0(\tau) &= \sum_{\mu \in \mathbb{Z}[\omega]} q^{N(\mu)} = \sum_{m,n\in \mathbb{Z}} \left(e^{2\pi i \tau/3} \right)^{m^2-mn+n^2},\\
        \theta_1(\tau) &= \sum_{\mu \in \mathbb{Z}[\omega]} e^{2\pi i (m+n)/3}q^{N(\mu)} = \sum_{m,n\in \mathbb{Z}} e^{2\pi i (m+n)/3} \left(e^{2\pi i \tau/3} \right)^{m^2-mn+n^2},\\
        q &= e^{2\pi i \tau /3}, \quad N(\mu) = \mu \bar{\mu},
    \end{aligned}
$$

と超幾何級数の間の関係式も与えられている: $s = \dfrac{\theta_1(\tau)}{\theta_0(\tau)}$ に対して

$$
    F\left(\frac13,\frac23,1;1-s^3\right) = \theta_0(\tau)
$$

が成立.

## 周期 $\tau$ と周期写像の逆写像 $1-s^3$ との対応
J. M. Borwein, P. B. Borwein(1991)[^Bor91]では明記されてないが, 小池･志賀(2007)[^KS07]のTheorem 3.1においてどのように初期値 $a_0,b_0$ に対して周期 $\tau$ が定まるかを明記している:

$$
    \tau = \sqrt{3}i \left. F\left(\frac13 ,\frac23 ,1;\frac{b_0^3}{a_0^3}\right)\middle/ F\left(\frac13 ,\frac23 ,1;1-\frac{b_0^3}{a_0^3}\right)\right.
$$

## コード
```python
function theta01(tau::Complex; prec::Integer=256, tol::Real=1e-50)
    return setprecision(prec) do
        tau_big = Complex{BigFloat}(big(real(tau)), big(imag(tau)))
        imtau   = imag(tau_big)
        imtau <= 0 && throw(ArgumentError("Im(tau) must be > 0."))

        pi_big   = big(pi)
        two_pi   = 2 * pi_big
        tol_big  = BigFloat(tol)
        Ibig     = Complex{BigFloat}(0, 1)

        q_exponent_factor = (two_pi / 3) * Ibig * tau_big
        phase_exponent_factor = (two_pi / 3) * Ibig

        lambda_min = BigFloat(0.5)
        C = two_pi * imtau * lambda_min / 3   # = 2π Im(τ)/(6)

        R = 0
        Rmax = 0
        while true
            R += 1
            RR = BigFloat(R * R)
            bound = 8 * BigFloat(R) * exp(-C * RR)
            if bound < tol_big
                Rmax = R
                break
            end
        end

        theta0 = Complex{BigFloat}(0)
        theta1 = Complex{BigFloat}(0)

        for m in -Rmax:Rmax
            mb = BigFloat(m)
            for n in -Rmax:Rmax
                nb = BigFloat(n)

                Nmn = mb*mb - mb*nb + nb*nb

                qpow = exp(q_exponent_factor * Nmn)

                theta0 += qpow

                phase = exp(phase_exponent_factor * (mb + nb))
                theta1 += phase * qpow
            end
        end

        return theta0, theta1
    end
end
```

<p class="lang-ja">議論やフィードバックは <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a> まで. </p>

[^Bor91]: J. M. Borwein and P. B. Borwein, A cubic counterpart of Jacobi’s identity and the AGM, Trans. Amer. Math. Soc. 323(2) (1991) 691–701.
[^KS07]: K. Koike and H. Shiga, Isogeny formulas for the Picard modular form and a three terms arithmetic geometric mean, J. Number Theory 124(1) (2007) 123–141.

<p class="lang-en">Feedback and discussion: <a href="mailto:nakano.ryunosuke.i3[at]elms.hokudai.ac.jp">nakano.ryunosuke.i3[at]elms.hokudai.ac.jp</a>.</p>
