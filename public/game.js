'use strict';
/* Snow Sparkle Match: a small winter match-3. No dependencies. */

const N = 7;
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (n) => Math.floor(Math.random() * n);

/* ---------- levels ---------- */
const LEVELS = [
  { moves: 20, types: 5, goal: { kind: 'score', n: 500 } },
  { moves: 24, types: 5, goal: { kind: 'collect', type: 0, n: 15 } },
  { moves: 32, types: 5, goal: { kind: 'frost', map: ['.......', '.......', '..XXX..', '..XXX..', '..XXX..', '.......', '.......'] } },
  { moves: 28, types: 6, goal: { kind: 'score', n: 1000 } },
  { moves: 30, types: 6, goal: { kind: 'collect', type: 1, n: 16 } },
  { moves: 40, types: 5, goal: { kind: 'frost', map: ['.......', '..X.X..', '.XXXXX.', '..XXX..', '...X...', '.......', '.......'] } },
];

/* ---------- save ---------- */
let save = { stars: [], muted: false };
try { save = Object.assign(save, JSON.parse(localStorage.getItem('ssm-save') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('ssm-save', JSON.stringify(save)); } catch (e) {} };

/* ---------- art ---------- */
function starPts(cx, cy, R, r) {
  let p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r : R;
    p.push((cx + q * Math.cos(a)).toFixed(1) + ',' + (cy + q * Math.sin(a)).toFixed(1));
  }
  return p.join(' ');
}
const SHAPES = [
  // 0 snowflake
  () => {
    let arms = '';
    for (let i = 0; i < 6; i++) arms += `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50V16M50 28l-9-8M50 28l9-8"/></g>`;
    return `<circle cx="50" cy="50" r="44" fill="#3fa9f5" stroke="#fff" stroke-width="5"/><g stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none">${arms}</g>`;
  },
  // 1 heart
  () => `<path d="M50 90C8 60 4 30 26 18c13-6 24 4 24 14 0-10 11-20 24-14 22 12 18 42-24 72z" fill="#ff5fa2" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><ellipse cx="32" cy="34" rx="7" ry="10" fill="#fff" opacity=".5" transform="rotate(-30 32 34)"/>`,
  // 2 star
  () => `<polygon points="${starPts(50, 53, 46, 21)}" fill="#ffd23c" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><circle cx="40" cy="44" r="6" fill="#fff" opacity=".6"/>`,
  // 3 gem
  () => `<polygon points="50,6 90,40 50,94 10,40" fill="#a66bff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><polygon points="50,6 68,40 50,94 32,40" fill="#c9a4ff"/><path d="M10 40H90" stroke="#fff" stroke-width="3" opacity=".7"/>`,
  // 4 drop
  () => `<path d="M50 6C50 6 16 46 16 64a34 34 0 0 0 68 0C84 46 50 6 50 6z" fill="#2fd6b5" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><ellipse cx="38" cy="62" rx="7" ry="12" fill="#fff" opacity=".5"/>`,
  // 5 moon
  () => `<path d="M64 8A44 44 0 1 0 92 66 36 36 0 1 1 64 8z" fill="#ff9d42" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>`,
];
const OVERLAY = {
  h: `<g stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M22 50H78M32 38L20 50l12 12M68 38l12 12-12 12" stroke="#26357f" stroke-width="13"/><path d="M22 50H78M32 38L20 50l12 12M68 38l12 12-12 12"/></g>`,
  v: `<g transform="rotate(90 50 50)" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M22 50H78M32 38L20 50l12 12M68 38l12 12-12 12" stroke="#26357f" stroke-width="13"/><path d="M22 50H78M32 38L20 50l12 12M68 38l12 12-12 12"/></g>`,
};
function bombSVG() {
  const cols = ['#3fa9f5', '#ff5fa2', '#ffd23c', '#a66bff', '#2fd6b5', '#ff9d42'];
  let dots = '';
  cols.forEach((c, i) => {
    const a = (i * Math.PI) / 3;
    dots += `<circle cx="${(50 + 26 * Math.cos(a)).toFixed(1)}" cy="${(50 + 26 * Math.sin(a)).toFixed(1)}" r="9" fill="${c}"/>`;
  });
  return `<circle cx="50" cy="50" r="45" fill="#fff" stroke="#26357f" stroke-width="4"/>${dots}<polygon points="${starPts(50, 50, 15, 6)}" fill="#26357f"/>`;
}
function tileSVG(type, special) {
  const body = special === 'bomb' ? bombSVG() : SHAPES[type]() + (special ? OVERLAY[special] : '');
  return `<svg viewBox="0 0 100 100">${body}</svg>`;
}
/* Princess Lumi: original character. pale gold hair buns, blue star clips, snowflake tiara, ice-blue gown. */
function lumiSVG(happy) {
  const mouth = happy
    ? '<path d="M84 122q16 20 32 0z" fill="#b0405f"/>'
    : '<path d="M86 124q14 12 28 0" fill="none" stroke="#b0405f" stroke-width="4" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 200 200">
  <path d="M34 200q8-52 66-54 58 2 66 54z" fill="#4fb8ee"/>
  <circle cx="50" cy="62" r="25" fill="#f7e3a0"/><circle cx="150" cy="62" r="25" fill="#f7e3a0"/>
  <circle cx="100" cy="94" r="58" fill="#f7e3a0"/>
  <ellipse cx="100" cy="154" rx="50" ry="15" fill="#fff"/>
  <ellipse cx="100" cy="104" rx="45" ry="46" fill="#eeb98f"/>
  <path d="M54 100q0-52 46-52t46 52q-18-30-46-26-28-4-46 26z" fill="#f7e3a0"/>
  <polygon points="${starPts(50, 58, 11, 5)}" fill="#3fa9f5"/><polygon points="${starPts(150, 58, 11, 5)}" fill="#3fa9f5"/>
  <path d="M72 56l8-20 10 13 10-23 10 23 10-13 8 20z" fill="#d8f3ff" stroke="#7cc8f5" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="100" cy="46" r="5" fill="#ff5fa2"/>
  <ellipse cx="82" cy="104" rx="7" ry="9" fill="#2b2140"/><ellipse cx="118" cy="104" rx="7" ry="9" fill="#2b2140"/>
  <circle cx="84.500" cy="100" r="3" fill="#fff"/><circle cx="120.500" cy="100" r="3" fill="#fff"/>
  <circle cx="68" cy="120" r="9" fill="#ff8fb0" opacity=".55"/><circle cx="132" cy="120" r="9" fill="#ff8fb0" opacity=".55"/>
  ${mouth}
  <circle cx="100" cy="156" r="7" fill="#7cc8f5" stroke="#fff" stroke-width="2"/>
</svg>`;
}
const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#fff"/><path d="M16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/></svg>';
const ICON_MUTE = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#fff"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

/* ---------- audio (all synthesized, original tune) ---------- */
const audio = (() => {
  let ctx, master, music, timer, nextBar = 0, bar = 0;
  const BEAT = 0.62;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // chord: [bass, arp notes]
  const F = [53, [65, 69, 72]], C = [48, [64, 67, 72]], Dm = [50, [62, 65, 69]], Bb = [46, [62, 65, 70]], Am = [45, [64, 69, 72]];
  const SONG = [
    [F, [[69, 1], [72, 1], [77, 1.5], [76, 0.5]]],
    [C, [[74, 1], [72, 1], [67, 2]]],
    [Dm, [[65, 1], [69, 1], [74, 1.5], [72, 0.5]]],
    [Bb, [[70, 1], [69, 1], [65, 2]]],
    [F, [[69, 1], [72, 1], [77, 1], [81, 1]]],
    [Am, [[79, 1.5], [76, 0.5], [72, 2]]],
    [Bb, [[74, 1], [77, 1], [82, 1], [81, 1]]],
    [C, [[79, 2], [72, 1], [76, 1]]],
  ];
  function tone(f, t, dur, type, vol, dest, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function bell(m, t, dur, vol, dest) {
    tone(hz(m), t, dur, 'sine', vol, dest);
    tone(hz(m) * 2, t, dur * 0.5, 'sine', vol * 0.35, dest);
    tone(hz(m) * 3, t, dur * 0.25, 'sine', vol * 0.12, dest);
  }
  function scheduleBar(t) {
    const [chord, mel] = SONG[bar % SONG.length];
    tone(hz(chord[0]), t, BEAT * 2, 'triangle', 0.16, music);
    tone(hz(chord[0]), t + BEAT * 2, BEAT * 2, 'triangle', 0.12, music);
    for (let i = 0; i < 8; i++) {
      const n = chord[1][[0, 1, 2, 1, 0, 1, 2, 1][i]];
      tone(hz(n), t + (i * BEAT) / 2, BEAT * 0.9, 'triangle', 0.05, music);
    }
    let b = 0;
    for (const [m, d] of mel) { bell(m, t + b * BEAT, d * BEAT * 1.6, 0.16, music); b += d; }
    bar++;
  }
  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextBar < ctx.currentTime) nextBar = ctx.currentTime + 0.1;
    while (nextBar < ctx.currentTime + 0.6) { scheduleBar(nextBar); nextBar += BEAT * 4; }
  }
  function init() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = save.muted ? 0 : 1; master.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
    timer = setInterval(tick, 150);
    tick();
  }
  const now = () => ctx.currentTime + 0.01;
  const ok = () => ctx && ctx.state === 'running';
  const SCALE = [72, 74, 77, 79, 81, 84, 86, 89];
  return {
    init,
    setMuted(m) { if (master) master.gain.value = m ? 0 : 1; },
    pause() { if (ctx) ctx.suspend(); },
    resume() { if (ctx) ctx.resume(); },
    tap() { if (ok()) tone(900, now(), 0.06, 'sine', 0.12); },
    swap() { if (ok()) tone(420, now(), 0.12, 'sine', 0.18, null, 760); },
    bad() { if (ok()) { tone(220, now(), 0.12, 'triangle', 0.22); tone(180, now() + 0.1, 0.16, 'triangle', 0.22); } },
    match(combo) {
      if (!ok()) return;
      const i = Math.min(combo - 1, SCALE.length - 1), t = now();
      bell(SCALE[i], t, 0.5, 0.25); bell(SCALE[i] + 4, t + 0.07, 0.5, 0.18);
    },
    blast() { if (ok()) { tone(1500, now(), 0.35, 'sawtooth', 0.08, null, 250); tone(2000, now(), 0.3, 'sine', 0.15, null, 500); } },
    win() { if (ok()) [65, 69, 72, 77, 81, 84].forEach((m, i) => bell(m, now() + i * 0.11, 0.9, 0.25)); },
    lose() { if (ok()) [72, 69, 65].forEach((m, i) => bell(m, now() + i * 0.22, 0.7, 0.2)); },
  };
})();

/* ---------- game state ---------- */
const boardEl = $('#board');
let grid, frost, cells, L, levelIdx = 0;
let score, moves, collected, frostTotal, frostLeft;
let busy = true, selected = null, hintTimer = null, hinted = [];

const pos = (el, r, c) => { el.style.transform = `translate(${c * 100}%,${r * 100}%)`; };

function makeTile(type, r, c, special, fromRow) {
  const el = document.createElement('div');
  el.className = 'tile' + (special ? ' special' : '');
  el.innerHTML = tileSVG(type, special);
  const t = { type, special: special || null, el, r, c };
  if (fromRow !== undefined) {
    el.style.transition = 'none';
    pos(el, fromRow, c);
    boardEl.appendChild(el);
    void el.offsetWidth;
    el.style.transition = '';
  } else boardEl.appendChild(el);
  pos(el, r, c);
  return t;
}

function findRuns() {
  const runs = [];
  const scan = (get, dir) => {
    for (let a = 0; a < N; a++) {
      let start = 0;
      for (let b = 1; b <= N; b++) {
        const prev = get(a, start), cur = b < N ? get(a, b) : null;
        if (!cur || !prev || cur.type !== prev.type || cur.type < 0) {
          if (prev && prev.type >= 0 && b - start >= 3) {
            const run = { dir, type: prev.type, tiles: [] };
            for (let k = start; k < b; k++) run.tiles.push(get(a, k));
            runs.push(run);
          }
          start = b;
        }
      }
    }
  };
  scan((a, b) => grid[a][b], 'h');
  scan((a, b) => grid[b][a], 'v');
  return runs;
}

function findMove() {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 >= N || c2 >= N) continue;
      const a = grid[r][c], b = grid[r2][c2];
      if (a.special === 'bomb' || b.special === 'bomb') return [a, b];
      grid[r][c] = b; grid[r2][c2] = a;
      const hit = findRuns().length > 0;
      grid[r][c] = a; grid[r2][c2] = b;
      if (hit) return [a, b];
    }
  }
  return null;
}

function startLevel(i) {
  levelIdx = i; L = LEVELS[i];
  score = 0; moves = L.moves; collected = 0; selected = null; clearHint();
  boardEl.innerHTML = '';
  frost = []; cells = []; frostTotal = 0;
  for (let r = 0; r < N; r++) {
    frost.push([]); cells.push([]);
    for (let c = 0; c < N; c++) {
      const f = L.goal.kind === 'frost' && L.goal.map[r][c] === 'X';
      frost[r].push(f); if (f) frostTotal++;
      const el = document.createElement('div');
      el.className = 'cell' + (f ? ' frost' : '');
      pos(el, r, c); boardEl.appendChild(el); cells[r].push(el);
    }
  }
  frostLeft = frostTotal;
  do {
    boardEl.querySelectorAll('.tile').forEach((e) => e.remove());
    grid = [];
    for (let r = 0; r < N; r++) {
      grid.push([]);
      for (let c = 0; c < N; c++) {
        let t;
        do { t = rnd(L.types); } while (
          (c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) ||
          (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t));
        grid[r].push(makeTile(t, r, c, null, r - N));
      }
    }
  } while (!findMove());
  $('#lvlName').textContent = 'Level ' + (i + 1);
  updateHUD();
  show('game');
  busy = false;
  scheduleHint();
}

function goalProgress() {
  const g = L.goal;
  if (g.kind === 'score') return [score, g.n];
  if (g.kind === 'collect') return [collected, g.n];
  return [frostTotal - frostLeft, frostTotal];
}
function updateHUD() {
  const g = L.goal, [have, need] = goalProgress();
  const shown = Math.min(have, need);
  let html;
  if (g.kind === 'score') html = `Score ${shown} / ${need}`;
  else if (g.kind === 'collect') html = `${tileSVG(g.type)} ${shown} / ${need}`;
  else html = `Frost ${shown} / ${need}`;
  $('#goal').innerHTML = html;
  $('#barFill').style.width = (100 * shown) / need + '%';
  $('#moves').textContent = moves;
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

function beam(r, c, dir) {
  const el = document.createElement('div');
  el.className = 'beam';
  const u = 100 / N;
  if (dir === 'h') Object.assign(el.style, { left: 0, width: '100%', top: (r + 0.3) * u + '%', height: u * 0.4 + '%' });
  else Object.assign(el.style, { top: 0, height: '100%', left: (c + 0.3) * u + '%', width: u * 0.4 + '%' });
  boardEl.appendChild(el);
  setTimeout(() => el.remove(), 320);
}

/* Ice magic: snowflake bolts fly from the princess portrait to each fired special, then burst. */
const MAGIC_MS = 260;
const BOLT_SVG = (() => {
  let arms = '';
  for (let i = 0; i < 6; i++) arms += `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50V10M50 26l-11-10M50 26l11-10"/></g>`;
  return `<svg viewBox="0 0 100 100"><g stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none">${arms}</g></svg>`;
})();
function burst(x, y) {
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'spark';
    document.body.appendChild(el);
    const a = (i * Math.PI) / 6 + Math.random() * 0.4, d = 36 + rnd(46);
    el.animate(
      [{ transform: `translate(${x}px,${y}px) scale(1.4)`, opacity: 1 },
       { transform: `translate(${x + d * Math.cos(a)}px,${y + d * Math.sin(a)}px) scale(0)`, opacity: 0 }],
      { duration: 420 + rnd(200), easing: 'ease-out' }
    ).onfinish = () => el.remove();
  }
}
function castMagic(tiles) {
  const por = $('#portrait'), p = por.getBoundingClientRect();
  const b = boardEl.getBoundingClientRect(), s = b.width / N;
  const px = p.left + p.width / 2, py = p.top + p.height / 2;
  por.classList.remove('cast'); void por.offsetWidth; por.classList.add('cast');
  for (const t of tiles) {
    const tx = b.left + (t.c + 0.5) * s, ty = b.top + (t.r + 0.5) * s;
    const el = document.createElement('div');
    el.className = 'bolt';
    el.innerHTML = BOLT_SVG;
    document.body.appendChild(el);
    el.animate(
      [{ transform: `translate(${px}px,${py}px) scale(.4) rotate(0deg)` },
       { transform: `translate(${tx}px,${ty}px) scale(1.5) rotate(360deg)` }],
      { duration: MAGIC_MS, easing: 'ease-in' }
    ).onfinish = () => { el.remove(); burst(tx, ty); };
  }
}

