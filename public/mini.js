'use strict';
/* Mini-games: "Ice Magic" (free-play frost painting) and "Snow Catch" (tap drops to freeze them).
   Both are no-fail. Uses helpers from game.js: $, rnd, show, audio, lumiSVG, burst, BOLT_SVG. */
(() => {
  const cv = $('#miniCanvas'), g = cv.getContext('2d');
  let mode = null, raf = 0, W = 0, H = 0, last = 0;
  let flakes = [], drops = [], caught = 0, spawnIn = 0, elapsed = 0, lastChime = 0, lastPt = null;

  function resize() {
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    g.setTransform(d, 0, 0, d, 0, 0);
  }
  function drawFlake(x, y, size, rot, alpha, color) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.globalAlpha = alpha; g.strokeStyle = color || '#fff'; g.lineCap = 'round';
    g.lineWidth = Math.max(1.500, size * 0.12);
    g.shadowColor = '#9fe1ff'; g.shadowBlur = size * 0.5;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a);
      g.moveTo(0, 0); g.lineTo(c * size, s * size);
      for (const side of [-1, 1]) {
        const b = a + side * 0.7;
        g.moveTo(c * size * 0.6, s * size * 0.6);
        g.lineTo(c * size * 0.6 + Math.cos(b) * size * 0.3, s * size * 0.6 + Math.sin(b) * size * 0.3);
      }
    }
    g.stroke(); g.restore();
  }
  function drawDrop(x, y, r) {
    g.save(); g.translate(x, y);
    g.beginPath(); g.moveTo(0, -r * 1.500);
    g.bezierCurveTo(r * 1.100, -r * 0.200, r, r, 0, r);
    g.bezierCurveTo(-r, r, -r * 1.100, -r * 0.200, 0, -r * 1.500);
    g.fillStyle = '#2fd6b5'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
    g.beginPath(); g.ellipse(-r * 0.350, r * 0.150, r * 0.180, r * 0.350, 0, 0, 7); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
    g.restore();
  }
  function chime() {
    const t = performance.now();
    if (t - lastChime < 140) return;
    lastChime = t; audio.match(1 + rnd(8));
  }
  /* the princess throws a snowflake bolt to a point on the canvas */
  function zap(x, y) {
    const por = $('#miniPortrait'), p = por.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const px = p.left + p.width / 2, py = p.top + p.height / 2, tx = c.left + x, ty = c.top + y;
    por.classList.remove('cast'); void por.offsetWidth; por.classList.add('cast');
    const el = document.createElement('div');
    el.className = 'bolt'; el.innerHTML = BOLT_SVG;
    document.body.appendChild(el);
    el.animate(
      [{ transform: `translate(${px}px,${py}px) scale(.4) rotate(0deg)` }, { transform: `translate(${tx}px,${ty}px) scale(1.300) rotate(360deg)` }],
      { duration: 200, easing: 'ease-in' }
    ).onfinish = () => { el.remove(); burst(tx, ty); };
  }
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const addFlake = (x, y, size, life) => flakes.push({ x, y, size, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.6, age: 0, life, vy: 0 });

  cv.addEventListener('pointerdown', (e) => {
    audio.init();
    const p = pt(e);
    if (mode === 'paint') {
      lastPt = p; zap(p.x, p.y); addFlake(p.x, p.y, 30 + rnd(26), 9); chime();
    } else if (mode === 'catch') {
      let best = null, bd = 60;
      for (const d of drops) { const k = Math.hypot(d.x - p.x, d.y - p.y); if (!d.frozen && k < bd) { bd = k; best = d; } }
      if (best) {
        best.frozen = true; best.age = 0; caught++;
        zap(best.x, best.y); chime();
        $('#miniInfo').textContent = 'Snowflakes: ' + caught;
      } else audio.tap();
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (mode !== 'paint' || !lastPt) return;
    const p = pt(e);
    if (Math.hypot(p.x - lastPt.x, p.y - lastPt.y) < 22) return;
    lastPt = p; addFlake(p.x + rnd(14) - 7, p.y + rnd(14) - 7, 9 + rnd(16), 7); chime();
  });
  const end = () => { lastPt = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    g.clearRect(0, 0, W, H);
    if (mode === 'catch') {
      elapsed += dt; spawnIn -= dt;
      if (spawnIn <= 0 && drops.length < 7) {
        const r = 20 + rnd(8);
        drops.push({ x: r + 10 + Math.random() * (W - 2 * r - 20), y: -40, r, v: 55 + Math.min(70, elapsed * 1.200) + rnd(30), frozen: false, age: 0, rot: 0 });
        spawnIn = Math.max(0.550, 1.300 - elapsed * 0.012);
      }
      for (const d of drops) {
        if (d.frozen) { d.age += dt; d.y -= 40 * dt; d.rot += dt * 2; drawFlake(d.x, d.y, d.r * 1.200, d.rot, Math.max(0, 1 - d.age / 1.600)); }
        else { d.y += d.v * dt; drawDrop(d.x, d.y, d.r); }
      }
      drops = drops.filter((d) => (d.frozen ? d.age < 1.600 : d.y < H + 50));
    }
    for (const f of flakes) {
      f.age += dt; f.rot += f.spin * dt;
      const grow = Math.min(1, f.age / 0.350), fade = Math.min(1, (f.life - f.age) / 2);
      drawFlake(f.x, f.y, f.size * grow, f.rot, Math.max(0, fade));
    }
    flakes = flakes.filter((f) => f.age < f.life);
    if (flakes.length > 260) flakes.splice(0, flakes.length - 260);
    raf = requestAnimationFrame(frame);
  }
  function start(m) {
    audio.init(); audio.tap();
    mode = m; flakes = []; drops = []; caught = 0; spawnIn = 0.400; elapsed = 0; lastPt = null;
    $('#miniName').textContent = m === 'paint' ? 'Ice Magic' : 'Snow Catch';
    $('#miniInfo').textContent = m === 'paint' ? 'Draw with your finger' : 'Tap the drops to freeze them';
    show('mini'); resize();
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() { mode = null; cancelAnimationFrame(raf); show('title'); }

  $('#miniPortrait').innerHTML = lumiSVG(true);
  $('#paintBtn').onclick = () => start('paint');
  $('#catchBtn').onclick = () => start('catch');
  $('#miniBack').onclick = stop;
  window.addEventListener('resize', () => { if (mode) resize(); });
  window.__mini = { state: () => ({ mode, flakes: flakes.length, drops: drops.map((d) => ({ x: d.x, y: d.y, frozen: d.frozen })), caught }) };
})();
