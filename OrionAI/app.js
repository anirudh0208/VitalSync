/* ============================================================
   OrionAI — script.js
   All simulation logic, maps, animations, data
   ============================================================ */

// ── DATA ──────────────────────────────────────────────────
const CITIES = {
  'Bengaluru (Whitefield)': [12.9698, 77.7500],
  'Mysuru (City Centre)':   [12.2958, 76.6394],
  'Hubli':                  [15.3647, 75.1240],
  'Mangaluru (Port)':       [12.8698, 74.8431],
  'Belagavi':               [15.8497, 74.4977],
  'Tumkur':                 [13.3379, 77.1173],
  'Shivamogga':             [13.9299, 75.5681],
  'Davangere':              [14.4644, 75.9218],
};

const SHIPMENTS = [
  { id: 'SHP-7821', from: 'Bengaluru (Whitefield)', to: 'Mysuru (City Centre)',  status: 'transit',   eta: '2h 30m',  lat: 12.6300, lng: 77.1500 },
  { id: 'SHP-6204', from: 'Hubli',                 to: 'Bengaluru (Whitefield)', status: 'transit',   eta: '5h 10m',  lat: 14.5000, lng: 75.8000 },
  { id: 'SHP-5091', from: 'Mangaluru (Port)',       to: 'Shivamogga',            status: 'delayed',   eta: '4h 50m',  lat: 13.2000, lng: 75.3000 },
  { id: 'SHP-4300', from: 'Belagavi',               to: 'Davangere',             status: 'transit',   eta: '3h 00m',  lat: 15.1000, lng: 75.3000 },
  { id: 'SHP-3814', from: 'Tumkur',                 to: 'Hubli',                 status: 'delivered', eta: 'Done',    lat: 14.2000, lng: 76.4000 },
];

const ACTIVITIES = [
  { text: 'SHP-7821 departed Bengaluru checkpoint', time: '2 min ago',   color: '#3b82f6' },
  { text: '⚠️ SHP-5091 delayed — road block near Agumbe', time: '5 min ago',  color: '#ef4444' },
  { text: 'Route optimized: Hubli → Bengaluru, saved ₹1,200', time: '12 min ago', color: '#10b981' },
  { text: 'SHP-3814 delivered at Hubli warehouse', time: '18 min ago', color: '#10b981' },
  { text: 'New order SHP-4300 dispatched from Belagavi', time: '22 min ago', color: '#8b5cf6' },
  { text: 'AI rerouted SHP-6204 via NH-48 — saves 40min', time: '31 min ago', color: '#06b6d4' },
];

const ALERTS_DATA = [
  { type: 'critical', icon: '🚨', title: '⚠️ Delay due to traffic — NH-75 near Agumbe', desc: 'SHP-5091 affected. 3 vehicles stuck in accident clearance. ETA pushed by 1h 20min. Auto-reroute via Tirthahalli initiated.', tag: 'critical', route: 'Mangaluru → Shivamogga', time: '5 min ago' },
  { type: 'warning',  icon: '🌧️', title: '⚠️ Weather advisory — Heavy rain in Coastal Karnataka', desc: 'Mangaluru port corridor at risk. 4 shipments may face 30–60 min delays. Monitoring wind speed > 55 km/h.', tag: 'warning', route: 'Mangaluru corridor', time: '12 min ago' },
  { type: 'warning',  icon: '⛽', title: '⚠️ Fuel cost spike detected', desc: 'Diesel prices up 8% in Belagavi zone. AI recommends shifting 2 truck routes to Mini Van for cost saving of ₹3,400.', tag: 'warning', route: 'Belagavi zone', time: '28 min ago' },
  { type: 'info',     icon: '🔄', title: 'Route optimization complete', desc: 'AI optimized 6 routes on the Bengaluru–Mysuru corridor. Combined savings: ₹18,200 and 2.3 hours fleet time.', tag: 'info', route: 'Bengaluru → Mysuru', time: '45 min ago' },
  { type: 'info',     icon: '📦', title: 'Batch planning completed', desc: '94 shipments scheduled for tomorrow. 8 routes consolidated. Fleet utilization projected at 88%.', tag: 'info', route: 'All Karnataka', time: '1 hr ago' },
  { type: 'resolved', icon: '✅', title: 'Resolved — Traffic jam cleared on NH-48', desc: 'The 2-hour congestion near Tumkur has cleared. SHP-6112 back on schedule. Estimated arrival resumed.', tag: 'resolved', route: 'Tumkur bypass', time: '2 hr ago' },
];