function commonType() {
  const n = {};
  let best = 0, bt = 0;
  for (const row of grid) for (const t of row) if (t && t.type >= 0) { n[t.type] = (n[t.type] || 0) + 1; if (n[t.type] > best) { best = n[t.type]; bt = t.type; } }
  return bt;
}

/* Clear a set of tiles (firing any specials among them), spawn new specials, then apply gravity. */
async function clearTiles(set, spawns, combo) {
  const queue = [...set];
  const fired = [];
  const add = (t) => { if (t && !set.has(t)) { set.add(t); queue.push(t); } };
  while (queue.length) {
    const t = queue.pop();
    if (!t.special || t.fired) continue;
    t.fired = true; fired.push(t);
    if (t.special === 'h') { for (let i = 0; i < N; i++) add(grid[t.r][i]); }
    else if (t.special === 'v') { for (let i = 0; i < N; i++) add(grid[i][t.c]); }
    else {
      const target = t.target !== undefined ? t.target : commonType();
      for (const row of grid) for (const o of row) if (o && o.type === target) add(o);
    }
  }
  const blasted = fired.length > 0;
  if (blasted) {
    // the princess throws ice magic at each special before it goes off
    castMagic(fired);
    await sleep(MAGIC_MS);
    for (const t of fired) if (t.special !== 'bomb') beam(t.r, t.c, t.special);
  }
  for (const t of set) {
    score += 10 * combo;
    if (L.goal.kind === 'collect' && t.type === L.goal.type) collected++;
    if (frost[t.r][t.c]) { frost[t.r][t.c] = false; frostLeft--; cells[t.r][t.c].classList.remove('frost'); }
    grid[t.r][t.c] = null;
    t.el.classList.add('pop');
  }
  audio.match(combo);
  if (blasted) audio.blast();
  if (combo === 3) toast('Sparkly!'); else if (combo === 5) toast('Snow-tastic!');
  updateHUD();
  await sleep(230);
  for (const t of set) t.el.remove();
  for (const s of spawns) if (!grid[s.r][s.c]) grid[s.r][s.c] = makeTile(s.type, s.r, s.c, s.special);
  // gravity
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      const t = grid[r][c];
      if (!t) continue;
      if (r !== w) { grid[w][c] = t; grid[r][c] = null; t.r = w; pos(t.el, w, c); }
      w--;
    }
    const gap = w + 1;
    for (let r = w; r >= 0; r--) grid[r][c] = makeTile(rnd(L.types), r, c, null, r - gap);
  }
  await sleep(290);
}

