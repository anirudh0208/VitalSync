/* global app.js → Chart.js loaded from CDN inside this file via dynamic script */

// ─── Bootstrap ────────────────────────────────────────────────────────────────
(function () {
  // Inject Chart.js
  const chartScript = document.createElement('script');
  chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
  chartScript.onload = init;
  document.head.appendChild(chartScript);
})();

// ─── Globals ──────────────────────────────────────────────────────────────────
let optimizerPriority = 'distance';
let optimizerTraffic = 'light';
let fleetData = [];
let allCarriers = [];
let activityInterval, aiInterval, tickerInterval, kpiInterval;

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  setupNavbar();
  setupHeroCanvas();
  animateHeroStats();
  setupTicker();
  setupFleetMap();
  setupActivityFeed();
  setupAIInsights();
  setupOptimizer();
  setupAnalytics();
  setupFleetGrid();
  setupTracker();
  setupIntersectionObserver();
  setupKPILive();
  setupSectionNav();
  setupHamburger();
  setupNotifications();
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function smoothScroll(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
window.smoothScroll = smoothScroll;

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }
function pick(arr) { return arr[randInt(0, arr.length)]; }
function lerp(a, b, t) { return a + (b - a) * t; }

// ─── Navbar ───────────────────────────────────────────────────────────────────
function setupNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Hamburger ────────────────────────────────────────────────────────────────
function setupHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  btn?.addEventListener('click', () => links.classList.toggle('open'));
}

// ─── Section Nav Highlight ────────────────────────────────────────────────────
function setupSectionNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
}

// ─── Notifications ────────────────────────────────────────────────────────────
function setupNotifications() {
  const btn = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');
  const clear = document.getElementById('notifClear');
  btn?.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('open'); });
  document.addEventListener('click', () => panel.classList.remove('open'));
  panel?.addEventListener('click', e => e.stopPropagation());
  clear?.addEventListener('click', () => { panel.querySelectorAll('.notif-item').forEach(el => el.remove()); });
}

