/* Pricing Desk 101 — shared runtime.
   C.* : math (N, black, bachelier, bs, gk, N2, solve, df, yearFrac),
         formatting, cashflow-leg diagrams (C.legs), line/payoff charts (C.chart),
         calculators (C.calc), tables (C.table) and the course navigation. */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ manifest */
  // p = part index into PARTS; types = the product-type labels the page covers.
  const PARTS = ['Start here', 'Cash products', 'Futures', 'Swaps', 'Credit', 'Mortgages',
    'Vanilla options', 'Exotics & volatility', 'Reference'];
  const PAGES = [
    { f: 'index.html', t: 'Course map', p: 0, types: [] },
    { f: 'toolkit.html', t: 'The pricing toolkit', p: 0, types: [] },
    { f: 'equity.html', t: 'Shares, preferreds & warrants', p: 1, types: ['Equity', 'PreferredStock', 'Warrant'] },
    { f: 'fx-forward.html', t: 'FX spot, forwards & NDFs', p: 1, types: ['FX', 'NDF'] },
    { f: 'bond.html', t: 'Bonds & bills', p: 1, types: ['Bond'] },
    { f: 'repo.html', t: 'Repo & reverse repo', p: 1, types: ['Repo', 'CollateralPool'] },
    { f: 'futures.html', t: 'Futures: the basics', p: 2, types: ['CommodityFuture', 'EquityIndexFuture', 'FXFuture', 'EquityFuture', 'DividendEquityIndexFuture'] },
    { f: 'commodity-swap-futures.html', t: 'Commodity swap & spread futures', p: 2, types: ['CommoditySwapFuture', 'CommoditySpreadFuture'] },
    { f: 'stir-futures.html', t: 'Short-rate & swap futures', p: 2, types: ['InterestFuture', 'InterestSwapFuture'] },
    { f: 'bond-futures.html', t: 'Bond futures', p: 2, types: ['BondFuture'] },
    { f: 'fra.html', t: 'Forward rate agreements', p: 3, types: ['FRA'] },
    { f: 'irs.html', t: 'Interest rate swaps & OIS', p: 3, types: ['Swap'] },
    { f: 'nds.html', t: 'Non-deliverable swaps', p: 3, types: ['NDS'] },
    { f: 'xccy.html', t: 'Cross-currency swaps', p: 3, types: ['CurrencySwap', 'MTMCurrencySwap', 'CurrencyNds'] },
    { f: 'asset-swap.html', t: 'Asset swaps', p: 3, types: ['AssetSwap'] },
    { f: 'trs.html', t: 'Total return & equity-linked swaps', p: 3, types: ['TRS', 'ELS'] },
    { f: 'inflation-swap.html', t: 'Zero-coupon inflation swaps', p: 3, types: ['InflationSwap'] },
    { f: 'cds.html', t: 'Credit default swaps', p: 4, types: ['CDS', 'RecoverySwap'] },
    { f: 'cds-index.html', t: 'CDS indices', p: 4, types: ['CDSIndex'] },
    { f: 'tranche.html', t: 'Index tranches', p: 4, types: ['CdsIndexTranche'] },
    { f: 'mbs.html', t: 'MBS, TBAs & CMOs', p: 5, types: ['Tba', 'Mbs'] },
    { f: 'options-intro.html', t: 'Options & Black-Scholes', p: 6, types: ['EquityIndexListedOption', 'EquityListedOption', 'EquityOption'] },
    { f: 'futures-options.html', t: 'Options on futures', p: 6, types: ['CommodityFutureListedOption', 'InterestFutureListedOption', 'EquityIndexFutureListedOption', 'BondFutureListedOption'] },
    { f: 'fx-options.html', t: 'FX vanilla options', p: 6, types: ['FXOption (Put/Call)'] },
    { f: 'capfloor.html', t: 'Caps & floors', p: 6, types: ['CapFloor'] },
    { f: 'swaption.html', t: 'Swaptions', p: 6, types: ['Swaption', 'NDSwaption'] },
    { f: 'cms-spread.html', t: 'CMS spread options', p: 6, types: ['SpreadCapFloor'] },
    { f: 'cds-option.html', t: 'CDS index options', p: 6, types: ['CdsOption'] },
    { f: 'lpi.html', t: 'LPI: capped & floored inflation', p: 6, types: ['InflationIndexSwap'] },
    { f: 'fx-digitals.html', t: 'FX digitals, touches & dual digitals', p: 7, types: ['FXOption (DualDigital/Touch/Barrier)'] },
    { f: 'fva.html', t: 'Forward volatility agreements', p: 7, types: ['FxFva'] },
    { f: 'var-vol-swaps.html', t: 'Variance & volatility swaps', p: 7, types: ['VolSwap', 'VarSwap'] },
    { f: 'correlation-swap.html', t: 'Correlation swaps', p: 7, types: ['CorrelationSwap'] },
    { f: 'structured.html', t: 'Structured products & other records', p: 7, types: ['StructuredProduct', 'Expense', 'SimpleFlow', 'PayToHold', 'CashPool', 'CapitalTransaction'] },
    { f: 'cheatsheet.html', t: 'Cheat sheet & glossary', p: 8, types: [] },
  ];

  /* ------------------------------------------------------------------ math */
  const SQ2PI = Math.sqrt(2 * Math.PI);
  function n(x) { return Math.exp(-0.5 * x * x) / SQ2PI; }
  // Normal CDF, |error| < 1e-14 (W. J. Cody rational approximation via erfc).
  function N(x) {
    // Hart (1968) double-precision algorithm, accurate to ~1e-15.
    const z = Math.abs(x);
    if (z > 37) return x > 0 ? 1 : 0;
    const e = Math.exp(-z * z / 2);
    let c;
    if (z < 7.07106781186547) {
      let num = 3.52624965998911e-02 * z + 0.700383064443688;
      num = num * z + 6.37396220353165; num = num * z + 33.912866078383;
      num = num * z + 112.079291497871; num = num * z + 221.213596169931; num = num * z + 220.206867912376;
      let den = 8.83883476483184e-02 * z + 1.75566716318264;
      den = den * z + 16.064177579207; den = den * z + 86.7807322029461; den = den * z + 296.564248779674;
      den = den * z + 637.333633378831; den = den * z + 793.826512519948; den = den * z + 440.413735824752;
      c = e * num / den;
    } else {
      const d = z + 1 / (z + 2 / (z + 3 / (z + 4 / (z + 0.65))));
      c = e / (d * 2.506628274631);
    }
    return x > 0 ? 1 - c : c;
  }
  function Ninv(p) { // Acklam's inverse normal, refined by one Newton step
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    let q, r, x;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    const e = N(x) - p; return x - e * SQ2PI * Math.exp(x * x / 2);
  }
  // Bivariate normal CDF P(X<a, Y<b) with correlation rho, by Gauss-Legendre integration
  // of n(x)·N((b-rho·x)/sqrt(1-rho²)) over x in (-inf, a]. Accurate to ~1e-9.
  const GL_X = [-0.9931285991850949, -0.9639719272779138, -0.9122344282513259, -0.8391169718222188, -0.7463319064601508, -0.636053680726515, -0.5108670019508271, -0.37370608871541955, -0.2277858511416451, -0.07652652113349734, 0.07652652113349734, 0.2277858511416451, 0.37370608871541955, 0.5108670019508271, 0.636053680726515, 0.7463319064601508, 0.8391169718222188, 0.9122344282513259, 0.9639719272779138, 0.9931285991850949];
  const GL_W = [0.017614007139152118, 0.04060142980038694, 0.06267204833410907, 0.08327674157670475, 0.10193011981724044, 0.11819453196151841, 0.13168863844917664, 0.14209610931838204, 0.14917298647260374, 0.15275338713072584, 0.15275338713072584, 0.14917298647260374, 0.14209610931838204, 0.13168863844917664, 0.11819453196151841, 0.10193011981724044, 0.08327674157670475, 0.06267204833410907, 0.04060142980038694, 0.017614007139152118];
  function N2(a, b, rho) {
    if (rho >= 0.999999) return N(Math.min(a, b));
    if (rho <= -0.999999) return Math.max(0, N(a) + N(b) - 1);
    const s = Math.sqrt(1 - rho * rho), lo = -9, hi = Math.min(a, 9);
    if (hi <= lo) return 0;
    let tot = 0; const pieces = 8, w = (hi - lo) / pieces;
    for (let k = 0; k < pieces; k++) {
      const m = lo + (k + 0.5) * w, h = w / 2;
      for (let i = 0; i < 20; i++) { const x = m + h * GL_X[i]; tot += h * GL_W[i] * n(x) * N((b - rho * x) / s); }
    }
    return tot;
  }

  // Black (1976) on a forward. vol lognormal (0.25 = 25%). Greeks per unit of forward;
  // vega per 1 vol point (0.01), theta per calendar day.
  function black(o) {
    const { F, K, T, vol, df = 1, call = true } = o;
    if (T <= 0 || vol <= 0) {
      const iv = Math.max(call ? F - K : K - F, 0);
      return { pv: df * iv, delta: df * (iv > 0 ? (call ? 1 : -1) : 0), gamma: 0, vega: 0, theta: 0, d1: NaN, d2: NaN };
    }
    const sT = vol * Math.sqrt(T), d1 = (Math.log(F / K) + 0.5 * sT * sT) / sT, d2 = d1 - sT;
    const pv = call ? df * (F * N(d1) - K * N(d2)) : df * (K * N(-d2) - F * N(-d1));
    return {
      pv, d1, d2,
      delta: call ? df * N(d1) : -df * N(-d1),
      gamma: df * n(d1) / (F * sT),
      vega: df * F * n(d1) * Math.sqrt(T) / 100,
      theta: -df * F * n(d1) * vol / (2 * Math.sqrt(T)) / 365,
    };
  }
  // Bachelier (normal) model. volN absolute (0.0090 = 90bp/yr for rates; price units otherwise).
  // vega per 1bp of normal vol (0.0001), theta per calendar day.
  function bachelier(o) {
    const { F, K, T, volN, df = 1, call = true } = o;
    if (T <= 0 || volN <= 0) {
      const iv = Math.max(call ? F - K : K - F, 0);
      return { pv: df * iv, delta: df * (iv > 0 ? (call ? 1 : -1) : 0), gamma: 0, vega: 0, theta: 0, d: NaN };
    }
    const sT = volN * Math.sqrt(T), d = (F - K) / sT;
    const pv = call ? df * ((F - K) * N(d) + sT * n(d)) : df * ((K - F) * N(-d) + sT * n(d));
    return {
      pv, d,
      delta: call ? df * N(d) : -df * N(-d),
      gamma: df * n(d) / sT,
      vega: df * Math.sqrt(T) * n(d) * 0.0001,
      theta: -df * volN * n(d) / (2 * Math.sqrt(T)) / 365,
    };
  }
  // Black-Scholes-Merton on spot with continuous rates r and dividend/foreign yield q.
  // delta per unit spot; vega per vol point; theta per calendar day; rho per 1% of r.
  function bs(o) {
    const { S, K, T, r = 0, q = 0, vol, call = true } = o;
    const df = Math.exp(-r * T), F = S * Math.exp((r - q) * T);
    if (T <= 0 || vol <= 0) {
      const iv = Math.max(call ? S - K : K - S, 0);
      return { pv: iv, delta: iv > 0 ? (call ? 1 : -1) : 0, gamma: 0, vega: 0, theta: 0, rho: 0, fwd: F, d1: NaN, d2: NaN };
    }
    const sT = vol * Math.sqrt(T), d1 = (Math.log(F / K) + 0.5 * sT * sT) / sT, d2 = d1 - sT;
    const dq = Math.exp(-q * T);
    const pv = call ? S * dq * N(d1) - K * df * N(d2) : K * df * N(-d2) - S * dq * N(-d1);
    const thetaY = call
      ? -S * dq * n(d1) * vol / (2 * Math.sqrt(T)) - r * K * df * N(d2) + q * S * dq * N(d1)
      : -S * dq * n(d1) * vol / (2 * Math.sqrt(T)) + r * K * df * N(-d2) - q * S * dq * N(-d1);
    return {
      pv, d1, d2, fwd: F,
      delta: call ? dq * N(d1) : -dq * N(-d1),
      gamma: dq * n(d1) / (S * sT),
      vega: S * dq * n(d1) * Math.sqrt(T) / 100,
      theta: thetaY / 365,
      rho: (call ? K * T * df * N(d2) : -K * T * df * N(-d2)) / 100,
    };
  }
  // Garman-Kohlhagen FX option: S = spot (domestic per 1 foreign), rd/rf continuous.
  function gk(o) { return bs({ S: o.S, K: o.K, T: o.T, r: o.rd, q: o.rf, vol: o.vol, call: o.call }); }

  // Discount factor from a rate. comp: 'cont' | 'simple' | number of periods per year (1, 2, 4, 12).
  function df(r, T, comp = 'cont') {
    if (comp === 'cont') return Math.exp(-r * T);
    if (comp === 'simple') return 1 / (1 + r * T);
    return Math.pow(1 + r / comp, -comp * T);
  }
  // Brent-free robust root finder: bisection + secant hybrid on [lo, hi].
  function solve(f, lo, hi, tol = 1e-12, maxIt = 200) {
    let flo = f(lo), fhi = f(hi);
    if (flo * fhi > 0) return NaN;
    for (let i = 0; i < maxIt; i++) {
      let mid = hi - fhi * (hi - lo) / (fhi - flo);
      if (!(mid > Math.min(lo, hi) && mid < Math.max(lo, hi))) mid = (lo + hi) / 2;
      const fm = f(mid);
      if (Math.abs(fm) < tol || Math.abs(hi - lo) < tol) return mid;
      if (flo * fm < 0) { hi = mid; fhi = fm; flo /= 2; } else { lo = mid; flo = fm; fhi /= 2; }
    }
    return (lo + hi) / 2;
  }
  // Central finite difference of fn(x) — for greeks a closed form doesn't give.
  function fd(fn, x, h) { return (fn(x + h) - fn(x - h)) / (2 * h); }

  // Dates: accept Date or 'YYYY-MM-DD'. All UTC.
  function toDate(d) { if (d instanceof Date) return d; const [y, m, dd] = String(d).split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)); }
  function iso(d) { return toDate(d).toISOString().slice(0, 10); }
  function addMonths(d, k) {
    const x = toDate(d), y = x.getUTCFullYear(), m = x.getUTCMonth() + k, day = x.getUTCDate();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  }
  function addDays(d, k) { return new Date(toDate(d).getTime() + k * 864e5); }
  function days(a, b) { return Math.round((toDate(b) - toDate(a)) / 864e5); }
  // Day-count year fraction. basis: 'ACT/360' | 'ACT/365F' | '30/360' | 'ACT/ACT' (simple ISDA approx).
  function yearFrac(a, b, basis = 'ACT/360') {
    const d1 = toDate(a), d2 = toDate(b);
    if (basis === 'ACT/360') return days(d1, d2) / 360;
    if (basis === 'ACT/365F') return days(d1, d2) / 365;
    if (basis === '30/360') {
      let D1 = d1.getUTCDate(), D2 = d2.getUTCDate();
      if (D1 === 31) D1 = 30; if (D2 === 31 && D1 === 30) D2 = 30;
      return ((d2.getUTCFullYear() - d1.getUTCFullYear()) * 360 + (d2.getUTCMonth() - d1.getUTCMonth()) * 30 + (D2 - D1)) / 360;
    }
    // ACT/ACT ISDA
    let t = 0, cur = d1;
    while (cur < d2) {
      const y = cur.getUTCFullYear(), yEnd = new Date(Date.UTC(y + 1, 0, 1)), end = d2 < yEnd ? d2 : yEnd;
      const dy = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365;
      t += days(cur, end) / dy; cur = end;
    }
    return t;
  }

  /* ------------------------------------------------------------------ formatting */
  function fmt(x, dp = 2) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
    const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    return (x < 0 && Number(s.replace(/,/g, '')) !== 0 ? '−' : '') + s;
  }
  const money = (x, dp = 0, ccy = '') => (ccy ? ccy + ' ' : '') + fmt(x, dp);
  const pct = (x, dp = 2) => fmt(x * 100, dp) + '%';
  const bp = (x, dp = 1) => fmt(x * 1e4, dp) + 'bp';
  const signed = (x, dp = 2) => (x > 0 ? '+' : '') + fmt(x, dp);

  /* ------------------------------------------------------------------ DOM helpers */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function $(t) { return typeof t === 'string' ? document.querySelector(t) : t; }
  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, attrs, html) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function niceTicks(lo, hi, count = 6) {
    if (lo === hi) { lo -= 1; hi += 1; }
    const span = hi - lo, raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= count) || 10 * mag;
    const out = [], start = Math.ceil(lo / step - 1e-9) * step;
    for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
    return out;
  }
  function autoFmt(ticks) {
    const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1;
    const dp = step >= 1 ? 0 : Math.min(6, Math.ceil(-Math.log10(step) + 1e-9));
    return v => fmt(v, dp);
  }

  /* ------------------------------------------------------------------ cashflow-leg diagram
     C.legs(target, {
       tMin: 0, tMax: 5, ticks: [..] (optional), tickFmt: t => label (optional),
       axisLabel: 'years from today',
       legs: [{ name, dir: +1 receive | -1 pay, style: 'fixed'|'float'|'notional'|'contingent',
                color: 'rec'|'pay'|'aqua' (optional; defaults to direction),
                flows: [{ t, a (size, >0), label (optional), tip (optional) }] }],
       events: [{ t, label }], height: per-side px (default 120), equal: true -> all arrows same height
     }) */
  function legs(target, spec) {
    const root = $(target); if (!root) return;
    root.innerHTML = '';
    const W = 760, pl = 74, pr = 28;
    const tMin = spec.tMin ?? 0, tMax = spec.tMax ?? Math.max(...spec.legs.flatMap(l => l.flows.map(f => f.t)));
    const all = spec.legs.flatMap(l => l.flows);
    const maxA = Math.max(1e-12, ...all.map(f => Math.abs(f.a ?? 1)));
    const hasUp = spec.legs.some(l => l.dir > 0 && l.flows.length), hasDn = spec.legs.some(l => l.dir < 0 && l.flows.length);
    const side = spec.height || 120, top = (spec.events && spec.events.length ? 26 : 10);
    const Hup = hasUp ? side : 18, Hdn = hasDn ? side : 18;
    const axisY = top + Hup, H = axisY + Hdn + 34;
    const x = t => pl + (t - tMin) / (tMax - tMin || 1) * (W - pl - pr);
    const wrap = h('div', { class: 'viz' }); root.appendChild(wrap);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': spec.aria || 'Cashflow diagram' }, wrap);
    // ticks
    let ticks = spec.ticks;
    if (!ticks) { ticks = niceTicks(tMin, tMax, Math.min(12, Math.max(4, Math.round(tMax - tMin)))); }
    const tf = spec.tickFmt || autoFmt(ticks);
    ticks.forEach(t => {
      if (t < tMin - 1e-9 || t > tMax + 1e-9) return;
      el('line', { x1: x(t), x2: x(t), y1: top, y2: axisY + Hdn, class: 'grid' }, svg);
      el('text', { x: x(t), y: H - 16, 'text-anchor': 'middle', class: 't-ax' }, svg, tf(t));
    });
    el('text', { x: W - pr, y: H - 2, 'text-anchor': 'end', class: 't-ax' }, svg, spec.axisLabel || 'years from today');
    (spec.events || []).forEach(e => {
      el('line', { x1: x(e.t), x2: x(e.t), y1: 16, y2: axisY + Hdn, class: 'ev' }, svg);
      el('text', { x: x(e.t), y: 12, 'text-anchor': e.t <= tMin ? 'start' : (e.t >= tMax ? 'end' : 'middle'), class: 't-ev' }, svg, e.label);
    });
    el('line', { x1: pl - 8, x2: W - pr + 6, y1: axisY, y2: axisY, class: 'axis' }, svg);
    // Side labels run vertically along the left edge so they never meet arrow labels at t = tMin.
    if (hasUp) el('text', { x: 0, y: 0, transform: `translate(14 ${top + Hup / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 't-side' }, svg, 'YOU RECEIVE');
    if (hasDn) el('text', { x: 0, y: 0, transform: `translate(14 ${axisY + Hdn / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 't-side' }, svg, 'YOU PAY');
    // arrows
    const sameDirCount = { 1: 0, '-1': 0 }, legIdx = spec.legs.map(l => sameDirCount[l.dir > 0 ? 1 : -1]++);
    spec.legs.forEach((leg, li) => {
      const dir = leg.dir > 0 ? 1 : -1, cls = leg.color || (dir > 0 ? 'rec' : 'pay');
      const nSame = sameDirCount[dir > 0 ? 1 : -1], off = (legIdx[li] - (nSame - 1) / 2) * 9;
      const room = (dir > 0 ? Hup : Hdn) - 22;
      leg.flows.forEach(fl => {
        const a = Math.abs(fl.a ?? 1), len = spec.equal ? room * 0.7 : Math.max(16, a / maxA * room);
        const cx = x(fl.t) + off, y0 = axisY, y1 = axisY - dir * len, hd = 7;
        const g = el('g', { class: cls }, svg);
        const st = leg.style || 'fixed', sw = st === 'notional' ? 4.5 : 2.5;
        const line = el('line', { x1: cx, x2: cx, y1: y0, y2: y1 + dir * hd, 'stroke-width': sw, 'stroke-linecap': 'butt' }, g);
        if (st === 'float') line.setAttribute('stroke-dasharray', '5 3');
        if (st === 'contingent') line.setAttribute('stroke-dasharray', '2 3');
        const head = el('polygon', { points: `${cx},${y1} ${cx - 5.5},${y1 + dir * hd} ${cx + 5.5},${y1 + dir * hd}`, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
        if (st === 'float' || st === 'contingent') head.setAttribute('class', 'hollow');
        el('title', {}, g, fl.tip || `${leg.name} · t = ${fmt(fl.t, 2)} · ${fl.label ?? fmt(fl.a ?? 0, 2)}`);
        el('rect', { x: cx - 8, y: Math.min(y0, y1) - 4, width: 16, height: Math.abs(y1 - y0) + 8, fill: 'transparent', stroke: 'none' }, g);
        if (fl.label !== undefined && fl.label !== '')
          el('text', { x: cx, y: dir > 0 ? y1 - 5 : y1 + 13, 'text-anchor': 'middle', class: 't-lab' }, svg, fl.label);
        if (st === 'contingent') el('text', { x: cx + 9, y: (y0 + y1) / 2 + 4, class: 't-lab' }, svg, '?');
      });
    });
    // legend
    const lg = h('div', { class: 'legend' });
    spec.legs.forEach(leg => {
      const dir = leg.dir > 0 ? 1 : -1, cls = leg.color || (dir > 0 ? 'rec' : 'pay'), st = leg.style || 'fixed';
      const dash = st === 'float' ? ' stroke-dasharray="5 3"' : st === 'contingent' ? ' stroke-dasharray="2 3"' : '';
      lg.appendChild(h('span', {}, `<svg viewBox="0 0 26 12" class="viz" aria-hidden="true"><line x1="1" x2="25" y1="6" y2="6" style="stroke:var(--${cls})" stroke-width="${st === 'notional' ? 4.5 : 2.5}"${dash}/></svg>${esc(leg.name)}`));
    });
    root.appendChild(lg);
  }

  /* ------------------------------------------------------------------ line / payoff chart
     C.chart(target, {
       x: [lo, hi], n: 240, xLabel, yLabel, xFmt, yFmt, height: 260, y: [lo, hi] (optional),
       series: [{ name, f: x => y } | { name, points: [[x, y], ...] }, color: 1|2|3|0, dashed: bool }],
       marks: [{ x, label }], hmarks: [{ y, label }]
     }) -> { update(spec) } */
  function chart(target, spec) {
    const root = $(target); if (!root) return null;
    function draw(sp) {
      root.innerHTML = '';
      const W = 760, Hh = sp.height || 260, pl = 64, pr = 18, pt = 14, pb = 42;
      const [x0, x1] = sp.x, nPts = sp.n || 240;
      const ser = sp.series.map((s, i) => {
        let pts = s.points;
        if (!pts) { pts = []; for (let k = 0; k <= nPts; k++) { const xv = x0 + (x1 - x0) * k / nPts; pts.push([xv, s.f(xv)]); } }
        return { ...s, pts: pts.filter(p => Number.isFinite(p[1])), color: s.color ?? (i + 1) };
      });
      let ys = ser.flatMap(s => s.pts.map(p => p[1]));
      (sp.hmarks || []).forEach(m => ys.push(m.y));
      let [y0, y1] = sp.y || [Math.min(...ys), Math.max(...ys)];
      if (!sp.y) { const pad = (y1 - y0) * 0.08 || Math.abs(y1) * 0.1 || 1; y0 -= pad; y1 += pad; if (sp.zero !== false && y0 > 0 && y0 < (y1 - y0) * 0.6) y0 = 0; }
      const X = v => pl + (v - x0) / (x1 - x0) * (W - pl - pr), Y = v => pt + (y1 - v) / (y1 - y0) * (Hh - pt - pb);
      const wrap = h('div', { class: 'viz' }); wrap.style.position = 'relative'; root.appendChild(wrap);
      const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': sp.aria || sp.yLabel || 'Chart' }, wrap);
      const yt = niceTicks(y0, y1, 5), xt = niceTicks(x0, x1, 7);
      const yf = sp.yFmt || autoFmt(yt), xf = sp.xFmt || autoFmt(xt);
      yt.forEach(v => { if (v < y0 || v > y1) return; el('line', { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), class: v === 0 ? 'zero' : 'grid' }, svg); el('text', { x: pl - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 't-ax' }, svg, yf(v)); });
      xt.forEach(v => { if (v < x0 || v > x1) return; el('text', { x: X(v), y: Hh - pb + 17, 'text-anchor': 'middle', class: 't-ax' }, svg, xf(v)); });
      el('line', { x1: pl, x2: W - pr, y1: Hh - pb, y2: Hh - pb, class: 'axis' }, svg);
      if (sp.xLabel) el('text', { x: W - pr, y: Hh - 4, 'text-anchor': 'end', class: 't-ax' }, svg, sp.xLabel);
      (sp.marks || []).filter(m => m.x >= Math.min(x0, x1) && m.x <= Math.max(x0, x1)).forEach(m => { el('line', { x1: X(m.x), x2: X(m.x), y1: pt, y2: Hh - pb, class: 'mark' }, svg); el('text', { x: X(m.x) + 4, y: pt + 10, class: 't-ev' }, svg, m.label || ''); });
      (sp.hmarks || []).filter(m => m.y >= y0 && m.y <= y1).forEach(m => { el('line', { x1: pl, x2: W - pr, y1: Y(m.y), y2: Y(m.y), class: 'mark' }, svg); el('text', { x: W - pr - 4, y: Y(m.y) - 5, 'text-anchor': 'end', class: 't-ev' }, svg, m.label || ''); });
      ser.forEach(s => {
        if (!s.pts.length) return;
        const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(Math.max(y0, Math.min(y1, p[1]))).toFixed(1)).join('');
        const pth = el('path', { d, class: `line s${s.color}` }, svg);
        if (s.dashed) pth.setAttribute('stroke-dasharray', '6 4');
      });
      // crosshair + tooltip
      const xh = el('line', { y1: pt, y2: Hh - pb, class: 'xh', visibility: 'hidden' }, svg);
      const dots = ser.map(s => el('circle', { r: 4.5, class: `dot f${s.color}`, visibility: 'hidden' }, svg));
      const tip = h('div', { class: 'tip' }); tip.hidden = true; wrap.appendChild(tip);
      const hit = el('rect', { x: pl, y: pt, width: W - pl - pr, height: Hh - pt - pb, fill: 'transparent' }, svg);
      const move = ev => {
        const r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * W;
        const xv = x0 + (Math.max(pl, Math.min(W - pr, sx)) - pl) / (W - pl - pr) * (x1 - x0);
        xh.setAttribute('x1', X(xv)); xh.setAttribute('x2', X(xv)); xh.setAttribute('visibility', 'visible');
        let html = `<div>${esc(sp.xLabel || 'x')}: <b>${xf(xv)}</b></div>`;
        ser.forEach((s, i) => {
          let best = s.pts[0]; for (const p of s.pts) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p;
          const yv = s.f ? s.f(xv) : best[1];
          if (Number.isFinite(yv) && yv >= y0 && yv <= y1) { dots[i].setAttribute('cx', X(s.f ? xv : best[0])); dots[i].setAttribute('cy', Y(yv)); dots[i].setAttribute('visibility', 'visible'); }
          else dots[i].setAttribute('visibility', 'hidden');
          html += `<div><span style="color:var(--${['muted', 'rec', 'pay', 'aqua'][s.color]})">●</span> ${esc(s.name)}: <b>${(sp.tipFmt || yf)(yv)}</b></div>`;
        });
        tip.innerHTML = html; tip.hidden = false;
        const px = (X(xv) / W) * r.width, tw = tip.offsetWidth;
        tip.style.left = Math.min(Math.max(4, px + 12), r.width - tw - 4) + 'px'; tip.style.top = '6px';
      };
      hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
      hit.addEventListener('pointerleave', () => { xh.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); tip.hidden = true; });
      if (sp.yLabel || ser.length > 1) {
        const lg = h('div', { class: 'legend' });
        if (sp.yLabel) lg.appendChild(h('span', { style: 'color:var(--muted)' }, 'y: ' + esc(sp.yLabel)));
        if (ser.length > 1) ser.forEach(s => lg.appendChild(h('span', {}, `<svg viewBox="0 0 26 12" class="viz" aria-hidden="true"><line x1="1" x2="25" y1="6" y2="6" style="stroke:var(--${['muted', 'rec', 'pay', 'aqua'][s.color]})" stroke-width="2.5"${s.dashed ? ' stroke-dasharray="6 4"' : ''}/></svg>${esc(s.name)}`)));
        root.appendChild(lg);
      }
    }
    draw(spec);
    return { update: draw };
  }

  /* ------------------------------------------------------------------ table */
  // C.table(target, { head: [...], rows: [[...]], num: [colIdx...] (right-aligned mono), foot: [...] })
  function table(target, spec) {
    const root = $(target); if (!root) return;
    const num = new Set(spec.num || []);
    const cell = (v, i, tag) => `<${tag}${num.has(i) ? ' class="num"' : ''}>${v}</${tag}>`;
    root.innerHTML = `<table><thead><tr>${spec.head.map((c, i) => cell(c, i, 'th')).join('')}</tr></thead><tbody>${spec.rows.map(r => `<tr>${r.map((c, i) => cell(c, i, 'td')).join('')}</tr>`).join('')}</tbody>${spec.foot ? `<tfoot><tr>${spec.foot.map((c, i) => cell(c, i, 'td')).join('')}</tr></tfoot>` : ''}</table>`;
  }

  /* ------------------------------------------------------------------ calculator
     C.calc(target, {
       title, tag: 'Calculator',
       inputs: [{ id, label, value, step, min, max, unit, options: [[value, label], ...] }],
       compute: v => ({
         out: [[label, valueString, highlight?], ...],
         chart: chartSpec?, legs: legsSpec?, table: { head, rows, num }?, note: html?
       })
     }) */
  function calc(target, spec) {
    const root = $(target); if (!root) return;
    const cid = root.id || ('calc' + Math.random().toString(36).slice(2, 7));
    root.innerHTML = '';
    const box = h('div', { class: 'calc' });
    box.appendChild(h('div', { class: 'calc-h' }, `<b>${spec.title || 'Calculator'}</b><span>${spec.tag || 'Live calculator'}</span>`));
    const body = h('div', { class: 'calc-b' });
    const form = h('form', { class: 'calc-in', autocomplete: 'off' });
    const out = h('div', { class: 'calc-out', 'aria-live': 'polite' });
    body.append(form, out); box.appendChild(body);
    const viz = h('div', { class: 'calc-viz' }), tbl = h('div', { class: 'calc-tbl' }), note = h('div', { class: 'calc-note' });
    box.append(viz, tbl, note); root.appendChild(box);
    spec.inputs.forEach(inp => {
      const id = `${cid}-${inp.id}`;
      const lab = h('label', { for: id }, `${inp.label}${inp.unit ? ` <span class="u">(${inp.unit})</span>` : ''}`);
      let ctl;
      if (inp.options) {
        ctl = h('select', { id, name: inp.id });
        inp.options.forEach(([val, txt]) => { const o = h('option', { value: val }, txt); if (String(val) === String(inp.value)) o.selected = true; ctl.appendChild(o); });
      } else {
        ctl = h('input', { id, name: inp.id, type: 'number', inputmode: 'decimal', value: inp.value, step: inp.step ?? 'any' });
        if (inp.min !== undefined) ctl.min = inp.min; if (inp.max !== undefined) ctl.max = inp.max;
      }
      lab.appendChild(ctl); form.appendChild(lab);
    });
    form.addEventListener('submit', e => e.preventDefault());
    let chartObj = null;
    function run() {
      const v = {};
      spec.inputs.forEach(inp => {
        const raw = form.elements[inp.id].value;
        const num = Number(raw);
        v[inp.id] = raw !== '' && Number.isFinite(num) ? num : raw;
      });
      let res;
      try { res = spec.compute(v) || {}; }
      catch (e) { out.innerHTML = `<p class="err">Can't price with these inputs: ${esc(e.message)}</p>`; return; }
      out.innerHTML = (res.out || []).map(([k, val, hi]) => `<div class="row${hi ? ' hi' : ''}"><span>${k}</span><b>${val}</b></div>`).join('');
      if (res.chart || res.legs) {
        if (res.legs) { viz.innerHTML = ''; const d = h('div'); viz.appendChild(d); legs(d, res.legs); chartObj = null; }
        if (res.chart) {
          if (!res.legs && chartObj && viz.firstChild) chartObj.update(res.chart);
          else { if (!res.legs) viz.innerHTML = ''; const d = h('div'); viz.appendChild(d); chartObj = chart(d, res.chart); }
        }
        if (res.legs && res.chart) chartObj = null;
      } else viz.innerHTML = '';
      if (res.table) { tbl.innerHTML = ''; table(tbl, res.table); } else tbl.innerHTML = '';
      note.innerHTML = res.note || '';
    }
    form.addEventListener('input', run); form.addEventListener('change', run);
    run();
  }

  /* ------------------------------------------------------------------ chrome */
  function chrome() {
    const cur = document.body.dataset.page || location.pathname.split('/').pop() || 'index.html';
    const toc = document.getElementById('toc');
    if (toc) {
      let num = 0;
      const parts = PARTS.map((name, pi) => {
        const items = PAGES.filter(p => p.p === pi).map(p => {
          const label = (p.f === 'index.html' || p.f === 'cheatsheet.html') ? '' : String(num++).padStart(2, '0');
          return `<li><a href="${p.f}"${p.f === cur ? ' aria-current="page"' : ''}><span class="n">${label}</span><span>${esc(p.t)}</span></a></li>`;
        }).join('');
        return `<div class="toc-part"><span>${esc(name)}</span><ol>${items}</ol></div>`;
      }).join('');
      toc.innerHTML = `<div class="toc-head"><a class="toc-brand" href="index.html">Pricing Desk 101<small>From cash to exotics</small></a><button class="toc-toggle" type="button" aria-expanded="false">All pages</button></div><nav class="toc-list" aria-label="Course pages">${parts}</nav>`;
      const btn = toc.querySelector('.toc-toggle');
      btn.addEventListener('click', () => { const o = toc.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    }
    const main = document.querySelector('main.page');
    const i = PAGES.findIndex(p => p.f === cur);
    if (main && i >= 0 && !main.querySelector('.pager')) {
      const prev = PAGES[i - 1], next = PAGES[i + 1];
      const pg = h('nav', { class: 'pager', 'aria-label': 'Previous and next page' });
      if (prev) pg.appendChild(h('a', { href: prev.f, class: 'prev' }, `<small>← Previous</small>${esc(prev.t)}`));
      if (next) pg.appendChild(h('a', { href: next.f, class: 'next' }, `<small>Next →</small>${esc(next.t)}`));
      main.appendChild(pg);
    }
    // Product-type chips in the header: <div class="ptypes" data-ptypes></div> is filled from the manifest.
    document.querySelectorAll('[data-ptypes]').forEach(box => {
      const pg = PAGES[i]; if (!pg) return;
      const eg = box.dataset.eg;
      box.innerHTML = `<span>Product types:</span>` + pg.types.map(t => `<span class="chip"><b>${esc(t)}</b></span>`).join('') + (eg ? `<span class="eg">e.g. ${esc(eg)}</span>` : '');
    });
  }

  // Capture script errors into the DOM so headless checks can see them.
  global.addEventListener('error', e => {
    const b = document.body; if (!b) return;
    let box = document.getElementById('__errors');
    if (!box) { box = document.createElement('pre'); box.id = '__errors'; box.hidden = true; b.appendChild(box); }
    box.textContent += `${e.message} @ ${e.filename}:${e.lineno}\n`;
  });

  global.C = { PAGES, PARTS, n, N, Ninv, N2, black, bachelier, bs, gk, df, solve, fd, toDate, iso, addMonths, addDays, days, yearFrac,
    fmt, money, pct, bp, signed, legs, chart, calc, table, esc };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chrome); else chrome();
})(window);