async function resolve(combo, moved) {
  for (;;) {
    const runs = findRuns();
    if (!runs.length) return;
    const set = new Set(), spawns = [];
    for (const run of runs) {
      run.tiles.forEach((t) => set.add(t));
      if (run.tiles.length >= 4) {
        const at = (moved && run.tiles.find((t) => moved.includes(t))) || run.tiles[1];
        const big = run.tiles.length >= 5;
        spawns.push({ r: at.r, c: at.c, type: big ? -1 : run.type, special: big ? 'bomb' : run.dir });
      }
    }
    await clearTiles(set, spawns, combo);
    combo++; moved = null;
  }
}

function swapTiles(a, b) {
  const { r, c } = a;
  grid[b.r][b.c] = a; grid[r][c] = b;
  a.r = b.r; a.c = b.c; b.r = r; b.c = c;
  pos(a.el, a.r, a.c); pos(b.el, b.r, b.c);
}

async function trySwap(a, b) {
  if (busy || !a || !b) return;
  busy = true; clearHint(); select(null);
  swapTiles(a, b); audio.swap();
  await sleep(220);
  const aB = a.special === 'bomb', bB = b.special === 'bomb';
  if (aB || bB) {
    const set = new Set();
    if (aB && bB) { for (const row of grid) for (const t of row) set.add(t); audio.blast(); }
    else { const bomb = aB ? a : b, other = aB ? b : a; bomb.target = other.type; set.add(bomb); }
    await clearTiles(set, [], 1);
    await resolve(2, null);
  } else {
    if (!findRuns().length) {
      swapTiles(a, b); audio.bad();
      await sleep(220);
      busy = false; scheduleHint();
      return;
    }
    await resolve(1, [a, b]);
  }
  moves--; updateHUD();
  const [have, need] = goalProgress();
  if (have >= need) return finish(true);
  if (moves <= 0) return finish(false);
  if (!findMove()) await shuffle();
  busy = false; scheduleHint();
}