// ─── Hero Canvas ──────────────────────────────────────────────────────────────
function setupHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], nodes = [], connections = [];
    const PARTICLE_COUNT = 80;
    const NODE_COUNT = 18;
    const COLORS = ['#38BDF8', '#22D3EE', '#22c55e', '#F87171'];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildNodes();
  }

  function buildNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: rand(0.1, 0.9) * W, y: rand(0.1, 0.9) * H,
      vx: rand(-0.15, 0.15), vy: rand(-0.15, 0.15),
      r: rand(3, 7), color: pick(COLORS), pulse: rand(0, Math.PI * 2)
    }));
    connections = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 200) connections.push([i, j]);
      }
    }
    particles = Array.from({ length: PARTICLE_COUNT }, () => buildParticle());
  }

  function buildParticle() {
    return { x: rand(0, W), y: rand(0, H), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), r: rand(1, 2.5), alpha: rand(0.1, 0.5), color: pick(COLORS) };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Grid dots
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let x = 0; x < W; x += 40) for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }

    // Connections
    connections.forEach(([i, j]) => {
      const a = nodes[i], b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.max(0, 1 - d / 200) * 0.12;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(110,231,247,${alpha})`; ctx.lineWidth = 1; ctx.stroke();
    });

    // Particles
    const t = Date.now() * 0.001;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) Object.assign(p, buildParticle(), { x: rand(0, W), y: rand(0, H) });
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });

    // Nodes
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.pulse += 0.04;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      const glow = Math.sin(n.pulse) * 0.5 + 0.5;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * (2 + glow));
      g.addColorStop(0, n.color + 'cc'); g.addColorStop(1, n.color + '00');
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (1.5 + glow * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color; ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize(); draw();
}

// ─── Hero Stats Counter ───────────────────────────────────────────────────────
function animateHeroStats() {
  document.querySelectorAll('.hero-stat-val').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0, start = null;
    const duration = 1800;
    function step(ts) {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.round(ease * target).toLocaleString();
      if (prog < 1) requestAnimationFrame(step);
    }
    setTimeout(() => requestAnimationFrame(step), 400);
  });
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
const TICKER_EVENTS = [
  { text: 'TRK-047 rerouted via I-80 – saving 23 min', cls: 't-yellow', icon: '⚡' },
  { text: 'ORD-7821 delivered · Warehouse C · 14:02', cls: 't-green', icon: '✔' },
  { text: 'AI Demand spike forecast: Region 4 +31% Fri–Sun', cls: 't-green', icon: '📈' },
  { text: 'TRK-019 fuel alert: 12% remaining', cls: 't-red', icon: '⚠' },
  { text: 'Route batch #RB-1204 optimized: -18% distance', cls: 't-green', icon: '🗺' },
  { text: 'Weather alert: Storm advisory Route NE-7', cls: 't-yellow', icon: '🌩' },
  { text: 'Carrier FastFreight: 98.4% on-time this week', cls: 't-green', icon: '🏆' },
  { text: 'Warehouse B: 92% capacity · replenishment triggered', cls: 't-yellow', icon: '📦' },
  { text: 'Cost savings today: $84,200 – up 2.7%', cls: 't-green', icon: '💰' },
  { text: 'TRK-033 completed route NW-3 · 12/12 stops', cls: 't-green', icon: '✔' },
];

function setupTicker() {
  const el = document.getElementById('tickerContent');
  if (!el) return;
  const doubled = [...TICKER_EVENTS, ...TICKER_EVENTS];
  el.innerHTML = doubled.map(e =>
    `<span class="ticker-item"><span class="${e.cls} t-status">${e.icon} ${e.text}</span></span><span class="ticker-sep">·</span>`
  ).join('');
}

// ─── Live Fleet Map ───────────────────────────────────────────────────────────
let mapVehicles = [], mapRoutes = [], mapFilterMode = 'all';

function setupFleetMap() {
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  // Build fake city grid & vehicles
  const CITIES = [
    { name: 'Hub A', x: 0.15, y: 0.25 }, { name: 'Hub B', x: 0.85, y: 0.2 },
    { name: 'Hub C', x: 0.5, y: 0.5 }, { name: 'Hub D', x: 0.2, y: 0.75 },
    { name: 'Hub E', x: 0.75, y: 0.75 }, { name: 'Hub F', x: 0.4, y: 0.15 },
    { name: 'Hub G', x: 0.65, y: 0.35 }, { name: 'Hub H', x: 0.3, y: 0.6 },
  ];

  mapVehicles = Array.from({ length: 30 }, (_, i) => {
    const from = pick(CITIES), to = pick(CITIES);
    const statuses = ['on-route', 'on-route', 'on-route', 'delayed', 'alert', 'idle'];
    return {
      id: `TRK-${String(i + 1).padStart(3, '0')}`,
      from, to, progress: rand(0, 1),
      speed: rand(0.0008, 0.003),
      status: pick(statuses),
      x: 0, y: 0,
    };
  });

  mapRoutes = [];
  for (let i = 0; i < CITIES.length; i++)
    for (let j = i + 1; j < CITIES.length; j++)
      if (Math.random() > 0.4) mapRoutes.push([CITIES[i], CITIES[j]]);

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  const STATUS_COLORS = { 'on-route': '#34d399', 'delayed': '#fbbf24', 'alert': '#f87171', 'idle': '#384a66' };

  function drawMap() {
    ctx.clearRect(0, 0, W, H);
    // Background grid
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Routes
    mapRoutes.forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // City nodes
    CITIES.forEach(c => {
      const x = c.x * W, y = c.y * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
      g.addColorStop(0, 'rgba(56,189,248,0.3)'); g.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#38BDF8'; ctx.fill();
      ctx.fillStyle = '#4B5563'; ctx.font = '500 10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(c.name, x, y - 14);
    });

    // Vehicles
    const t = Date.now() * 0.001;
    const visible = mapFilterMode === 'all' ? mapVehicles :
      mapFilterMode === 'active' ? mapVehicles.filter(v => v.status !== 'idle') :
        mapVehicles.filter(v => v.status === 'alert');

    visible.forEach(v => {
      v.progress += v.speed;
      if (v.progress > 1) { v.progress = 0; v.from = v.to; v.to = pick(CITIES.filter(c => c !== v.from)); }
      v.x = lerp(v.from.x * W, v.to.x * W, v.progress);
      v.y = lerp(v.from.y * H, v.to.y * H, v.progress);
      const color = STATUS_COLORS[v.status];
      // Glow
      const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 10);
      g.addColorStop(0, color + '99'); g.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(v.x, v.y, 10, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      // Truck dot
      ctx.beginPath(); ctx.arc(v.x, v.y, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.arc(v.x, v.y, 4, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(5,12,24,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    requestAnimationFrame(drawMap);
  }

  window.addEventListener('resize', () => { resize(); });
  resize(); drawMap();

  // Controls
  ['mapViewAll', 'mapViewActive', 'mapViewAlert'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function () {
      document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      mapFilterMode = id === 'mapViewAll' ? 'all' : id === 'mapViewActive' ? 'active' : 'alert';
    });
  });
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
const ACTIVITY_TEMPLATES = [
  { icon: '✔', type: 'green', title: v => `Delivered · ${v}`, sub: () => `${pick(['Warehouse C', 'Store 12', 'DC North', 'Zone B'])}` },
  { icon: '⚡', type: 'yellow', title: v => `Rerouted · ${v}`, sub: () => `Traffic on ${pick(['I-80', 'US-101', 'RT-66', 'I-405'])} — alt route applied` },
  { icon: '⚠', type: 'red', title: v => `Alert · ${v}`, sub: () => pick(['Low fuel warning', 'Engine check required', 'Idle >45 min', 'Off-route detected']) },
  { icon: '📦', type: 'blue', title: v => `Loaded · ${v}`, sub: () => `${randInt(8, 40)} pallets · ${pick(['Hub A', 'Hub B', 'Depot 3'])}` },
  { icon: '🗺', type: 'green', title: () => `AI Optimization`, sub: () => `Batch ${randInt(100, 999)} optimized: -${randInt(10, 30)}% distance` },
];

function setupActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;

  function addItem() {
    const tpl = pick(ACTIVITY_TEMPLATES);
    const vid = `TRK-${String(randInt(1, 300)).padStart(3, '0')}`;
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="act-icon act-icon-${tpl.type}">${tpl.icon}</div>
      <div class="act-text">
        <p class="act-title">${tpl.title(vid)}</p>
        <p class="act-sub">${tpl.sub()}</p>
      </div>
      <span class="act-time">Just now</span>`;
    feed.prepend(item);
    if (feed.children.length > 8) feed.removeChild(feed.lastChild);
  }

  // Seed
  for (let i = 0; i < 5; i++) addItem();
  activityInterval = setInterval(addItem, 3500);
}

