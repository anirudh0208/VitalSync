/* ============================================================
   OrionAI — app.js v2.0
   Extended: Cold Chain, Emergency AI, Weather India,
             Real Road Paths, Heavy Vehicle Routing
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
  { id: 'SHP-7821', from: 'Bengaluru (Whitefield)', to: 'Mysuru (City Centre)',  status: 'transit',   eta: '2h 30m',  lat: 12.6300, lng: 77.1500, delivery_type: 'normal',     cold_chain_profile: null,    assigned_vehicle: 'V002' },
  { id: 'SHP-6204', from: 'Hubli',                 to: 'Bengaluru (Whitefield)', status: 'transit',   eta: '5h 10m',  lat: 14.5000, lng: 75.8000, delivery_type: 'cold_chain',  cold_chain_profile: 'pharma', assigned_vehicle: 'V003' },
  { id: 'SHP-5091', from: 'Mangaluru (Port)',       to: 'Shivamogga',            status: 'delayed',   eta: '4h 50m',  lat: 13.2000, lng: 75.3000, delivery_type: 'normal',     cold_chain_profile: null,    assigned_vehicle: 'V005' },
  { id: 'SHP-4300', from: 'Belagavi',               to: 'Davangere',             status: 'transit',   eta: '3h 00m',  lat: 15.1000, lng: 75.3000, delivery_type: 'cold_chain',  cold_chain_profile: 'frozen', assigned_vehicle: 'V004' },
  { id: 'SHP-3814', from: 'Tumkur',                 to: 'Hubli',                 status: 'delivered', eta: 'Done',    lat: 14.2000, lng: 76.4000, delivery_type: 'normal',     cold_chain_profile: null,    assigned_vehicle: 'V001' },
];

const ACTIVITIES = [
  { text: 'SHP-7821 departed Bengaluru checkpoint', time: '2 min ago',   color: '#3b82f6' },
  { text: '⚠️ SHP-5091 delayed — road block near Agumbe', time: '5 min ago',  color: '#ef4444' },
  { text: 'Route optimized: Hubli → Bengaluru, saved ₹1,200', time: '12 min ago', color: '#10b981' },
  { text: '❄️ Cold chain SHP-6204 temp OK: 4.2°C (target 2–8°C)', time: '15 min ago', color: '#06b6d4' },
  { text: 'SHP-3814 delivered at Hubli warehouse', time: '18 min ago', color: '#10b981' },
  { text: 'AI rerouted SHP-6204 via NH-48 — saves 40min', time: '31 min ago', color: '#06b6d4' },
];

const ALERTS_DATA = [
  { type: 'critical', icon: '🚨', title: '⚠️ Delay due to traffic — NH-75 near Agumbe', desc: 'SHP-5091 affected. 3 vehicles stuck in accident clearance. ETA pushed by 1h 20min. Auto-reroute via Tirthahalli initiated.', tag: 'critical', route: 'Mangaluru → Shivamogga', time: '5 min ago' },
  { type: 'warning',  icon: '🌧️', title: '⚠️ Weather advisory — Heavy rain in Coastal Karnataka', desc: 'Mangaluru port corridor at risk. 4 shipments may face 30–60 min delays. Monitoring wind speed > 55 km/h.', tag: 'warning', route: 'Mangaluru corridor', time: '12 min ago' },
  { type: 'warning',  icon: '🌡️', title: '⚠️ Cold chain temp breach risk — Bihar heat wave 38°C', desc: 'FreezePro HGV (V004): compartment temp trending toward upper threshold. Recommend increasing check interval.', tag: 'warning', route: 'Bihar corridor', time: '20 min ago' },
  { type: 'warning',  icon: '⛽', title: '⚠️ Fuel cost spike detected', desc: 'Diesel prices up 8% in Belagavi zone. AI recommends shifting 2 truck routes to Mini Van for cost saving of ₹3,400.', tag: 'warning', route: 'Belagavi zone', time: '28 min ago' },
  { type: 'info',     icon: '🔄', title: 'Route optimization complete', desc: 'AI optimized 6 routes on the Bengaluru–Mysuru corridor. Combined savings: ₹18,200 and 2.3 hours fleet time.', tag: 'info', route: 'Bengaluru → Mysuru', time: '45 min ago' },
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
  { id: 'flight',  emoji: '✈️', name: 'Flight',   ratePerKm: 32,   maxWeight: 25000,baseSpeed: 650, overweightFactor: 1.2 },
];

const COURIER_COST_DATA = [
  {
    id: 'dtdc', emoji: '📦', name: 'DTDC',
    intra1: [40, 70], inter1: [80, 100], intra10: [200, 300], inter10: [600, 900],
    slabs: [
      { min: 0, max: 1, range: [40, 70] }, { min: 1, max: 2, range: [70, 100] },
      { min: 2, max: 3, range: [100, 150] }, { min: 4, max: 5, range: [150, 200] },
      { min: 5, max: 10, range: [200, 400] }, { min: 10, max: null, range: [400, 520] },
    ],
  },
  {
    id: 'delhivery', emoji: '🚚', name: 'Delhivery',
    intra1: [30, 50], inter1: [70, 120], intra10: [180, 250], inter10: [500, 800],
    slabs: [
      { min: 0, max: 1, range: [30, 50] }, { min: 1, max: 2, range: [50, 80] },
      { min: 2, max: 3, range: [80, 120] }, { min: 4, max: 5, range: [120, 180] },
      { min: 5, max: 10, range: [180, 300] }, { min: 10, max: null, range: [300, 420] },
    ],
  },
  {
    id: 'blue-dart', emoji: '🛫', name: 'Blue Dart',
    intra1: [100, 150], inter1: [120, 200], intra10: [400, 600], inter10: [800, 1200],
    slabs: [
      { min: 0, max: 1, range: [100, 150] }, { min: 1, max: 2, range: [150, 200] },
      { min: 2, max: 3, range: [200, 300] }, { min: 4, max: 5, range: [300, 400] },
      { min: 5, max: 10, range: [400, 600] }, { min: 10, max: null, range: [600, 800] },
    ],
  },
  {
    id: 'india-post', emoji: '📮', name: 'India Post',
    intra1: [35, 55], inter1: [65, 90], intra10: [150, 200], inter10: [400, 600],
    slabs: [
      { min: 0, max: 1, range: [35, 55] }, { min: 1, max: 2, range: [50, 80] },
      { min: 2, max: 3, range: [80, 120] }, { min: 4, max: 5, range: [120, 180] },
      { min: 5, max: 10, range: [200, 300] }, { min: 10, max: null, range: [300, 420] },
    ],
  },
];

const INDIA_STATE_DISTRICTS_URLS = [
  'https://raw.githubusercontent.com/nshntarora/Indian-Cities-JSON/master/states-and-districts.json',
  'https://raw.githubusercontent.com/iamrahulchauhan/indian-state-district-city/master/state_district_wise.json',
  'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json',
];

const DELIVERY_HISTORY = [
  { shipmentId: 'SHP-7821', route: 'Bengaluru → Mysuru',     status: 'delivered', deliveredAt: 'Today, 03:10 PM',       delayMin: 8,  type: 'normal' },
  { shipmentId: 'SHP-6204', route: 'Hubli → Bengaluru',      status: 'transit',   deliveredAt: 'ETA Today, 07:20 PM',   delayMin: 18, type: 'cold_chain' },
  { shipmentId: 'SHP-5091', route: 'Mangaluru → Shivamogga', status: 'delayed',   deliveredAt: 'ETA Today, 09:05 PM',   delayMin: 70, type: 'normal' },
  { shipmentId: 'SHP-4300', route: 'Belagavi → Davangere',   status: 'transit',   deliveredAt: 'ETA Today, 06:40 PM',   delayMin: 14, type: 'cold_chain' },
  { shipmentId: 'SHP-3814', route: 'Tumkur → Hubli',         status: 'delivered', deliveredAt: 'Today, 11:45 AM',       delayMin: 0,  type: 'normal' },
  { shipmentId: 'SHP-7008', route: 'Bengaluru → Mangaluru',  status: 'delivered', deliveredAt: 'Yesterday, 07:05 PM',   delayMin: 22, type: 'normal' },
];

const TRANSACTION_HISTORY = [
  { txnId: 'TXN-11920', shipmentId: 'SHP-7821', amount: 4820, method: 'UPI',    time: 'Today, 03:18 PM' },
  { txnId: 'TXN-11913', shipmentId: 'SHP-3814', amount: 3620, method: 'Card',   time: 'Today, 12:02 PM' },
  { txnId: 'TXN-11905', shipmentId: 'SHP-7008', amount: 9210, method: 'NEFT',   time: 'Yesterday, 07:20 PM' },
  { txnId: 'TXN-11897', shipmentId: 'SHP-6120', amount: 2750, method: 'UPI',    time: 'Yesterday, 03:11 PM' },
  { txnId: 'TXN-11884', shipmentId: 'SHP-5987', amount: 6400, method: 'Card',   time: 'Yesterday, 11:49 AM' },
  { txnId: 'TXN-11875', shipmentId: 'SHP-5901', amount: 7180, method: 'Wallet', time: '2 days ago, 08:32 PM' },
];

// ── NEW DATA ────────────────────────────────────────────────
const VEHICLES_FLEET = [
  { id: 'V001', name: "Ravi's Ace",    type: 'light', refrigerated: false, status: 'available',  capacity_kg: 500,   lat: 12.9698, lng: 77.7500, driver: 'Ravi Kumar',  fuel_pct: 87 },
  { id: 'V002', name: 'Express Hawk',  type: 'light', refrigerated: false, status: 'in_transit', capacity_kg: 400,   lat: 12.6300, lng: 77.1500, driver: 'Suresh Babu', fuel_pct: 62 },
  { id: 'V003', name: 'ColdStar Mini', type: 'light', refrigerated: true,  status: 'in_transit', capacity_kg: 350,   lat: 14.5000, lng: 75.8000, driver: 'Priya Nair',  fuel_pct: 74 },
  { id: 'V004', name: 'FreezePro HGV', type: 'heavy', refrigerated: true,  status: 'available',  capacity_kg: 8000,  lat: 15.1000, lng: 75.3000, driver: 'Anand Singh', fuel_pct: 91 },
  { id: 'V005', name: 'Road King HGV', type: 'heavy', refrigerated: false, status: 'delayed',    capacity_kg: 10000, lat: 13.2000, lng: 75.3000, driver: 'Mohan Das',   fuel_pct: 45 },
  { id: 'V006', name: 'Swift Rider',   type: 'light', refrigerated: false, status: 'available',  capacity_kg: 20,    lat: 13.3379, lng: 77.1173, driver: 'Kiran Rao',   fuel_pct: 95 },
];

const COLD_CHAIN_PROFILES = {
  pharma:  { label: 'Pharma (2–8°C)',       min: 2,   max: 8,   color: '#3b82f6', icon: '💊', surcharge: 35 },
  frozen:  { label: 'Frozen (-18 to -12°C)', min: -18, max: -12, color: '#06b6d4', icon: '🧊', surcharge: 55 },
  chilled: { label: 'Chilled (0–4°C)',       min: 0,   max: 4,   color: '#8b5cf6', icon: '🌡️', surcharge: 40 },
};

const WEATHER_DATA = [
  { state: 'Andhra Pradesh',    city: 'Amaravati',          temp_c: 34, condition: 'Sunny',          wind_kmh: 14, humidity: 58, icon: '☀️',  route_impact: 'none' },
  { state: 'Arunachal Pradesh', city: 'Itanagar',           temp_c: 18, condition: 'Partly Cloudy',  wind_kmh: 10, humidity: 72, icon: '⛅',  route_impact: 'none' },
  { state: 'Assam',             city: 'Dispur',              temp_c: 27, condition: 'Heavy Rain',     wind_kmh: 42, humidity: 91, icon: '🌧️',  route_impact: 'delay_60min' },
  { state: 'Bihar',             city: 'Patna',               temp_c: 38, condition: 'Heat Wave',      wind_kmh: 8,  humidity: 32, icon: '🔥',  route_impact: 'cold_chain_risk' },
  { state: 'Chhattisgarh',      city: 'Raipur',              temp_c: 36, condition: 'Sunny',          wind_kmh: 11, humidity: 40, icon: '☀️',  route_impact: 'none' },
  { state: 'Goa',               city: 'Panaji',              temp_c: 30, condition: 'Moderate Rain',  wind_kmh: 28, humidity: 82, icon: '🌦️',  route_impact: 'delay_30min' },
  { state: 'Gujarat',           city: 'Gandhinagar',         temp_c: 37, condition: 'Hot & Dry',      wind_kmh: 20, humidity: 25, icon: '🌡️',  route_impact: 'cold_chain_risk' },
  { state: 'Haryana',           city: 'Chandigarh',          temp_c: 32, condition: 'Clear',          wind_kmh: 16, humidity: 45, icon: '☀️',  route_impact: 'none' },
  { state: 'Himachal Pradesh',  city: 'Shimla',              temp_c: 12, condition: 'Foggy',          wind_kmh: 6,  humidity: 68, icon: '🌫️',  route_impact: 'delay_20min' },
  { state: 'Jharkhand',         city: 'Ranchi',              temp_c: 29, condition: 'Partly Cloudy',  wind_kmh: 12, humidity: 60, icon: '⛅',  route_impact: 'none' },
  { state: 'Karnataka',         city: 'Bengaluru',           temp_c: 27, condition: 'Partly Cloudy',  wind_kmh: 15, humidity: 62, icon: '⛅',  route_impact: 'none' },
  { state: 'Kerala',            city: 'Thiruvananthapuram',  temp_c: 31, condition: 'Heavy Rain',     wind_kmh: 52, humidity: 90, icon: '⛈️',  route_impact: 'delay_60min' },
  { state: 'Madhya Pradesh',    city: 'Bhopal',              temp_c: 39, condition: 'Extreme Heat',   wind_kmh: 7,  humidity: 18, icon: '🔥',  route_impact: 'cold_chain_risk' },
  { state: 'Maharashtra',       city: 'Mumbai',              temp_c: 32, condition: 'Moderate Rain',  wind_kmh: 35, humidity: 85, icon: '🌧️',  route_impact: 'delay_30min' },
  { state: 'Manipur',           city: 'Imphal',              temp_c: 22, condition: 'Cloudy',         wind_kmh: 14, humidity: 70, icon: '☁️',  route_impact: 'none' },
  { state: 'Meghalaya',         city: 'Shillong',            temp_c: 17, condition: 'Heavy Rain',     wind_kmh: 38, humidity: 92, icon: '⛈️',  route_impact: 'delay_60min' },
  { state: 'Mizoram',           city: 'Aizawl',              temp_c: 20, condition: 'Drizzle',        wind_kmh: 18, humidity: 78, icon: '🌦️',  route_impact: 'delay_15min' },
  { state: 'Nagaland',          city: 'Kohima',              temp_c: 19, condition: 'Partly Cloudy',  wind_kmh: 10, humidity: 66, icon: '⛅',  route_impact: 'none' },
  { state: 'Odisha',            city: 'Bhubaneswar',         temp_c: 36, condition: 'Sunny',          wind_kmh: 18, humidity: 55, icon: '☀️',  route_impact: 'none' },
  { state: 'Punjab',            city: 'Chandigarh',          temp_c: 33, condition: 'Clear',          wind_kmh: 14, humidity: 42, icon: '☀️',  route_impact: 'none' },
  { state: 'Rajasthan',         city: 'Jaipur',              temp_c: 42, condition: 'Extreme Heat',   wind_kmh: 22, humidity: 12, icon: '🔥',  route_impact: 'cold_chain_risk' },
  { state: 'Sikkim',            city: 'Gangtok',             temp_c: 14, condition: 'Heavy Fog',      wind_kmh: 5,  humidity: 80, icon: '🌫️',  route_impact: 'delay_30min' },
  { state: 'Tamil Nadu',        city: 'Chennai',             temp_c: 35, condition: 'Hot & Humid',    wind_kmh: 20, humidity: 75, icon: '🌡️',  route_impact: 'cold_chain_risk' },
  { state: 'Telangana',         city: 'Hyderabad',           temp_c: 37, condition: 'Partly Cloudy',  wind_kmh: 16, humidity: 48, icon: '⛅',  route_impact: 'none' },
  { state: 'Tripura',           city: 'Agartala',            temp_c: 28, condition: 'Moderate Rain',  wind_kmh: 24, humidity: 80, icon: '🌧️',  route_impact: 'delay_30min' },
  { state: 'Uttar Pradesh',     city: 'Lucknow',             temp_c: 40, condition: 'Heat Wave',      wind_kmh: 9,  humidity: 22, icon: '🔥',  route_impact: 'cold_chain_risk' },
  { state: 'Uttarakhand',       city: 'Dehradun',            temp_c: 19, condition: 'Cloudy',         wind_kmh: 12, humidity: 65, icon: '☁️',  route_impact: 'none' },
  { state: 'West Bengal',       city: 'Kolkata',             temp_c: 33, condition: 'Moderate Rain',  wind_kmh: 30, humidity: 82, icon: '🌧️',  route_impact: 'delay_30min' },
];

// Encoded polyline paths (Google Polyline Encoding format)
// Decode with decodePolyline() before passing to Leaflet
// Production: replace with ORS /v2/directions or Google Directions API geometry
const ROAD_PATHS = {
  // Bengaluru (Whitefield) → Mysuru (City Centre)  [NH-275, ~152 km]
  'Bengaluru (Whitefield)|Mysuru (City Centre)':
    'yz`iBmdjyM?aFdBqEpBcEtBgEdBkEdBkExDsFzE_FlEmEhEmFfEuFdEuF',

  // Bengaluru (Whitefield) → Hubli  [NH-48, ~413 km]
  'Bengaluru (Whitefield)|Hubli':
    'yz`iBmdjyMiHbIoJfK_LfK_L`KwJvJuJvJmJhK{NhR{NhRuY`d@cPdUuItJwJhKwJhKoItJqH`JoHhJqHhJuH`K',

  // Bengaluru (Whitefield) → Mangaluru (Port)  [NH-75, ~352 km]
  'Bengaluru (Whitefield)|Mangaluru (Port)':
    'yz`iBmdjyMhHxKlHzKpHxKtH`LzHbLbIbLfInLlIfLrIhLzIlL`JnLhJrL',

  // Hubli → Belagavi  [NH-748, ~98 km]
  'Hubli|Belagavi':
    'g_qjBsxotMuJtHwJpHyJlHyJlHyJfH',

  // Mangaluru (Port) → Shivamogga  [NH-169, ~161 km]
  'Mangaluru (Port)|Shivamogga':
    '_qmhB}|buMiObGoQkH{PkH{PgHsPcHsTaHsT}GqTyGqT}GqVaHsVaH',

  // Belagavi → Davangere  [NH-67, ~180 km]
  'Belagavi|Davangere':
    'cj_nBmxhpMxNqJzNuJxNuJzNuJ|NwJzNuJvNqJrNqJrNqJpNqJnNqJjNmJhNiJ',
};

/**
 * Decode a Google-encoded polyline string into [[lat,lng], ...] coordinate pairs.
 * Implements the standard Polyline Algorithm:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded) {
  const coords = [];
  let idx = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (idx < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    coords.push([lat * 1e-5, lng * 1e-5]);
  }
  return coords;
}

/**
 * Helper: get decoded coordinate array for a ROAD_PATHS key.
 * Falls back to null if not found.
 */