async function shuffle() {
  toast('Shuffle!');
  const tiles = grid.flat().filter((t) => t.special !== 'bomb');
  for (let tries = 0; tries < 200; tries++) {
    const types = tiles.map((t) => t.type);
    for (let i = types.length - 1; i > 0; i--) { const j = rnd(i + 1); [types[i], types[j]] = [types[j], types[i]]; }
    tiles.forEach((t, i) => { t.type = types[i]; });
    if (!findRuns().length && findMove()) break;
  }
  tiles.forEach((t) => { t.el.innerHTML = tileSVG(t.type, t.special); });
  await sleep(500);
  await resolve(1, null);
}

/* ---------- hints & selection ---------- */
function clearHint() {
  clearTimeout(hintTimer);
  hinted.forEach((t) => t.el.classList.remove('hint'));
  hinted = [];
}
function scheduleHint() {
  clearHint();
  hintTimer = setTimeout(() => {
    if (busy) return;
    const m = findMove();
    if (m) { hinted = m; m.forEach((t) => t.el.classList.add('hint')); }
  }, 6000);
}
function select(t) {
  if (selected) selected.el.classList.remove('sel');
  selected = t;
  if (t) t.el.classList.add('sel');
}

/* ---------- input ---------- */
let down = null;
function cellAt(e) {
  const b = boardEl.getBoundingClientRect(), s = b.width / N;
  const c = Math.floor((e.clientX - b.left) / s), r = Math.floor((e.clientY - b.top) / s);
  return r >= 0 && r < N && c >= 0 && c < N ? { r, c, s } : null;
}
boardEl.addEventListener('pointerdown', (e) => {
  audio.init();
  if (busy) return;
  const p = cellAt(e);
  if (!p) return;
  down = { ...p, x: e.clientX, y: e.clientY, swiped: false };
  try { boardEl.setPointerCapture(e.pointerId); } catch (err) {}
});
boardEl.addEventListener('pointermove', (e) => {
  if (!down || down.swiped || busy) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y, th = down.s * 0.35;
  if (Math.abs(dx) < th && Math.abs(dy) < th) return;
  const horiz = Math.abs(dx) > Math.abs(dy);
  const r2 = down.r + (horiz ? 0 : Math.sign(dy)), c2 = down.c + (horiz ? Math.sign(dx) : 0);
  down.swiped = true;
  if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) return;
  trySwap(grid[down.r][down.c], grid[r2][c2]);
});
const up = () => {
  if (!down) return;
  const d = down; down = null;
  if (d.swiped || busy) return;
  const t = grid[d.r][d.c];
  if (selected && selected !== t && Math.abs(selected.r - t.r) + Math.abs(selected.c - t.c) === 1) trySwap(selected, t);
  else { select(selected === t ? null : t); audio.tap(); scheduleHint(); }
};
boardEl.addEventListener('pointerup', up);
boardEl.addEventListener('pointercancel', () => { down = null; });