// ─── AI Insights ──────────────────────────────────────────────────────────────
const AI_INSIGHTS = [
  '🚀 Suggest consolidating routes NW-3 and NW-7 — saves 94 km and $312 today.',
  '📊 Demand for Region 4 forecasted +31% Fri–Sun. Pre-position 3 trucks at Hub D.',
  '⚠️ TRK-019 fuel critically low. Nearest station: 4.2 km via Exit 22.',
  '🌿 Switching 12 routes to e-vehicles reduces CO₂ by 2.4 tons this week.',
  '🏆 Carrier FastFreight outperforming SLA by 6.2%. Consider increasing allocation.',
  '💡 Warehouse B at 92% capacity. Trigger replenishment for SKUs 4412, 8803.',
  '📈 On-time delivery rate improved to 98.4% — best week of Q2.',
  '🔄 Route batch RB-1204: AI reduced total distance by 18%, saving 3.2 hrs.',
  '⛽ Fuel efficiency up 4.1% after driver coaching alerts rolled out.',
  '🗺 5 overlapping delivery zones detected. Merging saves 2 vehicles daily.',
];

function setupAIInsights() {
  const el = document.getElementById('aiInsights');
  const status = document.querySelector('.ai-status');
  if (!el) return;
  let idx = 0;
  function show() {
    if (status) status.textContent = 'Analyzing…';
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'ai-insight';
      div.textContent = AI_INSIGHTS[idx % AI_INSIGHTS.length];
      el.prepend(div);
      if (el.children.length > 3) el.removeChild(el.lastChild);
      if (status) status.textContent = 'Ready';
      idx++;
    }, 1200);
  }
  show(); aiInterval = setInterval(show, 6000);
}

