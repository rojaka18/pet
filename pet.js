/* Hewan peliharaan layar + reminder duduk & sholat. Klik bookmarklet lagi = hilang. */
(() => {
  if (window.__aroPet) { window.__aroPet.destroy(); return; }

  const C = {
    sitMin: 45, idleMin: 5, snoozeMin: 10,          // reminder duduk
    before: 10,                                      // menit sebelum sholat
    lat: -6.2088, lon: 106.8456, tz: 7,              // Jakarta
    fajrAngle: 20, ishaAngle: 18, ihtiyat: 2,        // Kemenag RI
    animals: ['🐱', '🐶', '🐹', '🐰', '🦊'],
    sound: false,
  };
  let animal = C.animals[0];
  const S = 52;

  /* START_PRAYER */
  const rad = Math.PI / 180, sin = a => Math.sin(a * rad), cos = a => Math.cos(a * rad),
    tan = a => Math.tan(a * rad), acos = x => Math.acos(x) / rad,
    atan2 = (a, b) => Math.atan2(a, b) / rad, fix = (a, b) => a - b * Math.floor(a / b);
  function prayer(y, m, d) {
    const D = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5 - 2451545;
    const g = fix(357.529 + .98560028 * D, 360), q = fix(280.459 + .98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + .02 * sin(2 * g), 360), e = 23.439 - 3.6e-7 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)), 360) / 15;
    const eqt = fix(q / 15 - RA + 12, 24) - 12;
    const decl = Math.asin(sin(e) * sin(L)) / rad;
    const noon = 12 + C.tz - C.lon / 15 - eqt;
    const ang = a => acos((-sin(a) - sin(decl) * sin(C.lat)) / (cos(decl) * cos(C.lat))) / 15;
    const asrA = Math.atan(1 / (1 + tan(Math.abs(C.lat - decl)))) / rad;
    const ih = C.ihtiyat / 60;
    const h = {
      Subuh: noon - ang(C.fajrAngle), Dzuhur: noon, Ashar: noon + ang(-asrA),
      Maghrib: noon + ang(.833), Isya: noon + ang(C.ishaAngle),
    };
    const out = {};
    for (const k in h) out[k] = new Date(Date.UTC(y, m - 1, d) + (h[k] + ih - C.tz) * 36e5);
    return out;
  }
  /* END_PRAYER */

  const ymd = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date()).split('-').map(Number);
  const hhmm = d => d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });

  /* ---------- elemen ---------- */
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;width:' + S + 'px;height:' + S + 'px;font:44px/' + S + 'px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif;text-align:center';
  const face = document.createElement('div');
  face.textContent = animal;
  const bub = document.createElement('div');
  bub.style.cssText = 'position:absolute;background:#fff;color:#222;font:13px/1.4 system-ui,sans-serif;padding:6px 10px;border-radius:10px;box-shadow:0 2px 10px #0004;display:none;cursor:default;text-align:center;white-space:pre-line;width:max-content;max-width:260px;line-height:1.4';
  bub.addEventListener('pointerdown', e => e.stopPropagation());
  el.append(face, bub);
  document.documentElement.appendChild(el);

  /* ---------- state ---------- */
  let W = innerWidth, H = innerHeight;
  let x = W / 3, y = H - S, vx = 0, vy = 0, dir = 1, mode = 'idle', timer = 1, bounce = 0;
  let hold = false, bt, ht, clicks = [], angryUntil = 0, last = 0, raf;
  let lastAct = Date.now(), active = 0;
  const fired = {};

  const setMode = (m, t) => { if (mode === 'sleep' && m !== 'sleep' && !hold) hide(); mode = m; timer = t; };
  const hide = () => { bub.style.display = 'none'; clearTimeout(bt); };

  function place() {
    const up = y > 120;
    bub.style.top = up ? 'auto' : '100%';
    bub.style.bottom = up ? '100%' : 'auto';
    bub.style.margin = up ? '0 0 4px' : '4px 0 0';
    if (x < 140) { bub.style.left = '0'; bub.style.right = 'auto'; bub.style.transform = 'none'; }
    else if (x > W - 160) { bub.style.right = '0'; bub.style.left = 'auto'; bub.style.transform = 'none'; }
    else { bub.style.left = '50%'; bub.style.right = 'auto'; bub.style.transform = 'translateX(-50%)'; }
  }
  function card(text, btns, ms) {
    bub.textContent = '';
    const t = document.createElement('div'); t.textContent = text; bub.appendChild(t);
    if (btns) {
      const r = document.createElement('div');
      r.style.cssText = 'margin-top:6px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap';
      btns.forEach(([l, f]) => {
        const b = document.createElement('button'); b.textContent = l;
        b.style.cssText = 'border:0;border-radius:6px;padding:3px 8px;background:#2563eb;color:#fff;font:12px system-ui;cursor:pointer';
        b.onclick = e => { e.stopPropagation(); f(); };
        r.appendChild(b);
      });
      bub.appendChild(r);
    }
    place(); bub.style.display = 'block'; clearTimeout(bt); if (ms) bt = setTimeout(hide, ms);
  }
  const say = (t, ms) => { if (!hold) card(t, null, ms); };
  function release() { hold = false; hide(); vx = 0; vy = 0; bounce = 0; setMode('air', 0); }

  function beep() {
    if (!C.sound) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination); o.frequency.value = 660;
      g.gain.setValueAtTime(.15, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .6);
      o.start(); o.stop(a.currentTime + .6);
    } catch (e) {}
  }
  function notify(text, btns) {
    hold = true; setMode('idle', 0);
    x = W / 2 - S / 2; y = H / 2 - S / 2; vx = vy = 0;
    card(text, btns.map(([l, f]) => [l, () => { f(); release(); }]));
    beep();
  }

  /* ---------- perilaku ---------- */
  function jump() { vy = -650; vx = dir * 120; bounce = 0; setMode('air', 0); }
  function next() {
    const r = Math.random();
    if (r < .5) { dir = Math.random() < .5 ? -1 : 1; setMode('walk', 2 + Math.random() * 4); }
    else if (r < .75) setMode('idle', 2 + Math.random() * 3);
    else if (r < .9) { setMode('sleep', 6 + Math.random() * 8); say('💤'); }
    else jump();
  }
  function tick(t) {
    const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    if (mode === 'air') {
      vy += 1800 * dt; x += vx * dt; y += vy * dt;
      if (x < 0) { x = 0; vx = Math.abs(vx) * .6; }
      if (x > W - S) { x = W - S; vx = -Math.abs(vx) * .6; }
      if (y < 0) { y = 0; vy = Math.abs(vy) * .5; }
      if (y >= H - S) {
        y = H - S;
        if (bounce && Math.abs(vy) > 150) { vy = -vy * bounce; vx *= .8; }
        else { vy = 0; vx = 0; setMode('idle', 1 + Math.random() * 2); }
      }
    } else if (mode !== 'drag') {
      timer -= dt;
      if (mode === 'walk' && !hold) {
        x += dir * 55 * dt;
        if (x < 0) { x = 0; dir = 1; } if (x > W - S) { x = W - S; dir = -1; }
      }
      if (timer <= 0 && !hold) next();
    }
    const angry = Date.now() < angryUntil;
    const f = angry ? ({ '🐱': '😾' }[animal] || '😤') : animal;
    if (face.textContent !== f) face.textContent = f;
    const bob = mode === 'walk' ? Math.sin(t / 110) * 3 : 0, sh = angry ? Math.sin(t / 30) * 3 : 0;
    face.style.transform = `translate(${sh}px,${bob}px) scaleX(${dir > 0 ? -1 : 1})`;
    el.style.transform = `translate(${x}px,${y}px)`;
    raf = requestAnimationFrame(tick);
  }

  /* ---------- interaksi ---------- */
  let dn = null, hist = [];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  el.addEventListener('pointerdown', e => {
    if (e.button) return;
    el.setPointerCapture(e.pointerId);
    dn = { ox: e.clientX - x, oy: e.clientY - y, sx: e.clientX, sy: e.clientY, moved: false };
    hist = []; el.style.cursor = 'grabbing';
  });
  el.addEventListener('pointermove', e => {
    if (!dn) return;
    if (!dn.moved && Math.hypot(e.clientX - dn.sx, e.clientY - dn.sy) > 5) { dn.moved = true; mode = 'drag'; clearTimeout(ht); }
    if (dn.moved) {
      x = clamp(e.clientX - dn.ox, 0, W - S); y = clamp(e.clientY - dn.oy, 0, H - S);
      const n = performance.now(); hist.push([n, x, y]); hist = hist.filter(h => n - h[0] < 100);
    }
  });
  el.addEventListener('pointerup', () => {
    if (!dn) return;
    const d = dn; dn = null; el.style.cursor = 'grab';
    if (d.moved) {
      if (hist.length > 1) {
        const a = hist[0], b = hist[hist.length - 1], s = (b[0] - a[0]) / 1000 || 1;
        vx = clamp((b[1] - a[1]) / s, -2500, 2500); vy = clamp((b[2] - a[2]) / s, -2500, 2500);
      } else { vx = vy = 0; }
      bounce = .55; mode = 'air';
      if (Math.hypot(vx, vy) > 800) say('Wuaaa! 😵', 1200);
    } else if (!hold) {
      const n = Date.now(); clicks = clicks.filter(c => n - c < 3000); clicks.push(n);
      if (clicks.length >= 5) { clicks = []; angryUntil = n + 3000; say('💢 Ih, ngambek ah!', 2500); setMode('idle', 3); }
      else { say('!', 600); jump(); }
    }
  });
  el.addEventListener('mouseenter', () => { ht = setTimeout(() => { if (mode !== 'drag') say('❤️', 1500); }, 1200); });
  el.addEventListener('mouseleave', () => clearTimeout(ht));
  el.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); menu(); });

  function schedule() {
    const [y0, m0, d0] = ymd(), T = prayer(y0, m0, d0);
    const jum = new Date(Date.UTC(y0, m0 - 1, d0)).getUTCDay() === 5 ? ' (Jumat)' : '';
    card('Jadwal sholat hari ini (perkiraan)\n' + Object.keys(T).map(k => k + (k === 'Dzuhur' ? jum : '') + '  ' + hhmm(T[k])).join('\n'), [['Tutup', release]]);
  }
  function menu() {
    hold = true; setMode('idle', 0);
    card('Menu', [
      ['🔄 Ganti', () => { animal = C.animals[(C.animals.indexOf(animal) + 1) % C.animals.length]; }],
      ['🔊 Suara', () => { C.sound = !C.sound; say2(C.sound ? 'Suara ON' : 'Suara OFF'); beep(); }],
      ['🕌 Jadwal', schedule],
      ['🔔 Tes', () => notify('Tes reminder ✅', [['Oke', () => {}]])],
      ['❌ Hilangkan', () => destroy()],
      ['Tutup', release],
    ]);
  }
  const say2 = t => { card(t, [['Tutup', release]]); };

  /* ---------- reminder ---------- */
  const acts = ['mousemove', 'keydown', 'scroll', 'pointerdown', 'wheel'];
  const act = () => { lastAct = Date.now(); };
  acts.forEach(a => addEventListener(a, act, true));

  function checkPrayer(n) {
    const [y0, m0, d0] = ymd(), T = prayer(y0, m0, d0), id = '' + y0 + m0 + d0;
    const jum = new Date(Date.UTC(y0, m0 - 1, d0)).getUTCDay() === 5;
    for (const k in T) {
      const t = T[k].getTime(), kb = id + k + 'b', ka = id + k + 'a';
      const name = k === 'Dzuhur' && jum ? 'Dzuhur (Jumatan)' : k;
      if (n >= t && n < t + 3e5 && !fired[ka]) {
        if (hold) return; fired[ka] = fired[kb] = 1;
        notify(`🕌 Waktu ${name} sudah masuk (${hhmm(T[k])}). Yuk sholat 🤲`, [['Oke', () => {}]]);
      } else if (n >= t - C.before * 6e4 && n < t && !fired[kb]) {
        if (hold) return; fired[kb] = 1;
        notify(`🕌 ${name} ${C.before} menit lagi (${hhmm(T[k])}). Siap-siap wudhu.`, [['Oke', () => {}]]);
      }
    }
  }
  const iv = setInterval(() => {
    const n = Date.now();
    if (n - lastAct < C.idleMin * 6e4) active += 10; else active = 0;
    if (active >= C.sitMin * 60 && !hold) {
      active = 0;
      notify(`Sudah ±${C.sitMin} menit duduk. Berdiri dulu, regangkan badan 🧘`, [
        ['Oke', () => {}],
        [`Tunda ${C.snoozeMin} menit`, () => { active = (C.sitMin - C.snoozeMin) * 60; }],
      ]);
    }
    checkPrayer(n);
  }, 1e4);

  /* ---------- lifecycle ---------- */
  const rs = () => { W = innerWidth; H = innerHeight; x = clamp(x, 0, W - S); y = clamp(y, 0, H - S); };
  addEventListener('resize', rs);
  function destroy() {
    cancelAnimationFrame(raf); clearInterval(iv); clearTimeout(bt); clearTimeout(ht);
    acts.forEach(a => removeEventListener(a, act, true)); removeEventListener('resize', rs);
    el.remove(); delete window.__aroPet;
  }
  window.__aroPet = { destroy };
  raf = requestAnimationFrame(tick);
})();