function getDecodedPath(key) {
  const enc = ROAD_PATHS[key] || ROAD_PATHS[key?.split('|').reverse().join('|')];
  return enc ? decodePolyline(enc) : null;
}

// ── STATE ─────────────────────────────────────────────────
let miniMap = null, trackMap = null, routeMap = null, emergencyMap = null;
let movingMarker = null, trackMovingMarker = null;
let routeMapLayer = null;
let isLightMode = false;
let trackingMarkers = [], trackingRouteLines = [];
let indiaStatesData = [];
let indiaDistrictCoordCache = {};
let currentVehicleClass = 'light';
let currentDeliveryType = 'normal';
let currentTempProfile = 'pharma';
let ccVehicleClass = 'light';
let emergencyEventCount = 0;
let emergencyMapMarkers = [];
let weatherFilterMode = 'all';

const TRACK_CENTER = { lat: 14.0, lng: 76.0 };
const DASH_CENTER = { lat: 14.5, lng: 75.7 };

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
  initIndiaLocationSelectors();
  renderFleetOverview();
  renderColdFleetList();
  renderFleetStatusList();
  renderWeatherBadges();
  initWeatherGrid();
  initWeatherSummary();
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
    { id: 'kpi1', target: 2841 },
    { id: 'kpi2', target: 184 },
    { id: 'kpi3', target: 14 },
    { id: 'kpi-cold', target: 12 },
  ];
  kpis.forEach(({ id, target }) => {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const duration = 1600;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = start.toLocaleString('en-IN');
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
        dashboard: 'Dashboard', tracking: 'Live Tracking', route: 'Route Optimizer',
        cost: 'Cost Analysis', coldchain: '❄️ Cold Chain', emergency: '🚨 Emergency AI',
        weather: '🌦️ Weather India', alerts: 'Alerts', assistant: 'AI Assistant', history: 'History'
      };
      document.getElementById('pageTitle').textContent = titles[sec] || sec;
      if (window.innerWidth <= 900) document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function switchSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('sec-' + name);
  if (target) target.classList.add('active');

  if (name === 'dashboard' && !miniMap)   setTimeout(initMiniMap, 100);
  if (name === 'tracking' && !trackMap)   setTimeout(initTrackMap, 100);
  if (name === 'emergency' && !emergencyMap) setTimeout(initEmergencyMap, 100);
  if (name === 'route' && !routeMap)      setTimeout(initRouteMap, 100);
}