// ─── Route Optimizer ──────────────────────────────────────────────────────────
let optStops = [], optAssignments = [];
const VEHICLE_COLORS = ['#6ee7f7', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#f87171', '#22d3ee', '#818cf8', '#4ade80', '#fb923c'];

window.setPriority = function (btn, val) {
  optimizerPriority = val;
  document.querySelectorAll('#prioDistance,#prioTime,#prioCost').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};
window.setTraffic = function (btn, val) {
  optimizerTraffic = val;
  document.querySelectorAll('#trafficLight,#trafficMod,#trafficHeavy').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

function setupOptimizer() {
  const stopsSlider = document.getElementById('stopsSlider');
  const fleetSlider = document.getElementById('fleetSlider');
  stopsSlider?.addEventListener('input', () => { document.getElementById('stopsVal').textContent = stopsSlider.value; });
  fleetSlider?.addEventListener('input', () => { document.getElementById('fleetVal').textContent = fleetSlider.value; });
  drawOptCanvas([], [], 4);
}

window.runOptimizer = function () {
  const nStops = parseInt(document.getElementById('stopsSlider').value);
  const nVehicles = parseInt(document.getElementById('fleetSlider').value);
  const btn = document.getElementById('optimizeBtn');
  const progressWrap = document.getElementById('optProgressWrap');
  const fill = document.getElementById('optFill');
  const pct = document.getElementById('optPct');
  const status = document.getElementById('optStatus');

  btn.disabled = true; btn.textContent = '⏳ Solving…';
  progressWrap.style.display = 'block'; status.textContent = 'AI solver running…';
  document.getElementById('optResults').style.display = 'none';

  let prog = 0;
  const progInterval = setInterval(() => {
    prog = Math.min(prog + rand(1, 6), 99);
    fill.style.width = prog + '%'; pct.textContent = Math.round(prog) + '%';
  }, 80);

  setTimeout(() => {
    clearInterval(progInterval);
    fill.style.width = '100%'; pct.textContent = '100%';

    // Build stops
    const canvas = document.getElementById('optCanvas');
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const depot = { x: W * 0.5, y: H * 0.5, isDepot: true };
    const stops = Array.from({ length: nStops }, () => ({
      x: rand(W * 0.08, W * 0.92),
      y: rand(H * 0.08, H * 0.92),
      demand: randInt(1, 5),
      isDepot: false,
      vehicle: -1,
    }));

    // Nearest-neighbor per vehicle
    const assignments = Array.from({ length: nVehicles }, () => []);
    const unvisited = [...stops];
    let vIdx = 0;
    let pos = depot;
    while (unvisited.length > 0) {
      let bestIdx = 0, bestDist = Infinity;
      unvisited.forEach((s, i) => {
        const d = dist(pos, s);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      const s = unvisited.splice(bestIdx, 1)[0];
      s.vehicle = vIdx;
      assignments[vIdx % nVehicles].push(s);
      pos = s;
      vIdx++;
    }

    optStops = stops; optAssignments = assignments;
    drawOptCanvas(stops, assignments, nVehicles, depot);

    // Results
    const multiplier = optimizerTraffic === 'light' ? 1 : optimizerTraffic === 'moderate' ? 1.25 : 1.55;
    const totalDist = (assignments.flat().reduce((acc, s, i, arr) => {
      if (i === 0) return 0;
      return acc + dist(arr[i - 1], s);
    }, 0) / 30 * multiplier).toFixed(0);

    const resDistance = document.getElementById('resDistance');
    const resDuration = document.getElementById('resDuration');
    const resFuel = document.getElementById('resFuel');
    const resCo2 = document.getElementById('resCo2');
    if (resDistance) resDistance.textContent = `${(nStops * 4.2 * multiplier).toFixed(0)} km`;
    if (resDuration) resDuration.textContent = `${(nStops * 0.6 * multiplier).toFixed(1)} hrs`;
    if (resFuel) resFuel.textContent = `${(nStops * 1.8).toFixed(0)} L`;
    if (resCo2) resCo2.textContent = `${(nStops * 4.7).toFixed(0)} kg`;

    document.getElementById('optResults').style.display = 'block';
    btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Re-Optimize';
    btn.style.cssText = '';
    status.textContent = `✅ Optimized ${nStops} stops across ${nVehicles} vehicles`;
    setTimeout(() => { progressWrap.style.display = 'none'; }, 1000);
  }, 2000);
};

function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function drawOptCanvas(stops, assignments, nVehicles, depot) {
  const canvas = document.getElementById('optCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  ctx.clearRect(0, 0, W, H);
  // Grid
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  if (stops.length === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = '600 14px Inter';
    ctx.textAlign = 'center'; ctx.fillText('Configure and run optimization →', W / 2, H / 2);
    return;
  }

  const dep = depot || { x: W * 0.5, y: H * 0.5 };

  // Draw routes
  assignments.forEach((route, vi) => {
    const color = VEHICLE_COLORS[vi % VEHICLE_COLORS.length];
    if (route.length === 0) return;
    ctx.beginPath(); ctx.moveTo(dep.x, dep.y);
    route.forEach(s => ctx.lineTo(s.x, s.y));
    ctx.lineTo(dep.x, dep.y);
    ctx.strokeStyle = color + '80'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke();
    ctx.setLineDash([]);
  });

  // Stop nodes
  stops.forEach((s, i) => {
    const color = s.vehicle >= 0 ? VEHICLE_COLORS[s.vehicle % VEHICLE_COLORS.length] : '#8b9dc0';
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12);
    g.addColorStop(0, color + '50'); g.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(s.x, s.y, 12, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, s.x, s.y);
  });

  // Depot
  ctx.beginPath(); ctx.arc(dep.x, dep.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(110,231,247,0.15)'; ctx.fill();
  ctx.beginPath(); ctx.arc(dep.x, dep.y, 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#6ee7f7'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#6ee7f7'; ctx.font = 'bold 9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('HQ', dep.x, dep.y);
}

// ─── Analytics Charts ─────────────────────────────────────────────────────────
const CHART_DEFAULTS = {
  color: '#4B5563',
  scales: {
    x: { grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false }, ticks: { color: '#6B7280', font: { size: 11 } } },
    y: { grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false }, ticks: { color: '#6B7280', font: { size: 11 } } },
  },
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1, titleColor: '#1F2937', bodyColor: '#4B5563', padding: 12, cornerRadius: 10 } },
};

function makeGradient(ctx, color1, color2) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, color1); g.addColorStop(1, color2); return g;
}

function setupAnalytics() {
  buildDeliveryChart();
  buildStatusChart();
  buildRegionChart();
  buildCostChart();
  buildCpmChart();
  buildDemandChart();
  buildHeatGrid();
  buildFvaChart();
  buildCarrierTable();
}