const ROUTE_DATA = {
  'Bengaluru (Whitefield)|Mysuru (City Centre)': { dist: 152, road: 'NH-275', congestion: 'low', toll: 85 },
  'Bengaluru (Whitefield)|Hubli':                { dist: 413, road: 'NH-48', congestion: 'medium', toll: 220 },
  'Bengaluru (Whitefield)|Mangaluru (Port)':     { dist: 352, road: 'NH-75', congestion: 'medium', toll: 180 },
  'Bengaluru (Whitefield)|Belagavi':             { dist: 508, road: 'NH-48', congestion: 'low', toll: 260 },
  'Bengaluru (Whitefield)|Tumkur':               { dist: 71,  road: 'NH-4',  congestion: 'high', toll: 35 },
  'Bengaluru (Whitefield)|Shivamogga':           { dist: 281, road: 'NH-206', congestion: 'low', toll: 120 },
  'Bengaluru (Whitefield)|Davangere':            { dist: 264, road: 'NH-48', congestion: 'low', toll: 110 },
  'Mysuru (City Centre)|Mangaluru (Port)':       { dist: 244, road: 'NH-275', congestion: 'medium', toll: 130 },
  'Mysuru (City Centre)|Hubli':                  { dist: 331, road: 'NH-150', congestion: 'low', toll: 160 },
  'Hubli|Belagavi':                              { dist: 98,  road: 'NH-748', congestion: 'low', toll: 50 },
  'Hubli|Davangere':                             { dist: 95,  road: 'NH-48', congestion: 'low', toll: 45 },
  'Mangaluru (Port)|Shivamogga':                 { dist: 161, road: 'NH-169', congestion: 'high', toll: 80 },
  'Belagavi|Davangere':                          { dist: 180, road: 'NH-67', congestion: 'low', toll: 90 },
  'Tumkur|Hubli':                                { dist: 260, road: 'NH-48', congestion: 'low', toll: 130 },
  'Shivamogga|Davangere':                        { dist: 111, road: 'NH-48', congestion: 'low', toll: 55 },
};

const VEHICLE_DATA = [
  { id: 'bike',    emoji: '🛵', name: 'Bike',     ratePerKm: 4.5,  maxWeight: 20,   baseSpeed: 45, overweightFactor: 1.8 },
  { id: 'minivan', emoji: '🚐', name: 'Mini Van', ratePerKm: 9,    maxWeight: 500,  baseSpeed: 55, overweightFactor: 1.0 },
  { id: 'truck',   emoji: '🚛', name: 'Truck',    ratePerKm: 18,   maxWeight: 10000,baseSpeed: 45, overweightFactor: 1.0 },
];

const DELIVERY_HISTORY = [
  { shipmentId: 'SHP-7821', route: 'Bengaluru → Mysuru', status: 'delivered', deliveredAt: 'Today, 03:10 PM', delayMin: 8 },
  { shipmentId: 'SHP-6204', route: 'Hubli → Bengaluru', status: 'transit', deliveredAt: 'ETA Today, 07:20 PM', delayMin: 18 },
  { shipmentId: 'SHP-5091', route: 'Mangaluru → Shivamogga', status: 'delayed', deliveredAt: 'ETA Today, 09:05 PM', delayMin: 70 },
  { shipmentId: 'SHP-4300', route: 'Belagavi → Davangere', status: 'transit', deliveredAt: 'ETA Today, 06:40 PM', delayMin: 14 },
  { shipmentId: 'SHP-3814', route: 'Tumkur → Hubli', status: 'delivered', deliveredAt: 'Today, 11:45 AM', delayMin: 0 },
  { shipmentId: 'SHP-7008', route: 'Bengaluru → Mangaluru', status: 'delivered', deliveredAt: 'Yesterday, 07:05 PM', delayMin: 22 },
];

const TRANSACTION_HISTORY = [
  { txnId: 'TXN-11920', shipmentId: 'SHP-7821', amount: 4820, method: 'UPI', time: 'Today, 03:18 PM' },
  { txnId: 'TXN-11913', shipmentId: 'SHP-3814', amount: 3620, method: 'Card', time: 'Today, 12:02 PM' },
  { txnId: 'TXN-11905', shipmentId: 'SHP-7008', amount: 9210, method: 'NEFT', time: 'Yesterday, 07:20 PM' },
  { txnId: 'TXN-11897', shipmentId: 'SHP-6120', amount: 2750, method: 'UPI', time: 'Yesterday, 03:11 PM' },
  { txnId: 'TXN-11884', shipmentId: 'SHP-5987', amount: 6400, method: 'Card', time: 'Yesterday, 11:49 AM' },
  { txnId: 'TXN-11875', shipmentId: 'SHP-5901', amount: 7180, method: 'Wallet', time: '2 days ago, 08:32 PM' },
];

