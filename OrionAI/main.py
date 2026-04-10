"""
OrionAI — FastAPI Backend v2.0
Covers: Auth, Shipments (cold chain), Routes (real paths + heavy vehicle),
        Cost Analysis, Alerts, AI Assistant, History, Emergency Handling,
        Weather (simulated), Fleet Management.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
import databases
import sqlalchemy
from sqlalchemy import MetaData
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import random
import math

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
SECRET_KEY       = "orionai-secret-key-change-in-prod"
ALGORITHM        = "HS256"
ACCESS_TOKEN_TTL = 60  # minutes

DATABASE_URL = "sqlite:///./orionai.db"

# NOTE: In production, set these in .env
# OWM_API_KEY = os.getenv("OWM_API_KEY", "")
# ORS_API_KEY = os.getenv("ORS_API_KEY", "")
# For hackathon demo: all external API calls use realistic simulated data.

# ─────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────
database = databases.Database(DATABASE_URL)
metadata = MetaData()

users_table = sqlalchemy.Table(
    "users", metadata,
    sqlalchemy.Column("id",           sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("first_name",   sqlalchemy.String(100)),
    sqlalchemy.Column("last_name",    sqlalchemy.String(100)),
    sqlalchemy.Column("email",        sqlalchemy.String(200), unique=True, index=True),
    sqlalchemy.Column("organisation", sqlalchemy.String(200)),
    sqlalchemy.Column("hashed_pw",    sqlalchemy.String(200)),
    sqlalchemy.Column("created_at",   sqlalchemy.DateTime, default=datetime.utcnow),
)

engine = sqlalchemy.create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata.create_all(engine)

# ─────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_TTL))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc
    user = await database.fetch_one(
        users_table.select().where(users_table.c.email == email)
    )
    if user is None:
        raise credentials_exc
    return dict(user)

# ─────────────────────────────────────────────
# APP LIFECYCLE
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(title="OrionAI Backend", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════
# ── STATIC DATA (existing + extended)
# ═══════════════════════════════════════════════
CITIES = {
    "Bengaluru (Whitefield)": [12.9698, 77.7500],
    "Mysuru (City Centre)":   [12.2958, 76.6394],
    "Hubli":                  [15.3647, 75.1240],
    "Mangaluru (Port)":       [12.8698, 74.8431],
    "Belagavi":               [15.8497, 74.4977],
    "Tumkur":                 [13.3379, 77.1173],
    "Shivamogga":             [13.9299, 75.5681],
    "Davangere":              [14.4644, 75.9218],
}

SHIPMENTS = [
    {"id": "SHP-7821", "from": "Bengaluru (Whitefield)", "to": "Mysuru (City Centre)",   "status": "transit",   "eta": "2h 30m", "lat": 12.6300, "lng": 77.1500, "delivery_type": "normal",     "vehicle_type": "light", "cold_chain_profile": None,    "assigned_vehicle": "V002"},
    {"id": "SHP-6204", "from": "Hubli",                  "to": "Bengaluru (Whitefield)", "status": "transit",   "eta": "5h 10m", "lat": 14.5000, "lng": 75.8000, "delivery_type": "cold_chain",  "vehicle_type": "light", "cold_chain_profile": "pharma", "assigned_vehicle": "V003"},
    {"id": "SHP-5091", "from": "Mangaluru (Port)",        "to": "Shivamogga",             "status": "delayed",   "eta": "4h 50m", "lat": 13.2000, "lng": 75.3000, "delivery_type": "normal",     "vehicle_type": "heavy", "cold_chain_profile": None,    "assigned_vehicle": "V005"},
    {"id": "SHP-4300", "from": "Belagavi",                "to": "Davangere",              "status": "transit",   "eta": "3h 00m", "lat": 15.1000, "lng": 75.3000, "delivery_type": "cold_chain",  "vehicle_type": "heavy", "cold_chain_profile": "frozen", "assigned_vehicle": "V004"},
    {"id": "SHP-3814", "from": "Tumkur",                  "to": "Hubli",                  "status": "delivered", "eta": "Done",   "lat": 14.2000, "lng": 76.4000, "delivery_type": "normal",     "vehicle_type": "light", "cold_chain_profile": None,    "assigned_vehicle": "V001"},
]

ROUTE_DATA = {
    "Bengaluru (Whitefield)|Mysuru (City Centre)": {"dist": 152, "road": "NH-275",  "congestion": "low",    "toll": 85},
    "Bengaluru (Whitefield)|Hubli":                {"dist": 413, "road": "NH-48",   "congestion": "medium", "toll": 220},
    "Bengaluru (Whitefield)|Mangaluru (Port)":     {"dist": 352, "road": "NH-75",   "congestion": "medium", "toll": 180},
    "Bengaluru (Whitefield)|Belagavi":             {"dist": 508, "road": "NH-48",   "congestion": "low",    "toll": 260},
    "Bengaluru (Whitefield)|Tumkur":               {"dist": 71,  "road": "NH-4",    "congestion": "high",   "toll": 35},
    "Bengaluru (Whitefield)|Shivamogga":           {"dist": 281, "road": "NH-206",  "congestion": "low",    "toll": 120},
    "Bengaluru (Whitefield)|Davangere":            {"dist": 264, "road": "NH-48",   "congestion": "low",    "toll": 110},
    "Mysuru (City Centre)|Mangaluru (Port)":       {"dist": 244, "road": "NH-275",  "congestion": "medium", "toll": 130},
    "Mysuru (City Centre)|Hubli":                  {"dist": 331, "road": "NH-150",  "congestion": "low",    "toll": 160},
    "Hubli|Belagavi":                              {"dist": 98,  "road": "NH-748",  "congestion": "low",    "toll": 50},
    "Hubli|Davangere":                             {"dist": 95,  "road": "NH-48",   "congestion": "low",    "toll": 45},
    "Mangaluru (Port)|Shivamogga":                 {"dist": 161, "road": "NH-169",  "congestion": "high",   "toll": 80},
    "Belagavi|Davangere":                          {"dist": 180, "road": "NH-67",   "congestion": "low",    "toll": 90},
    "Tumkur|Hubli":                                {"dist": 260, "road": "NH-48",   "congestion": "low",    "toll": 130},
    "Shivamogga|Davangere":                        {"dist": 111, "road": "NH-48",   "congestion": "low",    "toll": 55},
}

VEHICLE_DATA = [
    {"id": "bike",    "emoji": "🛵", "name": "Bike",     "ratePerKm": 4.5,  "maxWeight": 20,    "baseSpeed": 45,  "overweightFactor": 1.8},
    {"id": "minivan", "emoji": "🚐", "name": "Mini Van", "ratePerKm": 9,    "maxWeight": 500,   "baseSpeed": 55,  "overweightFactor": 1.0},
    {"id": "truck",   "emoji": "🚛", "name": "Truck",    "ratePerKm": 18,   "maxWeight": 10000, "baseSpeed": 45,  "overweightFactor": 1.0},
    {"id": "flight",  "emoji": "✈️", "name": "Flight",   "ratePerKm": 32,   "maxWeight": 25000, "baseSpeed": 650, "overweightFactor": 1.2},
]

ALERTS_DATA = [
    {"type": "critical", "icon": "🚨", "title": "⚠️ Delay due to traffic — NH-75 near Agumbe",   "desc": "SHP-5091 affected. 3 vehicles stuck in accident clearance. ETA pushed by 1h 20min. Auto-reroute via Tirthahalli initiated.", "tag": "critical", "route": "Mangaluru → Shivamogga", "time": "5 min ago"},
    {"type": "warning",  "icon": "🌧️", "title": "⚠️ Weather advisory — Heavy rain in Coastal Karnataka", "desc": "Mangaluru port corridor at risk. 4 shipments may face 30–60 min delays. Wind speed > 55 km/h.", "tag": "warning", "route": "Mangaluru corridor", "time": "12 min ago"},
    {"type": "warning",  "icon": "⛽", "title": "⚠️ Fuel cost spike detected",                     "desc": "Diesel up 8% in Belagavi zone. AI recommends shifting 2 routes to Mini Van — saving ₹3,400.", "tag": "warning", "route": "Belagavi zone",       "time": "28 min ago"},
    {"type": "info",     "icon": "🔄", "title": "Route optimization complete",                      "desc": "AI optimized 6 routes on Bengaluru–Mysuru corridor. Combined savings: ₹18,200 and 2.3h fleet time.", "tag": "info", "route": "Bengaluru → Mysuru",  "time": "45 min ago"},
    {"type": "info",     "icon": "📦", "title": "Batch planning completed",                         "desc": "94 shipments scheduled for tomorrow. 8 routes consolidated. Fleet utilization projected at 88%.", "tag": "info", "route": "All Karnataka",       "time": "1 hr ago"},
    {"type": "resolved", "icon": "✅", "title": "Resolved — Traffic jam cleared on NH-48",          "desc": "2-hour congestion near Tumkur cleared. SHP-6112 back on schedule.", "tag": "resolved", "route": "Tumkur bypass",       "time": "2 hr ago"},
]

DELIVERY_HISTORY = [
    {"shipmentId": "SHP-7821", "route": "Bengaluru → Mysuru",       "status": "delivered", "deliveredAt": "Today, 03:10 PM",        "delayMin": 8},
    {"shipmentId": "SHP-6204", "route": "Hubli → Bengaluru",        "status": "transit",   "deliveredAt": "ETA Today, 07:20 PM",   "delayMin": 18},
    {"shipmentId": "SHP-5091", "route": "Mangaluru → Shivamogga",   "status": "delayed",   "deliveredAt": "ETA Today, 09:05 PM",   "delayMin": 70},
    {"shipmentId": "SHP-4300", "route": "Belagavi → Davangere",     "status": "transit",   "deliveredAt": "ETA Today, 06:40 PM",   "delayMin": 14},
    {"shipmentId": "SHP-3814", "route": "Tumkur → Hubli",           "status": "delivered", "deliveredAt": "Today, 11:45 AM",       "delayMin": 0},
    {"shipmentId": "SHP-7008", "route": "Bengaluru → Mangaluru",    "status": "delivered", "deliveredAt": "Yesterday, 07:05 PM",   "delayMin": 22},
]

TRANSACTION_HISTORY = [
    {"txnId": "TXN-11920", "shipmentId": "SHP-7821", "amount": 4820, "method": "UPI",    "time": "Today, 03:18 PM"},
    {"txnId": "TXN-11913", "shipmentId": "SHP-3814", "amount": 3620, "method": "Card",   "time": "Today, 12:02 PM"},
    {"txnId": "TXN-11905", "shipmentId": "SHP-7008", "amount": 9210, "method": "NEFT",   "time": "Yesterday, 07:20 PM"},
    {"txnId": "TXN-11897", "shipmentId": "SHP-6120", "amount": 2750, "method": "UPI",    "time": "Yesterday, 03:11 PM"},
    {"txnId": "TXN-11884", "shipmentId": "SHP-5987", "amount": 6400, "method": "Card",   "time": "Yesterday, 11:49 AM"},
]

COURIER_COST_DATA = [
    {"id": "dtdc",       "name": "DTDC",       "emoji": "📦", "intra1": [40, 70],   "inter1": [80, 100],   "intra10": [200, 300],  "inter10": [600, 900]},
    {"id": "delhivery",  "name": "Delhivery",  "emoji": "🚚", "intra1": [30, 50],   "inter1": [70, 120],   "intra10": [180, 250],  "inter10": [500, 800]},
    {"id": "blue-dart",  "name": "Blue Dart",  "emoji": "🛫", "intra1": [100, 150], "inter1": [120, 200],  "intra10": [400, 600],  "inter10": [800, 1200]},
    {"id": "india-post", "name": "India Post", "emoji": "📮", "intra1": [35, 55],   "inter1": [65, 90],    "intra10": [150, 200],  "inter10": [400, 600]},
]

# ═══════════════════════════════════════════════
# ── NEW: FLEET DATA
# ═══════════════════════════════════════════════
VEHICLES_FLEET = [
    {"id": "V001", "name": "Ravi's Ace",    "type": "light", "refrigerated": False, "status": "available",  "capacity_kg": 500,   "lat": 12.9698, "lng": 77.7500, "driver": "Ravi Kumar",   "fuel_pct": 87},
    {"id": "V002", "name": "Express Hawk",  "type": "light", "refrigerated": False, "status": "in_transit", "capacity_kg": 400,   "lat": 12.6300, "lng": 77.1500, "driver": "Suresh Babu",  "fuel_pct": 62},
    {"id": "V003", "name": "ColdStar Mini", "type": "light", "refrigerated": True,  "status": "in_transit", "capacity_kg": 350,   "lat": 14.5000, "lng": 75.8000, "driver": "Priya Nair",   "fuel_pct": 74},
    {"id": "V004", "name": "FreezePro HGV", "type": "heavy", "refrigerated": True,  "status": "available",  "capacity_kg": 8000,  "lat": 15.1000, "lng": 75.3000, "driver": "Anand Singh",  "fuel_pct": 91},
    {"id": "V005", "name": "Road King HGV", "type": "heavy", "refrigerated": False, "status": "delayed",    "capacity_kg": 10000, "lat": 13.2000, "lng": 75.3000, "driver": "Mohan Das",    "fuel_pct": 45},
    {"id": "V006", "name": "Swift Rider",   "type": "light", "refrigerated": False, "status": "available",  "capacity_kg": 20,    "lat": 13.3379, "lng": 77.1173, "driver": "Kiran Rao",    "fuel_pct": 95},
]

# ═══════════════════════════════════════════════
# ── NEW: COLD CHAIN PROFILES
# ═══════════════════════════════════════════════
COLD_CHAIN_PROFILES = {
    "pharma":  {"label": "Pharma (2–8°C)",      "min_temp": 2,   "max_temp": 8,   "color": "#3b82f6", "surcharge_pct": 35},
    "frozen":  {"label": "Frozen (-18 to -12°C)","min_temp": -18, "max_temp": -12, "color": "#06b6d4", "surcharge_pct": 55},
    "chilled": {"label": "Chilled (0–4°C)",      "min_temp": 0,   "max_temp": 4,   "color": "#8b5cf6", "surcharge_pct": 40},
}

# ═══════════════════════════════════════════════
# ── NEW: EMERGENCY EVENTS (live list)
# ═══════════════════════════════════════════════
EMERGENCY_EVENTS = []
_emergency_counter = 1

# ═══════════════════════════════════════════════
# ── NEW: WEATHER DATA (simulated — all 28 Indian states)
# ── Production: replace with OWM API call per state capital
# ═══════════════════════════════════════════════
WEATHER_DATA = [
    {"state": "Andhra Pradesh",   "city": "Amaravati",      "temp_c": 34, "condition": "Sunny",           "wind_kmh": 14, "humidity": 58, "icon": "☀️",  "route_impact": "none"},
    {"state": "Arunachal Pradesh","city": "Itanagar",       "temp_c": 18, "condition": "Partly Cloudy",   "wind_kmh": 10, "humidity": 72, "icon": "⛅",  "route_impact": "none"},
    {"state": "Assam",            "city": "Dispur",         "temp_c": 27, "condition": "Heavy Rain",      "wind_kmh": 42, "humidity": 91, "icon": "🌧️",  "route_impact": "delay_60min"},
    {"state": "Bihar",            "city": "Patna",          "temp_c": 38, "condition": "Heat Wave",       "wind_kmh": 8,  "humidity": 32, "icon": "🔥",  "route_impact": "cold_chain_risk"},
    {"state": "Chhattisgarh",     "city": "Raipur",         "temp_c": 36, "condition": "Sunny",           "wind_kmh": 11, "humidity": 40, "icon": "☀️",  "route_impact": "none"},
    {"state": "Goa",              "city": "Panaji",         "temp_c": 30, "condition": "Moderate Rain",   "wind_kmh": 28, "humidity": 82, "icon": "🌦️",  "route_impact": "delay_30min"},
    {"state": "Gujarat",          "city": "Gandhinagar",    "temp_c": 37, "condition": "Hot & Dry",       "wind_kmh": 20, "humidity": 25, "icon": "🌡️",  "route_impact": "cold_chain_risk"},
    {"state": "Haryana",          "city": "Chandigarh",     "temp_c": 32, "condition": "Clear",           "wind_kmh": 16, "humidity": 45, "icon": "☀️",  "route_impact": "none"},
    {"state": "Himachal Pradesh", "city": "Shimla",         "temp_c": 12, "condition": "Foggy",           "wind_kmh": 6,  "humidity": 68, "icon": "🌫️",  "route_impact": "delay_20min"},
    {"state": "Jharkhand",        "city": "Ranchi",         "temp_c": 29, "condition": "Partly Cloudy",   "wind_kmh": 12, "humidity": 60, "icon": "⛅",  "route_impact": "none"},
    {"state": "Karnataka",        "city": "Bengaluru",      "temp_c": 27, "condition": "Partly Cloudy",   "wind_kmh": 15, "humidity": 62, "icon": "⛅",  "route_impact": "none"},
    {"state": "Kerala",           "city": "Thiruvananthapuram", "temp_c": 31, "condition": "Heavy Rain", "wind_kmh": 52, "humidity": 90, "icon": "⛈️",  "route_impact": "delay_60min"},
    {"state": "Madhya Pradesh",   "city": "Bhopal",         "temp_c": 39, "condition": "Extreme Heat",   "wind_kmh": 7,  "humidity": 18, "icon": "🔥",  "route_impact": "cold_chain_risk"},
    {"state": "Maharashtra",      "city": "Mumbai",         "temp_c": 32, "condition": "Moderate Rain",   "wind_kmh": 35, "humidity": 85, "icon": "🌧️",  "route_impact": "delay_30min"},
    {"state": "Manipur",          "city": "Imphal",         "temp_c": 22, "condition": "Cloudy",          "wind_kmh": 14, "humidity": 70, "icon": "☁️",  "route_impact": "none"},
    {"state": "Meghalaya",        "city": "Shillong",       "temp_c": 17, "condition": "Heavy Rain",      "wind_kmh": 38, "humidity": 92, "icon": "⛈️",  "route_impact": "delay_60min"},
    {"state": "Mizoram",          "city": "Aizawl",         "temp_c": 20, "condition": "Drizzle",         "wind_kmh": 18, "humidity": 78, "icon": "🌦️",  "route_impact": "delay_15min"},
    {"state": "Nagaland",         "city": "Kohima",         "temp_c": 19, "condition": "Partly Cloudy",   "wind_kmh": 10, "humidity": 66, "icon": "⛅",  "route_impact": "none"},
    {"state": "Odisha",           "city": "Bhubaneswar",    "temp_c": 36, "condition": "Sunny",           "wind_kmh": 18, "humidity": 55, "icon": "☀️",  "route_impact": "none"},
    {"state": "Punjab",           "city": "Chandigarh",     "temp_c": 33, "condition": "Clear",           "wind_kmh": 14, "humidity": 42, "icon": "☀️",  "route_impact": "none"},
    {"state": "Rajasthan",        "city": "Jaipur",         "temp_c": 42, "condition": "Extreme Heat",    "wind_kmh": 22, "humidity": 12, "icon": "🔥",  "route_impact": "cold_chain_risk"},
    {"state": "Sikkim",           "city": "Gangtok",        "temp_c": 14, "condition": "Heavy Fog",       "wind_kmh": 5,  "humidity": 80, "icon": "🌫️",  "route_impact": "delay_30min"},
    {"state": "Tamil Nadu",       "city": "Chennai",        "temp_c": 35, "condition": "Hot & Humid",     "wind_kmh": 20, "humidity": 75, "icon": "🌡️",  "route_impact": "cold_chain_risk"},
    {"state": "Telangana",        "city": "Hyderabad",      "temp_c": 37, "condition": "Partly Cloudy",   "wind_kmh": 16, "humidity": 48, "icon": "⛅",  "route_impact": "none"},
    {"state": "Tripura",          "city": "Agartala",       "temp_c": 28, "condition": "Moderate Rain",   "wind_kmh": 24, "humidity": 80, "icon": "🌧️",  "route_impact": "delay_30min"},
    {"state": "Uttar Pradesh",    "city": "Lucknow",        "temp_c": 40, "condition": "Heat Wave",       "wind_kmh": 9,  "humidity": 22, "icon": "🔥",  "route_impact": "cold_chain_risk"},
    {"state": "Uttarakhand",      "city": "Dehradun",       "temp_c": 19, "condition": "Cloudy",          "wind_kmh": 12, "humidity": 65, "icon": "☁️",  "route_impact": "none"},
    {"state": "West Bengal",      "city": "Kolkata",        "temp_c": 33, "condition": "Moderate Rain",   "wind_kmh": 30, "humidity": 82, "icon": "🌧️",  "route_impact": "delay_30min"},
]

# ═══════════════════════════════════════════════
# ── NEW: REAL ROAD PATH WAYPOINTS (simulated)
# ── Production: replace with ORS /directions API
# ═══════════════════════════════════════════════
ROAD_PATHS = {
    "Bengaluru (Whitefield)|Mysuru (City Centre)": [
        [12.9698, 77.7500], [12.9300, 77.6800], [12.8900, 77.5500],
        [12.7800, 77.3200], [12.6500, 77.1200], [12.5200, 76.9800],
        [12.4000, 76.8200], [12.2958, 76.6394]
    ],
    "Bengaluru (Whitefield)|Hubli": [
        [12.9698, 77.7500], [13.1800, 77.5200], [13.4000, 77.2200],
        [13.6800, 76.9000], [14.0000, 76.4500], [14.4000, 75.9800],
        [14.8000, 75.6500], [15.1500, 75.3200], [15.3647, 75.1240]
    ],
    "Bengaluru (Whitefield)|Mangaluru (Port)": [
        [12.9698, 77.7500], [12.8500, 77.5000], [12.7200, 77.1800],
        [12.6500, 76.8500], [12.7000, 76.4800], [12.7800, 75.8800],
        [12.8200, 75.3500], [12.8698, 74.8431]
    ],
    "Hubli|Belagavi": [
        [15.3647, 75.1240], [15.4800, 75.0200], [15.6000, 74.8800],
        [15.7200, 74.7200], [15.8497, 74.4977]
    ],
    "Mangaluru (Port)|Shivamogga": [
        [12.8698, 74.8431], [13.0000, 74.9200], [13.1800, 75.0800],
        [13.4000, 75.2500], [13.6000, 75.3800], [13.7500, 75.4800],
        [13.9299, 75.5681]
    ],
    "Belagavi|Davangere": [
        [15.8497, 74.4977], [15.6000, 74.8000], [15.3000, 75.1000],
        [15.0500, 75.3500], [14.8000, 75.5000], [14.5500, 75.6800],
        [14.4644, 75.9218]
    ],
}

# ═══════════════════════════════════════════════
# ── NEW: HIGHWAY NETWORK (heavy vehicles)
# ═══════════════════════════════════════════════
HIGHWAY_ROUTES = {
    "Bengaluru (Whitefield)|Hubli": {
        "highway": "NH-48", "heavy_allowed": True,
        "restriction_zones": [],
        "toll_booths": ["Nelamangala", "Chittradurga", "Davangere"],
        "total_toll_inr": 580,
        "waypoints": [
            [12.9698, 77.7500], [13.0500, 77.5200], [13.3000, 77.1000],
            [13.9700, 76.6000], [14.2000, 76.3000], [14.4644, 75.9218],
            [15.0000, 75.4000], [15.3647, 75.1240]
        ],
        "notes": "Suitable for HGV. No bridge weight restrictions on NH-48 corridor."
    },
    "Bengaluru (Whitefield)|Belagavi": {
        "highway": "NH-48", "heavy_allowed": True,
        "restriction_zones": ["Nandi Hills bypass — avoid for HGV"],
        "toll_booths": ["Nelamangala", "Tumkur", "Haveri"],
        "total_toll_inr": 780,
        "waypoints": [
            [12.9698, 77.7500], [13.0500, 77.3000], [13.3379, 77.1173],
            [13.8000, 76.8000], [14.4644, 75.9218], [15.0000, 75.3000],
            [15.3647, 75.1240], [15.8497, 74.4977]
        ],
        "notes": "Preferred HGV corridor. Bypass Nandi Hills ghat section."
    },
    "Bengaluru (Whitefield)|Mysuru (City Centre)": {
        "highway": "NH-275", "heavy_allowed": True,
        "restriction_zones": [],
        "toll_booths": ["Bidadi", "Maddur"],
        "total_toll_inr": 120,
        "waypoints": [
            [12.9698, 77.7500], [12.8500, 77.5000], [12.7500, 77.2500],
            [12.6000, 77.0000], [12.4500, 76.8000], [12.2958, 76.6394]
        ],
        "notes": "4-lane expressway, HGV friendly."
    },
}

# ═══════════════════════════════════════════════
# ── PYDANTIC MODELS (existing + new)
# ═══════════════════════════════════════════════
from pydantic import BaseModel, EmailStr, Field

class SignUpRequest(BaseModel):
    first_name:   str       = Field(..., min_length=1, max_length=100)
    last_name:    str       = Field(..., min_length=1, max_length=100)
    email:        EmailStr
    organisation: str       = Field(..., min_length=1, max_length=200)
    password:     str       = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         dict

class RouteQueryRequest(BaseModel):
    origin:      str
    destination: str

class CostCalcRequest(BaseModel):
    origin:      str
    destination: str
    vehicle_id:  str
    weight_kg:   float = Field(..., gt=0)

class AssistantQueryRequest(BaseModel):
    query: str

class UpdateShipmentRequest(BaseModel):
    status: str

# ── NEW MODELS ──
class ShipmentCreateRequest(BaseModel):
    origin:              str
    destination:         str
    weight_kg:           float = Field(..., gt=0)
    delivery_type:       str = "normal"        # normal | cold_chain
    cold_chain_profile:  Optional[str] = None  # pharma | frozen | chilled
    vehicle_type:        str = "light"         # light | heavy
    priority:            str = "standard"      # standard | express | same-day

class EmergencyTriggerRequest(BaseModel):
    vehicle_id:  str
    shipment_id: str
    lat:         float
    lng:         float
    reason:      str = "breakdown"  # breakdown | delay | accident

class HeavyRouteRequest(BaseModel):
    origin:      str
    destination: str
    weight_kg:   float = 5000
    load_type:   str = "standard"   # standard | hazmat | oversized


# ═══════════════════════════════════════════════
# ── AUTH ROUTES (unchanged)
# ═══════════════════════════════════════════════
@app.post("/auth/signup", response_model=TokenResponse, status_code=201)
async def signup(body: SignUpRequest):
    existing = await database.fetch_one(
        users_table.select().where(users_table.c.email == body.email)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    new_id = await database.execute(users_table.insert().values(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        organisation=body.organisation,
        hashed_pw=hash_password(body.password),
        created_at=datetime.utcnow(),
    ))
    token = create_access_token({"sub": body.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_id, "first_name": body.first_name,
            "last_name": body.last_name, "email": body.email,
            "organisation": body.organisation,
        },
    }


@app.post("/auth/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await database.fetch_one(
        users_table.select().where(users_table.c.email == form.username)
    )
    if not user or not verify_password(form.password, user["hashed_pw"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"], "first_name": user["first_name"],
            "last_name": user["last_name"], "email": user["email"],
            "organisation": user["organisation"],
        },
    }


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "hashed_pw"}


# ═══════════════════════════════════════════════
# ── DASHBOARD (unchanged)
# ═══════════════════════════════════════════════
@app.get("/dashboard/stats")
async def dashboard_stats(current_user: dict = Depends(get_current_user)):
    in_transit  = sum(1 for s in SHIPMENTS if s["status"] == "transit")
    delayed     = sum(1 for s in SHIPMENTS if s["status"] == "delayed")
    delivered   = sum(1 for s in SHIPMENTS if s["status"] == "delivered")
    total_rev   = sum(t["amount"] for t in TRANSACTION_HISTORY)
    active_routes = len([r for r, d in ROUTE_DATA.items() if d["congestion"] != "high"])
    cold_chain_active = sum(1 for s in SHIPMENTS if s["delivery_type"] == "cold_chain" and s["status"] == "transit")
    return {
        "total_shipments":       len(SHIPMENTS),
        "in_transit":            in_transit,
        "delayed":               delayed,
        "delivered":             delivered,
        "active_routes":         active_routes,
        "total_revenue_inr":     total_rev,
        "fleet_utilisation_pct": 88,
        "ai_savings_mtd_inr":    420000,
        "cold_chain_active":     cold_chain_active,
        "emergency_events":      len(EMERGENCY_EVENTS),
    }


# ═══════════════════════════════════════════════
# ── SHIPMENT TRACKING (extended)
# ═══════════════════════════════════════════════
@app.get("/shipments")
async def list_shipments(
    status: Optional[str] = None,
    delivery_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    data = SHIPMENTS
    if status:
        data = [s for s in data if s["status"] == status]
    if delivery_type:
        data = [s for s in data if s["delivery_type"] == delivery_type]
    return {"shipments": data, "total": len(data)}


@app.get("/shipments/{shipment_id}")
async def get_shipment(shipment_id: str, current_user: dict = Depends(get_current_user)):
    shipment = next((s for s in SHIPMENTS if s["id"] == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    return shipment


@app.patch("/shipments/{shipment_id}/status")
async def update_shipment_status(
    shipment_id: str,
    body: UpdateShipmentRequest,
    current_user: dict = Depends(get_current_user),
):
    allowed = {"transit", "delayed", "delivered"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail=f"Status must be one of {allowed}")
    shipment = next((s for s in SHIPMENTS if s["id"] == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    shipment["status"] = body.status
    return {"updated": True, "shipment": shipment}


# ── NEW: Create Shipment with Cold Chain / Heavy Vehicle Support ──
@app.post("/shipments/create", status_code=201)
async def create_shipment(
    body: ShipmentCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    # Validate cold chain
    if body.delivery_type == "cold_chain" and body.cold_chain_profile not in COLD_CHAIN_PROFILES:
        raise HTTPException(status_code=422, detail=f"Invalid cold chain profile. Choose: {list(COLD_CHAIN_PROFILES.keys())}")

    # AI vehicle assignment
    needs_refrigeration = body.delivery_type == "cold_chain"
    assigned = _assign_best_vehicle(body.vehicle_type, needs_refrigeration, body.weight_kg)
    if not assigned:
        raise HTTPException(status_code=503, detail="No suitable vehicle available right now.")

    # Route lookup / estimate
    key = f"{body.origin}|{body.destination}"
    rev_key = f"{body.destination}|{body.origin}"
    route = ROUTE_DATA.get(key) or ROUTE_DATA.get(rev_key) or {"dist": 200, "road": "NH Corridor", "congestion": "medium", "toll": 100}

    dist = route["dist"]
    speed = 45 if body.vehicle_type == "heavy" else 55
    speed_factor = {"low": 0.92, "medium": 0.78, "high": 0.60}.get(route["congestion"], 0.78)
    eta_hours = round(dist / (speed * speed_factor), 2)

    profile = COLD_CHAIN_PROFILES.get(body.cold_chain_profile, {})
    cold_surcharge = profile.get("surcharge_pct", 0) if needs_refrigeration else 0
    base_cost = round(dist * (18 if body.vehicle_type == "heavy" else 9))
    total_cost = round(base_cost * (1 + cold_surcharge / 100)) + route.get("toll", 0)

    # Simulated temperature risk
    temp_risk = "none" if route["congestion"] == "low" else "medium" if route["congestion"] == "medium" else "high"

    new_id = f"SHP-{random.randint(9000, 9999)}"
    shipment = {
        "id": new_id,
        "from": body.origin,
        "to": body.destination,
        "status": "transit",
        "eta": f"{int(eta_hours)}h {int((eta_hours % 1) * 60)}m",
        "lat": CITIES.get(body.origin, [14.0, 76.0])[0],
        "lng": CITIES.get(body.origin, [14.0, 76.0])[1],
        "delivery_type": body.delivery_type,
        "vehicle_type": body.vehicle_type,
        "cold_chain_profile": body.cold_chain_profile,
        "assigned_vehicle": assigned["id"],
    }
    SHIPMENTS.append(shipment)
    assigned["status"] = "in_transit"

    return {
        "shipment_id": new_id,
        "assigned_vehicle": assigned["id"],
        "assigned_vehicle_name": assigned["name"],
        "driver": assigned["driver"],
        "vehicle_refrigerated": assigned["refrigerated"],
        "distance_km": dist,
        "road": route["road"],
        "eta_hours": eta_hours,
        "total_cost_inr": total_cost,
        "cold_chain_profile": profile.get("label"),
        "temp_risk": temp_risk,
        "ai_note": f"AI assigned {assigned['name']} — {'refrigerated unit confirmed ✅' if needs_refrigeration else 'standard vehicle'}"
    }


def _assign_best_vehicle(vehicle_type: str, refrigerated: bool, weight_kg: float):
    """Heuristic AI: closest available vehicle matching type + refrigeration."""
    candidates = [
        v for v in VEHICLES_FLEET
        if v["status"] == "available"
        and v["type"] == vehicle_type
        and (not refrigerated or v["refrigerated"])
        and v["capacity_kg"] >= weight_kg
    ]
    if not candidates:
        # Relax vehicle_type constraint
        candidates = [
            v for v in VEHICLES_FLEET
            if v["status"] == "available"
            and (not refrigerated or v["refrigerated"])
            and v["capacity_kg"] >= weight_kg
        ]
    return candidates[0] if candidates else None


# ── NEW: Cold Chain Status ──
@app.get("/shipments/{shipment_id}/cold-chain")
async def cold_chain_status(shipment_id: str, current_user: dict = Depends(get_current_user)):
    shipment = next((s for s in SHIPMENTS if s["id"] == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    if shipment["delivery_type"] != "cold_chain":
        raise HTTPException(status_code=400, detail="Not a cold chain shipment.")

    profile = COLD_CHAIN_PROFILES.get(shipment["cold_chain_profile"], {})
    # Simulated temperature log
    base_temp = (profile["min_temp"] + profile["max_temp"]) / 2
    readings = [
        {"time": f"-{i*10}min", "temp_c": round(base_temp + random.uniform(-0.5, 0.8), 1)}
        for i in range(6, 0, -1)
    ]
    breaches = [r for r in readings if r["temp_c"] > profile["max_temp"] or r["temp_c"] < profile["min_temp"]]

    return {
        "shipment_id": shipment_id,
        "profile": profile.get("label"),
        "target_range": f"{profile['min_temp']}°C to {profile['max_temp']}°C",
        "current_temp_c": readings[-1]["temp_c"],
        "status": "BREACH" if breaches else "OK",
        "breach_count": len(breaches),
        "temperature_log": readings,
        "assigned_vehicle": shipment["assigned_vehicle"],
    }


# ═══════════════════════════════════════════════
# ── ROUTE OPTIMISER (extended)
# ═══════════════════════════════════════════════
@app.get("/routes")
async def list_routes(current_user: dict = Depends(get_current_user)):
    routes = [
        {"key": key, "origin": key.split("|")[0], "destination": key.split("|")[1], **details}
        for key, details in ROUTE_DATA.items()
    ]
    return {"routes": routes, "total": len(routes)}


@app.post("/routes/query")
async def query_route(body: RouteQueryRequest, current_user: dict = Depends(get_current_user)):
    key = f"{body.origin}|{body.destination}"
    rev_key = f"{body.destination}|{body.origin}"
    route = ROUTE_DATA.get(key) or ROUTE_DATA.get(rev_key)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found in network.")
    return {
        "origin": body.origin, "destination": body.destination,
        **route,
        "origin_coords":      CITIES.get(body.origin),
        "destination_coords": CITIES.get(body.destination),
    }


@app.get("/routes/cities")
async def list_cities(current_user: dict = Depends(get_current_user)):
    return {"cities": [{"name": n, "lat": c[0], "lng": c[1]} for n, c in CITIES.items()]}


# ── NEW: Real Road Path (simulated ORS) ──
@app.get("/routes/real-path")
async def real_road_path(
    origin: str,
    destination: str,
    vehicle: str = "car",   # car | hgv
    current_user: dict = Depends(get_current_user),
):
    """
    Returns simulated road-following waypoints.
    Production: replace body with ORS /v2/directions/{profile}/geojson call.
    """
    key = f"{origin}|{destination}"
    rev_key = f"{destination}|{origin}"
    path = ROAD_PATHS.get(key) or ROAD_PATHS.get(rev_key)

    if not path and origin in CITIES and destination in CITIES:
        # Fallback: generate intermediate waypoints along great-circle path
        o, d = CITIES[origin], CITIES[destination]
        path = _interpolate_path(o, d, steps=6)
    elif not path:
        raise HTTPException(status_code=404, detail="Path not available for this pair.")

    route_info = ROUTE_DATA.get(key) or ROUTE_DATA.get(rev_key) or {"dist": 200}
    dist = route_info.get("dist", 200)
    duration_s = int((dist / 50) * 3600)  # ~50 km/h average

    return {
        "origin": origin,
        "destination": destination,
        "vehicle_profile": vehicle,
        "distance_m": dist * 1000,
        "duration_s": duration_s,
        "waypoints": path,
        "geometry": {
            "type": "LineString",
            "coordinates": [[p[1], p[0]] for p in path]  # GeoJSON: [lng, lat]
        },
        "data_source": "simulated",  # replace with "openrouteservice" in production
    }


def _interpolate_path(origin: list, dest: list, steps: int = 6):
    """Generate intermediate lat/lng to simulate a curved road path."""
    points = []
    for i in range(steps + 1):
        t = i / steps
        lat = origin[0] + (dest[0] - origin[0]) * t
        lng = origin[1] + (dest[1] - origin[1]) * t
        # Add slight curvature (road-like deviation)
        jitter_lat = math.sin(t * math.pi) * random.uniform(0.01, 0.06) * (1 if random.random() > 0.5 else -1)
        jitter_lng = math.sin(t * math.pi) * random.uniform(0.01, 0.06) * (1 if random.random() > 0.5 else -1)
        points.append([round(lat + jitter_lat, 4), round(lng + jitter_lng, 4)])
    points[0] = [origin[0], origin[1]]
    points[-1] = [dest[0], dest[1]]
    return points


# ── NEW: Heavy Vehicle Route ──
@app.post("/routes/heavy-vehicle")
async def heavy_vehicle_route(body: HeavyRouteRequest, current_user: dict = Depends(get_current_user)):
    """
    Returns highway-only route for HGV with toll & restriction info.
    Production: use ORS profile 'driving-hgv' with weight/height params.
    """
    key = f"{body.origin}|{body.destination}"
    rev_key = f"{body.destination}|{body.origin}"
    hwy = HIGHWAY_ROUTES.get(key) or HIGHWAY_ROUTES.get(rev_key)
    route_info = ROUTE_DATA.get(key) or ROUTE_DATA.get(rev_key)

    if not hwy and route_info:
        # Generate generic highway response from route data
        hwy = {
            "highway": route_info["road"],
            "heavy_allowed": route_info["congestion"] != "high",
            "restriction_zones": ["Check local bridge weight limits"],
            "toll_booths": ["Auto-calculated"],
            "total_toll_inr": route_info["toll"] + 150,
            "waypoints": _interpolate_path(
                CITIES.get(body.origin, [14.0, 76.0]),
                CITIES.get(body.destination, [15.0, 75.0]), 8
            ),
            "notes": "Simulated HGV route. Verify with transport authority for oversized loads."
        }
    elif not hwy:
        raise HTTPException(status_code=404, detail="Heavy vehicle route not available for this corridor.")

    dist = route_info["dist"] if route_info else 300
    speed_hgv = 38  # km/h average for HGV
    eta_h = round(dist / speed_hgv, 2)

    return {
        "origin": body.origin,
        "destination": body.destination,
        "vehicle_type": "HGV",
        "load_type": body.load_type,
        "weight_kg": body.weight_kg,
        **hwy,
        "distance_km": dist,
        "eta_hours": eta_h,
        "ai_routing_notes": hwy.get("notes"),
        "data_source": "simulated",  # replace with ORS driving-hgv in production
    }


# ═══════════════════════════════════════════════
# ── EMERGENCY HANDLING (NEW)
# ═══════════════════════════════════════════════
@app.post("/emergency/trigger")
async def trigger_emergency(body: EmergencyTriggerRequest, current_user: dict = Depends(get_current_user)):
    """
    AI Emergency Engine:
    1. Mark vehicle as broken down
    2. Find nearest available vehicle with matching capabilities
    3. Reassign shipment
    4. Calculate new ETA
    """
    global _emergency_counter

    # Find broken vehicle
    broken = next((v for v in VEHICLES_FLEET if v["id"] == body.vehicle_id), None)
    affected_shipment = next((s for s in SHIPMENTS if s["id"] == body.shipment_id), None)

    if not broken:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    if not affected_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")

    # Mark broken vehicle
    broken["status"] = "breakdown"

    # Find nearest available replacement
    needs_ref = affected_shipment.get("delivery_type") == "cold_chain"
    nearest = _find_nearest_vehicle(body.lat, body.lng, needs_ref, body.vehicle_id)

    if not nearest:
        event = {
            "event_id": f"EMG-{_emergency_counter:03d}",
            "timestamp": datetime.utcnow().isoformat(),
            "breakdown_vehicle": body.vehicle_id,
            "breakdown_lat": body.lat,
            "breakdown_lng": body.lng,
            "shipment_id": body.shipment_id,
            "reason": body.reason,
            "status": "AWAITING_VEHICLE",
            "resolution": None,
            "eta_delta_min": None,
        }
        EMERGENCY_EVENTS.append(event)
        _emergency_counter += 1
        return {"event": event, "alert": "⚠️ No available replacement found. Manual intervention required."}

    # Reassign
    dist_to_breakdown = _haversine(body.lat, body.lng, nearest["lat"], nearest["lng"])
    eta_delta_min = round((dist_to_breakdown / 50) * 60)  # ~50 km/h to reach breakdown point

    nearest["status"] = "dispatched"
    affected_shipment["assigned_vehicle"] = nearest["id"]

    event = {
        "event_id": f"EMG-{_emergency_counter:03d}",
        "timestamp": datetime.utcnow().isoformat(),
        "breakdown_vehicle": body.vehicle_id,
        "breakdown_lat": body.lat,
        "breakdown_lng": body.lng,
        "nearest_vehicle": nearest["id"],
        "nearest_vehicle_name": nearest["name"],
        "nearest_driver": nearest["driver"],
        "distance_to_breakdown_km": round(dist_to_breakdown, 1),
        "shipment_id": body.shipment_id,
        "reason": body.reason,
        "status": "AUTO_REASSIGNED",
        "eta_delta_min": eta_delta_min,
        "resolution": f"{nearest['name']} ({nearest['driver']}) dispatched to take over.",
    }
    EMERGENCY_EVENTS.append(event)
    _emergency_counter += 1

    return {
        "event": event,
        "alert": f"🚨 Auto-reassigned: {nearest['name']} dispatched. ETA delayed by ~{eta_delta_min} min.",
        "new_vehicle": nearest["id"],
        "eta_delta_min": eta_delta_min,
    }


@app.get("/emergency/status")
async def emergency_status(current_user: dict = Depends(get_current_user)):
    return {
        "total_events": len(EMERGENCY_EVENTS),
        "active": sum(1 for e in EMERGENCY_EVENTS if e["status"] == "AUTO_REASSIGNED"),
        "awaiting": sum(1 for e in EMERGENCY_EVENTS if e["status"] == "AWAITING_VEHICLE"),
        "events": list(reversed(EMERGENCY_EVENTS)),
    }


def _find_nearest_vehicle(lat: float, lng: float, needs_refrigeration: bool, exclude_id: str):
    candidates = [
        v for v in VEHICLES_FLEET
        if v["status"] == "available"
        and v["id"] != exclude_id
        and (not needs_refrigeration or v["refrigerated"])
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda v: _haversine(lat, lng, v["lat"], v["lng"]))


def _haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# ═══════════════════════════════════════════════
# ── WEATHER (NEW — simulated, all Indian states)
# ═══════════════════════════════════════════════
@app.get("/weather/all-states")
async def weather_all_states(current_user: dict = Depends(get_current_user)):
    """
    Returns simulated weather for all 28 Indian states.
    Production: replace with concurrent OWM API calls per state capital.
    """
    rain_states   = [w for w in WEATHER_DATA if "Rain" in w["condition"] or "Storm" in w["condition"]]
    heat_states   = [w for w in WEATHER_DATA if "Heat" in w["condition"] or "Extreme" in w["condition"]]
    routes_affected = [w for w in WEATHER_DATA if w["route_impact"] != "none"]

    return {
        "total_states": len(WEATHER_DATA),
        "data_source": "simulated",  # replace with "openweathermap" in production
        "summary": {
            "rain_alerts": len(rain_states),
            "heat_alerts": len(heat_states),
            "routes_affected": len(routes_affected),
        },
        "states": WEATHER_DATA,
        "ai_advisory": _build_weather_advisory(routes_affected),
    }


@app.get("/weather/state/{state_name}")
async def weather_by_state(state_name: str, current_user: dict = Depends(get_current_user)):
    weather = next((w for w in WEATHER_DATA if w["state"].lower() == state_name.lower()), None)
    if not weather:
        raise HTTPException(status_code=404, detail=f"State '{state_name}' not found.")

    # ETA adjustment
    eta_adj = _weather_eta_adjustment(weather)
    return {
        **weather,
        "eta_adjustment_min": eta_adj["delta_min"],
        "ai_recommendation": eta_adj["recommendation"],
    }


def _weather_eta_adjustment(w: dict) -> dict:
    cond = w["condition"].lower()
    if "heavy rain" in cond or "storm" in cond:
        return {"delta_min": 60, "recommendation": "High risk. Consider holding shipment or using alternate route."}
    if "moderate rain" in cond:
        return {"delta_min": 30, "recommendation": "Add 30-min buffer. Reduce speed through affected zones."}
    if "extreme heat" in cond or "heat wave" in cond:
        return {"delta_min": 0, "recommendation": "Cold chain risk. Increase refrigeration check frequency."}
    if "fog" in cond:
        return {"delta_min": 20, "recommendation": "Fog reduces visibility. Add 20-min buffer for ghat routes."}
    if "drizzle" in cond:
        return {"delta_min": 15, "recommendation": "Minor delay expected. No alternate needed."}
    return {"delta_min": 0, "recommendation": "Clear conditions. No ETA adjustment needed."}


def _build_weather_advisory(affected_routes: list) -> str:
    if not affected_routes:
        return "All Indian state corridors are clear. No weather disruptions expected."
    names = [r["state"] for r in affected_routes[:3]]
    return (
        f"{len(affected_routes)} states with active weather warnings: {', '.join(names)} and others. "
        "AI recommends pre-loading ETAs with weather buffer. Cold chain vehicles in heat-zone states "
        "should increase temperature check intervals to every 30 minutes."
    )


# ═══════════════════════════════════════════════
# ── FLEET MANAGEMENT (NEW)
# ═══════════════════════════════════════════════
@app.get("/fleet")
async def list_fleet(
    type: Optional[str] = None,
    status: Optional[str] = None,
    refrigerated: Optional[bool] = None,
    current_user: dict = Depends(get_current_user),
):
    data = VEHICLES_FLEET
    if type:
        data = [v for v in data if v["type"] == type]
    if status:
        data = [v for v in data if v["status"] == status]
    if refrigerated is not None:
        data = [v for v in data if v["refrigerated"] == refrigerated]

    return {
        "vehicles": data,
        "total": len(data),
        "available": sum(1 for v in VEHICLES_FLEET if v["status"] == "available"),
        "in_transit": sum(1 for v in VEHICLES_FLEET if v["status"] == "in_transit"),
        "breakdown": sum(1 for v in VEHICLES_FLEET if v["status"] == "breakdown"),
    }


@app.get("/fleet/cold-chain-vehicles")
async def cold_chain_vehicles(current_user: dict = Depends(get_current_user)):
    cold = [v for v in VEHICLES_FLEET if v["refrigerated"]]
    return {
        "cold_chain_vehicles": cold,
        "total": len(cold),
        "available": sum(1 for v in cold if v["status"] == "available"),
    }


# ═══════════════════════════════════════════════
# ── AI ETA PREDICTOR (NEW)
# ═══════════════════════════════════════════════
@app.get("/ai/eta-predict")
async def ai_eta_predict(
    origin: str,
    destination: str,
    vehicle_type: str = "light",
    delivery_type: str = "normal",
    current_user: dict = Depends(get_current_user),
):
    """
    Heuristic ML-style ETA prediction:
    Inputs: distance, congestion, vehicle speed, weather conditions, time of day
    Output: adjusted ETA with confidence score
    Production: replace with trained scikit-learn gradient boost model.
    """
    key = f"{origin}|{destination}"
    rev_key = f"{destination}|{origin}"
    route = ROUTE_DATA.get(key) or ROUTE_DATA.get(rev_key)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found.")

    # Base ETA
    base_speed = 38 if vehicle_type == "heavy" else 50
    congestion_factor = {"low": 1.0, "medium": 0.80, "high": 0.58}.get(route["congestion"], 0.80)
    base_eta_h = (route["dist"] / base_speed) / congestion_factor

    # Weather adjustment (check origin state weather)
    weather_boost = 1.0
    for w in WEATHER_DATA:
        if w["city"].lower() in origin.lower() or w["state"].lower() in origin.lower():
            adj = _weather_eta_adjustment(w)
            weather_boost += adj["delta_min"] / 60.0
            break

    # Time-of-day adjustment (peak hours: 8-10am, 5-8pm IST)
    hour = datetime.utcnow().hour + 5  # rough IST
    peak_factor = 1.25 if (8 <= hour <= 10 or 17 <= hour <= 20) else 1.0

    # Cold chain penalty (more careful driving)
    cold_factor = 1.10 if delivery_type == "cold_chain" else 1.0

    final_eta_h = round(base_eta_h * weather_boost * peak_factor * cold_factor, 2)
    confidence = int(max(55, 95 - (route["congestion"] == "high") * 20 - (weather_boost > 1.2) * 15))

    return {
        "origin": origin,
        "destination": destination,
        "distance_km": route["dist"],
        "base_eta_hours": round(base_eta_h, 2),
        "adjusted_eta_hours": final_eta_h,
        "confidence_pct": confidence,
        "factors": {
            "congestion": route["congestion"],
            "congestion_factor": congestion_factor,
            "weather_boost": round(weather_boost, 2),
            "peak_hour_factor": peak_factor,
            "cold_chain_factor": cold_factor,
        },
        "model": "heuristic-v1",  # replace with 'gradient-boost-v2' in production
        "ai_note": (
            f"ETA confidence {confidence}%. "
            + (f"Weather adding ~{round((weather_boost-1)*60)}min." if weather_boost > 1.0 else "Weather clear.")
            + (" Peak hour detected — slow traffic expected." if peak_factor > 1.0 else "")
        ),
    }


# ═══════════════════════════════════════════════
# ── COST ANALYSIS (unchanged)
# ═══════════════════════════════════════════════
@app.post("/cost/calculate")
async def calculate_cost(body: CostCalcRequest, current_user: dict = Depends(get_current_user)):
    key = f"{body.origin}|{body.destination}"
    rev_key = f"{body.destination}|{body.origin}"
    route = ROUTE_DATA.get(key) or ROUTE_DATA.get(rev_key)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found.")

    vehicle = next((v for v in VEHICLE_DATA if v["id"] == body.vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle '{body.vehicle_id}' not found.")

    dist       = route["dist"]
    rate       = vehicle["ratePerKm"]
    overweight = body.weight_kg > vehicle["maxWeight"]
    factor     = vehicle["overweightFactor"] if overweight else 1.0
    base_cost  = round(dist * rate * factor)
    total_cost = base_cost + route["toll"]
    speed      = vehicle["baseSpeed"]
    eta_hrs    = round(dist / speed, 2)

    return {
        "origin": body.origin, "destination": body.destination,
        "vehicle": vehicle["name"], "distance_km": dist,
        "road": route["road"], "congestion": route["congestion"],
        "base_cost_inr": base_cost, "toll_inr": route["toll"],
        "total_cost_inr": total_cost, "eta_hours": eta_hrs,
        "overweight": overweight, "weight_kg": body.weight_kg,
        "max_weight_kg": vehicle["maxWeight"],
    }


@app.get("/cost/couriers")
async def list_couriers(current_user: dict = Depends(get_current_user)):
    return {"couriers": COURIER_COST_DATA}


@app.get("/cost/vehicles")
async def list_vehicles(current_user: dict = Depends(get_current_user)):
    return {"vehicles": VEHICLE_DATA}


# ═══════════════════════════════════════════════
# ── ALERTS (unchanged)
# ═══════════════════════════════════════════════
@app.get("/alerts")
async def list_alerts(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    data = ALERTS_DATA
    if type:
        data = [a for a in data if a["type"] == type]
    return {
        "alerts": data, "total": len(data),
        "critical": sum(1 for a in ALERTS_DATA if a["type"] == "critical"),
        "warnings":  sum(1 for a in ALERTS_DATA if a["type"] == "warning"),
    }


# ═══════════════════════════════════════════════
# ── AI ASSISTANT (extended)
# ═══════════════════════════════════════════════
@app.post("/assistant/query")
async def assistant_query(body: AssistantQueryRequest, current_user: dict = Depends(get_current_user)):
    q = body.query.lower()
    if any(w in q for w in ["cold", "chain", "temperature", "refrigerat", "frozen", "pharma"]):
        reply = _build_cold_chain_response()
    elif any(w in q for w in ["emergency", "breakdown", "accident", "reassign"]):
        reply = _build_emergency_response()
    elif any(w in q for w in ["weather", "rain", "storm", "climate"]):
        reply = _build_weather_response()
    elif any(w in q for w in ["heavy", "truck", "hgv", "highway", "highway-only"]):
        reply = _build_heavy_vehicle_response()
    elif any(w in q for w in ["route", "delivery", "multi", "sequence"]):
        reply = _build_multi_route_response()
    elif any(w in q for w in ["delay", "hotspot", "stuck", "traffic"]):
        reply = _build_delay_hotspot_response()
    elif any(w in q for w in ["cost", "reduce", "saving", "cheap"]):
        reply = _build_cost_reduction_response()
    elif any(w in q for w in ["history", "recent", "transaction"]):
        reply = _build_history_response()
    else:
        reply = (
            "I can help with:\n"
            "1) Cold chain & temperature-controlled logistics\n"
            "2) Emergency vehicle breakdown & reassignment\n"
            "3) Weather impact on routes across India\n"
            "4) Heavy vehicle / HGV highway routing\n"
            "5) Best routes for multi-stop deliveries\n"
            "6) Delay hotspot analysis\n"
            "7) Cost reduction strategy\n"
            "8) Recent delivery & transaction history\n"
        )
    return {"query": body.query, "response": reply}


def _build_cold_chain_response() -> str:
    cold_active = sum(1 for s in SHIPMENTS if s["delivery_type"] == "cold_chain" and s["status"] == "transit")
    ref_vehicles = sum(1 for v in VEHICLES_FLEET if v["refrigerated"] and v["status"] == "available")
    return (
        f"Cold Chain Status:\n"
        f"• Active cold chain shipments: {cold_active}\n"
        f"• Refrigerated vehicles available: {ref_vehicles}\n\n"
        "Active profiles: Pharma (2–8°C), Frozen (-18 to -12°C), Chilled (0–4°C)\n\n"
        "AI Tip: In current heat wave conditions (Bihar, Rajasthan, MP), "
        "increase temperature check intervals to every 30 minutes. "
        "ColdStar Mini (V003) and FreezePro HGV (V004) are your certified cold chain units."
    )


def _build_emergency_response() -> str:
    active_events = sum(1 for e in EMERGENCY_EVENTS if e["status"] == "AUTO_REASSIGNED")
    return (
        f"Emergency System Status:\n"
        f"• Total emergency events today: {len(EMERGENCY_EVENTS)}\n"
        f"• Auto-reassigned: {active_events}\n\n"
        "AI engine uses haversine distance + fleet availability to find nearest vehicle in <2 seconds.\n\n"
        "To simulate: Go to Emergency section → click 'Simulate Breakdown' to see the AI reassignment "
        "algorithm in action. The system considers vehicle type match and refrigeration needs before assigning."
    )


def _build_weather_response() -> str:
    rain_count = sum(1 for w in WEATHER_DATA if "Rain" in w["condition"])
    heat_count = sum(1 for w in WEATHER_DATA if "Heat" in w["condition"] or "Extreme" in w["condition"])
    affected = sum(1 for w in WEATHER_DATA if w["route_impact"] != "none")
    return (
        f"India-wide Weather Summary:\n"
        f"• Rain/storm alerts: {rain_count} states\n"
        f"• Heat wave alerts: {heat_count} states\n"
        f"• Routes with weather impact: {affected}\n\n"
        "Worst affected: Kerala (Heavy Rain ⛈️), Assam (Heavy Rain 🌧️), Meghalaya (Heavy Rain ⛈️)\n"
        "Cold chain risk zones: Rajasthan 42°C, MP 39°C, Bihar 38°C\n\n"
        "AI Recommendation: Hold non-critical cold chain shipments in extreme heat zones. "
        "Add 30–60 min ETA buffer on rain-affected routes."
    )


def _build_heavy_vehicle_response() -> str:
    heavy_fleet = [v for v in VEHICLES_FLEET if v["type"] == "heavy"]
    return (
        f"Heavy Vehicle Fleet Status:\n"
        f"• Total HGV units: {len(heavy_fleet)}\n"
        f"• Available: {sum(1 for v in heavy_fleet if v['status'] == 'available')}\n\n"
        "Preferred HGV corridors: NH-48 (Bengaluru–Hubli–Belagavi), NH-275 (Bengaluru–Mysuru)\n\n"
        "ORS driving-hgv profile avoids: residential areas, narrow bridges, restricted zones.\n\n"
        "AI Tip: For loads >5,000 kg on NH-206 (Shivamogga route), verify ghat section bridge limits "
        "before dispatch. NH-48 remains the safest HGV corridor today."
    )


def _build_multi_route_response() -> str:
    top = sorted(ROUTE_DATA.items(), key=lambda x: x[1]["dist"])[:3]
    lines = "\n".join(
        f"{i+1}. {r.replace('|',' → ')} ({d['dist']} km, {d['congestion']} traffic)"
        for i, (r, d) in enumerate(top)
    )
    return (
        f"Best multi-delivery sequence for today:\n{lines}\n\n"
        "Recommendation: Group northbound stops (Hubli/Belagavi/Davangere) in one run "
        "and coastal routes separately to avoid NH-75 peak congestion."
    )


def _build_delay_hotspot_response() -> str:
    delayed_count = sum(1 for s in SHIPMENTS if s["status"] == "delayed")
    high_cong = [r.replace("|", " → ") for r, d in ROUTE_DATA.items() if d["congestion"] == "high"]
    return (
        f"Current delay hotspots:\n"
        f"• Coastal + ghat corridor: {', '.join(high_cong)}\n"
        f"• Active delayed shipments: {delayed_count}\n\n"
        "Action: Add +45 min buffer on high-risk lanes and auto-reroute where toll roads are clear."
    )


def _build_cost_reduction_response() -> str:
    dist = 180
    truck = next(v for v in VEHICLE_DATA if v["id"] == "truck")
    van   = next(v for v in VEHICLE_DATA if v["id"] == "minivan")
    savings = round(dist * truck["ratePerKm"]) - round(dist * van["ratePerKm"])
    return (
        f"Cost reduction plan:\n"
        "• Shift medium loads from truck to mini-van on sub-200 km routes\n"
        "• Bundle same-corridor orders into one dispatch window\n"
        "• Prefer standard/express over same-day for non-critical consignments\n\n"
        f"Estimated saving: ~₹{savings:,} per 180 km route when using mini-van instead of truck."
    )


def _build_history_response() -> str:
    completed = sum(1 for d in DELIVERY_HISTORY if d["status"] == "delivered")
    delayed   = sum(1 for d in DELIVERY_HISTORY if d["status"] == "delayed")
    revenue   = sum(t["amount"] for t in TRANSACTION_HISTORY)
    return (
        f"Recent history snapshot:\n"
        f"• Deliveries tracked: {len(DELIVERY_HISTORY)}\n"
        f"• Completed: {completed}, Delayed: {delayed}\n"
        f"• Recent transaction value: ₹{revenue:,}\n\n"
        "Open the History section for full shipment-wise and transaction-wise logs."
    )


@app.get("/assistant/insight")
async def assistant_insight(current_user: dict = Depends(get_current_user)):
    delayed_pct = round(
        sum(1 for s in SHIPMENTS if s["status"] == "delayed") / len(SHIPMENTS) * 100
    )
    best_lanes = [
        r.replace("|", " → ")
        for r, d in ROUTE_DATA.items()
        if d["congestion"] == "low"
    ][:2]
    cold_active = sum(1 for s in SHIPMENTS if s["delivery_type"] == "cold_chain")
    weather_alerts = sum(1 for w in WEATHER_DATA if w["route_impact"] != "none")

    return {
        "delayed_pct": delayed_pct,
        "best_lanes": best_lanes,
        "cold_chain_active": cold_active,
        "weather_alerts": weather_alerts,
        "insight": (
            f"Current delayed shipment ratio is {delayed_pct}%. "
            f"Best low-congestion lanes: {', '.join(best_lanes)}. "
            f"{cold_active} cold chain shipment(s) active — monitor temperature logs. "
            f"{weather_alerts} Indian states have weather alerts affecting routes today."
        ),
    }


# ═══════════════════════════════════════════════
# ── HISTORY (unchanged)
# ═══════════════════════════════════════════════
@app.get("/history/deliveries")
async def delivery_history(current_user: dict = Depends(get_current_user)):
    delivered  = sum(1 for d in DELIVERY_HISTORY if d["status"] == "delivered")
    delayed    = sum(1 for d in DELIVERY_HISTORY if d["status"] == "delayed")
    in_transit = sum(1 for d in DELIVERY_HISTORY if d["status"] == "transit")
    return {
        "deliveries": DELIVERY_HISTORY,
        "summary": {
            "total": len(DELIVERY_HISTORY), "delivered": delivered,
            "delayed": delayed, "in_transit": in_transit,
        },
    }


@app.get("/history/transactions")
async def transaction_history(current_user: dict = Depends(get_current_user)):
    total_value = sum(t["amount"] for t in TRANSACTION_HISTORY)
    return {
        "transactions": TRANSACTION_HISTORY,
        "summary": {"total": len(TRANSACTION_HISTORY), "total_value": total_value},
    }


# ═══════════════════════════════════════════════
# ── HEALTH CHECK (public)
# ═══════════════════════════════════════════════
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "OrionAI Backend",
        "version": "2.0.0",
        "features": ["cold_chain", "emergency_ai", "weather_india", "heavy_vehicle_routing", "real_road_paths"],
    }
