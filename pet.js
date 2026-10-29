/* Pet layar v3. Klik bookmarklet lagi = hilang. */
(() => {
  if (window.__aroPet) { window.__aroPet.destroy(); return; }
  const doc = document, root = doc.documentElement;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FONT = 'system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif';
  const TOP = 2147483647;

  /* ---------- konfigurasi ---------- */
  const CITIES = {
    Jakarta: [-6.2088, 106.8456, 7], Bandung: [-6.9175, 107.6191, 7], Semarang: [-6.9667, 110.4167, 7],
    Yogyakarta: [-7.7956, 110.3695, 7], Surabaya: [-7.2575, 112.7521, 7], Banyuwangi: [-8.2192, 114.3691, 7],
    Medan: [3.5952, 98.6722, 7], Palembang: [-2.9761, 104.7754, 7], Makassar: [-5.1477, 119.4327, 8], Denpasar: [-8.65, 115.2167, 8],
  };
  const ANIMALS = ['🐱', '🐶', '🐹', '🐰', '🦊', '🐸', '🐧', '🐼'];
  const HATS = {
    '': 'Tanpa', '🎀': '🎀 Pita', '🧢': '🧢 Baseball', '🎓': '🎓 Toga', '🎩': '🎩 Topi', '👑': '👑 Mahkota',
    '🌙': '🌙 Bulan', '🇮🇩': '🇮🇩 Merah Putih', '🎃': '🎃 Halloween', '🎆': '🎆 Tahun Baru',
  };
  const HAT_LV = { '🎀': 1, '🧢': 2, '🎓': 3, '🎩': 4, '👑': 5 };
  const DEF = {
    name: 'Mimi', owner: 'Aro', animal: '🐱', hat: '', buddy: '', size: 52, sound: false,
    sitMin: 45, waterMin: 90, eyeMin: 20, idleMin: 5, snoozeMin: 10,
    city: 'Jakarta', before: 10, endTime: '17:00', sysIdle: false, desk: false, eye: '#22d3ee',
    quietFrom: '', quietTo: '', eco: true,
  };
  const C = Object.assign({}, DEF);
  try { Object.assign(C, JSON.parse(localStorage.getItem('aroPet.cfg') || '{}')); } catch (e) {}
  const saveC = () => { try { localStorage.setItem('aroPet.cfg', JSON.stringify(C)); } catch (e) {} };

  const st = { date: '', water: 0, kicks: 0, fed: 0, best: 0, greet: {}, hunger: 30, happy: 70, t: Date.now(), xp: 0, ach: {}, seen: {}, dndUntil: 0 };
  try { Object.assign(st, JSON.parse(localStorage.getItem('aroPet.st') || '{}')); } catch (e) {}
  const saveS = () => { st.t = Date.now(); try { localStorage.setItem('aroPet.st', JSON.stringify(st)); } catch (e) {} };
  { const s = Math.min(8 * 3600, Math.max(0, (Date.now() - st.t) / 1000));
    st.hunger = clamp(st.hunger + s * .0093, 0, 100); st.happy = clamp(st.happy - s * .01, 0, 100); }
  st.g = Object.assign({ rps: [0, 0, 0], ttt: [0, 0, 0], reflex: 0, gaze: 0, mem: 0, whack: 0, catch: 0 }, st.g || {});
  st.tot = Object.assign({ click: 0, kick: 0, fed: 0, purr: 0, guide: 0, win: 0, water: 0, trick: 0, bestCombo: 0 }, st.tot || {});
  const lvl = () => Math.floor(Math.sqrt(st.xp / 20)) + 1, lvXp = L => 20 * (L - 1) * (L - 1);

  /* ---------- waktu sholat ---------- */
  const rad = Math.PI / 180, sin = a => Math.sin(a * rad), cos = a => Math.cos(a * rad),
    tan = a => Math.tan(a * rad), acos = x => Math.acos(x) / rad,
    atan2 = (a, b) => Math.atan2(a, b) / rad, fix = (a, b) => a - b * Math.floor(a / b);
  function prayer(y, m, d, lat, lon, tz) {
    const D = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5 - 2451545;
    const g = fix(357.529 + .98560028 * D, 360), q = fix(280.459 + .98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + .02 * sin(2 * g), 360), e = 23.439 - 3.6e-7 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)), 360) / 15;
    const eqt = fix(q / 15 - RA + 12, 24) - 12;
    const decl = Math.asin(sin(e) * sin(L)) / rad;
    const noon = 12 + tz - lon / 15 - eqt;
    const ang = a => acos((-sin(a) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    const asrA = Math.atan(1 / (1 + tan(Math.abs(lat - decl)))) / rad;
    const h = { Subuh: noon - ang(20), Dzuhur: noon, Ashar: noon + ang(-asrA), Maghrib: noon + ang(.833), Isya: noon + ang(18) };
    const out = {};
    for (const k in h) out[k] = new Date(Date.UTC(y, m - 1, d) + (h[k] + 2 / 60 - tz) * 36e5);
    return out;
  }
  const loc = () => CITIES[C.city] || CITIES.Jakarta;
  const tzName = () => loc()[2] === 8 ? 'Asia/Makassar' : 'Asia/Jakarta';
  const ymd = () => new Intl.DateTimeFormat('en-CA', { timeZone: tzName(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number);
  const hhmm = d => d.toLocaleTimeString('en-GB', { timeZone: tzName(), hour: '2-digit', minute: '2-digit' });
  const dayTimes = (y, m, d) => { const l = loc(); return prayer(y, m, d, l[0], l[1], l[2]); };
  const nowMin = () => { const p = new Intl.DateTimeFormat('en-GB', { timeZone: tzName(), hourCycle: 'h23', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date()); return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value; };
  const isWeekday = () => { const [y, m, d] = ymd(), w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return w > 0 && w < 6; };
  function nextPrayer(n) {
    const [y, m, d] = ymd();
    for (let i = 0; i < 2; i++) { const T = dayTimes(y, m, d + i); for (const k in T) if (T[k].getTime() > n) return [k, T[k]]; }
  }
  const hm = s => /^\d\d:\d\d$/.test(s || '') ? +s.slice(0, 2) * 60 + +s.slice(3) : -1;

  /* ---------- elemen ---------- */
  const baseS = () => clamp(+C.size || 52, 36, 96) * (C.desk ? 1.6 : 1);
  let S = baseS(), animal = C.animal;
  const el = doc.createElement('div');
  const face = doc.createElement('div'), acc = doc.createElement('div'), badge = doc.createElement('div'), bub = doc.createElement('div');
  el.style.cssText = `position:fixed;left:0;top:0;z-index:${TOP};user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;text-align:center`;
  acc.style.cssText = 'position:absolute;left:0;right:0;pointer-events:none;line-height:1';
  badge.style.cssText = 'position:absolute;right:-8px;top:-6px;pointer-events:none;line-height:1';
  bub.style.cssText = `position:absolute;background:#fff;color:#222;font:13px/1.4 ${FONT};padding:6px 10px;border-radius:10px;box-shadow:0 2px 10px #0004;display:none;cursor:default;text-align:center;white-space:pre-line;width:max-content;max-width:min(260px,calc(100vw - 24px));max-height:calc(100vh - 16px);overflow:auto;box-sizing:border-box`;
  bub.addEventListener('pointerdown', e => e.stopPropagation());
  el.append(face, acc, badge, bub);
  root.appendChild(el);
  function applySize() {
    el.style.width = el.style.height = S + 'px';
    el.style.font = `${Math.round(S * .85)}px/${S}px ${FONT}`;
    acc.style.top = -Math.round(S * (C.desk ? .1 : .3)) + 'px'; acc.style.fontSize = Math.round(S * (C.desk ? .3 : .45)) + 'px';
    badge.style.fontSize = Math.round(S * .3) + 'px';
    if (C.desk) { face.textContent = ''; face.appendChild(cv); cv.width = cv.height = Math.round(S * 2); cv.style.width = cv.style.height = S + 'px'; }
    else face.textContent = animal;
    acc.textContent = C.hat;
  }

  const panel = doc.createElement('div');
  panel.style.cssText = `position:fixed;right:12px;top:12px;width:min(290px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;background:#fff;color:#222;border-radius:12px;box-shadow:0 4px 24px #0006;padding:12px;font:13px/1.4 ${FONT};z-index:${TOP};display:none`;
  panel.addEventListener('pointerdown', e => e.stopPropagation());
  root.appendChild(panel);

  /* ---------- state ---------- */
  let W = innerWidth, H = innerHeight;
  let x = W / 3, y = H - S, vx = 0, vy = 0, dir = 1, mode = 'idle', timer = 1, bounce = 0;
  let hold = false, bt, ht, angryUntil = 0, last = 0, raf, tok = 0;
  let combo = 0, lastClick = 0, lastXp = 0;
  let lastAct = Date.now(), lastR = Date.now(), lastHungry = 0, nextChat = Date.now() + rnd(25, 40) * 6e4, lastSave = 0;
  const A = { sit: 0, eye: 0, water: 0 };
  const fired = {};
  let item = null, bud = null, wx = null, pomo = null, sysIdle = null, idleAbort = null;
  let dnd = false, night = false, guide = null, breathK = 1, trick = null, peek = null;
  let strokeAmt = 0, purrUntil = 0, lastHeart = 0;
  const missed = [], toasts = [];
  /* desk buddy */
  const cv = doc.createElement('canvas'); cv.style.cssText = 'display:block;pointer-events:none';
  const BASE = { w: .17, h: .26, r: .085, lid: 0, tilt: 0, arc: 0, arcR: 0, heart: 0, spiral: 0 };
  const ex = o => Object.assign({}, BASE, o);
  const EXPR = {
    normal: ex({}), happy: ex({ arc: 1 }), wink: ex({ arcR: 1 }), sleepy: ex({ h: .07, r: .035 }), drowsy: ex({ h: .15, r: .06 }),
    angry: ex({ h: .22, r: .05, lid: .55, tilt: 1, col: '#f87171' }), sad: ex({ h: .22, lid: .5, tilt: -1, col: '#60a5fa' }),
    surprised: ex({ w: .21, h: .31, r: .105, col: '#fde047' }), go: ex({ w: .21, h: .31, r: .105, col: '#4ade80' }),
    love: ex({ heart: 1, col: '#f472b6' }), dizzy: ex({ spiral: 1, col: '#c4b5fd' }),
  };
  const cur = Object.assign({}, BASE), gz = { x: 0, y: 0 }, wand = { x: 0, y: 0 };
  let eyeCol = '#22d3ee', emoName = 'normal', emoUntil = 0, gazeForce = null, mx = 0, my = 0, lastMove = 0;
  let nextBlink = 0, blinkT = 0, nextWander = 0, nextQuirk = Date.now() + 10000, gameTok = 0, landSq = 0, poke = 0;

  const hide = () => { bub.style.display = 'none'; clearTimeout(bt); };
  const setMode = (m, t) => { if (mode === 'sleep' && m !== 'sleep' && !hold) hide(); mode = m; timer = t; };

  function place() {
    bub.style.display = 'block';
    const bw = bub.offsetWidth, bh = bub.offsetHeight, g = 4;
    const fitUp = y - bh - g >= 0, fitDown = y + S + bh + g <= H;
    const up = fitUp && fitDown ? y > H / 2 : fitUp || fitDown ? fitUp : y > H - y - S;
    bub.style.top = up ? 'auto' : '100%'; bub.style.bottom = up ? '100%' : 'auto';
    bub.style.margin = up ? `0 0 ${g}px` : `${g}px 0 0`;
    bub.style.right = 'auto'; bub.style.transform = 'none';
    bub.style.left = clamp(x + (S - bw) / 2, 4, Math.max(4, W - bw - 4)) - x + 'px';
  }
  function card(text, btns, ms) {
    bub.textContent = '';
    const t = doc.createElement('div'); t.textContent = text; bub.appendChild(t);
    if (btns) {
      const r = doc.createElement('div');
      r.style.cssText = 'margin-top:6px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap';
      btns.forEach(([l, f]) => {
        const b = doc.createElement('button'); b.textContent = l;
        b.style.cssText = `border:0;border-radius:6px;padding:3px 8px;background:#2563eb;color:#fff;font:12px ${FONT};cursor:pointer`;
        b.onclick = e => { e.stopPropagation(); f(); };
        r.appendChild(b);
      });
      bub.appendChild(r);
    }
    place(); clearTimeout(bt); if (ms) bt = setTimeout(hide, ms);
  }
  const say = (t, ms) => { if (hold) return false; card(t, null, ms); return true; };
  const sayAuto = (t, ms) => dnd ? false : say(t, ms);
  const toast = t => { toasts.push(t); };
  function release() { hold = false; hide(); vx = vy = 0; bounce = 0; setMode('air', 0); }
  function notify(text, btns, ms, urgent) {
    if (dnd && !urgent) { if (missed.length < 10) missed.push(text.split('\n')[0].slice(0, 60)); return; }
    hold = true; const my = ++tok; setMode('idle', 0); setEmo('surprised', 1.5);
    vx = vy = 0;
    card(text, btns.map(([l, f]) => [l, () => { f(); release(); }]));
    if (ms) setTimeout(() => { if (hold && tok === my) release(); }, ms);
    if (!dnd) beep();
  }
  function beep() {
    if (!C.sound) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination); o.frequency.value = 660;
      g.gain.setValueAtTime(.15, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .6);
      o.start(); o.stop(a.currentTime + .6);
    } catch (e) {}
  }

  /* ---------- XP, level, prestasi ---------- */
  const ACH = [
    ['kenyal', '🫧 Si Kenyal', 'Klik 100x', () => st.tot.click >= 100, () => `${st.tot.click}/100`],
    ['striker', '⚽ Striker', 'Tendang bola 50x', () => st.tot.kick >= 50, () => `${st.tot.kick}/50`],
    ['gembul', '🍖 Gembul', 'Beri makan 20x', () => st.tot.fed >= 20, () => `${st.tot.fed}/20`],
    ['manja', '🥰 Si Manja', 'Elus 10x', () => st.tot.purr >= 10, () => `${st.tot.purr}/10`],
    ['tenang', '🧘 Tenang', 'Selesaikan 5 sesi napas/peregangan', () => st.tot.guide >= 5, () => `${st.tot.guide}/5`],
    ['jago', '🎮 Jago Game', 'Menang 10x', () => st.tot.win >= 10, () => `${st.tot.win}/10`],
    ['combo', '💥 Combo Master', 'Combo klik 15', () => st.tot.bestCombo >= 15, () => `${st.tot.bestCombo}/15`],
    ['minum', '💧 Rajin Minum', 'Minum 20 gelas', () => st.tot.water >= 20, () => `${st.tot.water}/20`],
    ['kilat', '⚡ Kilat', 'Refleks di bawah 250 ms', () => st.g.reflex > 0 && st.g.reflex < 250, () => st.g.reflex ? st.g.reflex + ' ms' : 'belum'],
    ['trik', '🎪 Pecinta Trik', 'Lihat 10 trik', () => st.tot.trick >= 10, () => `${st.tot.trick}/10`],
  ];
  function levelUp(L) {
    const h = Object.keys(HAT_LV).find(k => HAT_LV[k] === L);
    toast(`🎉 Level ${L}!` + (h ? ` Aksesori ${h} terbuka` : '')); if (!wx) weather('confetti', 4); setEmo('love', 2.5);
  }
  function checkAch() {
    for (const [id, title, , test] of ACH) {
      if (!st.ach[id] && test()) { st.ach[id] = 1; const b = lvl(); st.xp += 25; toast('🏆 Prestasi: ' + title + ' (+25 XP)'); if (lvl() > b) levelUp(lvl()); }
    }
  }
  function gain(n, key) {
    const b = lvl(); st.xp += n; if (key) st.tot[key] = (st.tot[key] || 0) + 1;
    if (lvl() > b) levelUp(lvl());
    checkAch();
  }
  function drink() { st.water++; gain(2, 'water'); saveS(); }

  /* ---------- efek ---------- */
  function fx(e, px, py) {
    const d = doc.createElement('div'); d.textContent = e;
    d.style.cssText = `position:fixed;left:${px}px;top:${py}px;z-index:${TOP};pointer-events:none;font-size:20px;line-height:1;opacity:1;transition:transform .9s ease-out,opacity .9s`;
    root.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = `translate(${rnd(-30, 30)}px,-60px)`; d.style.opacity = '0'; });
    setTimeout(() => d.remove(), 1000);
  }
  function mkPart(type, init) {
    const p = { x: rnd(0, W), y: init ? rnd(-H, H) : rnd(-40, 0) };
    if (type === 'rain') { p.v = rnd(600, 900); p.l = rnd(10, 18); }
    else if (type === 'snow') { p.v = rnd(40, 90); p.r = rnd(2, 4); p.d = rnd(0, 6.28); }
    else { p.v = rnd(120, 260); p.s = rnd(5, 9); p.c = `hsl(${rnd(0, 360)},85%,55%)`; p.a = rnd(0, 6.28); p.va = rnd(-6, 6); p.d = rnd(-40, 40); }
    return p;
  }
  function weather(type, secs) {
    if (wx) { wx.cv.remove(); wx = null; }
    if (!type) return;
    const cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
    cv.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:${TOP - 1}`;
    root.appendChild(cv);
    const n = type === 'rain' ? 120 : type === 'snow' ? 80 : 160;
    wx = { type, cv, ctx: cv.getContext('2d'), parts: Array.from({ length: n }, () => mkPart(type, type !== 'confetti')), until: Date.now() + secs * 1000 };
  }
  function drawWx(dt, t) {
    const { ctx, parts, type } = wx, dying = Date.now() > wx.until;
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.y += p.v * dt;
      if (type === 'rain') { p.x -= 80 * dt; ctx.strokeStyle = 'rgba(80,130,255,.65)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + p.l); ctx.stroke(); }
      else if (type === 'snow') { p.x += Math.sin(t / 700 + p.d) * 25 * dt; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9db4c8'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); ctx.stroke(); }
      else { p.x += p.d * dt; p.a += p.va * dt; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
      if (p.y > H + 20) { if (dying || type === 'confetti') parts.splice(i, 1); else { p.y = -20; p.x = rnd(0, W); } }
    }
    if (!parts.length) { wx.cv.remove(); wx = null; }
  }

  /* ---------- drag generik ---------- */
  function drag(node, o) {
    let dn = null, hist = [];
    node.addEventListener('pointerdown', e => {
      if (e.button) return;
      e.stopPropagation(); node.setPointerCapture(e.pointerId);
      const p = o.pos(); dn = { ox: e.clientX - p[0], oy: e.clientY - p[1], sx: e.clientX, sy: e.clientY, moved: false }; hist = [];
      o.down && o.down();
    });
    node.addEventListener('pointermove', e => {
      if (!dn) return;
      if (!dn.moved && Math.hypot(e.clientX - dn.sx, e.clientY - dn.sy) > 5) { dn.moved = true; o.start && o.start(); }
      if (dn.moved) {
        const s = o.size(), nx = clamp(e.clientX - dn.ox, 0, W - s), ny = clamp(e.clientY - dn.oy, 0, H - s);
        o.set(nx, ny); const n = performance.now(); hist.push([n, nx, ny]); hist = hist.filter(h => n - h[0] < 100);
      }
    });
    node.addEventListener('pointerup', e => {
      if (!dn) return;
      const d = dn; dn = null; let a = 0, b = 0;
      if (d.moved && hist.length > 1) {
        const f = hist[0], l = hist[hist.length - 1], s = (l[0] - f[0]) / 1000 || 1;
        a = clamp((l[1] - f[1]) / s, -2500, 2500); b = clamp((l[2] - f[2]) / s, -2500, 2500);
      }
      o.end(a, b, d.moved, e);
    });
  }

  /* ---------- hewan ---------- */
  function jump() { vy = -650; vx = dir * 120; bounce = 0; setMode('air', 0); }
  const onFloor = () => y >= H - S - 2;
  function next() {
    if (!hold && onFloor()) {
      if (Math.random() < .07) return doTrick(pick(['roll', 'dance', 'clap', 'roll', 'dance', 'clap', 'dead']));
      if (Math.random() < .05) return startPeek();
    }
    if (night && Math.random() < .3) return setMode('sleep', 8 + Math.random() * 10);
    const r = Math.random();
    if (r < .5) { dir = Math.random() < .5 ? -1 : 1; setMode('walk', 2 + Math.random() * 4); }
    else if (r < .75) setMode('idle', 2 + Math.random() * 3);
    else if (r < .9) setMode('sleep', 6 + Math.random() * 8);
    else jump();
  }
  const TRICKS = { roll: ['Guling! 🌀', 1.4, 'happy'], dance: ['Joget~ 🎵', 2.6, 'happy'], clap: ['Prok prok! 👏', 2.2, 'love'], dead: ['Uhuk... 💀', 2.8, 'dizzy'] };
  function doTrick(k) {
    if (hold || mode === 'drag' || !onFloor()) return;
    const T = TRICKS[k]; trick = { k, t0: Date.now(), dur: T[1] * 1000, fx: 0 };
    setMode('trick', T[1]); vx = vy = 0; setEmo(T[2], T[1]); say(T[0], 1500); gain(1, 'trick');
  }
  function startPeek() {
    if (hold || !onFloor()) return;
    const side = x < W / 2 ? -1 : 1; peek = { side, ph: 'go', t: 0 }; dir = side; setMode('peek', 99);
  }
  function stepPeek(dt) {
    const P = peek, tgt = P.side < 0 ? -S * .5 : W - S * .5, back = P.side < 0 ? 24 : W - S - 24;
    if (P.ph === 'go') {
      x += P.side * 130 * dt;
      if (P.side < 0 ? x <= tgt : x >= tgt) { x = tgt; P.ph = 'stay'; P.t = 2.6; dir = -P.side; gazeForce = { x: -P.side * 1.2, y: 0, until: Date.now() + 2400 }; setEmo('happy', 1.2); }
    } else if (P.ph === 'stay') { P.t -= dt; if (P.t <= 0) P.ph = 'back'; }
    else {
      x -= P.side * 130 * dt;
      if (P.side < 0 ? x >= back : x <= back) { peek = null; setMode('idle', 2); }
    }
  }
  drag(el, {
    pos: () => [x, y], size: () => S,
    down: () => { el.style.cursor = 'grabbing'; },
    start: () => { mode = 'drag'; clearTimeout(ht); },
    set: (nx, ny) => { x = nx; y = ny; },
    end: (a, b, moved, e) => {
      el.style.cursor = 'grab';
      if (moved) {
        vx = a; vy = b; bounce = .55; mode = 'air'; emoUntil = 0;
        if (Math.hypot(vx, vy) > 800) { say('Wuaaa! 😵', 1200); setEmo('dizzy', 1.8); }
      } else if (!hold) click(e);
    },
  });
  function click(e) {
    const n = Date.now();
    combo = n - lastClick < 800 ? combo + 1 : 1; lastClick = n; poke = 1;
    st.happy = clamp(st.happy + 1, 0, 100);
    if (combo > st.best) st.best = combo;
    st.tot.click++; st.tot.bestCombo = Math.max(st.tot.bestCombo, combo);
    if (n - lastXp > 2000) { lastXp = n; gain(1); } else checkAch();
    fx(pick(['💥', '✨', '⭐']), e.clientX, e.clientY);
    const angry = n < angryUntil;
    if (combo === 5) { angryUntil = n + 3000; say('💢 Ih, ngambek ah!', 2500); setMode('idle', 3); st.happy = clamp(st.happy - 3, 0, 100); }
    else if (angry) { angryUntil = n + 1500; say(`💥 x${combo}${combo >= 10 ? ' 🔥' : ''}`, 700); }
    else if (combo >= 3) { say('💥 x' + combo, 700); jump(); setEmo('surprised', .6); }
    else { say('!', 600); jump(); setEmo('surprised', .6); }
  }
  el.addEventListener('mouseenter', () => { ht = setTimeout(() => { if (mode !== 'drag' && !hold) { say(status(), 4500); setEmo('happy', 2); st.happy = clamp(st.happy + 1, 0, 100); } }, 700); });
  el.addEventListener('mouseleave', () => clearTimeout(ht));
  el.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); openMenu(); });
  el.addEventListener('pointermove', e => {
    if (e.buttons || hold || mode === 'drag') return;
    const d = Math.hypot(e.movementX || 0, e.movementY || 0);
    if (d > 0 && d < 40) { strokeAmt += d; if (strokeAmt > 350) { strokeAmt = 0; purr(); } }
  });
  function purr() {
    const n = Date.now(); if (n < purrUntil) return;
    purrUntil = n + 3500; setEmo('love', 3.5); st.happy = clamp(st.happy + 8, 0, 100); gain(3, 'purr'); say('🥰 prrr...', 2500);
  }

  /* ---------- makanan / bola ---------- */
  function removeItem() { if (item) { item.el.remove(); item = null; } }
  function spawnItem(k, emoji) {
    removeItem();
    const s = Math.round(S * .6), e = doc.createElement('div');
    e.textContent = emoji;
    e.style.cssText = `position:fixed;left:0;top:0;z-index:${TOP - 1};width:${s}px;height:${s}px;font:${Math.round(s * .85)}px/${s}px ${FONT};text-align:center;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none`;
    root.appendChild(e);
    item = { k, el: e, s, x: rnd(W * .15, W * .85 - s), y: 0, vx: 0, vy: 0, drag: false, cool: 0 };
    drag(e, {
      pos: () => [item.x, item.y], size: () => item.s,
      down: () => { item.drag = true; item.vx = item.vy = 0; },
      set: (nx, ny) => { item.x = nx; item.y = ny; },
      end: (a, b) => { item.drag = false; item.vx = a; item.vy = b; },
    });
    e.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); removeItem(); });
  }
  function updItem(dt) {
    if (!item || item.drag) return;
    item.cool = Math.max(0, item.cool - dt);
    item.vy += 1800 * dt; item.x += item.vx * dt; item.y += item.vy * dt;
    if (item.x < 0) { item.x = 0; item.vx = Math.abs(item.vx) * .6; }
    if (item.x > W - item.s) { item.x = W - item.s; item.vx = -Math.abs(item.vx) * .6; }
    if (item.y < 0) { item.y = 0; item.vy = Math.abs(item.vy) * .5; }
    if (item.y >= H - item.s) {
      item.y = H - item.s;
      const r = item.k === 'ball' ? .62 : .15;
      item.vy = Math.abs(item.vy) > 120 ? -item.vy * r : 0;
      item.vx *= 1 - Math.min(1, 2.5 * dt);
    }
  }
  function touchItem() {
    if (!item || item.drag || item.cool > 0) return;
    const ic = item.x + item.s / 2, pc = x + S / 2;
    if (Math.abs(ic - pc) > S * .7 || Math.abs(item.y + item.s / 2 - (y + S / 2)) > S * .9) return;
    if (item.k === 'ball') {
      item.vx = (ic >= pc ? 1 : -1) * rnd(350, 650); item.vy = -rnd(300, 600); item.cool = .4;
      st.kicks++; st.happy = clamp(st.happy + 3, 0, 100); fx('⚽', ic, item.y); setEmo('happy', 1); gain(1, 'kick');
      if (st.kicks % 10 === 0) say('⚽ Gol! ' + st.kicks, 1500);
    } else {
      st.fed++; st.hunger = clamp(st.hunger - 45, 0, 100); st.happy = clamp(st.happy + 12, 0, 100); gain(5, 'fed');
      fx('❤️', ic, item.y); removeItem(); say('Nyam nyam 😋', 1500); setMode('idle', 2); setEmo('love', 2.5);
    }
  }

  /* ---------- teman ---------- */
  function mkBuddy() {
    if (bud) { bud.el.remove(); bud = null; }
    if (!C.buddy) return;
    const s = Math.round(S * .62), e = doc.createElement('div');
    e.textContent = C.buddy;
    e.style.cssText = `position:fixed;left:0;top:0;z-index:${TOP - 1};width:${s}px;height:${s}px;font:${Math.round(s * .85)}px/${s}px ${FONT};text-align:center;cursor:pointer;user-select:none;-webkit-user-select:none`;
    e.addEventListener('pointerdown', ev => { ev.stopPropagation(); if (bud) { bud.vy = -520; fx('❤️', ev.clientX, ev.clientY); } });
    root.appendChild(e);
    bud = { el: e, s, x: clamp(x - S * 1.3, 0, W - s), y: H - s, vy: 0, dir: 1 };
  }
  function updBuddy(dt) {
    if (!bud) return;
    const tx = clamp(x + (dir > 0 ? -S * 1.2 : S * 1.2), 0, W - bud.s), dx = tx - bud.x;
    if (Math.abs(dx) > 6) { bud.x += clamp(dx * 2, -170, 170) * dt; bud.dir = dx > 0 ? 1 : -1; }
    else if (Math.random() < .0015) fx('❤️', bud.x + bud.s / 2, bud.y);
    bud.vy += 1800 * dt; bud.y += bud.vy * dt;
    if (bud.y >= H - bud.s) { bud.y = H - bud.s; bud.vy = 0; if (mode === 'air' && Math.random() < .02) bud.vy = -520; }
    bud.el.style.transform = `translate(${bud.x}px,${bud.y}px) scaleX(${bud.dir > 0 ? -1 : 1})`;
  }

  /* ---------- desk buddy: ekspresi & gambar ---------- */
  const setEmo = (name, secs) => { emoName = name; emoUntil = Date.now() + secs * 1000; };
  function emoNow(n) {
    if (emoUntil > n) return emoName;
    if (mode === 'sleep') return 'sleepy';
    if (n < angryUntil) return 'angry';
    if (mode === 'drag') return 'surprised';
    if (st.hunger > 70) return 'sad';
    if (night) return 'drowsy';
    return 'normal';
  }
  const onMove = e => { mx = e.clientX; my = e.clientY; lastMove = Date.now(); };
  function rrect(g, x0, y0, w, h, r) {
    r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x0 + r, y0);
    g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
    g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath();
  }
  function drawBuddy(dt, t, n) {
    const E = EXPR[emoNow(n)] || EXPR.normal, k = Math.min(1, dt * 14);
    eyeCol = E.col || C.eye;
    for (const key in BASE) cur[key] += (E[key] - cur[key]) * k;
    if (n > nextBlink) { blinkT = n; nextBlink = n + rnd(2500, 6000); }
    const bl = n - blinkT < 160 ? Math.sin((n - blinkT) / 160 * Math.PI) : 0;
    if (n > nextQuirk) { nextQuirk = n + rnd(8, 16) * 1e3; if (!hold && mode !== 'sleep' && emoUntil < n && st.happy > 60) setEmo(pick(['happy', 'wink', 'happy']), 1.4); }
    let tx = 0, ty = 0;
    if (gazeForce && n < gazeForce.until) { tx = gazeForce.x; ty = gazeForce.y; }
    else if (n - lastMove < 4000) { tx = clamp((mx - (x + S / 2)) / (S * 2.5), -1, 1); ty = clamp((my - (y + S / 2)) / (S * 2.5), -1, 1); }
    else {
      if (n > nextWander) { nextWander = n + rnd(1500, 4000); if (Math.random() < .35) { wand.x = wand.y = 0; } else { wand.x = rnd(-.8, .8); wand.y = rnd(-.6, .6); } }
      tx = wand.x; ty = wand.y;
    }
    const kg = Math.min(1, dt * 10); gz.x += (tx - gz.x) * kg; gz.y += (ty - gz.y) * kg;
    const g = cv.getContext('2d'), by = S * .18 + Math.sin(t / 900) * S * .004, bh = S - by - S * .01;
    g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, S, S);
    g.shadowBlur = 0; g.fillStyle = '#0f172a'; g.strokeStyle = '#334155'; g.lineWidth = 2;
    rrect(g, 1, by, S - 2, bh, S * .24); g.fill(); g.stroke();
    const cy = by + bh * .48;
    for (let i = 0; i < 2; i++) {
      const cx = S * .5 + (i ? 1 : -1) * S * .2 + gz.x * S * .06, ey = cy + gz.y * S * .045;
      const w = cur.w * S * breathK, h = Math.max(S * .012, cur.h * S * breathK * (1 - bl * .92)), r = Math.min(cur.r * S, w / 2, h / 2);
      const arc = i ? Math.max(cur.arc, cur.arcR) : cur.arc;
      g.fillStyle = g.strokeStyle = eyeCol; g.shadowColor = eyeCol; g.shadowBlur = S * .08;
      if (cur.heart > .5) {
        const s = S * .17; g.beginPath(); g.moveTo(cx, ey + s * .35);
        g.bezierCurveTo(cx + s * .7, ey - s * .05, cx + s * .45, ey - s * .55, cx, ey - s * .2);
        g.bezierCurveTo(cx - s * .45, ey - s * .55, cx - s * .7, ey - s * .05, cx, ey + s * .35); g.fill();
      } else if (cur.spiral > .5) {
        g.lineWidth = S * .03; g.beginPath();
        for (let a = 0; a < 12; a += .3) g.lineTo(cx + Math.cos(a + t / 150) * a * S * .0085, ey + Math.sin(a + t / 150) * a * S * .0085);
        g.stroke();
      } else if (arc > .5) {
        g.lineWidth = S * .045; g.lineCap = 'round'; g.beginPath(); g.arc(cx, ey + S * .04, S * .075, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      } else {
        rrect(g, cx - w / 2, ey - h / 2, w, h, r); g.fill();
        if (cur.lid > .02) {
          g.shadowBlur = 0; g.fillStyle = '#0f172a';
          const lowIn = Math.max(0, cur.tilt) * cur.lid * h, lowOut = Math.max(0, -cur.tilt) * cur.lid * h;
          const yl = i === 0 ? lowOut : lowIn, yr = i === 0 ? lowIn : lowOut;
          g.beginPath(); g.moveTo(cx - w / 2 - 2, ey - h / 2 - 2); g.lineTo(cx + w / 2 + 2, ey - h / 2 - 2);
          g.lineTo(cx + w / 2 + 2, ey - h / 2 + yr); g.lineTo(cx - w / 2 - 2, ey - h / 2 + yl); g.closePath(); g.fill();
        }
      }
    }
    g.shadowBlur = 0;
  }

  /* ---------- pemandu napas & peregangan ---------- */
  const STRETCH = [
    { t: 'Tegakkan punggung, rilekskan bahu 🧘', s: 6 }, { t: 'Miringkan kepala ke kanan, tahan ➡️', s: 6 },
    { t: 'Miringkan kepala ke kiri, tahan ⬅️', s: 6 }, { t: 'Putar bahu ke belakang pelan 🔄', s: 6 }, { t: 'Putar pergelangan tangan 🤲', s: 6 },
  ];
  const BREATH = [];
  for (let i = 0; i < 5; i++) BREATH.push({ t: 'Tarik napas... 🌬', s: 4, k: 'in' }, { t: 'Tahan...', s: 4, k: 'hold' }, { t: 'Hembuskan pelan 😮‍💨', s: 4, k: 'out' });
  function startGuide(name, steps) {
    closePanel(); hold = true; ++tok; setMode('idle', 0); vx = vy = 0;
    card('', [['Berhenti', () => stopGuide()]]);
    guide = { name, steps, i: 0, end: Date.now() + steps[0].s * 1000, tdiv: bub.firstChild, shown: '' };
  }
  function stopGuide(silent) { guide = null; release(); if (silent !== true) say('Dihentikan', 1500); }
  function finishGuide() {
    const g = guide; guide = null; release(); gain(10, 'guide'); setEmo('happy', 2.5); say('✅ ' + g.name + ' selesai! +10 XP', 3500);
  }
  function guideK(n) {
    const s = guide.steps[guide.i]; if (!s.k) return 1;
    const p = clamp(1 - (guide.end - n) / (s.s * 1000), 0, 1);
    return s.k === 'in' ? 1 + .25 * p : s.k === 'hold' ? 1.25 : 1.25 - .25 * p;
  }
  function stepGuide(n) {
    const G = guide;
    if (n >= G.end) { G.i++; if (G.i >= G.steps.length) return finishGuide(); G.end = n + G.steps[G.i].s * 1000; }
    const s = G.steps[G.i], txt = `${G.name} ${G.i + 1}/${G.steps.length}\n${s.t}\n${Math.ceil((G.end - n) / 1000)}`;
    if (txt !== G.shown) { G.shown = txt; G.tdiv.textContent = txt; }
  }

  /* ---------- loop ---------- */
  function tick(t) {
    if (C.eco && !hold && !guide) {
      const quiet = Date.now() - Math.max(lastMove, lastAct) > 30000, gap = quiet ? (mode === 'sleep' ? 100 : 33) : 0;
      if (gap && t - last < gap - 2) { raf = requestAnimationFrame(tick); return; }
    }
    const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    const n = Date.now();
    landSq = Math.max(0, landSq - dt * 5); poke = Math.max(0, poke - dt * 3); strokeAmt = Math.max(0, strokeAmt - dt * 80);
    if (peek && mode !== 'peek') { peek = null; x = clamp(x, 0, W - S); }
    if (guide) stepGuide(n);
    const gt = guide ? guideK(n) : 1; breathK += (gt - breathK) * Math.min(1, dt * 8);
    if (n < purrUntil && n - lastHeart > 450) { lastHeart = n; fx('❤️', x + rnd(0, S), y); }
    const brk = pomo && pomo.phase === 'break';
    if (!hold && mode !== 'drag' && mode !== 'air') {
      if (brk) { if (mode !== 'sleep') setMode('sleep', 9); timer = 9; }
      else if (item && !item.drag && mode !== 'chase' && mode !== 'trick' && mode !== 'peek') { if (mode === 'sleep') hide(); mode = 'chase'; }
    }
    updItem(dt);
    if (mode === 'air') {
      vy += 1800 * dt; x += vx * dt; y += vy * dt;
      if (x < 0) { x = 0; vx = Math.abs(vx) * .6; }
      if (x > W - S) { x = W - S; vx = -Math.abs(vx) * .6; }
      if (y < 0) { y = 0; vy = Math.abs(vy) * .5; }
      if (y >= H - S) {
        y = H - S; landSq = clamp(Math.abs(vy) / 900, .3, 1);
        if (bounce && Math.abs(vy) > 150) { vy = -vy * bounce; vx *= .8; }
        else { vy = 0; vx = 0; setMode('idle', 1 + Math.random() * 2); }
      }
      if (!hold) touchItem();
    } else if (mode === 'chase') {
      if (!item || hold) setMode('idle', 1);
      else {
        const ic = item.x + item.s / 2, pc = x + S / 2;
        dir = ic > pc ? 1 : -1;
        x = clamp(x + dir * Math.min(200, Math.abs(ic - pc) * 3 + 40) * dt, 0, W - S);
        if (item.y + item.s < y - S * .5 && Math.abs(ic - pc) < S * 1.2 && y >= H - S - 1) jump();
        touchItem();
      }
    } else if (mode === 'peek') {
      if (hold || !peek) { peek = null; x = clamp(x, 0, W - S); setMode('idle', 1); } else stepPeek(dt);
    } else if (mode !== 'drag') {
      timer -= dt;
      if (mode === 'walk' && !hold) {
        x += dir * 70 * dt;
        if (x < 0) { x = 0; dir = 1; } if (x > W - S) { x = W - S; dir = -1; }
      }
      if (mode === 'trick' && trick && trick.k === 'roll') x = clamp(x + dir * 90 * dt, 0, W - S);
      if (timer <= 0 && !hold) { if (mode === 'trick') trick = null; next(); }
    }
    if (C.desk) { if (!hold) touchItem(); drawBuddy(dt, t, n); }
    updBuddy(dt);
    if (wx) drawWx(dt, t);
    const angry = n < angryUntil;
    const f = angry ? (animal === '🐱' ? '😾' : '😤') : animal;
    if (!C.desk && face.textContent !== f) face.textContent = f;
    const bg = dnd ? '🔕' + (missed.length || '') : mode === 'sleep' ? '💤' : angry ? '💢' : st.hunger > 70 ? '🍖' : '';
    if (badge.textContent !== bg) badge.textContent = bg;
    const sh = angry ? Math.sin(t / 30) * 3 : 0;
    let sy = 1, lift = 0, rot = 0, org = '50% 100%';
    if (mode === 'trick' && trick) {
      const p = clamp((n - trick.dur * 0 - trick.t0) / trick.dur, 0, 1);
      if (trick.k === 'roll') { rot = 720 * p * dir; org = '50% 55%'; }
      else if (trick.k === 'dance') { const w = Math.sin(t / 110); rot = w * 12; sy = .9 + .2 * Math.abs(w); lift = Math.abs(w) * S * .08; if (n - trick.fx > 500) { trick.fx = n; fx(pick(['🎵', '🎶']), x + S / 2, y); } }
      else if (trick.k === 'clap') { sy = 1 + Math.sin(t / 80) * .1; if (n - trick.fx > 350) { trick.fx = n; fx('👏', x + S / 2 + rnd(-S / 2, S / 2), y); } }
      else { rot = (p < .15 ? 90 * (p / .15) : p < .8 ? 90 : 90 * (1 - (p - .8) / .2)) * dir; org = '50% 55%'; }
    }
    else if (mode === 'walk' || mode === 'chase' || mode === 'peek') { const th = t / (mode === 'chase' ? 90 : 130), a = Math.abs(Math.sin(th)); sy = .88 + .24 * a; lift = a * S * .09; rot = Math.sin(th) * 5 * dir; }
    else if (mode === 'air') sy = 1 + clamp(Math.abs(vy) / 2500, 0, .22);
    else if (mode === 'drag') sy = 1.07;
    else if (mode === 'sleep') sy = .96 + Math.sin(t / 700) * .025;
    else sy = 1 + Math.sin(t / 600) * .015;
    if (n < purrUntil) sy += Math.sin(t / 35) * .02;
    sy = clamp(sy - landSq * .25 + Math.sin(t / 45) * poke * .15, .6, 1.4);
    const sx = 1 / sy, bk = C.desk ? 1 + (breathK - 1) * .5 : breathK;
    face.style.transformOrigin = org;
    face.style.transform = `translate(${sh}px,${-lift}px) rotate(${rot}deg) scale(${(C.desk ? sx : sx * (dir > 0 ? -1 : 1)) * bk},${sy * bk})`;
    acc.style.transform = `translateY(${-lift - (sy * bk - 1) * S * .9}px) rotate(${mode === 'trick' ? 0 : rot}deg)`;
    el.style.transform = `translate(${x}px,${y}px)`;
    if (bub.style.display === 'block') place();
    if (item) item.el.style.transform = `translate(${item.x}px,${item.y}px)`;
    raf = requestAnimationFrame(tick);
  }

  /* ---------- panel ---------- */
  const closePanel = () => { gameTok++; panel.style.display = 'none'; panel.textContent = ''; };
  function openPanel(title, build) {
    panel.textContent = '';
    const h = doc.createElement('div'); h.textContent = title; h.style.cssText = 'font-weight:700;margin-bottom:8px;font-size:14px';
    panel.appendChild(h); build(panel); panel.style.display = 'block';
  }
  function btn(label, fn, bg) {
    const b = doc.createElement('button'); b.textContent = label;
    b.style.cssText = `border:0;border-radius:8px;padding:6px 8px;background:${bg || '#eef2ff'};color:${bg ? '#fff' : '#222'};font:13px ${FONT};cursor:pointer;flex:1 1 40%`;
    b.onclick = e => { e.stopPropagation(); fn(b); };
    return b;
  }
  function grid(parent, items) {
    const g = doc.createElement('div'); g.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px';
    items.forEach(([l, f, bg]) => g.appendChild(btn(l, b => { f(b); }, bg))); parent.appendChild(g);
  }
  const sec = (p, t) => { const d = doc.createElement('div'); d.textContent = t; d.style.cssText = 'font-size:11px;color:#667;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.04em'; p.appendChild(d); };
  const act = f => () => { closePanel(); f(); };
  function openMenu() {
    gameTok++;
    openPanel(`${C.name} ${moodTxt()} · Lv ${lvl()}`, p => {
      sec(p, 'Rawat');
      grid(p, [
        ['🍖 Makan', act(() => spawnItem('food', '🍖'))], ['⚽ Bola', act(() => spawnItem('ball', '⚽'))],
        ['🧹 Bersihkan', act(removeItem)], ['💧 Minum +1', act(() => { drink(); say('💧 ' + st.water + ' gelas hari ini', 2500); })],
      ]);
      sec(p, 'Seru');
      grid(p, [
        ['🎮 Main', gameMenu], ['🎪 Trik', trickMenu],
        ['🌧 Hujan', act(() => weather('rain', 600))], ['❄️ Salju', act(() => weather('snow', 600))],
        ['🎊 Konfeti', act(() => weather('confetti', 6))], ['✨ Cuaca off', act(() => weather(null))],
      ]);
      sec(p, 'Sehat');
      grid(p, [
        ['🌬 Napas', act(() => startGuide('Napas 4-4-4', BREATH))], ['🧘 Peregangan', act(() => startGuide('Peregangan', STRETCH))],
        [pomo ? '🍅 Stop Pomodoro' : '🍅 Pomodoro', act(togglePomo)],
        [dnd ? '🔔 Aktifkan reminder' : '🔕 Diam 1 jam', act(toggleDnd)],
      ]);
      sec(p, 'Lainnya');
      grid(p, [
        ['🏆 Level', showLevel], ['🕌 Jadwal', showSchedule],
        ['⚙️ Pengaturan', openSettings], ['🔔 Tes', act(() => notify('Tes reminder ✅', [['Oke', () => {}]], 0, true))],
        [C.desk ? '🐱 Mode Emoji' : '👀 Mode Desk Buddy', act(() => { C.desk = !C.desk; saveC(); applyCfg(); say(C.desk ? 'Mode Desk Buddy 👀' : 'Mode Emoji 🐱', 2000); })],
        ['❌ Hilangkan', () => destroy(), '#dc2626'], ['Tutup', closePanel],
      ]);
    });
  }
  function trickMenu() {
    openPanel('🎪 Trik', p => grid(p, [
      ['🌀 Guling', act(() => doTrick('roll'))], ['🎵 Joget', act(() => doTrick('dance'))],
      ['👏 Tepuk', act(() => doTrick('clap'))], ['💀 Pura-pura mati', act(() => doTrick('dead'))],
      ['🙈 Intip layar', act(startPeek)], ['← Menu', openMenu],
    ]));
  }
  function showSchedule() {
    const [y0, m0, d0] = ymd(), T = dayTimes(y0, m0, d0);
    const jum = new Date(Date.UTC(y0, m0 - 1, d0)).getUTCDay() === 5 ? ' (Jumat)' : '';
    openPanel('🕌 Jadwal sholat · ' + C.city, p => {
      const t = doc.createElement('div'); t.style.cssText = 'white-space:pre-line;margin-bottom:8px';
      t.textContent = Object.keys(T).map(k => k + (k === 'Dzuhur' ? jum : '') + '  ' + hhmm(T[k])).join('\n') + '\n\nPerkiraan hitungan Kemenag, cocokkan dengan jadwal resmi.';
      p.appendChild(t); grid(p, [['Tutup', closePanel]]);
    });
  }
  function showLevel() {
    openPanel('🏆 Level & prestasi', p => {
      const L = lvl(), a = lvXp(L), b = lvXp(L + 1), pc = clamp((st.xp - a) / (b - a), 0, 1);
      gtext(p, `Level ${L} · ${st.xp} XP\nKe level ${L + 1}: ${b - st.xp} XP lagi`);
      const bar = doc.createElement('div'); bar.style.cssText = 'height:8px;background:#e2e8f0;border-radius:4px;margin-bottom:8px;overflow:hidden';
      const fill = doc.createElement('div'); fill.style.cssText = `height:100%;width:${Math.round(pc * 100)}%;background:#2563eb`; bar.appendChild(fill); p.appendChild(bar);
      gtext(p, 'Aksesori: ' + Object.keys(HAT_LV).map(h => `${h} Lv${HAT_LV[h]}`).join('  '));
      gtext(p, ACH.map(([id, title, desc, , prog]) => (st.ach[id] ? '✅ ' : '🔒 ') + title + ' · ' + desc + (st.ach[id] ? '' : ` (${prog()})`)).join('\n'));
      grid(p, [['Tutup', closePanel]]);
    });
  }

  /* ---------- game ---------- */
  function gtext(p, s) { const t = doc.createElement('div'); t.style.cssText = 'margin-bottom:8px;white-space:pre-line'; t.textContent = s; p.appendChild(t); }
  const gfoot = p => grid(p, [['← Game', gameMenu], ['Tutup', closePanel]]);
  function gameMenu() {
    gameTok++;
    openPanel('🎮 Main sama ' + C.name, p => grid(p, [
      ['✊ Suit', gRps], ['⭕ Tic-tac-toe', gTtt], ['🧠 Memory', gMem], ['🔨 Pukul tikus', gWhack], ['🧺 Tangkap buah', gCatch],
      ...(C.desk ? [['👀 Tebak mata', gGaze], ['⚡ Refleks', gReflex]] : []),
      ['Tutup', closePanel],
    ]));
  }
  function gRps() {
    const E = ['✊', '✋', '✌️']; let msg = 'Pilih: batu, kertas, atau gunting';
    const draw = () => openPanel('✊ Suit', p => {
      gtext(p, msg + `\nMenang ${st.g.rps[0]} · Kalah ${st.g.rps[1]} · Seri ${st.g.rps[2]}`);
      grid(p, E.map((e, i) => [e, () => play(i)])); gfoot(p);
    });
    const play = u => {
      const b = Math.floor(Math.random() * 3), r = (u - b + 3) % 3, vs = `${E[u]} vs ${E[b]} → `;
      if (r === 0) { st.g.rps[2]++; setEmo('wink', 1.5); msg = vs + 'Seri!'; }
      else if (r === 1) { st.g.rps[0]++; setEmo('sad', 2); msg = vs + 'Kamu menang! 🎉'; gain(8, 'win'); }
      else { st.g.rps[1]++; setEmo('happy', 2); msg = vs + 'Aku menang 😎'; }
      saveS(); draw();
    };
    draw();
  }
  function gGaze() {
    const my = ++gameTok, D = [['⬅️', -1, 0], ['⬆️', 0, -1], ['⬇️', 0, 1], ['➡️', 1, 0]];
    let round = 0, score = 0, ans = null, locked = true, msg = '';
    const draw = () => openPanel('👀 Tebak arah mata', p => {
      gtext(p, msg);
      if (round < 5) grid(p, D.map(d => [d[0], () => guess(d)])); else grid(p, [['Main lagi', gGaze]]);
      gfoot(p);
    });
    const start = () => {
      ans = pick(D); locked = true; msg = `Ronde ${round + 1}/5. Lihat mataku... 👀`; draw();
      setTimeout(() => { if (my === gameTok) gazeForce = { x: ans[1] * 1.4, y: ans[2] * 1.4, until: Date.now() + 700 }; }, 700);
      setTimeout(() => { if (my !== gameTok) return; locked = false; msg = `Ronde ${round + 1}/5. Aku lirik ke mana tadi?`; draw(); }, 1700);
    };
    const guess = d => {
      if (locked) return; locked = true;
      if (d === ans) { score++; setEmo('happy', 1.2); msg = 'Benar! ✅'; } else { setEmo('sad', 1.2); msg = 'Salah ❌ (aku lirik ' + ans[0] + ')'; }
      round++;
      if (round >= 5) { st.g.gaze = Math.max(st.g.gaze, score); if (score >= 4) gain(8, 'win'); saveS(); msg += `\nSelesai! Skor ${score}/5 (terbaik ${st.g.gaze}/5)`; draw(); }
      else { draw(); setTimeout(() => { if (my === gameTok) start(); }, 1000); }
    };
    start();
  }
  function gReflex() {
    const my = ++gameTok; let s = 'idle', t0 = 0, tm, msg = 'Klik Mulai. Saat mataku melotot hijau, klik secepatnya!';
    const draw = () => openPanel('⚡ Uji refleks', p => {
      gtext(p, msg + (st.g.reflex ? `\nRekor: ${st.g.reflex} ms` : ''));
      const b = btn(s === 'idle' ? 'Mulai' : s === 'wait' ? 'Tunggu...' : 'KLIK!', go, s === 'go' ? '#16a34a' : s === 'wait' ? '#dc2626' : '#2563eb');
      b.style.cssText += ';width:100%;padding:16px;font-size:16px;flex:none'; p.appendChild(b); gfoot(p);
    });
    const go = () => {
      if (s === 'idle') {
        s = 'wait'; msg = 'Tunggu mataku berubah...'; draw();
        tm = setTimeout(() => { if (my !== gameTok) return; s = 'go'; t0 = performance.now(); emoName = 'go'; emoUntil = Date.now() + 5000; msg = 'SEKARANG!'; draw(); }, rnd(1500, 4000));
      } else if (s === 'wait') { clearTimeout(tm); s = 'idle'; msg = 'Terlalu cepat! 😅'; setEmo('sad', 1.5); draw(); }
      else {
        const ms = Math.round(performance.now() - t0); s = 'idle';
        msg = `${ms} ms · ${ms < 200 ? 'Kilat ⚡' : ms < 300 ? 'Cepat 👍' : 'Lumayan 🙂'}`;
        if (!st.g.reflex || ms < st.g.reflex) { st.g.reflex = ms; msg += ' · rekor baru! 🏆'; }
        if (ms < 350) gain(8, 'win');
        setEmo(ms < 300 ? 'wink' : 'happy', 2); saveS(); draw();
      }
    };
    draw();
  }
  function gTtt() {
    const b = Array(9).fill(''), L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let over = false, msg = 'Kamu ❌, aku ⭕. Giliranmu!';
    const win = q => L.find(l => l.every(i => b[i] === q)), free = () => b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    const find = q => { for (const l of L) { const v = l.map(i => b[i]); if (v.filter(z => z === q).length === 2 && v.includes('')) return l[v.indexOf('')]; } return -1; };
    const bot = () => { let m = -1; if (Math.random() < .75) { m = find('⭕'); if (m < 0) m = find('❌'); if (m < 0 && !b[4]) m = 4; } return m < 0 ? pick(free()) : m; };
    const draw = () => openPanel('⭕ Tic-tac-toe', p => {
      gtext(p, msg + `\nKamu ${st.g.ttt[0]} · Aku ${st.g.ttt[1]} · Seri ${st.g.ttt[2]}`);
      const gd = doc.createElement('div'); gd.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px';
      b.forEach((v, i) => { const c = btn(v || '·', () => move(i)); c.style.cssText += ';font-size:22px;padding:10px 0;flex:none'; gd.appendChild(c); });
      p.appendChild(gd); grid(p, [['Ulang', gTtt]]); gfoot(p);
    });
    const end = (m, k, emo) => { over = true; msg = m; st.g.ttt[k]++; setEmo(emo, 2.5); if (k === 0) gain(8, 'win'); };
    const move = i => {
      if (over || b[i]) return; b[i] = '❌';
      if (win('❌')) end('Kamu menang! 🎉', 0, 'sad');
      else if (!free().length) end('Seri 🤝', 2, 'wink');
      else {
        const m = bot(); b[m] = '⭕'; gazeForce = { x: (m % 3 - 1) * 1.4, y: (Math.floor(m / 3) - 1) * 1.4, until: Date.now() + 700 };
        if (win('⭕')) end('Aku menang 😎', 1, 'happy'); else if (!free().length) end('Seri 🤝', 2, 'wink'); else msg = 'Giliranmu ❌';
      }
      saveS(); draw();
    };
    draw();
  }
  function gMem() {
    const my = ++gameTok, E = ['🍎', '🍌', '🍇', '🍓', '🥝', '🍋'], cards = E.concat(E).sort(() => Math.random() - .5);
    let open = [], done = new Set(), moves = 0, lock = false, msg = 'Cari pasangan yang sama!';
    const draw = () => openPanel('🧠 Memory', p => {
      gtext(p, msg + `\nLangkah: ${moves}` + (st.g.mem ? ` · Rekor: ${st.g.mem}` : ''));
      const gd = doc.createElement('div'); gd.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px';
      cards.forEach((c, i) => { const b = btn(open.includes(i) || done.has(i) ? c : '❓', () => flip(i)); b.style.cssText += ';font-size:20px;padding:8px 0;flex:none'; gd.appendChild(b); });
      p.appendChild(gd); grid(p, [['Ulang', gMem]]); gfoot(p);
    });
    const flip = i => {
      if (lock || open.includes(i) || done.has(i)) return; open.push(i);
      if (open.length === 2) {
        moves++; const [a, b] = open;
        if (cards[a] === cards[b]) {
          done.add(a); done.add(b); open = []; setEmo('happy', 1);
          if (done.size === 12) { msg = `Selesai dalam ${moves} langkah! 🎉`; if (!st.g.mem || moves < st.g.mem) { st.g.mem = moves; msg += ' Rekor baru! 🏆'; } setEmo('love', 2.5); gain(8, 'win'); saveS(); }
        } else { lock = true; setTimeout(() => { if (my !== gameTok) return; open = []; lock = false; draw(); }, 800); }
      }
      draw();
    };
    draw();
  }
  function gWhack() {
    const my = ++gameTok, cells = []; let score = 0, left = 20, mole = -1, run = false, info, sbtn, tm, ti;
    openPanel('🔨 Pukul tikus', p => {
      info = doc.createElement('div'); info.style.cssText = 'margin-bottom:8px;white-space:pre-line'; info.textContent = 'Pukul 🐹 secepatnya selama 20 detik!' + (st.g.whack ? `\nRekor: ${st.g.whack}` : ''); p.appendChild(info);
      const gd = doc.createElement('div'); gd.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px';
      for (let i = 0; i < 9; i++) { const c = btn('·', () => hit(i)); c.style.cssText += ';font-size:24px;padding:10px 0;flex:none'; cells.push(c); gd.appendChild(c); }
      p.appendChild(gd); sbtn = btn('Mulai', () => start(), '#2563eb'); sbtn.style.cssText += ';width:100%;flex:none;margin-bottom:6px'; p.appendChild(sbtn); gfoot(p);
    });
    const show = i => { mole = i; cells.forEach((c, k) => { c.textContent = k === i ? '🐹' : '·'; }); };
    const stat = () => { info.textContent = `Waktu ${left} dtk · Skor ${score}`; };
    const pop = () => {
      if (my !== gameTok || !run) return;
      show(Math.floor(Math.random() * 9));
      tm = setTimeout(() => { if (my !== gameTok || !run) return; show(-1); tm = setTimeout(pop, rnd(150, 400)); }, rnd(550, 900));
    };
    const end = () => {
      run = false; clearInterval(ti); clearTimeout(tm); show(-1);
      const rec = score > (st.g.whack || 0); if (rec) st.g.whack = score;
      info.textContent = `Selesai! Skor ${score}` + (rec ? ' · rekor baru! 🏆' : ''); sbtn.textContent = 'Main lagi';
      if (score >= 15) gain(8, 'win'); setEmo(score >= 12 ? 'sad' : 'happy', 2); saveS();
    };
    const start = () => {
      if (run) return; run = true; score = 0; left = 20; sbtn.textContent = 'Berjalan...'; stat();
      ti = setInterval(() => { if (my !== gameTok) { clearInterval(ti); clearTimeout(tm); return; } left--; stat(); if (left <= 0) end(); }, 1000);
      pop();
    };
    const hit = i => { if (!run || i !== mole) return; score++; setEmo('surprised', .3); show(-1); clearTimeout(tm); tm = setTimeout(pop, rnd(100, 300)); stat(); };
  }
  function gCatch() {
    const my = ++gameTok, R = 6, K = 5, cells = []; let px = 2, lives = 3, score = 0, items = [], over = false, info;
    openPanel('🧺 Tangkap buah', p => {
      info = doc.createElement('div'); info.style.cssText = 'margin-bottom:6px'; p.appendChild(info);
      const gd = doc.createElement('div'); gd.style.cssText = `display:grid;grid-template-columns:repeat(${K},1fr);gap:2px;margin-bottom:8px;background:#f1f5f9;border-radius:8px;padding:4px`;
      for (let i = 0; i < R * K; i++) { const c = doc.createElement('div'); c.style.cssText = 'height:30px;line-height:30px;text-align:center;font-size:20px'; cells.push(c); gd.appendChild(c); }
      p.appendChild(gd); grid(p, [['⬅️', () => mv(-1)], ['➡️', () => mv(1)]]); grid(p, [['Ulang', gCatch]]); gfoot(p);
    });
    const render = () => {
      cells.forEach(c => { c.textContent = ''; }); items.forEach(it => { cells[it.r * K + it.c].textContent = it.e; });
      cells[(R - 1) * K + px].textContent = over ? '💥' : '🧺';
      info.textContent = over ? `Game over! Skor ${score}` + (score > (st.g.catch || 0) ? ' · rekor baru! 🏆' : '') : `Skor ${score} · Nyawa ${'❤️'.repeat(lives)}` + (st.g.catch ? ` · Rekor ${st.g.catch}` : '');
    };
    const mv = d => { if (over) return; px = clamp(px + d, 0, K - 1); render(); };
    const step = () => {
      items.forEach(it => { it.r++; });
      items = items.filter(it => {
        if (it.r < R - 1) return true;
        if (it.c === px) { if (it.e === '💣') { lives--; setEmo('dizzy', .8); } else { score++; setEmo('happy', .5); } }
        else if (it.e !== '💣') lives--;
        return false;
      });
      if (Math.random() < .6) items.push({ r: 0, c: Math.floor(Math.random() * K), e: Math.random() < .2 ? '💣' : pick(['🍎', '🍌', '🍇']) });
      if (lives <= 0) {
        over = true; if (score > (st.g.catch || 0)) st.g.catch = score;
        if (score >= 15) gain(8, 'win'); setEmo(score >= 10 ? 'sad' : 'happy', 2); saveS();
      }
    };
    const loop = () => { if (my !== gameTok || over) { if (my === gameTok) render(); return; } step(); render(); setTimeout(loop, Math.max(180, 450 - score * 8)); };
    render(); setTimeout(loop, 600);
  }

  /* ---------- pengaturan ---------- */
  const inp = (type, val, extra) => {
    const i = doc.createElement('input'); i.type = type; Object.assign(i, extra || {});
    if (type === 'checkbox') i.checked = !!val; else i.value = val;
    i.style.cssText = 'max-width:130px;font:13px ' + FONT; return i;
  };
  const sel = (opts, val) => {
    const s = doc.createElement('select'); s.style.cssText = 'max-width:130px;font:13px ' + FONT;
    opts.forEach(([v, t]) => { const o = doc.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); });
    s.value = val; return s;
  };
  function exportCfg() {
    const a = doc.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 3, cfg: C, st }, null, 1)], { type: 'application/json' }));
    a.download = 'pet-backup.json'; root.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importCfg() {
    const i = doc.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
    i.onchange = () => {
      const f = i.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result); if (!d || typeof d !== 'object' || !d.cfg || typeof d.cfg !== 'object') throw new Error('format salah');
          for (const k in DEF) if (k in d.cfg && typeof d.cfg[k] === typeof DEF[k]) C[k] = d.cfg[k];
          if (d.st && typeof d.st === 'object') for (const k of ['water', 'kicks', 'fed', 'best', 'hunger', 'happy', 'xp', 'tot', 'ach', 'g', 'seen']) if (k in d.st && typeof d.st[k] === typeof st[k]) st[k] = d.st[k];
          st.g = Object.assign({ rps: [0, 0, 0], ttt: [0, 0, 0], reflex: 0, gaze: 0, mem: 0, whack: 0, catch: 0 }, st.g);
          st.tot = Object.assign({ click: 0, kick: 0, fed: 0, purr: 0, guide: 0, win: 0, water: 0, trick: 0, bestCombo: 0 }, st.tot);
          saveC(); saveS(); applyCfg(); closePanel(); say('Impor berhasil ✅', 2500);
        } catch (e) { say('Gagal impor: ' + e.message, 3500); }
      };
      r.readAsText(f);
    };
    i.click();
  }
  function openSettings() {
    openPanel('⚙️ Pengaturan', p => {
      const f = {};
      const row = (k, label, input) => {
        f[k] = input; const r = doc.createElement('label');
        r.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 0';
        const s = doc.createElement('span'); s.textContent = label; r.append(s, input); p.appendChild(r);
      };
      row('name', 'Nama hewan', inp('text', C.name));
      row('owner', 'Nama kamu', inp('text', C.owner));
      row('animal', 'Hewan', sel(ANIMALS.map(a => [a, a]), C.animal));
      row('hat', 'Aksesori', sel(Object.entries(HATS).map(([v, t]) => [v, HAT_LV[v] > lvl() ? `🔒 ${t} (Lv ${HAT_LV[v]})` : t]), C.hat));
      [...f.hat.options].forEach(o => { if (HAT_LV[o.value] > lvl() && o.value !== C.hat) o.disabled = true; });
      row('desk', 'Mode Desk Buddy', inp('checkbox', C.desk));
      row('eye', 'Warna mata', sel([['#22d3ee', 'Cyan'], ['#4ade80', 'Hijau'], ['#f472b6', 'Pink'], ['#facc15', 'Kuning'], ['#fb923c', 'Oranye']], C.eye));
      row('buddy', 'Teman', sel([['', 'Tanpa']].concat(ANIMALS.map(a => [a, a])), C.buddy));
      row('size', 'Ukuran', inp('range', C.size, { min: 36, max: 96 }));
      row('sound', 'Suara', inp('checkbox', C.sound));
      row('eco', 'Hemat baterai', inp('checkbox', C.eco));
      sec(p, 'Reminder');
      row('sitMin', 'Duduk (mnt, 0=off)', inp('number', C.sitMin, { min: 0 }));
      row('waterMin', 'Minum (mnt, 0=off)', inp('number', C.waterMin, { min: 0 }));
      row('eyeMin', 'Istirahat mata (mnt)', inp('number', C.eyeMin, { min: 0 }));
      row('city', 'Kota sholat', sel(Object.keys(CITIES).map(c => [c, c]), C.city));
      row('before', 'Sholat: ingatkan (mnt)', inp('number', C.before, { min: 0 }));
      row('endTime', 'Jam pulang (kosong=off)', inp('time', C.endTime));
      row('quietFrom', 'Jam tenang mulai', inp('time', C.quietFrom));
      row('quietTo', 'Jam tenang selesai', inp('time', C.quietTo));
      const note = doc.createElement('div'); note.style.cssText = 'color:#666;font-size:12px;margin:6px 0';
      note.textContent = 'Saat jam tenang atau "Diam", reminder ditahan dan dirangkum setelahnya. Sholat tetap tampil (tanpa bunyi). Di jendela mini, hitungan duduk memakai waktu berjalan kecuali idle sistem diaktifkan.';
      p.appendChild(note);
      grid(p, [[sysIdle !== null ? '🖥️ Idle sistem: ON' : '🖥️ Aktifkan idle sistem', async b => { b.textContent = '...'; b.textContent = await enableIdle(); }]]);
      sec(p, 'Cadangan');
      grid(p, [['⬇️ Ekspor', exportCfg], ['⬆️ Impor', importCfg]]);
      grid(p, [
        ['Simpan', () => {
          C.name = f.name.value.trim() || DEF.name; C.owner = f.owner.value.trim();
          C.animal = f.animal.value; C.hat = f.hat.value; C.buddy = f.buddy.value;
          C.desk = f.desk.checked; C.eye = f.eye.value; C.eco = f.eco.checked;
          C.size = clamp(+f.size.value || 52, 36, 96); C.sound = f.sound.checked;
          ['sitMin', 'waterMin', 'eyeMin', 'before'].forEach(k => { C[k] = Math.max(0, +f[k].value || 0); });
          C.city = f.city.value; C.endTime = f.endTime.value; C.quietFrom = f.quietFrom.value; C.quietTo = f.quietTo.value;
          saveC(); applyCfg(); updDnd(); closePanel(); say('Tersimpan ✅', 1500);
        }, '#2563eb'],
        ['Batal', closePanel],
      ]);
    });
  }
  function applyCfg() {
    S = baseS(); animal = C.animal; applySize();
    x = clamp(x, 0, W - S); y = clamp(y, 0, H - S); mkBuddy();
  }

  /* ---------- status, mood, pomodoro, jangan ganggu ---------- */
  const moodTxt = () => st.hunger > 70 ? 'lapar 🍖' : st.happy < 30 ? 'bosan 😴' : st.happy > 70 ? 'senang 😊' : 'santai 🙂';
  function status() {
    const n = Date.now(), np = nextPrayer(n), m = Math.max(0, Math.round((np[1] - n) / 6e4));
    const left = m >= 60 ? Math.floor(m / 60) + ' j ' + (m % 60) + ' mnt' : m + ' mnt';
    let s = `${C.name} · Lv ${lvl()} · ${moodTxt()}\n❤ ${Math.round(st.happy)}%  🍖 ${Math.round(st.hunger)}%\n🕌 ${np[0]} ${left} lagi (${hhmm(np[1])})\n💧 ${st.water} gelas  ⚽ ${st.kicks}  💥 ${st.best}`;
    if (pomo) s += `\n🍅 ${pomo.phase === 'focus' ? 'Fokus' : 'Istirahat'} ${Math.ceil((pomo.end - n) / 6e4)} mnt`;
    if (dnd) s += '\n🔕 Mode diam' + (missed.length ? ` (${missed.length} tertahan)` : '');
    return s;
  }
  function togglePomo() {
    if (pomo) { pomo = null; say('Pomodoro berhenti', 2000); return; }
    pomo = { phase: 'focus', end: Date.now() + 25 * 6e4, cycle: 0 }; say('🍅 Fokus 25 menit dimulai', 3000);
  }
  function pomoStep(n) {
    if (!pomo || n < pomo.end || hold) return;
    if (pomo.phase === 'focus') {
      pomo.cycle++; const m = pomo.cycle % 4 === 0 ? 15 : 5; pomo.phase = 'break'; pomo.end = n + m * 6e4;
      notify(`🍅 Fokus selesai! Istirahat ${m} menit ☕\nBerdiri, minum, regangkan badan.`, [['Oke', () => {}]]);
    } else {
      pomo.phase = 'focus'; pomo.end = n + 25 * 6e4;
      notify('🍅 Istirahat selesai. Yuk fokus 25 menit lagi 💪', [['Mulai', () => {}]]);
    }
  }
  function inQuiet() {
    const a = hm(C.quietFrom), b = hm(C.quietTo); if (a < 0 || b < 0 || a === b) return false;
    const m = nowMin(); return a < b ? m >= a && m < b : m >= a || m < b;
  }
  function endDnd() {
    if (!missed.length) return;
    const list = missed.splice(0).slice(0, 4).map(s => '• ' + s).join('\n');
    toast('🔔 Reminder yang tertahan:\n' + list);
  }
  function updDnd() { const was = dnd; dnd = st.dndUntil > Date.now() || inQuiet(); if (was && !dnd) endDnd(); }
  function toggleDnd() {
    if (dnd) { st.dndUntil = 0; updDnd(); say(dnd ? '🔕 Jam tenang masih aktif' : '🔔 Reminder aktif lagi', 2500); }
    else { st.dndUntil = Date.now() + 36e5; saveS(); updDnd(); say('🔕 Diam 1 jam. Reminder ditahan', 2500); }
    saveS();
  }

  /* ---------- idle ---------- */
  async function startIdle() {
    const d = new IdleDetector(); idleAbort = new AbortController();
    d.addEventListener('change', () => { sysIdle = d.userState === 'idle'; });
    await d.start({ threshold: Math.max(6e4, C.idleMin * 6e4), signal: idleAbort.signal });
    sysIdle = d.userState === 'idle';
  }
  async function enableIdle() {
    try {
      if (!('IdleDetector' in window)) throw new Error('browser tidak mendukung');
      if (await IdleDetector.requestPermission() !== 'granted') throw new Error('izin ditolak');
      await startIdle(); C.sysIdle = true; saveC(); return '🖥️ Idle sistem: ON ✅';
    } catch (e) { return 'Gagal: ' + e.message; }
  }
  const isActive = n => sysIdle !== null ? !sysIdle : window.__aroPip ? true : n - lastAct < C.idleMin * 6e4;
  const evs = ['mousemove', 'keydown', 'scroll', 'pointerdown', 'wheel'];
  const onAct = () => { lastAct = Date.now(); };
  evs.forEach(a => addEventListener(a, onAct, true));
  addEventListener('pointermove', onMove, true);

  /* ---------- reminder ---------- */
  const LINES = [
    'Astaghfirullah, istighfar sebentar yuk 🤲', "Hasbunallah wa ni'mal wakil 🤍", 'Laa hawla wa laa quwwata illaa billaah 🌿',
    'Subhanallahi wa bihamdihi 📿', 'Pelan-pelan, yang penting jalan terus 🐾', 'Satu masalah satu waktu. Kamu bisa 💪',
    'Tarik napas dalam... lalu hembuskan 😮‍💨', 'Sudah kerja keras hari ini, bangga ya 🌟', 'Jangan lupa senyum 🙂', 'Bahu rileks? Turunkan sedikit 🧘',
  ];
  const SEAS = [
    ['halloween', 1020, 1102, 'Musim Halloween! Coba aksesori 🎃 di Pengaturan'],
    ['ri', 801, 831, 'Bulan Kemerdekaan! Coba aksesori 🇮🇩 di Pengaturan'],
    ['ny', 1228, 103, 'Menjelang tahun baru! Coba aksesori 🎆 di Pengaturan'],
  ];
  function rollDay() {
    const d = ymd().join('-');
    if (st.date !== d) { st.date = d; st.water = 0; st.kicks = 0; st.fed = 0; st.best = 0; st.greet = {}; saveS(); }
  }
  function checkPrayer(n) {
    const [y0, m0, d0] = ymd(), T = dayTimes(y0, m0, d0), id = [y0, m0, d0, C.city].join('');
    const jum = new Date(Date.UTC(y0, m0 - 1, d0)).getUTCDay() === 5;
    for (const k in T) {
      const t = T[k].getTime(), kb = id + k + 'b', ka = id + k + 'a', name = k === 'Dzuhur' && jum ? 'Dzuhur (Jumatan)' : k;
      if (n >= t && n < t + 3e5 && !fired[ka]) {
        if (hold) return; fired[ka] = fired[kb] = 1;
        notify(`🕌 Waktu ${name} sudah masuk (${hhmm(T[k])}). Yuk sholat 🤲`, [['Oke', () => {}]], 0, true);
      } else if (C.before > 0 && n >= t - C.before * 6e4 && n < t && !fired[kb]) {
        if (hold) return; fired[kb] = 1;
        notify(`🕌 ${name} ${C.before} menit lagi (${hhmm(T[k])}). Siap-siap wudhu.`, [['Oke', () => {}]], 0, true);
      }
    }
  }
  function checkDay(n) {
    const [y0, m0, d0] = ymd(), id = [y0, m0, d0].join('-'), mm = nowMin(), h = Math.floor(mm / 60);
    const per = h >= 4 && h < 11 ? 'pagi' : h >= 11 && h < 15 ? 'siang' : h >= 15 && h < 18 ? 'sore' : 'malam';
    if (!st.greet[per] && !hold) {
      const who = C.owner ? ', ' + C.owner : '';
      const msg = { pagi: `Selamat pagi${who}! Bismillah, semangat 💪`, siang: `Selamat siang${who}. Sudah makan? 🍚`, sore: `Selamat sore${who}. Sedikit lagi ya 🌤`, malam: `Selamat malam${who}. Jangan lupa istirahat 🌙` }[per];
      if (sayAuto(msg, 7000)) { st.greet[per] = 1; saveS(); }
    }
    const kd = m0 * 100 + d0;
    for (const [key, a, b, msg] of SEAS) {
      const sk = key + '-' + y0, inR = a <= b ? kd >= a && kd <= b : kd >= a || kd <= b;
      if (inR && !st.seen[sk]) { st.seen[sk] = 1; toast(msg); saveS(); }
    }
    const em = hm(C.endTime); if (em < 0 || !isWeekday()) return;
    if (mm >= em && mm < em + 30 && !fired[id + 'end'] && !hold && !dnd) {
      fired[id + 'end'] = fired[id + 'pre'] = 1; weather('confetti', 6);
      notify('🎉 Waktunya pulang! Rapikan meja, jangan lupa istirahat 🎒', [['Siap', () => {}]]);
    } else if (mm >= em - 30 && mm < em && !fired[id + 'pre'] && !hold) {
      if (sayAuto('Sebentar lagi pulang, tinggal ±' + (em - mm) + ' menit 🎒', 8000)) fired[id + 'pre'] = 1;
    }
  }
  function tickR() {
    const n = Date.now(), dt = Math.min(120, (n - lastR) / 1000); lastR = n;
    rollDay(); updDnd(); { const m = nowMin(); night = m >= 22 * 60 || m < 4 * 60; }
    if (isActive(n)) { A.sit += dt; A.eye += dt; A.water += dt; } else { A.sit = 0; A.eye = 0; }
    st.hunger = clamp(st.hunger + dt * .0093, 0, 100);
    st.happy = clamp(st.happy - dt * (st.hunger > 80 ? .02 : .01), 0, 100);
    if (n - lastSave > 3e4) { lastSave = n; saveS(); }
    if (C.sitMin > 0 && A.sit >= C.sitMin * 60 && !hold) {
      A.sit = 0; A.eye = 0;
      notify(`Sudah ±${C.sitMin} menit duduk. Berdiri dulu, regangkan badan 🧘`, [
        ['Peregangan 30 dtk', () => setTimeout(() => startGuide('Peregangan', STRETCH), 0)], ['Oke', () => {}],
        [`Tunda ${C.snoozeMin} menit`, () => { A.sit = (C.sitMin - C.snoozeMin) * 60; }],
      ]);
    }
    if (C.eyeMin > 0 && A.eye >= C.eyeMin * 60 && !hold) {
      A.eye = 0; notify('👀 Istirahat mata: lihat sesuatu yang jauh selama 20 detik.', [['Sudah', () => {}]], 25000);
    }
    if (C.waterMin > 0 && A.water >= C.waterMin * 60 && !hold) {
      A.water = 0;
      notify(`💧 Waktunya minum! Hari ini: ${st.water} gelas.`, [
        ['Sudah minum 💧', () => drink()], ['Nanti 15 mnt', () => { A.water = (C.waterMin - 15) * 60; }],
      ]);
    }
    pomoStep(n); checkPrayer(n); checkDay(n); checkAch();
    if (toasts.length && !dnd && say(toasts[0], 6000)) toasts.shift();
    if (st.hunger > 75 && n - lastHungry > 18e5 && !hold && sayAuto('Aku lapar 🍖 (klik kanan → Makan)', 4000)) lastHungry = n;
    if (n >= nextChat && !hold && mode !== 'sleep') {
      const pool = LINES.slice();
      if (st.hunger > 60) pool.push('Perutku keroncongan... 🍖');
      if (st.happy < 40) pool.push('Main yuk, bosen nih ⚽');
      if (sayAuto(pick(pool), 6000)) nextChat = n + rnd(30, 50) * 6e4;
    }
  }
  const iv = setInterval(tickR, 1e4);

  /* ---------- lifecycle ---------- */
  const rs = () => {
    W = innerWidth; H = innerHeight; x = clamp(x, 0, W - S); y = clamp(y, 0, H - S);
    if (wx) { wx.cv.width = W; wx.cv.height = H; }
    if (bud) bud.x = clamp(bud.x, 0, W - bud.s);
  };
  addEventListener('resize', rs);
  function destroy() {
    gameTok++; cancelAnimationFrame(raf); clearInterval(iv); clearTimeout(bt); clearTimeout(ht);
    evs.forEach(a => removeEventListener(a, onAct, true)); removeEventListener('resize', rs); removeEventListener('pointermove', onMove, true);
    if (idleAbort) idleAbort.abort();
    saveS(); removeItem(); if (bud) bud.el.remove(); if (wx) wx.cv.remove();
    panel.remove(); el.remove(); delete window.__aroPet;
  }
  window.__aroPet = { destroy, setEmo };
  applyCfg(); updDnd();
  if (C.sysIdle && 'IdleDetector' in window && navigator.permissions) {
    navigator.permissions.query({ name: 'idle-detection' }).then(p => { if (p.state === 'granted') startIdle().catch(() => {}); }).catch(() => {});
  }
  setTimeout(tickR, 1500);
  raf = requestAnimationFrame(tick);
})();