// ── STATE ─────────────────────────────────────────────────
let miniMap = null, trackMap = null;
let movingMarker = null, movingMarkerPos = 0;
let trackMovingMarker = null;
let isLightMode = false;
let currentShipmentIndex = 0;

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  animateCounters();
  renderActivityList();
  renderShipmentList();
  renderAlerts();
  renderAlertStats();
  updateCost();
  initMiniMap();
  setDefaultDate();
  setupNav();
  setupThemeToggle();
  setupSidebarToggle();
  initAssistant();
  renderHistory();
  renderAssistantInsight();
});

// ── CLOCK ─────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const el = document.getElementById('timeDisplay');
  if (el) el.textContent = t;
}

// ── COUNTER ANIMATION ─────────────────────────────────────
function animateCounters() {
  const kpis = [
    { id: 'kpi1', target: 2841, suffix: '' },
    { id: 'kpi2', target: 184,  suffix: '' },
    { id: 'kpi3', target: 14,   suffix: '' },
  ];
  kpis.forEach(({ id, target, suffix }) => {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const duration = 1600;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = start.toLocaleString('en-IN') + suffix;
      if (start >= target) clearInterval(timer);
    }, 16);
  });
}

// ── NAVIGATION ────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sec = item.dataset.section;
      switchSection(sec);

      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const titles = {
        dashboard: 'Dashboard',
        tracking: 'Live Tracking',
        route: 'Route Optimizer',
        cost: 'Cost Analysis',
        alerts: 'Alerts',
        assistant: 'AI Assistant',
        history: 'History'
      };
      document.getElementById('pageTitle').textContent = titles[sec] || sec;

      // Close sidebar on mobile
      if (window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}

function switchSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('sec-' + name);
  if (target) target.classList.add('active');

  // Init maps lazily
  if (name === 'tracking' && !trackMap) setTimeout(initTrackMap, 100);
}

// ── SIDEBAR TOGGLE ────────────────────────────────────────
function setupSidebarToggle() {
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

// ── THEME TOGGLE ──────────────────────────────────────────
function setupThemeToggle() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    isLightMode = !isLightMode;
    document.body.classList.toggle('light', isLightMode);
    document.getElementById('themeToggle').querySelector('span').textContent = isLightMode ? 'Dark Mode' : 'Light Mode';
  });
}