function buildDeliveryChart() {
  const ctx = document.getElementById('delivChart');
  if (!ctx) return;
  const c2d = ctx.getContext('2d');
  const labels = Array.from({ length: 30 }, (_, i) => `Mar ${i + 1}`);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Deliveries',
          data: labels.map(() => randInt(380, 520)),
          borderColor: '#38BDF8', borderWidth: 2.5,
          backgroundColor: makeGradient(c2d, 'rgba(56,189,248,0.25)', 'rgba(56,189,248,0.01)'),
          fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: '#38BDF8',
        },
        {
          label: 'Exceptions',
          data: labels.map(() => randInt(2, 18)),
          borderColor: '#F87171', borderWidth: 2,
          backgroundColor: makeGradient(c2d, 'rgba(248,113,113,0.15)', 'rgba(248,113,113,0.01)'),
          fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: '#F87171',
        }
      ]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, labels: { color: '#8b9dc0', usePointStyle: true, font: { size: 12 } } } } },
  });
}

function buildStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  const data = [68, 21, 7, 4];
  const colors = ['#22c55e', '#38BDF8', '#fbbf24', '#F87171'];
  const labels = ['On Time', 'Early', 'Slight Delay', 'Exception'];
  new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: colors.map(c => c + '44'), borderWidth: 2, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: CHART_DEFAULTS.plugins.tooltip } },
  });
  const legend = document.getElementById('donutLegend');
  if (legend) legend.innerHTML = labels.map((l, i) => `<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${colors[i]}"></div>${l}: ${data[i]}%</div>`).join('');
}

function buildRegionChart() {
  const ctx = document.getElementById('regionChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['North', 'South', 'East', 'West', 'Central', 'Overseas'],
      datasets: [{
        data: [32, 28, 21, 37, 19, 25],
        backgroundColor: ['#6ee7f7aa', '#a78bfaaa', '#34d399aa', '#fbbf24aa', '#f472b6aa', '#22d3eeaa'],
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v + '%' } } } },
  });
}

function buildCostChart() {
  const ctx = document.getElementById('costChart');
  if (!ctx) return;
  const c2d = ctx.getContext('2d');
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Fuel', data: labels.map(() => randInt(18000, 28000)), backgroundColor: '#38BDF8aa', borderRadius: 4, stack: 'cost' },
        { label: 'Labor', data: labels.map(() => randInt(22000, 32000)), backgroundColor: '#22D3EEaa', borderRadius: 4, stack: 'cost' },
        { label: 'Maintenance', data: labels.map(() => randInt(4000, 9000)), backgroundColor: '#22c55eaa', borderRadius: 4, stack: 'cost' },
        { label: 'Other', data: labels.map(() => randInt(2000, 6000)), backgroundColor: '#fbbf24aa', borderRadius: 4, stack: 'cost' },
      ]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, labels: { color: '#4B5563', usePointStyle: true } } } },
  });
}

function buildCpmChart() {
  const ctx = document.getElementById('cpmChart');
  if (!ctx) return;
  const c2d = ctx.getContext('2d');
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Cost/Mile',
        data: [2.84, 2.71, 2.65, 2.52, 2.41, 2.33],
        borderColor: '#a78bfa', borderWidth: 2.5,
        backgroundColor: makeGradient(c2d, 'rgba(167,139,250,0.25)', 'rgba(167,139,250,0.01)'),
        fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#a78bfa',
      }]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => '$' + v } } } },
  });
}

function buildDemandChart() {
  const ctx = document.getElementById('demandChart');
  if (!ctx) return;
  const c2d = ctx.getContext('2d');
  const now = new Date();
  const labels = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() + i * 7);
    return `Wk ${i + 1}`;
  });
  const actual = [840, 910, 875, 950, null, null, null, null];
  const forecast = [null, null, null, 960, 1020, 1180, 1090, 1250];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Actual Demand',
          data: actual,
          borderColor: '#34d399', borderWidth: 2.5,
          backgroundColor: makeGradient(c2d, 'rgba(52,211,153,0.2)', 'rgba(52,211,153,0)'),
          fill: true, tension: 0.4, spanGaps: false, pointRadius: 5, pointBackgroundColor: '#34d399',
        },
        {
          label: 'AI Forecast',
          data: forecast,
          borderColor: '#38BDF8', borderWidth: 2.5, borderDash: [8, 4],
          backgroundColor: makeGradient(c2d, 'rgba(56,189,248,0.15)', 'rgba(56,189,248,0)'),
          fill: true, tension: 0.4, spanGaps: false, pointRadius: 5, pointBackgroundColor: '#38BDF8',
        }
      ]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, labels: { color: '#4B5563', usePointStyle: true } } } },
  });
}