/* ---------- screens ---------- */
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}
function showLevels() {
  busy = true; clearHint();
  const g = $('#levelGrid');
  g.innerHTML = '';
  LEVELS.forEach((_, i) => {
    const b = document.createElement('button');
    const st = save.stars[i] || 0;
    b.className = 'lvl';
    b.disabled = i > 0 && !save.stars[i - 1];
    b.innerHTML = `<b>${i + 1}</b><span>${'★'.repeat(st)}</span>`;
    b.onclick = () => { audio.init(); audio.tap(); startLevel(i); };
    g.appendChild(b);
  });
  show('levels');
}
async function finish(won) {
  busy = true; clearHint();
  await sleep(350);
  const last = levelIdx === LEVELS.length - 1;
  let stars = 0;
  if (won) {
    const left = moves / L.moves;
    stars = left >= 0.3 ? 3 : left >= 0.1 ? 2 : 1;
    save.stars[levelIdx] = Math.max(save.stars[levelIdx] || 0, stars);
    persist();
    audio.win();
  } else audio.lose();
  $('#modalHero').innerHTML = lumiSVG(won);
  $('#modalTitle').textContent = won ? (last ? 'You did it all!' : 'Level complete!') : 'So close!';
  $('#modalStars').innerHTML = won ? '★'.repeat(stars) + `<span class="off">${'★'.repeat(3 - stars)}</span>` : '';
  $('#modalText').textContent = won ? `Score: ${score}` : 'You can do it. Try again?';
  const main = $('#modalMain');
  main.textContent = won ? (last ? 'Play again' : 'Next') : 'Try again';
  main.onclick = () => { $('#modal').hidden = true; startLevel(won ? (last ? 0 : levelIdx + 1) : levelIdx); };
  $('#modalAlt').onclick = () => { $('#modal').hidden = true; showLevels(); };
  $('#modal').hidden = false;
}

/* ---------- boot ---------- */
$('#heroBig').innerHTML = lumiSVG(true);
$('#portrait').innerHTML = lumiSVG(false);
const muteBtn = $('#muteBtn');
const drawMute = () => { muteBtn.innerHTML = save.muted ? ICON_MUTE : ICON_SOUND; };
drawMute();
muteBtn.onclick = () => { audio.init(); save.muted = !save.muted; persist(); audio.setMuted(save.muted); drawMute(); };
$('#playBtn').onclick = () => { audio.init(); audio.tap(); showLevels(); };
$('#levelsBack').onclick = () => show('title');
$('#backBtn').onclick = () => { if (!busy) showLevels(); };
document.addEventListener('visibilitychange', () => { document.hidden ? audio.pause() : audio.resume(); });
document.addEventListener('gesturestart', (e) => e.preventDefault());

const snow = $('#snow');
for (let i = 0; i < 28; i++) {
  const f = document.createElement('i');
  const s = 3 + rnd(6);
  f.style.cssText = `left:${rnd(100)}vw;width:${s}px;height:${s}px;animation-duration:${7 + rnd(9)}s;animation-delay:-${rnd(16)}s;opacity:${0.35 + Math.random() * 0.5}`;
  snow.appendChild(f);
}
