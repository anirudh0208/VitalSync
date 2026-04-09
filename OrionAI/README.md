# OrionAI — FastAPI Backend

## Quick Start

```bash
# 1. Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the development server
uvicorn main:app --reload --port 8000
```

The server starts at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

## Environment Variables (production)
Create a `.env` file or set these in your deployment environment:

| Variable          | Default                              | Description                      |
|-------------------|--------------------------------------|----------------------------------|
| `SECRET_KEY`      | `orionai-secret-key-change-in-prod`  | JWT signing key — **change this**|
| `DATABASE_URL`    | `sqlite:///./orionai.db`             | Any SQLAlchemy-compatible URL    |
| `ACCESS_TOKEN_TTL`| `60`                                 | JWT expiry in minutes            |

---

## API Reference

### Auth
| Method | Endpoint        | Auth required | Description             |
|--------|-----------------|---------------|-------------------------|
| POST   | `/auth/signup`  | ✗             | Register a new user     |
| POST   | `/auth/login`   | ✗             | Login → JWT token       |
| GET    | `/auth/me`      | ✔             | Current user profile    |

**Signup body**
```json
{
  "first_name":   "Rohan",
  "last_name":    "Mehta",
  "email":        "rohan@acmelogistics.in",
  "organisation": "Acme Logistics Pvt. Ltd.",
  "password":     "StrongPass@123"
}
```

**Login** uses OAuth2 form fields: `username` (email) + `password`.  
Returns `{ "access_token": "...", "token_type": "bearer", "user": {...} }`.

Add the token to every protected call:
```
Authorization: Bearer <access_token>
```

---

### Dashboard
| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | `/dashboard/stats` | KPIs: shipments, revenue, savings  |

---

### Shipment Tracking
| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/shipments`                     | List all shipments (filter by `?status=transit`) |
| GET    | `/shipments/{id}`                | Single shipment detail             |
| PATCH  | `/shipments/{id}/status`         | Update status                      |

---

### Route Optimiser
| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | `/routes`         | All available routes with congestion info|
| POST   | `/routes/query`   | Query a specific origin→destination      |
| GET    | `/routes/cities`  | All depot cities with coordinates        |

**POST /routes/query body**
```json
{ "origin": "Bengaluru (Whitefield)", "destination": "Mysuru (City Centre)" }
```

---

### Cost Analysis
| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/cost/calculate`   | Calculate trip cost & ETA      |
| GET    | `/cost/couriers`    | Courier rate slabs             |
| GET    | `/cost/vehicles`    | Vehicle types & rates          |

**POST /cost/calculate body**
```json
{
  "origin":      "Bengaluru (Whitefield)",
  "destination": "Hubli",
  "vehicle_id":  "truck",
  "weight_kg":   250
}
```

---

### Alerts
| Method | Endpoint   | Description                                     |
|--------|------------|-------------------------------------------------|
| GET    | `/alerts`  | All alerts (filter by `?type=critical/warning`) |

---

### AI Assistant
| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| POST   | `/assistant/query`     | Natural-language logistics query         |
| GET    | `/assistant/insight`   | One-line AI insight for the dashboard    |

**POST /assistant/query body**
```json
{ "query": "Which areas have the highest delays right now?" }
```

---

### History
| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/history/deliveries`     | Delivery log + summary stats         |
| GET    | `/history/transactions`   | Transaction log + total value        |

---

### Health
| Method | Endpoint   | Description           |
|--------|------------|-----------------------|
| GET    | `/health`  | Service health check  |

---

## Connecting the Frontend

In `app.js` / `orionai-auth.html`, replace direct data references with `fetch` calls:

```js
// Example: load shipments on page open
const res  = await fetch("http://localhost:8000/shipments", {
  headers: { "Authorization": `Bearer ${localStorage.getItem("orionai_token")}` }
});
const data = await res.json();
```

For login / signup, post to `/auth/login` or `/auth/signup` and store the returned `access_token` in `localStorage` or a secure cookie.

---

## Production Checklist
- [ ] Replace `SECRET_KEY` with a cryptographically random value
- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Restrict `allow_origins` in CORS middleware to your domain
- [ ] Run behind HTTPS (nginx / Caddy / AWS ALB)
- [ ] Use `gunicorn -k uvicorn.workers.UvicornWorker` for multi-worker production