function buildHeatGrid() {
  const el = document.getElementById('heatGrid');
  if (!el) return;
  const regions = ['NW', 'NE', 'N', 'NC', 'NO', 'WC', 'C', 'E', 'SE', 'S', 'SW', 'W', 'MW', 'ME', 'MS', 'FW', 'FE', 'FS', 'MN', 'MS'];
  const intensities = regions.map(() => randInt(10, 100));
  el.innerHTML = regions.map((r, i) => {
    const v = intensities[i];
    const h = Math.round(lerp(240, 0, v / 100));
    const bg = `hsl(${h}, 70%, 45%)`;
    return `<div class="heat-cell" style="background:${bg};opacity:0.8" title="${r}: ${v}% demand">${r}<span>${v}%</span></div>`;
  }).join('');
}

function buildFvaChart() {
  const ctx = document.getElementById('fvaChart');
  if (!ctx) return;
  const labels = Array.from({ length: 12 }, (_, i) => `Wk ${i + 1}`);
  const actual = labels.map(() => randInt(700, 1100));
  const forecast = actual.map(v => v + randInt(-60, 60));
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Actual', data: actual, backgroundColor: '#22c55e66', borderRadius: 4 },
        { label: 'Forecast', data: forecast, backgroundColor: '#38BDF866', borderRadius: 4, type: 'line', borderColor: '#38BDF8', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: false },
      ]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, labels: { color: '#4B5563', usePointStyle: true } } } },
  });
}

function buildCarrierTable() {
  const carriers = [
    { name: 'FastFreight Inc.', onTime: 98.4, damageRate: 0.12, cpl: 2.34, lanes: 42, score: 'A', status: 'Preferred' },
    { name: 'QuickShip Co.', onTime: 95.1, damageRate: 0.31, cpl: 2.71, lanes: 28, score: 'B', status: 'Active' },
    { name: 'Reliable Express', onTime: 97.2, damageRate: 0.18, cpl: 2.55, lanes: 35, score: 'A', status: 'Preferred' },
    { name: 'CrossLand Freight', onTime: 89.7, damageRate: 0.54, cpl: 2.28, lanes: 19, score: 'C', status: 'Review' },
    { name: 'Northern Routes', onTime: 93.8, damageRate: 0.27, cpl: 2.62, lanes: 22, score: 'B', status: 'Active' },
    { name: 'SkyBridge Logistics', onTime: 99.1, damageRate: 0.09, cpl: 2.91, lanes: 15, score: 'A', status: 'Preferred' },
    { name: 'Budget Freight', onTime: 86.3, damageRate: 0.71, cpl: 1.98, lanes: 31, score: 'C', status: 'Review' },
    { name: 'Metro Distribution', onTime: 94.5, damageRate: 0.22, cpl: 2.48, lanes: 26, score: 'B', status: 'Active' },
  ];
  allCarriers = carriers;
  renderCarrierTable(carriers);
}

function renderCarrierTable(carriers) {
  const tbody = document.getElementById('carrierTbody');
  if (!tbody) return;
  const scoreCls = { A: 'score-a', B: 'score-b', C: 'score-c' };
  const statusCls = { Preferred: 'status-preferred', Active: 'status-active', Review: 'status-review' };
  tbody.innerHTML = carriers.map(c => `
    <tr>
      <td style="font-weight:600;color:#1F2937">${c.name}</td>
      <td style="color:${c.onTime > 95 ? '#22c55e' : c.onTime > 90 ? '#fbbf24' : '#F87171'};font-weight:700">${c.onTime}%</td>
      <td style="color:${c.damageRate < 0.25 ? '#22c55e' : c.damageRate < 0.5 ? '#fbbf24' : '#F87171'}">${c.damageRate}%</td>
      <td>$${c.cpl}</td>
      <td>${c.lanes}</td>
      <td><span class="carrier-score ${scoreCls[c.score]}">${c.score}</span></td>
      <td><span class="carrier-status ${statusCls[c.status]}">${c.status}</span></td>
    </tr>
  `).join('');
}

window.filterCarriers = function (q) {
  const filtered = allCarriers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  renderCarrierTable(filtered);
};

// ─── Tab switching ─────────────────────────────────────────────────────────────
window.switchTab = function (btn, id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + id)?.classList.add('active');
};

// ─── Fleet Grid ───────────────────────────────────────────────────────────────
const DRIVER_NAMES = ['Alex Chen', 'Maria Lopez', 'Sam Patel', 'Jordan Kim', 'Taylor Brown', 'Casey Zhang', 'Morgan Davis', 'Riley Wilson', 'Jamie Okafor', 'Avery Nguyen'];
const ROUTES = ['NW-1', 'NE-3', 'SE-7', 'SW-2', 'N-4', 'S-6', 'E-5', 'W-8', 'C-1', 'MW-3'];
const STATUSES = ['on-route', 'on-route', 'on-route', 'on-route', 'idle', 'idle', 'alert'];
const VEHICLE_TYPES = ['Dry Van', 'Refrigerated', 'Flatbed', 'Box Truck', 'Tanker'];

