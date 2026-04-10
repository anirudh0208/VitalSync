"""
Test script to run OrionAI backend and capture outputs from all endpoints.
"""
import json
import uuid
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Create a unique test user
email = f"testuser+{uuid.uuid4().hex[:8]}@example.com"
password = "TestPass123"

print("=" * 80)
print("ORIONAI BACKEND - FULL TEST RUN")
print("=" * 80)

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────────
print("\n[1] SIGNUP")
signup_resp = client.post(
    "/auth/signup",
    json={
        "first_name": "Test",
        "last_name": "User",
        "email": email,
        "organisation": "OrionAI Test",
        "password": password,
    },
)
print(f"Status: {signup_resp.status_code}")
print(json.dumps(signup_resp.json(), indent=2))

print("\n[2] LOGIN")
login_resp = client.post(
    "/auth/login",
    data={"username": email, "password": password},
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
print(f"Status: {login_resp.status_code}")
login_json = login_resp.json()
print(json.dumps(login_json, indent=2))

token = login_json.get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("\n[3] GET /auth/me")
me_resp = client.get("/auth/me", headers=headers)
print(f"Status: {me_resp.status_code}")
print(json.dumps(me_resp.json(), indent=2))

# ─────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────
print("\n[4] GET /health (public)")
health_resp = client.get("/health")
print(f"Status: {health_resp.status_code}")
print(json.dumps(health_resp.json(), indent=2))

# ─────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────
print("\n[5] GET /dashboard/stats")
stats_resp = client.get("/dashboard/stats", headers=headers)
print(f"Status: {stats_resp.status_code}")
print(json.dumps(stats_resp.json(), indent=2))

# ─────────────────────────────────────────────────────────────
# SHIPMENTS
# ─────────────────────────────────────────────────────────────
print("\n[6] GET /shipments")
shipments_resp = client.get("/shipments", headers=headers)
print(f"Status: {shipments_resp.status_code}")
print(json.dumps(shipments_resp.json(), indent=2))

print("\n[7] GET /shipments/SHP-7821")
ship_detail_resp = client.get("/shipments/SHP-7821", headers=headers)
print(f"Status: {ship_detail_resp.status_code}")
print(json.dumps(ship_detail_resp.json(), indent=2))

print("\n[8] PATCH /shipments/SHP-7821/status")
update_resp = client.patch(
    "/shipments/SHP-7821/status",
    json={"status": "delivered"},
    headers=headers,
)
print(f"Status: {update_resp.status_code}")
print(json.dumps(update_resp.json(), indent=2))

# ─────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────
print("\n[9] GET /routes")
routes_resp = client.get("/routes", headers=headers)
routes_data = routes_resp.json()
print(f"Status: {routes_resp.status_code}")
print(f"Total routes: {routes_data.get('total')}")
print(f"First 3 routes:")
for route in routes_data.get("routes", [])[:3]:
    print(f"  - {route.get('origin')} → {route.get('destination')}: {route.get('dist')}km, {route.get('congestion')} traffic")

print("\n[10] POST /routes/query")
route_query_resp = client.post(
    "/routes/query",
    json={"origin": "Bengaluru (Whitefield)", "destination": "Mysuru (City Centre)"},
    headers=headers,
)
print(f"Status: {route_query_resp.status_code}")
print(json.dumps(route_query_resp.json(), indent=2))

print("\n[11] GET /routes/cities")
cities_resp = client.get("/routes/cities", headers=headers)
cities_data = cities_resp.json()
print(f"Status: {cities_resp.status_code}")
print(f"Total cities: {len(cities_data.get('cities', []))}")
for city in cities_data.get("cities", []):
    print(f"  - {city.get('name')}: ({city.get('lat')}, {city.get('lng')})")

# ─────────────────────────────────────────────────────────────
# COST ANALYSIS
# ─────────────────────────────────────────────────────────────
print("\n[12] POST /cost/calculate")
cost_resp = client.post(
    "/cost/calculate",
    json={
        "origin": "Bengaluru (Whitefield)",
        "destination": "Mysuru (City Centre)",
        "vehicle_id": "minivan",
        "weight_kg": 120.0,
    },
    headers=headers,
)
print(f"Status: {cost_resp.status_code}")
print(json.dumps(cost_resp.json(), indent=2))

print("\n[13] GET /cost/couriers")
couriers_resp = client.get("/cost/couriers", headers=headers)
couriers_data = couriers_resp.json()
print(f"Status: {couriers_resp.status_code}")
print(f"Available couriers: {len(couriers_data.get('couriers', []))}")
for courier in couriers_data.get("couriers", []):
    print(f"  - {courier.get('emoji')} {courier.get('name')}: ₹{courier.get('intra1')} (intra-1kg)")

print("\n[14] GET /cost/vehicles")
vehicles_resp = client.get("/cost/vehicles", headers=headers)
vehicles_data = vehicles_resp.json()
print(f"Status: {vehicles_resp.status_code}")
print(f"Available vehicles: {len(vehicles_data.get('vehicles', []))}")
for vehicle in vehicles_data.get("vehicles", []):
    print(f"  - {vehicle.get('emoji')} {vehicle.get('name')}: ₹{vehicle.get('ratePerKm')}/km")

# ─────────────────────────────────────────────────────────────
# ALERTS
# ─────────────────────────────────────────────────────────────
print("\n[15] GET /alerts")
alerts_resp = client.get("/alerts", headers=headers)
alerts_data = alerts_resp.json()
print(f"Status: {alerts_resp.status_code}")
print(f"Total alerts: {alerts_data.get('total')}")
print(f"Critical: {alerts_data.get('critical')}, Warnings: {alerts_data.get('warnings')}")
print("First 3 alerts:")
for alert in alerts_data.get("alerts", [])[:3]:
    print(f"  [{alert.get('type').upper()}] {alert.get('title')}")
    print(f"    → {alert.get('desc')[:80]}...")

# ─────────────────────────────────────────────────────────────
# AI ASSISTANT
# ─────────────────────────────────────────────────────────────
print("\n[16] POST /assistant/query (route planning)")
asst_route_resp = client.post(
    "/assistant/query",
    json={"query": "What's the best multi-delivery route for today?"},
    headers=headers,
)
print(f"Status: {asst_route_resp.status_code}")
asst_data = asst_route_resp.json()
print(f"Query: {asst_data.get('query')}")
print(f"Response:\n{asst_data.get('response')}")

print("\n[17] POST /assistant/query (delay analysis)")
asst_delay_resp = client.post(
    "/assistant/query",
    json={"query": "Where are the main delay hotspots?"},
    headers=headers,
)
print(f"Status: {asst_delay_resp.status_code}")
asst_data = asst_delay_resp.json()
print(f"Response:\n{asst_data.get('response')}")

print("\n[18] POST /assistant/query (cost reduction)")
asst_cost_resp = client.post(
    "/assistant/query",
    json={"query": "How can I reduce costs?"},
    headers=headers,
)
print(f"Status: {asst_cost_resp.status_code}")
asst_data = asst_cost_resp.json()
print(f"Response:\n{asst_data.get('response')}")

print("\n[19] GET /assistant/insight")
insight_resp = client.get("/assistant/insight", headers=headers)
print(f"Status: {insight_resp.status_code}")
print(json.dumps(insight_resp.json(), indent=2))

# ─────────────────────────────────────────────────────────────
# HISTORY
# ─────────────────────────────────────────────────────────────
print("\n[20] GET /history/deliveries")
hist_delivery_resp = client.get("/history/deliveries", headers=headers)
hist_data = hist_delivery_resp.json()
print(f"Status: {hist_delivery_resp.status_code}")
summary = hist_data.get("summary", {})
print(f"Summary: Total={summary.get('total')}, Delivered={summary.get('delivered')}, Delayed={summary.get('delayed')}, In Transit={summary.get('in_transit')}")
print("Recent deliveries:")
for delivery in hist_data.get("deliveries", [])[:3]:
    print(f"  - {delivery.get('shipmentId')}: {delivery.get('route')} [{delivery.get('status')}]")

print("\n[21] GET /history/transactions")
hist_txn_resp = client.get("/history/transactions", headers=headers)
hist_txn_data = hist_txn_resp.json()
print(f"Status: {hist_txn_resp.status_code}")
summary = hist_txn_data.get("summary", {})
print(f"Summary: Total={summary.get('total')}, Total Value=₹{summary.get('total_value'):,}")
print("Recent transactions:")
for txn in hist_txn_data.get("transactions", [])[:3]:
    print(f"  - {txn.get('txnId')}: ₹{txn.get('amount')} via {txn.get('method')} for {txn.get('shipmentId')}")

print("\n" + "=" * 80)
print("TEST RUN COMPLETE")
print("=" * 80)