function setupSidebarToggle() {
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

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
  if (!list) return;
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
  if (!list) return;
  list.innerHTML = SHIPMENTS.map(s => `
    <div class="shipment-item" onclick="focusShipment('${s.id}')">
      <div>
        <div class="ship-id">${s.id} ${s.delivery_type === 'cold_chain' ? '<span class="cold-tag">❄️</span>' : ''}</div>
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
  if (!list) return;
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
    { label: '🔴 Critical', num: ALERTS_DATA.filter(a => a.type === 'critical').length, color: 'var(--red)' },
    { label: '🟡 Warnings', num: ALERTS_DATA.filter(a => a.type === 'warning').length, color: 'var(--amber)' },
    { label: '🔵 Info',     num: ALERTS_DATA.filter(a => a.type === 'info').length, color: 'var(--accent)' },
    { label: '✅ Resolved', num: ALERTS_DATA.filter(a => a.type === 'resolved').length, color: 'var(--green)' },
  ];
  const el = document.getElementById('alertStats');
  if (el) el.innerHTML = stats.map(s => `
    <div class="alert-stat-item">
      <span class="alert-stat-label">${s.label}</span>
      <span class="alert-stat-num" style="color:${s.color}">${s.num}</span>
    </div>
  `).join('');

  const badge = document.getElementById('alertCount');
  if (badge) badge.textContent = stats[0].num + stats[1].num;
}

// ── MINI MAP (DASHBOARD) ──────────────────────────────────
function initMiniMap() {
  if (miniMap) return;
  miniMap = L.map('miniMap', { zoomControl: true, scrollWheelZoom: false }).setView([DASH_CENTER.lat, DASH_CENTER.lng], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(miniMap);
  addShipmentMarkers(miniMap);
  addRealRouteLines(miniMap);
  startMovingMarker(miniMap, true);
}

// ── TRACK MAP ─────────────────────────────────────────────
function initTrackMap() {
  if (trackMap) return;
  trackMap = L.map('trackMap', { zoomControl: true }).setView([TRACK_CENTER.lat, TRACK_CENTER.lng], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(trackMap);

  Object.entries(CITIES).forEach(([name, latlng]) => {
    const icon = L.divIcon({ className: '', html: `<div class="custom-marker" style="background:rgba(59,130,246,0.9)">🏙️</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
    L.marker(latlng, { icon }).addTo(trackMap).bindPopup(`<b style="font-family:Syne">${name}</b>`);
  });

  addShipmentMarkers(trackMap);
  addRealRouteLines(trackMap);
  startMovingMarker(trackMap, false);
}