function setupFleetGrid() {
  fleetData = Array.from({ length: 24 }, (_, i) => ({
    id: `TRK-${String(i + 1).padStart(3, '0')}`,
    driver: pick(DRIVER_NAMES),
    route: pick(ROUTES),
    type: pick(VEHICLE_TYPES),
    status: pick(STATUSES),
    speed: randInt(0, 90),
    fuel: randInt(15, 100),
    progress: randInt(10, 95),
    stops: randInt(1, 15),
    totalStops: 15,
    eta: `${randInt(1, 4)}h ${randInt(5, 59)}m`,
  }));
  renderFleetGrid(fleetData);
}

function renderFleetGrid(data) {
  const grid = document.getElementById('fleetGrid');
  if (!grid) return;
  const statusLabel = { 'on-route': 'On Route', 'idle': 'Idle', 'alert': 'Alert' };
  const statusCls = { 'on-route': 'status-on-route', 'idle': 'status-idle', 'alert': 'status-alert' };
  const fuelColor = f => f > 50 ? '#34d399' : f > 25 ? '#fbbf24' : '#f87171';

  grid.innerHTML = data.map(v => `
    <div class="fleet-card" data-status="${v.status}">
      <div class="fleet-card-header">
        <span class="fleet-vehicle-id">${v.id}</span>
        <span class="fleet-status ${statusCls[v.status]}">${statusLabel[v.status]}</span>
      </div>
      <p class="fleet-driver">Driver: <span>${v.driver}</span></p>
      <div class="fleet-metrics">
        <div class="fleet-metric"><div class="fleet-metric-label">Route</div><div class="fleet-metric-value">${v.route}</div></div>
        <div class="fleet-metric"><div class="fleet-metric-label">Type</div><div class="fleet-metric-value">${v.type}</div></div>
        <div class="fleet-metric"><div class="fleet-metric-label">Speed</div><div class="fleet-metric-value">${v.status === 'idle' ? '0 km/h' : v.speed + ' km/h'}</div></div>
        <div class="fleet-metric"><div class="fleet-metric-label">ETA</div><div class="fleet-metric-value">${v.status === 'idle' ? '—' : v.eta}</div></div>
      </div>
      <div class="fleet-progress-label"><span>Route Progress</span><span>${v.stops}/${v.totalStops} stops</span></div>
      <div class="fleet-progress-bar"><div class="fleet-progress-fill" style="width:${v.progress}%"></div></div>
      <div class="fleet-progress-label" style="margin-top:8px"><span>Fuel Level</span><span style="color:${fuelColor(v.fuel)}">${v.fuel}%</span></div>
      <div class="fleet-progress-bar"><div class="fleet-progress-fill" style="width:${v.fuel}%;background:${fuelColor(v.fuel)}"></div></div>
    </div>
  `).join('');
}

window.filterFleet = function (q) {
  const filtered = fleetData.filter(v =>
    v.id.toLowerCase().includes(q.toLowerCase()) ||
    v.driver.toLowerCase().includes(q.toLowerCase()) ||
    v.route.toLowerCase().includes(q.toLowerCase())
  );
  renderFleetGrid(filtered);
};

window.filterFleetStatus = function (btn, status) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'all' ? fleetData : fleetData.filter(v => v.status === status);
  renderFleetGrid(filtered);
};

// ─── Shipment Tracker ──────────────────────────────────────────────────────────
const SHIPMENT_DATA = {
  'ORD-7821': {
    status: 'In Transit', from: 'Chicago, IL', to: 'Denver, CO', carrier: 'FastFreight Inc.', weight: '2,400 lbs',
    eta: 'Today, 16:30', progress: 72,
    timeline: [
      { title: 'Order Placed', sub: 'Chicago Distribution Hub', time: 'Apr 7, 09:12', state: 'done' },
      { title: 'Picked Up', sub: 'TRK-047 · Alex Chen', time: 'Apr 7, 14:45', state: 'done' },
      { title: 'In Transit', sub: 'Currently on I-70 W · 847 mi covered', time: 'Now', state: 'active' },
      { title: 'Out for Delivery', sub: 'Denver Metro Area', time: 'Est. Today 15:00', state: 'pending' },
      { title: 'Delivered', sub: 'Warehouse C, Denver', time: 'Est. Today 16:30', state: 'pending' },
    ]
  },
  'ORD-6543': {
    status: 'Delivered', from: 'Phoenix, AZ', to: 'Las Vegas, NV', carrier: 'QuickShip Co.', weight: '860 lbs',
    eta: 'Delivered Apr 8', progress: 100,
    timeline: [
      { title: 'Order Placed', sub: 'Phoenix Depot', time: 'Apr 6, 11:00', state: 'done' },
      { title: 'Picked Up', sub: 'TRK-019 · Maria Lopez', time: 'Apr 7, 08:30', state: 'done' },
      { title: 'In Transit', sub: 'US-93 N', time: 'Apr 7, 10:00', state: 'done' },
      { title: 'Delivered', sub: 'Las Vegas Fulfillment Center', time: 'Apr 8, 13:22', state: 'done' },
    ]
  },
  'ORD-9102': {
    status: 'Pickup Scheduled', from: 'Seattle, WA', to: 'Portland, OR', carrier: 'Reliable Express', weight: '1,120 lbs',
    eta: 'Tomorrow, 10:00', progress: 8,
    timeline: [
      { title: 'Order Placed', sub: 'Seattle Warehouse A', time: 'Apr 9, 09:00', state: 'done' },
      { title: 'Pickup Scheduled', sub: 'TRK-033 · Sam Patel · Tomorrow 07:00', time: 'Apr 10, 07:00', state: 'active' },
      { title: 'In Transit', sub: 'I-5 S', time: 'Est. Apr 10, 07:30', state: 'pending' },
      { title: 'Delivered', sub: 'Portland Distribution Hub', time: 'Est. Apr 10, 10:00', state: 'pending' },
    ]
  }
};