// ── ACTIVITY LIST ─────────────────────────────────────────
function renderActivityList() {
  const list = document.getElementById('activityList');
  list.innerHTML = ACTIVITIES.map((a, i) => `
    <div class="activity-item" style="animation-delay:${i * 0.06}s">
      <div class="activity-dot" style="background:${a.color}"></div>
      <div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// ── SHIPMENT LIST ─────────────────────────────────────────
function renderShipmentList() {
  const list = document.getElementById('shipmentList');
  list.innerHTML = SHIPMENTS.map(s => `
    <div class="shipment-item" onclick="focusShipment('${s.id}')">
      <div>
        <div class="ship-id">${s.id}</div>
        <div class="ship-route">${s.from.split(' ')[0]} → ${s.to.split(' ')[0]}</div>
      </div>
      <div style="text-align:right">
        <div class="ship-status ${s.status}">${s.status.toUpperCase()}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px">ETA: ${s.eta}</div>
      </div>
    </div>
  `).join('');
}

// ── ALERTS ────────────────────────────────────────────────
function renderAlerts() {
  const list = document.getElementById('alertsList');
  list.innerHTML = ALERTS_DATA.map((a, i) => `
    <div class="alert-card ${a.type}" style="animation-delay:${i * 0.07}s">
      <div class="alert-icon-box ${a.type}">${a.icon}</div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
        <div class="alert-meta">
          <span class="alert-tag ${a.type}">${a.tag.toUpperCase()}</span>
          <span>📍 ${a.route}</span>
          <span>🕐 ${a.time}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAlertStats() {
  const stats = [
    { label: '🔴 Critical', num: 1, color: 'var(--red)' },
    { label: '🟡 Warnings', num: 2, color: 'var(--amber)' },
    { label: '🔵 Info',     num: 2, color: 'var(--accent)' },
    { label: '✅ Resolved', num: 1, color: 'var(--green)' },
  ];
  document.getElementById('alertStats').innerHTML = stats.map(s => `
    <div class="alert-stat-item">
      <span class="alert-stat-label">${s.label}</span>
      <span class="alert-stat-num" style="color:${s.color}">${s.num}</span>
    </div>
  `).join('');
}

// ── MINI MAP (DASHBOARD) ──────────────────────────────────
function initMiniMap() {
  miniMap = L.map('miniMap', { zoomControl: true, scrollWheelZoom: false })
    .setView([14.5, 75.7], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(miniMap);

  addShipmentMarkers(miniMap);
  startMovingMarker(miniMap, true);
}

// ── TRACK MAP (TRACKING SECTION) ─────────────────────────
function initTrackMap() {
  trackMap = L.map('trackMap', { zoomControl: true })
    .setView([14.0, 76.0], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(trackMap);

  // Add all city markers
  Object.entries(CITIES).forEach(([name, latlng]) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:rgba(59,130,246,0.9)">🏙️</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker(latlng, { icon })
      .addTo(trackMap)
      .bindPopup(`<b style="font-family:Syne">${name}</b>`);
  });

  addShipmentMarkers(trackMap);
  startMovingMarker(trackMap, false);

  // Draw a sample route line
  const from = CITIES['Bengaluru (Whitefield)'];
  const to   = CITIES['Mysuru (City Centre)'];
  L.polyline([from, to], { color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '8,6' }).addTo(trackMap);
  L.polyline([CITIES['Hubli'], from], { color: '#8b5cf6', weight: 3, opacity: 0.6, dashArray: '8,6' }).addTo(trackMap);
  L.polyline([CITIES['Mangaluru (Port)'], CITIES['Shivamogga']], { color: '#ef4444', weight: 3, opacity: 0.6, dashArray: '8,6' }).addTo(trackMap);
}

function addShipmentMarkers(map) {
  SHIPMENTS.forEach(s => {
    const color = s.status === 'delayed' ? '#ef4444' : s.status === 'delivered' ? '#10b981' : '#f59e0b';
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${color}">📦</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([s.lat, s.lng], { icon })
      .addTo(map)
      .bindPopup(`<b style="font-family:Syne">${s.id}</b><br>${s.from.split(' ')[0]} → ${s.to.split(' ')[0]}<br>ETA: ${s.eta}`);
  });
}

// Animates a delivery truck moving between two cities
function startMovingMarker(map, isMini) {
  const from = CITIES['Bengaluru (Whitefield)'];
  const to   = CITIES['Mysuru (City Centre)'];
  let t = 0;

  const truckIcon = L.divIcon({
    className: '',
    html: `<div class="custom-marker" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:2px solid #fff">🚛</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const marker = L.marker(from, { icon: truckIcon }).addTo(map).bindPopup('SHP-7821 · Live Tracking');
  if (isMini) movingMarker = marker; else trackMovingMarker = marker;

  setInterval(() => {
    t = (t + 0.003) % 1;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + (to[1] - from[1]) * t;
    marker.setLatLng([lat, lng]);
  }, 100);
}

function focusShipment(id) {
  const s = SHIPMENTS.find(x => x.id === id);
  if (!s || !trackMap) return;
  trackMap.setView([s.lat, s.lng], 9, { animate: true });
  showToast(`📍 Focused on ${id}`);
}

// ── ROUTE OPTIMIZER ───────────────────────────────────────
function optimizeRoute() {
  const src  = document.getElementById('routeSrc').value;
  const dest = document.getElementById('routeDest').value;
  const veh  = document.getElementById('routeVehicle').value;
  const pri  = document.getElementById('routePriority').value;

  if (!src || !dest) { showToast('⚠️ Please select source and destination'); return; }
  if (src === dest)   { showToast('⚠️ Source and destination cannot be same'); return; }

  const key = findRouteKey(src, dest);
  let dist = 200, road = 'NH-XX', congestion = 'medium', toll = 100;
  if (key && ROUTE_DATA[key]) {
    ({ dist, road, congestion, toll } = ROUTE_DATA[key]);
  } else {
    // Approximate
    const c1 = CITIES[src], c2 = CITIES[dest];
    if (c1 && c2) {
      const dlat = c1[0] - c2[0], dlng = c1[1] - c2[1];
      dist = Math.round(Math.sqrt(dlat*dlat + dlng*dlng) * 111);
    }
  }

  const vehicleData = VEHICLE_DATA.find(v => v.id === veh);
  const speedFactor = congestion === 'high' ? 0.6 : congestion === 'medium' ? 0.78 : 0.92;
  const priorityFactor = pri === 'same-day' ? 1.2 : pri === 'express' ? 1.0 : 0.85;
  const speed = vehicleData.baseSpeed * speedFactor;
  const baseHours = dist / speed;
  const totalHours = baseHours / priorityFactor;
  const hrs = Math.floor(totalHours);
  const mins = Math.round((totalHours - hrs) * 60);

  const congestionLabel = { low: '🟢 Low', medium: '🟡 Moderate', high: '🔴 High' }[congestion];
  const costEst = Math.round(dist * vehicleData.ratePerKm * (pri === 'same-day' ? 2 : pri === 'express' ? 1.5 : 1) + toll);

  document.getElementById('routeResult').innerHTML = `
    <div class="route-stat"><span class="route-stat-label">Route</span><span class="route-stat-val">${road}</span></div>
    <div class="route-stat"><span class="route-stat-label">Distance</span><span class="route-stat-val">${dist} km</span></div>
    <div class="route-stat"><span class="route-stat-label">Estimated Time</span><span class="route-stat-val">${hrs}h ${mins}m</span></div>
    <div class="route-stat"><span class="route-stat-label">Traffic</span><span class="route-stat-val">${congestionLabel}</span></div>
    <div class="route-stat"><span class="route-stat-label">Toll Charges</span><span class="route-stat-val">₹${toll}</span></div>
    <div class="route-stat"><span class="route-stat-label">Estimated Cost</span><span class="route-stat-val" style="color:var(--green)">₹${costEst.toLocaleString('en-IN')}</span></div>
    <div class="route-stat"><span class="route-stat-label">AI Score</span><span class="route-stat-val" style="color:var(--accent)">${congestion === 'low' ? '9.4' : congestion === 'medium' ? '7.8' : '5.2'}/10</span></div>
  `;
  document.getElementById('routeResult').classList.remove('hidden');

  // Update ETA
  const now = new Date();
  now.setHours(now.getHours() + hrs);
  now.setMinutes(now.getMinutes() + mins);
  const eta = now.toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const confidence = congestion === 'low' ? 94 : congestion === 'medium' ? 82 : 65;

  document.getElementById('etaDisplay').innerHTML = `
    <div class="eta-main">
      <div class="eta-time">${hrs}<span style="font-size:22px">h</span> ${mins}<span style="font-size:22px">m</span></div>
      <div class="eta-unit">Estimated Travel Time</div>
      <div class="eta-date">📅 Arrives: ${eta}</div>
      <div class="eta-confidence">
        <span>Confidence:</span>
        <div class="conf-bar"><div class="conf-fill" style="width:${confidence}%"></div></div>
        <span style="color:var(--accent)">${confidence}%</span>
      </div>
    </div>
  `;

  // Update delay panel
  const delays = [];
  if (congestion === 'high') {
    delays.push({ type: 'danger', icon: '🚨', text: '⚠️ Delay due to traffic — High congestion detected on ' + road, sub: 'Add 45–90 min buffer to ETA' });
  }
  if (congestion === 'medium') {
    delays.push({ type: 'warn', icon: '⚠️', text: '⚠️ Moderate traffic on ' + road, sub: 'Some slowdowns expected. Buffer 20–30 min.' });
  }
  if (dist > 350) {
    delays.push({ type: 'warn', icon: '🌧️', text: '⚠️ Long-haul route — weather check recommended', sub: 'Monsoon risk on Western Ghats stretch' });
  }
  if (delays.length === 0) {
    delays.push({ type: 'ok', icon: '✅', text: 'No active delay alerts for this route', sub: 'Road conditions are favorable' });
  }

  document.getElementById('delayPanel').innerHTML = delays.map(d => `
    <div class="delay-alert ${d.type}">
      <div class="delay-icon">${d.icon}</div>
      <div><div class="delay-text">${d.text}</div><div class="delay-sub">${d.sub}</div></div>
    </div>
  `).join('');

  showToast('✅ Route optimized successfully!');
}

function findRouteKey(a, b) {
  if (ROUTE_DATA[`${a}|${b}`]) return `${a}|${b}`;
  if (ROUTE_DATA[`${b}|${a}`]) return `${b}|${a}`;
  return null;
}

// ── COST ANALYSIS ─────────────────────────────────────────
function updateCost() {
  const dist    = parseFloat(document.getElementById('costDist').value)   || 120;
  const weight  = parseFloat(document.getElementById('costWeight').value) || 10;
  const urgency = parseFloat(document.getElementById('costUrgency').value)|| 1;
  const fuel    = parseFloat(document.getElementById('costFuel').value)   || 1;

  const costs = VEHICLE_DATA.map(v => {
    let effectiveRate = v.ratePerKm;
    if (weight > v.maxWeight) effectiveRate *= v.overweightFactor;
    const raw = Math.round(dist * effectiveRate * urgency * fuel);
    const etaH = Math.round(dist / v.baseSpeed);
    const weightOK = weight <= v.maxWeight;
    return { ...v, cost: raw, etaH, weightOK };
  });

  // Find cheapest among weight-compatible
  const compatible = costs.filter(c => c.weightOK);
  const minCost = compatible.length > 0 ? Math.min(...compatible.map(c => c.cost)) : Infinity;

  const container = document.getElementById('vehicleCards');
  container.innerHTML = costs.map((v, i) => {
    const isCheapest = v.weightOK && v.cost === minCost;
    const isOverweight = !v.weightOK;
    return `
      <div class="vehicle-card ${isCheapest ? 'cheapest' : ''}" style="animation-delay:${i*0.08}s;${isOverweight ? 'opacity:0.45;filter:grayscale(0.6)' : ''}">
        ${isCheapest ? '<div class="cheapest-badge">✅ AI Recommended</div>' : ''}
        <div class="vehicle-emoji">${v.emoji}</div>
        <div class="vehicle-name">${v.name}</div>
        <div class="vehicle-cost ${isCheapest ? 'green' : ''}">₹${v.cost.toLocaleString('en-IN')}</div>
        <div class="vehicle-breakdown">
          Base: ₹${Math.round(v.ratePerKm)}/km × ${dist}km<br>
          ${urgency > 1 ? `Urgency: ×${urgency}<br>` : ''}
          Max load: ${v.maxWeight >= 1000 ? (v.maxWeight/1000)+'T' : v.maxWeight+'kg'}
          ${isOverweight ? '<br><span style="color:var(--red)">⚠ Overweight for this vehicle</span>' : ''}
        </div>
        <div class="vehicle-eta">🕐 ETA: ~${v.etaH}h ${Math.round((dist / v.baseSpeed - v.etaH) * 60)}m</div>
      </div>
    `;
  }).join('');

  // AI recommendation text
  const cheapest = costs.find(v => v.weightOK && v.cost === minCost);
  const rec = document.getElementById('aiRecCard');
  if (cheapest && rec) {
    rec.innerHTML = `
      <div class="ai-rec-header">
        <div class="ai-badge">🤖 AI Insight</div>
        <span style="font-family:Syne;font-size:14px;font-weight:700">Cost Intelligence</span>
      </div>
      <div class="ai-rec-text">
        For a <strong>${weight}kg</strong> shipment over <strong>${dist}km</strong>,
        the <strong>${cheapest.emoji} ${cheapest.name}</strong> is the most cost-effective option at
        <strong style="color:var(--green)">₹${cheapest.cost.toLocaleString('en-IN')}</strong>.
        ${weight > 20 && cheapest.id !== 'bike' ? `<br><br>📦 Package weight exceeds bike capacity — Mini Van or Truck required.` : ''}
        ${urgency > 1.4 ? `<br><br>⚡ Same-day surcharge applied (×${urgency}). Consider express (×1.5) to reduce cost by ~${Math.round((urgency-1.5)*100)}%.` : ''}
        <br><br>💡 Tip: Consolidating shipments on this route could save up to <strong>₹${Math.round(cheapest.cost * 0.18).toLocaleString('en-IN')}</strong> per trip.
      </div>
    `;
  }
}

// ── RESCHEDULE ────────────────────────────────────────────
function rescheduleDelivery() {
  const ship = document.getElementById('reschedShip').value;
  const date = document.getElementById('reschedDate').value;
  const time = document.getElementById('reschedTime').value;
  const reason = document.getElementById('reschedReason').value;

  if (!date) { showToast('⚠️ Please select a new delivery date'); return; }

  const formatted = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const res = document.getElementById('reschedResult');
  res.className = 'result-box success';
  res.innerHTML = `✅ <strong>${ship}</strong> rescheduled to <strong>${formatted}</strong>, ${time}.<br>Reason: ${reason}. Driver notified via SMS.`;
  res.classList.remove('hidden');
  showToast('✅ Delivery rescheduled!');
}

// ── DATE DEFAULT ──────────────────────────────────────────
function setDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const el = document.getElementById('reschedDate');
  if (el) el.value = tomorrow.toISOString().split('T')[0];
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── AI ASSISTANT ────────────────────────────────────────────
function initAssistant() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const promptWrap = document.getElementById('quickPrompts');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    submitAssistantPrompt(text);
    input.value = '';
  });

  if (promptWrap) {
    promptWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.prompt-chip');
      if (!btn) return;
      submitAssistantPrompt(btn.dataset.prompt || btn.textContent.trim());
    });
  }

  addChatMessage('bot', 'Hi, I am OrionAI Assistant. Ask me about best routes for multiple deliveries, delay hotspots, cost reduction, or recent delivery/transaction history.');
}

function submitAssistantPrompt(question) {
  addChatMessage('user', question);
  addChatMessage('bot', 'Analyzing live logistics signals...');
  setTimeout(() => {
    replaceLastBotMessage(generateAssistantResponse(question));
  }, 500);
}

function addChatMessage(role, text) {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;
  const wrap = document.createElement('div');
  wrap.className = `chat-msg ${role}`;
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  wrap.innerHTML = `${escapeHtml(text)}<div class="chat-msg-meta">${role === 'user' ? 'You' : 'OrionAI'} • ${ts}</div>`;
  feed.appendChild(wrap);
  feed.scrollTop = feed.scrollHeight;
}

function replaceLastBotMessage(text) {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;
  const bots = feed.querySelectorAll('.chat-msg.bot');
  if (bots.length === 0) return;
  const target = bots[bots.length - 1];
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  target.innerHTML = `${escapeHtml(text)}<div class="chat-msg-meta">OrionAI • ${ts}</div>`;
  feed.scrollTop = feed.scrollHeight;
}

function generateAssistantResponse(rawQuestion) {
  const q = rawQuestion.toLowerCase();
  if (q.includes('multi') || q.includes('multiple') || q.includes('best route') || q.includes('deliveries')) {
    return buildMultiRouteResponse();
  }
  if (q.includes('delay') || q.includes('area') || q.includes('hotspot')) {
    return buildDelayHotspotResponse();
  }
  if (q.includes('cost') || q.includes('reduce') || q.includes('saving')) {
    return buildCostReductionResponse();
  }
  if (q.includes('history') || q.includes('recent') || q.includes('transaction')) {
    return buildHistoryResponse();
  }
  return `I can help with:
1) Best routes for multiple deliveries
2) Areas with highest delays
3) Cost reduction strategy
4) Recent delivery and transaction history
Try asking one of these directly.`;
}

function buildMultiRouteResponse() {
  const topRoutes = Object.entries(ROUTE_DATA)
    .sort((a, b) => a[1].dist - b[1].dist)
    .slice(0, 3)
    .map(([route, details], idx) => `${idx + 1}. ${route.replace('|', ' → ')} (${details.dist} km, ${details.congestion} traffic)`);

  return `Best multi-delivery sequence for today:
${topRoutes.join('\n')}

Recommendation: Group northbound stops (Hubli/Belagavi/Davangere) in one run and coastal routes separately to avoid NH-75 peak congestion.`;
}

function buildDelayHotspotResponse() {
  const delayed = SHIPMENTS.filter(s => s.status === 'delayed').length;
  const highCongestionRoutes = Object.entries(ROUTE_DATA)
    .filter(([, details]) => details.congestion === 'high')
    .map(([route]) => route.replace('|', ' → '));

  return `Current delay hotspots:
• Coastal + ghat corridor: Mangaluru → Shivamogga (high delay risk)
• Urban edge congestion: Bengaluru → Tumkur (peak-hour pressure)
• Active delayed shipments right now: ${delayed}

Action: Dispatch buffers of +45 minutes on high-risk lanes and auto-reroute where toll roads are clear.`;
}

function buildCostReductionResponse() {
  const sampleDist = 180;
  const truckCost = Math.round(sampleDist * VEHICLE_DATA.find(v => v.id === 'truck').ratePerKm);
  const vanCost = Math.round(sampleDist * VEHICLE_DATA.find(v => v.id === 'minivan').ratePerKm);
  const savings = truckCost - vanCost;

  return `Cost reduction plan:
• Shift medium loads from truck to mini-van on sub-200km routes
• Bundle same-corridor orders into one dispatch window
• Prefer standard/express over same-day for non-critical consignments

Estimated saving: ~₹${savings.toLocaleString('en-IN')} per 180km route when using mini-van instead of truck.`;
}

function buildHistoryResponse() {
  const completed = DELIVERY_HISTORY.filter(d => d.status === 'delivered').length;
  const delayed = DELIVERY_HISTORY.filter(d => d.status === 'delayed').length;
  const revenue = TRANSACTION_HISTORY.reduce((sum, t) => sum + t.amount, 0);

  return `Recent history snapshot:
• Deliveries tracked: ${DELIVERY_HISTORY.length}
• Completed: ${completed}, Delayed: ${delayed}
• Recent transaction value: ₹${revenue.toLocaleString('en-IN')}

Open the History section for full shipment-wise and transaction-wise logs.`;
}

function renderAssistantInsight() {
  const delayedPct = Math.round((SHIPMENTS.filter(s => s.status === 'delayed').length / SHIPMENTS.length) * 100);
  const best = Object.entries(ROUTE_DATA).filter(([, d]) => d.congestion === 'low').slice(0, 2).map(([r]) => r.replace('|', ' → ')).join(', ');
  const box = document.getElementById('assistantInsight');
  if (!box) return;
  box.innerHTML = `Current delayed shipment ratio is <strong>${delayedPct}%</strong>. Best low-congestion lanes now: <strong>${best}</strong>. OrionAI recommends clustering deliveries by corridor to reduce idle fleet time.`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── HISTORY ─────────────────────────────────────────────────
function renderHistory() {
  renderHistorySummary();
  renderDeliveryHistory();
  renderTransactionHistory();
}

function renderHistorySummary() {
  const delivered = DELIVERY_HISTORY.filter(x => x.status === 'delivered').length;
  const delayed = DELIVERY_HISTORY.filter(x => x.status === 'delayed').length;
  const inTransit = DELIVERY_HISTORY.filter(x => x.status === 'transit').length;
  const totalAmount = TRANSACTION_HISTORY.reduce((sum, t) => sum + t.amount, 0);

  const summary = document.getElementById('historySummary');
  if (!summary) return;
  summary.innerHTML = `
    <div class="summary-pill"><div class="label">Total Shipments</div><div class="value">${DELIVERY_HISTORY.length}</div></div>
    <div class="summary-pill"><div class="label">Delivered</div><div class="value" style="color:var(--green)">${delivered}</div></div>
    <div class="summary-pill"><div class="label">In Transit / Delayed</div><div class="value">${inTransit} / <span style="color:var(--red)">${delayed}</span></div></div>
    <div class="summary-pill"><div class="label">Recent Transaction Value</div><div class="value">₹${totalAmount.toLocaleString('en-IN')}</div></div>
  `;
}

function renderDeliveryHistory() {
  const body = document.getElementById('deliveryHistoryBody');
  if (!body) return;
  body.innerHTML = DELIVERY_HISTORY.map(item => `
    <tr>
      <td>${item.shipmentId}</td>
      <td>${item.route}</td>
      <td><span class="table-badge ${item.status}">${item.status.toUpperCase()}</span></td>
      <td>${item.deliveredAt}</td>
      <td>${item.delayMin > 0 ? `${item.delayMin} min` : '-'}</td>
    </tr>
  `).join('');
}

function renderTransactionHistory() {
  const body = document.getElementById('transactionHistoryBody');
  if (!body) return;
  body.innerHTML = TRANSACTION_HISTORY.map(item => `
    <tr>
      <td>${item.txnId}</td>
      <td>${item.shipmentId}</td>
      <td>₹${item.amount.toLocaleString('en-IN')}</td>
      <td>${item.method}</td>
      <td>${item.time}</td>
    </tr>
  `).join('');
}

// ── SIMULATE LIVE UPDATES ─────────────────────────────────
let updateCounter = 0;
setInterval(() => {
  updateCounter++;

  // Periodically add a new activity
  if (updateCounter % 20 === 0) {
    const newActivities = [
      { text: 'AI rerouted SHP-7821 to avoid toll congestion', color: '#3b82f6' },
      { text: '⚠️ Delay due to traffic — SHP-4300 affected on NH-67', color: '#ef4444' },
      { text: 'SHP-6204 arrived at Bengaluru hub on schedule', color: '#10b981' },
      { text: 'New batch scheduled: 14 shipments from Tumkur', color: '#8b5cf6' },
    ];
    const pick = newActivities[Math.floor(Math.random() * newActivities.length)];
    ACTIVITIES.unshift({ ...pick, time: 'Just now' });
    if (ACTIVITIES.length > 8) ACTIVITIES.pop();
    renderActivityList();
  }
}, 1000);