// ── ROUTE MAP (Route Optimizer) ───────────────────────────
function initRouteMap() {
  if (routeMap) return;
  routeMap = L.map('routeMap', { zoomControl: false, scrollWheelZoom: false }).setView([14.0, 76.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(routeMap);
}

// ── EMERGENCY MAP ─────────────────────────────────────────
function initEmergencyMap() {
  if (emergencyMap) return;
  emergencyMap = L.map('emergencyMap', { zoomControl: true, scrollWheelZoom: false }).setView([14.0, 76.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(emergencyMap);

  // Show all fleet vehicles
  VEHICLES_FLEET.forEach(v => {
    const color = v.status === 'available' ? '#10b981' : v.status === 'delayed' ? '#f59e0b' : '#3b82f6';
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${color}">${v.refrigerated ? '❄️' : v.type === 'heavy' ? '🚛' : '🚐'}</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    });
    const marker = L.marker([v.lat, v.lng], { icon })
      .addTo(emergencyMap)
      .bindPopup(`<b>${v.name}</b><br>${v.driver}<br>Status: ${v.status.toUpperCase()}`);
    emergencyMapMarkers.push({ vehicle: v, marker });
  });
}

// ── REAL ROAD ROUTE LINES ─────────────────────────────────
function addRealRouteLines(map) {
  const routes = [
    { key: 'Bengaluru (Whitefield)|Mysuru (City Centre)', color: '#3b82f6', weight: 3 },
    { key: 'Bengaluru (Whitefield)|Hubli',                color: '#8b5cf6', weight: 2.5 },
    { key: 'Mangaluru (Port)|Shivamogga',                 color: '#ef4444', weight: 3, dashArray: '6,4' },
  ];
  routes.forEach(r => {
    const path = getDecodedPath(r.key);
    if (!path) return;
    L.polyline(path, {
      color: r.color,
      weight: r.weight || 3,
      opacity: 0.8,
      dashArray: r.dashArray || null,
    }).addTo(map).bindTooltip(r.key.replace('|', ' → '), { sticky: true });
  });
}

function addShipmentMarkers(map) {
  SHIPMENTS.forEach(s => {
    const color = s.status === 'delayed' ? '#ef4444' : s.status === 'delivered' ? '#10b981' : '#f59e0b';
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${color}">${s.delivery_type === 'cold_chain' ? '❄️' : '📦'}</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    });
    L.marker([s.lat, s.lng], { icon }).addTo(map)
      .bindPopup(`<b style="font-family:Syne">${s.id}</b><br>${s.from.split(' ')[0]} → ${s.to.split(' ')[0]}<br>ETA: ${s.eta}${s.delivery_type === 'cold_chain' ? '<br>❄️ Cold Chain' : ''}`);
  });
}

function startMovingMarker(map, isMini) {
  const from = CITIES['Bengaluru (Whitefield)'];
  // Decode the encoded polyline for the moving truck animation
  const path = getDecodedPath('Bengaluru (Whitefield)|Mysuru (City Centre)') ||
               [[12.9698, 77.7500],[12.2958, 76.6394]];
  let step = 0;

  const truckIcon = L.divIcon({
    className: '',
    html: `<div class="custom-marker moving-truck" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:2px solid #fff">🚛</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17]
  });

  const marker = L.marker(from, { icon: truckIcon }).addTo(map).bindPopup('SHP-7821 · Live Tracking · NH-275');
  if (isMini) movingMarker = marker; else trackMovingMarker = marker;

  setInterval(() => {
    step = (step + 1) % (path.length * 30);
    const pathIdx = Math.floor(step / 30);
    const nextIdx = Math.min(pathIdx + 1, path.length - 1);
    const t = (step % 30) / 30;
    const lat = path[pathIdx][0] + (path[nextIdx][0] - path[pathIdx][0]) * t;
    const lng = path[pathIdx][1] + (path[nextIdx][1] - path[pathIdx][1]) * t;
    marker.setLatLng([lat, lng]);
  }, 120);
}

function focusShipment(id) {
  const s = SHIPMENTS.find(x => x.id === id);
  if (!s || !trackMap) return;
  trackMap.setView([s.lat, s.lng], 9, { animate: true });
  showToast(`📍 Focused on ${id}`);
}

// ── ROUTE OPTIMIZER (extended) ────────────────────────────
let _currentVehicleClassRoute = 'light';

function setVehicleClass(cls) {
  _currentVehicleClassRoute = cls;
  document.querySelectorAll('#vehicleClassToggle .vclass-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.class === cls);
  });

  // Show/hide heavy vehicle options
  const heavyOpts = document.getElementById('heavyVehicleOptions');
  if (heavyOpts) heavyOpts.classList.toggle('hidden', cls !== 'heavy');

  // Hide vehicle type selector when HGV is selected (HGV always uses truck-class)
  const vehicleTypeGroup = document.getElementById('vehicleTypeGroup');
  if (vehicleTypeGroup) {
    vehicleTypeGroup.style.display = cls === 'heavy' ? 'none' : '';
  }

  const badge = document.getElementById('routeMapPill');
  if (badge) badge.textContent = cls === 'heavy' ? '🚛 HGV Highway' : 'Road Path';
}

async function optimizeRoute() {
  const srcState = document.getElementById('routeSrcState').value;
  const srcDistrict = document.getElementById('routeSrcDistrict').value;
  const destState = document.getElementById('routeDestState').value;
  const destDistrict = document.getElementById('routeDestDistrict').value;
  const veh  = document.getElementById('routeVehicle').value;
  const pri  = document.getElementById('routePriority').value;
  const isHeavy = _currentVehicleClassRoute === 'heavy';

  if (!srcState || !srcDistrict || !destState || !destDistrict) {
    showToast('⚠️ Please select source/destination state and district');
    return;
  }
  if (srcDistrict === destDistrict) { showToast('⚠️ Source and destination cannot be same'); return; }

  const key = findRouteKey(srcDistrict, destDistrict);
  let dist = 200, road = 'National Highway', congestion = 'medium', toll = 100;

  if (key && ROUTE_DATA[key]) {
    ({ dist, road, congestion, toll } = ROUTE_DATA[key]);
  } else {
    const srcCoords = await geocodeDistrict(srcState, srcDistrict);
    const destCoords = await geocodeDistrict(destState, destDistrict);
    if (srcCoords && destCoords) {
      dist = Math.max(20, Math.round(haversineKm(srcCoords, destCoords)));
      road = dist > 900 ? 'NH Corridor + Expressway Mix' : dist > 350 ? 'Interstate NH Corridor' : 'Regional + NH Mix';
      congestion = dist > 800 ? 'high' : dist > 300 ? 'medium' : 'low';
      toll = Math.max(40, Math.round(dist * 0.7));
    }
  }

  // Heavy vehicle adjustments
  if (isHeavy) {
    toll += 150; // HGV toll premium
    const hgvWeight = parseFloat(document.getElementById('hgvWeight')?.value || 5000);
  }

  const vehicleData = VEHICLE_DATA.find(v => v.id === veh) || VEHICLE_DATA[1];
  const baseSpeed = isHeavy ? Math.min(vehicleData.baseSpeed, 42) : vehicleData.baseSpeed;
  const speedFactor = veh === 'flight' ? 1 : (congestion === 'high' ? 0.6 : congestion === 'medium' ? 0.78 : 0.92);
  const priorityFactor = pri === 'same-day' ? 1.2 : pri === 'express' ? 1.0 : 0.85;
  const speed = baseSpeed * speedFactor;
  const baseHours = dist / speed;
  const totalHours = baseHours / priorityFactor;
  const hrs = Math.floor(totalHours);
  const mins = Math.round((totalHours - hrs) * 60);

  const congestionLabel = { low: '🟢 Low', medium: '🟡 Moderate', high: '🔴 High' }[congestion];
  const baseFare = veh === 'flight' ? 1800 : 0;
  const tollCost = veh === 'flight' ? 0 : toll;
  const coldChainSurcharge = currentDeliveryType === 'cold_chain' ? 1.4 : 1;
  const costEst = Math.round(dist * vehicleData.ratePerKm * (pri === 'same-day' ? 2 : pri === 'express' ? 1.5 : 1) * coldChainSurcharge + tollCost + baseFare);

  const heavyBadge = isHeavy ? `<div class="heavy-route-info">🚛 HGV Mode: Highway-only routing · Avoid residential zones</div>` : '';

  document.getElementById('routeResult').innerHTML = `
    ${heavyBadge}
    <div class="route-stat"><span class="route-stat-label">Route</span><span class="route-stat-val">${srcDistrict}, ${srcState} → ${destDistrict}, ${destState}</span></div>
    <div class="route-stat"><span class="route-stat-label">Highway</span><span class="route-stat-val">${road} ${isHeavy ? '(HGV)' : ''}</span></div>
    <div class="route-stat"><span class="route-stat-label">Distance</span><span class="route-stat-val">${dist} km</span></div>
    <div class="route-stat"><span class="route-stat-label">Estimated Time</span><span class="route-stat-val">${hrs}h ${mins}m</span></div>
    <div class="route-stat"><span class="route-stat-label">Traffic</span><span class="route-stat-val">${congestionLabel}</span></div>
    <div class="route-stat"><span class="route-stat-label">Toll Charges</span><span class="route-stat-val">₹${toll}</span></div>
    <div class="route-stat"><span class="route-stat-label">Estimated Cost</span><span class="route-stat-val" style="color:var(--green)">₹${costEst.toLocaleString('en-IN')}</span></div>
    <div class="route-stat"><span class="route-stat-label">AI Score</span><span class="route-stat-val" style="color:var(--accent)">${congestion === 'low' ? '9.4' : congestion === 'medium' ? '7.8' : '5.2'}/10</span></div>
  `;
  document.getElementById('routeResult').classList.remove('hidden');

  // ETA Panel
  const now = new Date();
  now.setHours(now.getHours() + hrs);
  now.setMinutes(now.getMinutes() + mins);
  const eta = now.toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const confidence = congestion === 'low' ? 93 : congestion === 'medium' ? 80 : 62;

  document.getElementById('etaDisplay').innerHTML = `
    <div class="eta-main">
      <div class="eta-time">${hrs}<span style="font-size:22px">h</span> ${mins}<span style="font-size:22px">m</span></div>
      <div class="eta-unit">AI Predicted Travel Time ${isHeavy ? '(HGV)' : ''}</div>
      <div class="eta-date">📅 Arrives: ${eta}</div>
      <div class="eta-confidence">
        <span>AI Confidence:</span>
        <div class="conf-bar"><div class="conf-fill" style="width:${confidence}%"></div></div>
        <span style="color:var(--accent)">${confidence}%</span>
      </div>
    </div>
  `;

  // Delay Panel
  const delays = [];
  if (congestion === 'high') delays.push({ type: 'danger', icon: '🚨', text: '⚠️ High congestion on ' + road, sub: 'Add 45–90 min buffer to ETA' });
  if (congestion === 'medium') delays.push({ type: 'warn', icon: '⚠️', text: '⚠️ Moderate traffic — ' + road, sub: 'Buffer 20–30 min expected' });
  if (dist > 350) delays.push({ type: 'warn', icon: '🌧️', text: 'Long-haul weather check recommended', sub: 'Monsoon risk on ghat sections' });
  if (isHeavy) delays.push({ type: 'info', icon: '🚛', text: 'HGV routing active — residential zones bypassed', sub: 'Only highway-permitted roads selected' });
  if (!delays.length) delays.push({ type: 'ok', icon: '✅', text: 'No active delay alerts for this route', sub: 'Road conditions are favorable' });

  document.getElementById('delayPanel').innerHTML = delays.map(d => `
    <div class="delay-alert ${d.type}">
      <div class="delay-icon">${d.icon}</div>
      <div><div class="delay-text">${d.text}</div><div class="delay-sub">${d.sub}</div></div>
    </div>
  `).join('');

  // Route Map visualization
  updateRouteMapVisualization(srcDistrict, destDistrict, isHeavy);

  showToast(`✅ ${isHeavy ? 'HGV highway route' : 'Route'} optimized!`);
}

function updateRouteMapVisualization(src, dest, isHeavy) {
  if (!routeMap) {
    initRouteMap();
    setTimeout(() => drawRouteOnMap(src, dest, isHeavy), 300);
  } else {
    drawRouteOnMap(src, dest, isHeavy);
  }
}

function drawRouteOnMap(src, dest, isHeavy) {
  if (!routeMap) return;
  if (routeMapLayer) { routeMap.removeLayer(routeMapLayer); routeMapLayer = null; }

  // Prefer encoded polyline decode, then reverse direction, then interpolate
  const fwdKey = findRouteKey(src, dest);
  let path = getDecodedPath(fwdKey);

  const srcCoords = CITIES[src];
  const destCoords = CITIES[dest];

  if (!path && srcCoords && destCoords) {
    path = interpolatePath(srcCoords, destCoords, 6);
  }

  if (path) {
    routeMapLayer = L.layerGroup().addTo(routeMap);
    L.polyline(path, {
      color: isHeavy ? '#f59e0b' : '#3b82f6',
      weight: isHeavy ? 5 : 4,
      opacity: 0.9,
      dashArray: isHeavy ? null : '8,4',
    }).addTo(routeMapLayer);

    if (srcCoords) {
      L.marker(srcCoords, { icon: L.divIcon({ className: '', html: `<div class="custom-marker" style="background:#10b981">🚦</div>`, iconSize: [30,30], iconAnchor: [15,15] }) }).addTo(routeMapLayer);
    }
    if (destCoords) {
      L.marker(destCoords, { icon: L.divIcon({ className: '', html: `<div class="custom-marker" style="background:#ef4444">🏁</div>`, iconSize: [30,30], iconAnchor: [15,15] }) }).addTo(routeMapLayer);
    }

    const bounds = L.latLngBounds(path);
    routeMap.fitBounds(bounds, { padding: [30, 30] });
  }
}

function interpolatePath(o, d, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = Math.sin(t * Math.PI) * 0.04 * (Math.random() > 0.5 ? 1 : -1);
    pts.push([
      o[0] + (d[0] - o[0]) * t + jitter,
      o[1] + (d[1] - o[1]) * t + jitter
    ]);
  }
  pts[0] = [...o];
  pts[pts.length - 1] = [...d];
  return pts;
}

// ── FLEET OVERVIEW (Dashboard) ────────────────────────────
function renderFleetOverview() {
  const el = document.getElementById('fleetOverviewGrid');
  if (!el) return;
  el.innerHTML = VEHICLES_FLEET.map(v => {
    const statusColor = v.status === 'available' ? '#10b981' : v.status === 'in_transit' ? '#3b82f6' : v.status === 'delayed' ? '#f59e0b' : '#ef4444';
    return `
    <div class="fleet-card">
      <div class="fleet-card-top">
        <span class="fleet-emoji">${v.refrigerated ? '❄️' : v.type === 'heavy' ? '🚛' : '🚐'}</span>
        <span class="fleet-status-dot" style="background:${statusColor}" title="${v.status}"></span>
      </div>
      <div class="fleet-name">${v.name}</div>
      <div class="fleet-driver">${v.driver}</div>
      <div class="fleet-status" style="color:${statusColor}">${v.status.replace('_',' ').toUpperCase()}</div>
      <div class="fleet-fuel">
        <div class="fuel-bar"><div class="fuel-fill" style="width:${v.fuel_pct}%;background:${v.fuel_pct > 50 ? '#10b981' : v.fuel_pct > 25 ? '#f59e0b' : '#ef4444'}"></div></div>
        <span>${v.fuel_pct}%</span>
      </div>
    </div>
  `}).join('');
}

// ── COLD CHAIN UI ──────────────────────────────────────────
function setDeliveryType(type) {
  currentDeliveryType = type;
  document.querySelectorAll('.dtype-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  document.getElementById('coldChainOptions').classList.toggle('hidden', type !== 'cold_chain');
}

function selectTempProfile(profile) {
  currentTempProfile = profile;
  document.querySelectorAll('.temp-profile-card').forEach(c => c.classList.toggle('active', c.dataset.profile === profile));
  const info = { pharma: '💊 Pharma vehicles maintain 2–8°C compartment temperature', frozen: '🧊 Frozen requires -18 to -12°C specialized units', chilled: '🌡️ Chilled cargo kept at 0–4°C with enhanced insulation' };
  const iconMap = { pharma: '💊', frozen: '🧊', chilled: '🌡️' };
  document.getElementById('coldInfoText').textContent = info[profile];
  document.getElementById('coldInfoBox').querySelector('.cold-info-icon').textContent = iconMap[profile];
}

function setCCVehicleClass(cls) {
  ccVehicleClass = cls;
  document.querySelectorAll('.coldchain-form-card .vclass-btn').forEach(b => b.classList.toggle('active', b.dataset.class === cls));
}

function createColdChainShipment() {
  const origin = document.getElementById('ccOrigin').value;
  const dest   = document.getElementById('ccDest').value;
  const weight = parseFloat(document.getElementById('ccWeight').value);

  if (!origin || !dest) { showToast('⚠️ Select origin and destination'); return; }
  if (origin === dest)  { showToast('⚠️ Origin and destination must differ'); return; }

  // AI vehicle assignment (simulated)
  const needsRef = currentDeliveryType === 'cold_chain';
  const available = VEHICLES_FLEET.filter(v =>
    v.status === 'available' &&
    v.type === ccVehicleClass &&
    (!needsRef || v.refrigerated) &&
    v.capacity_kg >= weight
  );

  const assigned = available[0] || VEHICLES_FLEET.filter(v => v.status === 'available' && (!needsRef || v.refrigerated))[0];

  if (!assigned) {
    showToast('⚠️ No suitable vehicle available right now');
    return;
  }

  const key = findRouteKey(origin, dest);
  const route = (key && ROUTE_DATA[key]) || { dist: 200, road: 'NH Corridor', congestion: 'medium', toll: 100 };
  const profile = currentDeliveryType === 'cold_chain' ? COLD_CHAIN_PROFILES[currentTempProfile] : null;
  const costMultiplier = profile ? (1 + profile.surcharge / 100) : 1;
  const eta = Math.round(route.dist / (ccVehicleClass === 'heavy' ? 38 : 50));
  const cost = Math.round(route.dist * (ccVehicleClass === 'heavy' ? 18 : 9) * costMultiplier + route.toll);
  const newId = `SHP-${9000 + Math.floor(Math.random() * 999)}`;

  assigned.status = 'in_transit';
  SHIPMENTS.push({ id: newId, from: origin, to: dest, status: 'transit', eta: `${eta}h`, lat: CITIES[origin][0], lng: CITIES[origin][1], delivery_type: currentDeliveryType, cold_chain_profile: currentDeliveryType === 'cold_chain' ? currentTempProfile : null, assigned_vehicle: assigned.id });

  renderColdFleetList();
  renderFleetOverview();
  renderFleetStatusList();

  const resultEl = document.getElementById('ccResult');
  resultEl.className = 'cc-result success';
  resultEl.innerHTML = `
    <div class="cc-result-header">✅ Shipment Created — ${newId}</div>
    <div class="cc-result-row"><span>Assigned Vehicle:</span><strong>${assigned.name} (${assigned.id})</strong></div>
    <div class="cc-result-row"><span>Driver:</span><strong>${assigned.driver}</strong></div>
    ${needsRef ? `<div class="cc-result-row cold"><span>❄️ Profile:</span><strong>${profile.label}</strong></div>` : ''}
    <div class="cc-result-row"><span>Distance:</span><strong>${route.dist} km</strong></div>
    <div class="cc-result-row"><span>ETA:</span><strong>~${eta}h</strong></div>
    <div class="cc-result-row"><span>Est. Cost:</span><strong style="color:var(--green)">₹${cost.toLocaleString('en-IN')}</strong></div>
    <div class="cc-ai-note">🤖 AI assigned ${assigned.name} — ${needsRef ? '✅ Refrigerated unit confirmed' : 'Standard vehicle optimal for this route'}</div>
  `;
  resultEl.classList.remove('hidden');

  // Start temp monitor
  if (needsRef) loadTempMonitor(newId, profile);

  showToast(`✅ Shipment ${newId} created & ${assigned.name} dispatched!`);
}

function renderColdFleetList() {
  const el = document.getElementById('coldFleetList');
  if (!el) return;
  const coldVehicles = VEHICLES_FLEET.filter(v => v.refrigerated);
  el.innerHTML = coldVehicles.map(v => {
    const statusColor = v.status === 'available' ? '#10b981' : v.status === 'in_transit' ? '#3b82f6' : '#f59e0b';
    const assignedShip = SHIPMENTS.find(s => s.assigned_vehicle === v.id && s.status === 'transit');
    const tempProfile = assignedShip ? COLD_CHAIN_PROFILES[assignedShip.cold_chain_profile] : null;
    const fakeTemp = tempProfile ? (((tempProfile.min + tempProfile.max) / 2) + (Math.random() * 1.2 - 0.6)).toFixed(1) : null;
    return `
    <div class="cold-fleet-item">
      <div class="cold-fleet-icon">${v.type === 'heavy' ? '❄️🚛' : '❄️🚐'}</div>
      <div class="cold-fleet-info">
        <div class="cold-fleet-name">${v.name}</div>
        <div class="cold-fleet-driver">${v.driver}</div>
        ${assignedShip ? `<div class="cold-fleet-ship">📦 ${assignedShip.id}</div>` : ''}
        ${tempProfile && fakeTemp ? `<div class="cold-temp-reading" style="color:${parseFloat(fakeTemp) <= tempProfile.max ? '#10b981' : '#ef4444'}">${fakeTemp}°C (target: ${tempProfile.min}–${tempProfile.max}°C)</div>` : ''}
      </div>
      <div class="cold-fleet-status" style="color:${statusColor}">${v.status.replace('_',' ').toUpperCase()}</div>
    </div>
  `}).join('');
}

function loadTempMonitor(shipId, profile) {
  const el = document.getElementById('tempMonitor');
  if (!el || !profile) return;

  const readings = [];
  for (let i = 5; i >= 0; i--) {
    const temp = ((profile.min + profile.max) / 2 + (Math.random() * 1.4 - 0.7)).toFixed(1);
    readings.push({ time: `-${i * 10}min`, temp: parseFloat(temp) });
  }

  const inRange = readings.filter(r => r.temp >= profile.min && r.temp <= profile.max).length;
  el.innerHTML = `
    <div class="temp-monitor-header">
      <span>${shipId || 'SHP-6204'}</span>
      <span class="temp-badge" style="background:${inRange === readings.length ? '#10b98120' : '#ef444420'};color:${inRange === readings.length ? '#10b981' : '#ef4444'}">
        ${inRange === readings.length ? '✅ All OK' : '⚠️ Breach Detected'}
      </span>
    </div>
    <div class="temp-log">
      ${readings.map(r => `
        <div class="temp-log-row">
          <span class="temp-log-time">${r.time}</span>
          <div class="temp-log-bar-wrap">
            <div class="temp-log-bar-bg">
              <div class="temp-log-bar-fill" style="width:${Math.max(5, Math.min(100, ((r.temp - profile.min) / (profile.max - profile.min)) * 100))}%;background:${r.temp >= profile.min && r.temp <= profile.max ? '#10b981' : '#ef4444'}"></div>
            </div>
          </div>
          <span class="temp-log-val" style="color:${r.temp >= profile.min && r.temp <= profile.max ? '#10b981' : '#ef4444'}">${r.temp}°C</span>
        </div>
      `).join('')}
    </div>
    <div class="temp-target">Target: ${profile.min}°C to ${profile.max}°C · ${profile.label}</div>
  `;
}

// ── EMERGENCY AI ───────────────────────────────────────────
function renderFleetStatusList() {
  const el = document.getElementById('fleetStatusList');
  if (!el) return;
  el.innerHTML = VEHICLES_FLEET.map(v => {
    const statusColor = v.status === 'available' ? '#10b981' : v.status === 'in_transit' || v.status === 'dispatched' ? '#3b82f6' : v.status === 'delayed' ? '#f59e0b' : '#ef4444';
    return `
    <div class="fleet-status-item">
      <span class="fleet-status-dot-sm" style="background:${statusColor}"></span>
      <span class="fleet-status-em-icon">${v.refrigerated ? '❄️' : v.type === 'heavy' ? '🚛' : '🚐'}</span>
      <div class="fleet-status-info">
        <div class="fleet-status-name">${v.id} — ${v.name}</div>
        <div class="fleet-status-driver">${v.driver}</div>
      </div>
      <div class="fleet-status-badge" style="color:${statusColor}">${v.status.replace('_',' ').toUpperCase()}</div>
    </div>
  `}).join('');
}

function simulateEmergency() {
  const vehicleId  = document.getElementById('emergencyVehicle').value;
  const shipmentId = document.getElementById('emergencyShipment').value;
  const reason     = document.getElementById('emergencyReason').value;

  const vehicle = VEHICLES_FLEET.find(v => v.id === vehicleId);
  const shipment = SHIPMENTS.find(s => s.id === shipmentId);
  if (!vehicle || !shipment) { showToast('⚠️ Vehicle or shipment not found'); return; }

  const btn = document.getElementById('emergencyBtn');
  btn.disabled = true;
  btn.textContent = '⏳ AI Processing...';

  // Step 1: Mark breakdown
  vehicle.status = 'breakdown';
  updateEmergencyFeed('step1', `🚨 Emergency: ${vehicle.name} (${vehicleId}) — ${reason.toUpperCase()} at ${vehicle.lat.toFixed(3)}, ${vehicle.lng.toFixed(3)}`, 'critical');
  updateEmergencyFeed('step2', `🔍 AI scanning ${VEHICLES_FLEET.filter(v => v.status === 'available').length} available vehicles...`, 'processing');

  const needsRef = shipment.delivery_type === 'cold_chain';
  const nearest = VEHICLES_FLEET
    .filter(v => v.status === 'available' && v.id !== vehicleId && (!needsRef || v.refrigerated))
    .sort((a, b) => haversineKm({ lat: vehicle.lat, lng: vehicle.lng }, { lat: a.lat, lng: a.lng }) - haversineKm({ lat: vehicle.lat, lng: vehicle.lng }, { lat: b.lat, lng: b.lng }))[0];

  setTimeout(() => {
    if (!nearest) {
      updateEmergencyFeed('step3', '⚠️ No available replacement found. Manual intervention required.', 'warning');
      btn.disabled = false;
      btn.textContent = '🚨 Simulate Emergency';
      return;
    }

    const dist = haversineKm({ lat: vehicle.lat, lng: vehicle.lng }, { lat: nearest.lat, lng: nearest.lng });
    const etaDelta = Math.round((dist / 50) * 60);

    nearest.status = 'dispatched';
    shipment.assigned_vehicle = nearest.id;
    emergencyEventCount++;

    document.getElementById('emergencyCount').textContent = emergencyEventCount;

    updateEmergencyFeed('step3', `✅ AI Decision: ${nearest.name} selected (${dist.toFixed(1)} km away)`, 'success');
    updateEmergencyFeed('step4', `🚀 ${nearest.name} dispatched. Driver: ${nearest.driver}`, 'success');
    updateEmergencyFeed('step5', `⏱️ ETA delay: +${etaDelta} min · Shipment ${shipmentId} auto-reassigned`, 'info');

    // Map: draw reassignment route
    if (emergencyMap) {
      emergencyMapMarkers.forEach(m => {
        if (m.vehicle.id === vehicleId) {
          const breakIcon = L.divIcon({ className: '', html: `<div class="custom-marker pulse-red">🔴</div>`, iconSize: [36,36], iconAnchor: [18,18] });
          m.marker.setIcon(breakIcon);
          m.marker.bindPopup(`<b>🚨 BREAKDOWN: ${vehicle.name}</b><br>${reason}`).openPopup();
        }
        if (m.vehicle.id === nearest.id) {
          const dispatchIcon = L.divIcon({ className: '', html: `<div class="custom-marker pulse-blue">🚐➡️</div>`, iconSize: [40,40], iconAnchor: [20,20] });
          m.marker.setIcon(dispatchIcon);
          m.marker.bindPopup(`<b>✅ DISPATCHED: ${nearest.name}</b><br>Heading to breakdown`);
        }
      });

      // Draw reassignment path
      const rPath = [
        [nearest.lat, nearest.lng],
        [vehicle.lat + (nearest.lat - vehicle.lat) * 0.5, vehicle.lng + (nearest.lng - vehicle.lng) * 0.5],
        [vehicle.lat, vehicle.lng]
      ];
      L.polyline(rPath, { color: '#10b981', weight: 4, dashArray: '10,6', opacity: 0.9 }).addTo(emergencyMap);
      emergencyMap.setView([vehicle.lat, vehicle.lng], 8, { animate: true });
    }

    const epBean = document.getElementById('emergencyStatus');
    if (epBean) { epBean.textContent = `🚨 ${emergencyEventCount} Emergency`; epBean.style.background = '#ef444420'; epBean.style.color = '#ef4444'; }

    renderFleetStatusList();

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '🚨 Simulate Emergency';
      showToast(`✅ Emergency handled — ${nearest.name} dispatched, +${etaDelta}min buffer`);
    }, 1000);
  }, 1800);
}

function updateEmergencyFeed(key, msg, type) {
  const feed = document.getElementById('emergencyFeed');
  if (!feed) return;
  const placeholder = feed.querySelector('.em-placeholder');
  if (placeholder) placeholder.remove();

  const colorMap = { critical: '#ef4444', success: '#10b981', warning: '#f59e0b', processing: '#3b82f6', info: '#8b5cf6' };
  const iconMap  = { critical: '🚨', success: '✅', warning: '⚠️', processing: '🔍', info: '📋' };
  const existing = feed.querySelector(`[data-key="${key}"]`);
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (existing) {
    existing.innerHTML = `<span style="color:${colorMap[type]}">${iconMap[type]}</span> <span>${msg}</span> <span class="em-ts">${ts}</span>`;
  } else {
    const item = document.createElement('div');
    item.className = 'em-event-item';
    item.dataset.key = key;
    item.style.borderLeft = `3px solid ${colorMap[type]}`;
    item.innerHTML = `<span style="color:${colorMap[type]}">${iconMap[type]}</span> <span>${msg}</span> <span class="em-ts">${ts}</span>`;
    feed.appendChild(item);
    feed.scrollTop = feed.scrollHeight;
  }
}

// ── WEATHER INDIA UI ──────────────────────────────────────
function renderWeatherBadges() {
  const rainCount  = WEATHER_DATA.filter(w => w.condition.toLowerCase().includes('rain') || w.condition.toLowerCase().includes('storm')).length;
  const heatCount  = WEATHER_DATA.filter(w => w.condition.toLowerCase().includes('heat') || w.condition.toLowerCase().includes('extreme')).length;
  const alertCount = WEATHER_DATA.filter(w => w.route_impact !== 'none').length;

  const badge = document.getElementById('weatherAlertCount');
  if (badge) badge.textContent = alertCount;
}

function initWeatherSummary() {
  const bar = document.getElementById('weatherSummaryBar');
  if (!bar) return;
  const rainCount  = WEATHER_DATA.filter(w => w.route_impact.includes('delay')).length;
  const coldRisk   = WEATHER_DATA.filter(w => w.route_impact.includes('cold_chain')).length;
  const clearCount = WEATHER_DATA.filter(w => w.route_impact === 'none').length;

  bar.innerHTML = `
    <div class="weather-stat-card" style="--wc:#3b82f6">
      <div class="ws-icon">🌧️</div><div class="ws-val">${rainCount}</div>
      <div class="ws-label">Rain / Storm Alerts</div>
    </div>
    <div class="weather-stat-card" style="--wc:#ef4444">
      <div class="ws-icon">🔥</div><div class="ws-val">${coldRisk}</div>
      <div class="ws-label">Cold Chain Risk Zones</div>
    </div>
    <div class="weather-stat-card" style="--wc:#10b981">
      <div class="ws-icon">✅</div><div class="ws-val">${clearCount}</div>
      <div class="ws-label">States Clear</div>
    </div>
    <div class="weather-stat-card" style="--wc:#f59e0b">
      <div class="ws-icon">🗺️</div><div class="ws-val">${WEATHER_DATA.length}</div>
      <div class="ws-label">States Monitored</div>
    </div>
  `;

  const advisory = WEATHER_DATA.filter(w => w.route_impact !== 'none');
  const advEl = document.getElementById('weatherAdvisoryText');
  if (advEl && advisory.length) {
    const rains = advisory.filter(w => w.route_impact.includes('delay')).map(w => w.state).slice(0,3).join(', ');
    const heats = advisory.filter(w => w.route_impact.includes('cold_chain')).map(w => w.state).slice(0,3).join(', ');
    advEl.innerHTML = `
      ${rains ? `<div class="adv-row"><span class="adv-icon">🌧️</span> <strong>Rain delays</strong>: ${rains} — add 30–60 min ETA buffer on affected routes.</div>` : ''}
      ${heats ? `<div class="adv-row"><span class="adv-icon">🔥</span> <strong>Heat wave cold chain risk</strong>: ${heats} — increase refrigeration checks to every 30 min.</div>` : ''}
      <div class="adv-row"><span class="adv-icon">✅</span> ${clearCount} states are clear with no weather-related route impact.</div>
    `;
  }
}

function initWeatherGrid(filter) {
  filter = filter || 'all';
  weatherFilterMode = filter;
  const grid = document.getElementById('weatherGrid');
  if (!grid) return;

  let data = WEATHER_DATA;
  if (filter === 'rain') data = WEATHER_DATA.filter(w => w.condition.toLowerCase().includes('rain') || w.condition.toLowerCase().includes('storm') || w.condition.toLowerCase().includes('drizzle'));
  if (filter === 'heat') data = WEATHER_DATA.filter(w => w.condition.toLowerCase().includes('heat') || w.condition.toLowerCase().includes('extreme') || w.condition.toLowerCase().includes('hot'));
  if (filter === 'affected') data = WEATHER_DATA.filter(w => w.route_impact !== 'none');

  grid.innerHTML = data.map(w => {
    const impactColor = w.route_impact === 'none' ? '#10b981' : w.route_impact.includes('cold_chain') ? '#ef4444' : '#f59e0b';
    const impactLabel = w.route_impact === 'none' ? 'Route Clear' : w.route_impact.includes('cold_chain') ? 'Cold Chain Risk' : w.route_impact.replace('_', ' ').replace('delay', '⚠️ Delay');
    return `
    <div class="weather-card" style="--wi:${impactColor}">
      <div class="wc-top">
        <div class="wc-icon">${w.icon}</div>
        <div class="wc-state">${w.state}</div>
      </div>
      <div class="wc-city">${w.city}</div>
      <div class="wc-temp">${w.temp_c}°C</div>
      <div class="wc-condition">${w.condition}</div>
      <div class="wc-stats">
        <span>💨 ${w.wind_kmh} km/h</span>
        <span>💧 ${w.humidity}%</span>
      </div>
      <div class="wc-impact" style="color:${impactColor}">${impactLabel}</div>
    </div>
  `}).join('');
}

function filterWeather(mode) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  document.querySelector(`.filter-pill[onclick="filterWeather('${mode}')"]`)?.classList.add('active');
  initWeatherGrid(mode);
}

// ── HAVERSINE ─────────────────────────────────────────────
function haversineKm(a, b) {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── INDIA LOCATION SELECTORS ──────────────────────────────
async function initIndiaLocationSelectors() {
  const srcStateEl     = document.getElementById('routeSrcState');
  const srcDistrictEl  = document.getElementById('routeSrcDistrict');
  const destStateEl    = document.getElementById('routeDestState');
  const destDistrictEl = document.getElementById('routeDestDistrict');
  const trackStateEl   = document.getElementById('trackState');
  const trackDistrictEl= document.getElementById('trackDistrict');

  if (!srcStateEl) return;

  try {
    indiaStatesData = await loadIndiaStatesDistricts();
    const states = indiaStatesData.map(x => x.state).sort((a, b) => a.localeCompare(b));

    fillSelect(srcStateEl,   states, '— Select Source State —');
    fillSelect(destStateEl,  states, '— Select Destination State —');
    fillSelect(trackStateEl, states, '— Select State —');

    srcStateEl.addEventListener('change',   () => fillSelect(srcDistrictEl,   getDistrictsForState(srcStateEl.value),   '— Select Source District —'));
    destStateEl.addEventListener('change',  () => fillSelect(destDistrictEl,  getDistrictsForState(destStateEl.value),  '— Select Destination District —'));
    trackStateEl.addEventListener('change', () => fillSelect(trackDistrictEl, getDistrictsForState(trackStateEl.value), '— Select District —'));

    const districtCount = indiaStatesData.reduce((sum, s) => sum + s.districts.length, 0);
    showToast(`✅ Loaded ${states.length} states and ${districtCount} districts`);
  } catch (err) {
    showToast('⚠️ State/district data unavailable. Manual entry enabled.');
  }
}

async function loadIndiaStatesDistricts() {
  for (const url of INDIA_STATE_DISTRICTS_URLS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const raw = await res.json();
      const normalized = normalizeIndiaStateDistrictData(raw);
      if (normalized.length > 0) return normalized;
    } catch (_) { /* try next */ }
  }
  throw new Error('No India state/district source available');
}

function normalizeIndiaStateDistrictData(raw) {
  if (raw && Array.isArray(raw.states)) return normalizeIndiaStateDistrictData(raw.states);
  if (Array.isArray(raw)) {
    return raw.filter(item => item && typeof item.state === 'string').map(item => ({
      state: item.state.trim(),
      districts: Array.isArray(item.districts) ? [...new Set(item.districts.map(d => String(d).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)) : []
    })).filter(item => item.state && item.districts.length > 0).sort((a, b) => a.state.localeCompare(b.state));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([stateName, value]) => {
      let districts = Array.isArray(value) ? value : Array.isArray(value?.district) ? value.district : Array.isArray(value?.districts) ? value.districts : [];
      return { state: String(stateName).trim(), districts: [...new Set(districts.map(d => String(d).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)) };
    }).filter(item => item.state && item.districts.length > 0).sort((a, b) => a.state.localeCompare(b.state));
  }
  return [];
}

function fillSelect(selectEl, values, placeholder) {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(v => { const opt = document.createElement('option'); opt.value = v; opt.textContent = v; selectEl.appendChild(opt); });
}

function getDistrictsForState(stateName) {
  const match = indiaStatesData.find(x => x.state === stateName);
  return match ? [...match.districts] : [];
}

async function focusTrackingDistrict() {
  const state = document.getElementById('trackState').value;
  const district = document.getElementById('trackDistrict').value;
  if (!state || !district) { showToast('⚠️ Select state and district'); return; }
  if (!trackMap) { showToast('⚠️ Tracking map not ready'); return; }
  const coords = await geocodeDistrict(state, district);
  if (!coords) { showToast('⚠️ Could not locate district'); return; }
  trackMap.setView([coords.lat, coords.lng], 9, { animate: true });
  showToast(`📍 Focused on ${district}, ${state}`);
}

async function geocodeDistrict(state, district) {
  const key = `${district}|${state}`;
  if (indiaDistrictCoordCache[key]) return indiaDistrictCoordCache[key];
  const query = encodeURIComponent(`${district}, ${state}, India`);
  const providers = [
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
  ];
  for (const url of providers) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]?.lat && rows[0]?.lon) {
        const value = { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
        if (!isNaN(value.lat) && !isNaN(value.lng)) { indiaDistrictCoordCache[key] = value; return value; }
      }
    } catch (_) {}
  }
  return null;
}

function findRouteKey(a, b) {
  if (ROUTE_DATA[`${a}|${b}`]) return `${a}|${b}`;
  if (ROUTE_DATA[`${b}|${a}`]) return `${b}|${a}`;
  return null;
}

// ── COST ANALYSIS ─────────────────────────────────────────
function updateCost() {
  const dist    = parseFloat(document.getElementById('costDist')?.value)   || 120;
  const weight  = parseFloat(document.getElementById('costWeight')?.value) || 10;
  const urgency = parseFloat(document.getElementById('costUrgency')?.value)|| 1;
  const fuel    = parseFloat(document.getElementById('costFuel')?.value)   || 1;
  const interState = dist > 80;

  const costs = COURIER_COST_DATA.map(provider => {
    const slab = provider.slabs.find(s => weight > s.min && (s.max == null || weight <= s.max)) || provider.slabs[provider.slabs.length - 1];
    const baseRange = interState ? provider.inter10 : provider.intra10;
    const slabMid = Math.round((slab.range[0] + slab.range[1]) / 2);
    const tenKgMid = Math.round((baseRange[0] + baseRange[1]) / 2);
    const weightMultiplier = weight <= 10 ? slabMid / 220 : slabMid / 300;
    const distanceMultiplier = interState ? (0.95 + dist / 260) : (0.85 + dist / 320);
    const raw = Math.round(tenKgMid * weightMultiplier * distanceMultiplier * urgency * fuel);
    const etaH = interState ? Math.max(6, Math.round(dist / 55)) : Math.max(2, Math.round(dist / 28));
    return { ...provider, cost: raw, etaH, baseRange, slabRange: slab.range, lane: interState ? 'Inter-State' : 'Intra-City' };
  });

  const minCost = Math.min(...costs.map(c => c.cost));
  const container = document.getElementById('vehicleCards');
  if (!container) return;

  container.innerHTML = costs.map((v, i) => {
    const isCheapest = v.cost === minCost;
    return `
      <div class="vehicle-card ${isCheapest ? 'cheapest' : ''}" style="animation-delay:${i*0.08}s">
        ${isCheapest ? '<div class="cheapest-badge">✅ AI Recommended</div>' : ''}
        <div class="vehicle-emoji">${v.emoji}</div>
        <div class="vehicle-name">${v.name}</div>
        <div class="vehicle-cost ${isCheapest ? 'green' : ''}">₹${v.cost.toLocaleString('en-IN')}</div>
        <div class="vehicle-breakdown">
          Lane: ${v.lane}<br>
          Weight slab (${weight}kg): ₹${v.slabRange[0]}–₹${v.slabRange[1]}<br>
          10kg ${v.lane}: ₹${v.baseRange[0]}–₹${v.baseRange[1]}<br>
          ${urgency > 1 ? `Urgency: ×${urgency}<br>` : ''}
          Fuel factor: ×${fuel}
        </div>
        <div class="vehicle-eta">🕐 ETA: ~${v.etaH}h</div>
      </div>
    `;
  }).join('');

  const cheapest = costs.find(v => v.cost === minCost);
  const rec = document.getElementById('aiRecCard');
  if (cheapest && rec) {
    const highCost = Math.max(...costs.map(c => c.cost));
    const savings = highCost - cheapest.cost;
    rec.innerHTML = `
      <div class="ai-rec-header">
        <div class="ai-badge">🤖 AI Insight</div>
        <span style="font-family:Syne;font-size:14px;font-weight:700">Courier Cost Intelligence</span>
      </div>
      <div class="ai-rec-text">
        For <strong>${weight}kg</strong> over <strong>${dist}km</strong> (${interState ? 'Inter-State' : 'Intra-City'}),
        <strong>${cheapest.emoji} ${cheapest.name}</strong> is estimated best at
        <strong style="color:var(--green)">₹${cheapest.cost.toLocaleString('en-IN')}</strong>.
        <br><br>Potential savings vs highest: <strong>₹${savings.toLocaleString('en-IN')}</strong>.
        ${urgency > 1.4 ? '<br><br>⚡ Same-day surcharge is significant. Express may reduce spend.' : ''}
        <br><br>Compared: DTDC, Delhivery, Blue Dart, India Post.
      </div>
    `;
  }
}

// ── RESCHEDULE ─────────────────────────────────────────────
function rescheduleDelivery() {
  const ship = document.getElementById('reschedShip').value;
  const date = document.getElementById('reschedDate').value;
  const time = document.getElementById('reschedTime').value;
  const reason = document.getElementById('reschedReason').value;
  if (!date) { showToast('⚠️ Select a new delivery date'); return; }
  const formatted = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const res = document.getElementById('reschedResult');
  res.className = 'result-box success';
  res.innerHTML = `✅ <strong>${ship}</strong> rescheduled to <strong>${formatted}</strong>, ${time}.<br>Reason: ${reason}. Driver notified via SMS.`;
  res.classList.remove('hidden');
  showToast('✅ Delivery rescheduled!');
}

function setDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const el = document.getElementById('reschedDate');
  if (el) el.value = tomorrow.toISOString().split('T')[0];
}

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── AI ASSISTANT ───────────────────────────────────────────
function initAssistant() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const promptWrap = document.getElementById('quickPrompts');
  if (!form || !input) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    submitAssistantPrompt(text);
    input.value = '';
  });

  if (promptWrap) {
    promptWrap.addEventListener('click', e => {
      const btn = e.target.closest('.prompt-chip');
      if (!btn) return;
      submitAssistantPrompt(btn.dataset.prompt || btn.textContent.trim());
    });
  }

  addChatMessage('bot', 'Hi! I\'m OrionAI Copilot v2.0. I can help with cold chain logistics, emergency handling, weather-aware routing, HGV routing, delivery delays, and cost optimization.');
}

function submitAssistantPrompt(question) {
  addChatMessage('user', question);
  addChatMessage('bot', '🔍 Analyzing live logistics signals...');
  setTimeout(() => replaceLastBotMessage(generateAssistantResponse(question)), 600);
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
  if (!bots.length) return;
  const target = bots[bots.length - 1];
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  target.innerHTML = `${escapeHtml(text)}<div class="chat-msg-meta">OrionAI • ${ts}</div>`;
  feed.scrollTop = feed.scrollHeight;
}

function generateAssistantResponse(rawQuestion) {
  const q = rawQuestion.toLowerCase();
  if (q.includes('cold') || q.includes('chain') || q.includes('temperature') || q.includes('frozen') || q.includes('pharma') || q.includes('refriger'))
    return buildColdChainResponse();
  if (q.includes('emergency') || q.includes('breakdown') || q.includes('accident') || q.includes('reassign'))
    return buildEmergencyResponse();
  if (q.includes('weather') || q.includes('rain') || q.includes('storm') || q.includes('climate'))
    return buildWeatherResponse();
  if (q.includes('heavy') || q.includes('hgv') || q.includes('highway') || q.includes('truck route'))
    return buildHeavyVehicleResponse();
  if (q.includes('multi') || q.includes('best route') || q.includes('deliveries'))
    return buildMultiRouteResponse();
  if (q.includes('delay') || q.includes('hotspot') || q.includes('stuck'))
    return buildDelayHotspotResponse();
  if (q.includes('cost') || q.includes('reduce') || q.includes('saving'))
    return buildCostReductionResponse();
  if (q.includes('history') || q.includes('recent') || q.includes('transaction'))
    return buildHistoryResponse();
  return `I can help with:\n1) ❄️ Cold chain temperature logistics\n2) 🚨 Emergency vehicle breakdown & reassignment\n3) 🌦️ Weather impact on Indian routes\n4) 🚛 Heavy vehicle (HGV) highway routing\n5) Multi-stop route recommendations\n6) Delay hotspot analysis\n7) Cost reduction strategies\n8) Recent delivery & transaction history\n\nTry any of these topics!`;
}

function buildColdChainResponse() {
  const active = SHIPMENTS.filter(s => s.delivery_type === 'cold_chain' && s.status === 'transit').length;
  const refAvailable = VEHICLES_FLEET.filter(v => v.refrigerated && v.status === 'available').length;
  return `❄️ Cold Chain Status:\n• Active cold chain shipments: ${active}\n• Refrigerated vehicles available: ${refAvailable}\n\nActive profiles: Pharma (2–8°C), Frozen (-18°C to -12°C), Chilled (0–4°C)\n\n⚠️ Heat wave alert: Bihar (38°C), Rajasthan (42°C), MP (39°C) — increase temperature monitoring frequency for cold chain vehicles in these zones.\n\nAI Tip: ColdStar Mini (V003) and FreezePro HGV (V004) are your certified cold chain units. Prefer these for pharma and frozen cargo.`;
}

function buildEmergencyResponse() {
  const available = VEHICLES_FLEET.filter(v => v.status === 'available').length;
  return `🚨 Emergency System Status:\n• Vehicles available for reassignment: ${available}\n• Emergency events handled: ${emergencyEventCount}\n\nAI Decision Engine:\n1. Calculates haversine distance to all available vehicles\n2. Filters by type match + refrigeration requirement\n3. Dispatches nearest compatible vehicle in <2 seconds\n\nGo to Emergency AI section → click "Simulate Emergency" to see the system in action. The AI will find and dispatch the nearest available vehicle automatically.`;
}

function buildWeatherResponse() {
  const rain   = WEATHER_DATA.filter(w => w.route_impact.includes('delay')).length;
  const heat   = WEATHER_DATA.filter(w => w.route_impact.includes('cold_chain')).length;
  return `🌦️ India Weather Summary (${WEATHER_DATA.length} states monitored):\n• Rain/storm alerts: ${rain} states\n• Cold chain heat risk: ${heat} states\n\nWorst affected:\n• Kerala — Heavy rain ⛈️ (ETA +60min)\n• Assam — Heavy rain 🌧️ (ETA +60min)\n• Rajasthan — 42°C extreme heat 🔥\n\nAI Recommendation:\n• Add 30–60 min buffer on rain-affected routes\n• Increase cold chain checks in heat zones\n• Check Weather India Dashboard for full state-wise breakdown`;
}

function buildHeavyVehicleResponse() {
  const heavy = VEHICLES_FLEET.filter(v => v.type === 'heavy');
  return `🚛 Heavy Vehicle Fleet:\n• Total HGV units: ${heavy.length}\n• Available: ${heavy.filter(v => v.status === 'available').length}\n\nPreferred HGV corridors:\n• NH-48 (Bengaluru–Hubli–Belagavi) — recommended\n• NH-275 (Bengaluru–Mysuru) — 4-lane, HGV friendly\n\nRoute Optimizer now includes HGV mode with:\n• Highway-only routing (avoids residential/narrow roads)\n• Toll booth tracking\n• Weight/height constraint simulation\n\nTip: For loads >8,000 kg on ghat routes, verify bridge weight limits with transport authority.`;
}

function buildMultiRouteResponse() {
  const topRoutes = Object.entries(ROUTE_DATA).sort((a, b) => a[1].dist - b[1].dist).slice(0, 3)
    .map(([r, d], i) => `${i+1}. ${r.replace('|', ' → ')} (${d.dist} km, ${d.congestion} traffic)`);
  return `Best multi-delivery sequence:\n${topRoutes.join('\n')}\n\nRecommendation: Group northbound stops (Hubli/Belagavi/Davangere) in one run and coastal routes separately to avoid NH-75 peak congestion.`;
}

function buildDelayHotspotResponse() {
  const delayed = SHIPMENTS.filter(s => s.status === 'delayed').length;
  const highCong = Object.entries(ROUTE_DATA).filter(([,d]) => d.congestion === 'high').map(([r]) => r.replace('|', ' → '));
  return `Delay Hotspots:\n• Congested corridors: ${highCong.join(', ')}\n• Active delayed shipments: ${delayed}\n\nAction: Add +45 min buffer on high-risk lanes. Auto-reroute where toll roads are clear.`;
}

function buildCostReductionResponse() {
  const sampleDist = 180;
  const truckCost = Math.round(sampleDist * VEHICLE_DATA.find(v => v.id === 'truck').ratePerKm);
  const vanCost   = Math.round(sampleDist * VEHICLE_DATA.find(v => v.id === 'minivan').ratePerKm);
  return `Cost Reduction Plan:\n• Shift medium loads from truck to mini-van on sub-200km routes\n• Bundle same-corridor orders into one dispatch window\n• Prefer standard/express over same-day for non-critical loads\n\nEstimated saving: ~₹${(truckCost - vanCost).toLocaleString('en-IN')} per 180km route.`;
}

function buildHistoryResponse() {
  const completed = DELIVERY_HISTORY.filter(d => d.status === 'delivered').length;
  const delayed   = DELIVERY_HISTORY.filter(d => d.status === 'delayed').length;
  const revenue   = TRANSACTION_HISTORY.reduce((sum, t) => sum + t.amount, 0);
  return `Recent History:\n• Deliveries tracked: ${DELIVERY_HISTORY.length}\n• Completed: ${completed}, Delayed: ${delayed}\n• Recent transaction value: ₹${revenue.toLocaleString('en-IN')}\n\nOpen the History section for full logs.`;
}

function renderAssistantInsight() {
  const delayedPct = Math.round((SHIPMENTS.filter(s => s.status === 'delayed').length / SHIPMENTS.length) * 100);
  const coldActive = SHIPMENTS.filter(s => s.delivery_type === 'cold_chain').length;
  const best = Object.entries(ROUTE_DATA).filter(([,d]) => d.congestion === 'low').slice(0, 2).map(([r]) => r.replace('|', ' → ')).join(', ');
  const weatherAlerts = WEATHER_DATA.filter(w => w.route_impact !== 'none').length;
  const box = document.getElementById('assistantInsight');
  if (!box) return;
  box.innerHTML = `Delayed ratio: <strong>${delayedPct}%</strong>. Low-congestion: <strong>${best}</strong>. <strong>${coldActive}</strong> cold chain shipments active. <strong>${weatherAlerts}</strong> Indian states with weather alerts today.`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '<br>');
}

// ── HISTORY ────────────────────────────────────────────────
function renderHistory() {
  renderHistorySummary();
  renderDeliveryHistory();
  renderTransactionHistory();
}

function renderHistorySummary() {
  const delivered  = DELIVERY_HISTORY.filter(x => x.status === 'delivered').length;
  const delayed    = DELIVERY_HISTORY.filter(x => x.status === 'delayed').length;
  const inTransit  = DELIVERY_HISTORY.filter(x => x.status === 'transit').length;
  const totalAmount= TRANSACTION_HISTORY.reduce((sum, t) => sum + t.amount, 0);
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
      <td>${item.type === 'cold_chain' ? '<span class="cold-tag">❄️ Cold Chain</span>' : 'Normal'}</td>
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

// ── LIVE UPDATES ──────────────────────────────────────────
let updateCounter = 0;
setInterval(() => {
  updateCounter++;
  if (updateCounter % 20 === 0) {
    const newActivities = [
      { text: 'AI rerouted SHP-7821 to avoid toll congestion on NH-275', color: '#3b82f6' },
      { text: '❄️ Cold chain SHP-6204 temp stable: 4.1°C (target 2–8°C)', color: '#06b6d4' },
      { text: '⚠️ SHP-4300 delayed on NH-67 — weather advisory active', color: '#f59e0b' },
      { text: 'SHP-3814 delivered at Hubli warehouse on schedule', color: '#10b981' },
      { text: '🌧️ Kerala corridor: ETA buffer +45min applied automatically', color: '#8b5cf6' },
    ];
    const pick = newActivities[Math.floor(Math.random() * newActivities.length)];
    ACTIVITIES.unshift({ ...pick, time: 'Just now' });
    if (ACTIVITIES.length > 8) ACTIVITIES.pop();
    renderActivityList();
  }

  // Simulate temp fluctuation for cold fleet
  if (updateCounter % 15 === 0) {
    renderColdFleetList();
  }
}, 1000);

// ── AUTH OVERLAY LOGIC ────────────────────────────────────
function authSwitchTab(name, btn) {
  document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form-section').forEach(s => s.classList.remove('visible'));
  btn.classList.add('active');
  document.getElementById('auth-' + name).classList.add('visible');
}

function authSwitchTabByName(name) {
  const btns = document.querySelectorAll('.auth-tab-btn');
  btns.forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form-section').forEach(s => s.classList.remove('visible'));
  const idx = name === 'login' ? 0 : 1;
  btns[idx].classList.add('active');
  document.getElementById('auth-' + name).classList.add('visible');
}

function authUpdateStrength(val) {
  const segs = ['as1', 'as2', 'as3', 'as4'].map(id => document.getElementById(id));
  segs.forEach(s => s && s.classList.remove('active', 'warn'));
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  for (let i = 0; i < score; i++) {
    segs[i] && segs[i].classList.add(score < 3 ? 'warn' : 'active');
  }
}

// handleAuthSignIn is now a no-op stub.
// Real authentication is handled by the Firebase ES module in firebase-auth.js
// which is loaded as <script type="module"> in index.html.
function handleAuthSignIn() {
  // Legacy stub — no-op. Buttons are wired via addEventListener in the module script.
}