window.trackShipment = function () {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  showTrackerResult(id);
};

window.quickTrack = function (id) {
  document.getElementById('trackInput').value = id;
  showTrackerResult(id);
};

function showTrackerResult(id) {
  const result = document.getElementById('trackerResult');
  const data = SHIPMENT_DATA[id];
  if (!data) {
    result.innerHTML = `<div class="tracker-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>No shipment found for <strong>${id}</strong></p></div>`;
    return;
  }
  const statusColors = { 'In Transit': '#6ee7f7', 'Delivered': '#34d399', 'Pickup Scheduled': '#a78bfa' };
  const sc = statusColors[data.status] || '#6ee7f7';
  const stateIcons = {
    done: `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    active: `<svg viewBox="0 0 24 24" fill="none" stroke="#6ee7f7" stroke-width="2.5"><circle cx="12" cy="12" r="4" fill="#6ee7f7"/></svg>`,
    pending: '',
  };

  result.innerHTML = `
    <div class="tracker-result">
      <div class="tracker-order-header">
        <div>
          <div class="tracker-order-id">${id}</div>
          <div style="font-size:.83rem;color:#8b9dc0;margin-top:4px">${data.from} → ${data.to}</div>
        </div>
        <div>
          <span style="display:inline-flex;padding:5px 14px;border-radius:99px;font-size:.78rem;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44">${data.status}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px">
        <div class="fleet-metric"><div class="fleet-metric-label">Carrier</div><div class="fleet-metric-value" style="font-size:.82rem">${data.carrier}</div></div>
        <div class="fleet-metric"><div class="fleet-metric-label">Weight</div><div class="fleet-metric-value" style="font-size:.82rem">${data.weight}</div></div>
        <div class="fleet-metric"><div class="fleet-metric-label">ETA</div><div class="fleet-metric-value" style="font-size:.82rem;color:${sc}">${data.eta}</div></div>
      </div>
      <div style="margin-bottom:14px">
        <div class="fleet-progress-label"><span>Overall Progress</span><span style="color:${sc}">${data.progress}%</span></div>
        <div class="fleet-progress-bar" style="height:8px"><div class="fleet-progress-fill" style="width:${data.progress}%;background:${sc}"></div></div>
      </div>
      <div class="tracker-timeline">
        ${data.timeline.map(step => `
          <div class="timeline-step">
            <div class="timeline-dot ${step.state}">${stateIcons[step.state]}</div>
            <div class="timeline-title">${step.title}</div>
            <div class="timeline-sub">${step.sub}</div>
            <div class="timeline-time">${step.time}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ─── Live KPI updates ─────────────────────────────────────────────────────────
function setupKPILive() {
  kpiInterval = setInterval(() => {
    const trucks = document.getElementById('activeTrucks');
    const routes = document.getElementById('routesOpt');
    const transit = document.getElementById('inTransit');
    const cost = document.getElementById('costSaved');
    if (trucks) trucks.textContent = (247 + randInt(-3, 5)).toString();
    if (routes) routes.textContent = (1834 + randInt(0, 12)).toLocaleString();
    if (transit) transit.textContent = (4291 + randInt(-20, 30)).toLocaleString();
    if (cost) cost.textContent = '$' + (84.2 + rand(-0.5, 0.7)).toFixed(1) + 'K';
  }, 4000);
}

// ─── Intersection Observer (feature cards) ────────────────────────────────────
function setupIntersectionObserver() {
  const cards = document.querySelectorAll('.feature-card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('visible'), delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(c => obs.observe(c));

  // Demo button
  document.getElementById('demoBtn')?.addEventListener('click', () => smoothScroll('optimizer'));
  document.getElementById('heroCta')?.addEventListener('click', () => smoothScroll('dashboard'));
}
