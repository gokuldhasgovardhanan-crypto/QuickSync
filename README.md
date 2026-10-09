# QuickSync

> **"Reliable Real-Time Quick-Commerce Data Infrastructure"**

QuickSync is a production-grade, enterprise SaaS platform designed to retrieve, validate, monitor, and analyze real-time quick-commerce data directly from live provider APIs across **BlinkIt**, **Zepto**, **Swiggy (Instamart)**, **BigBasket (BB Now)**, **DMart Ready**, **JioMart**, and **Minutes**.

---

## ⚡ Zero-Mock Live Data Guarantee

QuickSync enforces a strict **No-Mock-Data Policy**:
- ❌ **No fake datasets**
- ❌ **No random product generators**
- ❌ **No simulated prices or fake inventory**
- ❌ **No hardcoded dashboard metrics**
- ✅ **100% of KPIs and metrics derive directly from live API responses stored in PostgreSQL snapshots.**
- ✅ If the live API is unreachable or rate-limited, QuickSync displays **"DATA SOURCE OFFLINE"** with exact HTTP diagnostics and latency, never fabricating numbers.

Every metric and product card includes a **"View Source"** audit button displaying the request ID, upstream provider endpoint, latency in milliseconds, timestamp, and the raw verified JSON response.

---

## 🏛 Architecture & Data Flow

```
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  React 18 + TS  │ ◄───► │  FastAPI Async  │ ◄───► │   QuickCommerce API    │
│  (Vite + WS)    │  REST │  Engine (Py3)   │ HTTP  │ api.quickcommerceapi.com
└─────────────────┘  /WS  └────────┬────────┘       └────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐
       │     Data Validation    │    │  Circuit Breaker &     │
       │     & Normalization    │    │  Exponential Backoff   │
       └────────────┬───────────┘    └────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │   PostgreSQL Snapshots │
       │   (quicksync_db)       │
       └────────────────────────┘
```

---

## 🚀 Key Platform Features

1. **Enterprise Split-Screen Login (`/login`)**:
   - Modern enterprise SaaS design with live data pillar visualizations.
   - JWT Access & Refresh Token rotation.
   - Role-Based Access Control (**ADMIN**, **OPERATOR**, **ANALYST**).
   - Instant Demo Admin mode (retaining 100% live API connectivity).

2. **Live Commerce Dashboard (`/dashboard`)**:
   - Dynamically calculated KPI cards: Live Data Sources, Active Platforms, Products Fetched, Stock Breakdown, Average Delivery ETA, Reliability Score.
   - Quick Search Widget with location selector.
   - Real-time activity feed streaming WebSocket events.

3. **Live Product Search (`/live-search`)**:
   - Location-aware search (Bangalore, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai, or custom entered coordinates).
   - Multi-platform filtering (All, BlinkIt, Zepto, Swiggy, BigBasket, DMart, JioMart, Minutes).
   - Live pricing, stock units, SLA, and product deeplinks.

4. **Cross-Platform Comparison (`/comparison`)**:
   - Side-by-side real-time price, stock availability, and delivery SLA comparison across all platforms for identical products.

5. **Price Monitoring & Delta Engine (`/prices`)**:
   - Immutable time-series price snapshots.
   - Tracks previous price, current price, price difference, and % fluctuation.

6. **Darkstore Inventory Telemetry (`/inventory`)**:
   - Real stock count signals (`IN_STOCK` >5, `LOW_STOCK` 1–5, `OUT_OF_STOCK` 0) linked to darkstore merchant IDs.

7. **Delivery ETA & SLAs (`/delivery`)**:
   - Live fulfillment SLA tracking per darkstore.

8. **Data Validation Engine (`/data-quality`)**:
   - Completeness audits, type checking, duplicate detection, and schema validation.

9. **Observability & Health Telemetry (`/monitoring`)**:
   - Latency distributions, request volume, error rates, timeout counts (504), rate limit alerts (429), and platform circuit breaker states.

10. **Automated Incident & Alert Manager (`/alerts`)**:
    - Dispatches alerts on `PRICE_CHANGE`, `OUT_OF_STOCK`, `BACK_IN_STOCK`, `API_FAILURE`, `DATA_STALE`, and `RATE_LIMIT`.

11. **Live Ingestion Controller (`/sync`)**:
    - Manual "SYNC NOW" triggers and detailed execution history with duration in milliseconds and valid vs invalid record counts.

12. **Data Sources Console (`/sources`)**:
    - Per-platform live connection status, latency, and real-time connectivity testing.

13. **API & Secrets Configuration (`/settings/api`)**:
    - Manage `QUICKCOMMERCE_API_KEY` (masked securely as `qc_live_************`), default coordinates, polling intervals, timeouts, and retries.

14. **User Governance & Audit Logs (`/admin`)**:
    - Provision operators and analysts, and inspect system audit trails.

15. **Hackathon Demonstration Walkthrough (`/demo`)**:
    - Interactive 6-step pipeline visualization (**Authenticate ➔ Retrieve ➔ Validate ➔ Store ➔ Monitor ➔ Analyze**).

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, TanStack Query, Axios, React Router, WebSockets.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Alembic, httpx (async HTTP), WebSockets, bcrypt, JWT (python-jose).
- **Database**: PostgreSQL (`quicksync_db`) with SQLite local zero-setup fallback.
- **DevOps**: Docker, Docker Compose, Nginx.
- **Testing**: Pytest, Pytest-Asyncio.

---

## 🔑 Authentication & Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Demo Admin** | `demo@quicksync.app` | `QuickSyncDemo2026!` | Full Governance, API Config, Sync, Audits |
| **System Admin** | `admin@quicksync.app` | `Admin123!` | Full Governance & User Management |
| **Platform Operator** | `operator@quicksync.app` | `Operator123!` | Run Sync, Manage Alerts, Monitor Sources |
| **Data Analyst** | `analyst@quicksync.app` | `Analyst123!` | Read-Only Dashboard, Search, Analytics |

---

## ⚡ Quick Start with Docker Compose

To start the entire production-grade SaaS application (Frontend, Backend, PostgreSQL, Redis) with a single command:

```bash
docker compose up --build
```

- **Frontend Dashboard**: `http://localhost:3000` (or `http://localhost:5173` in local dev)
- **FastAPI OpenAPI Swagger Docs**: `http://localhost:8000/docs`

---

## 💻 Local Development Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Initialize database tables and seed baseline users & platforms
python -m app.init_db

# Run FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

```bash
pytest tests -v
```

All 12 test suites will run:
- Authentication & JWT token tests
- Data validation engine rules (negative price rejection, missing fields)
- Normalization tests
- Circuit breaker state machine tests (CLOSED ➔ OPEN ➔ HALF_OPEN ➔ CLOSED)
- Database snapshot creation and dynamic KPI calculation tests
- Live API connection test (`test_live_api_connection`, skips gracefully if key is omitted without fabricating fake data)

---

## 📡 Core API Endpoints

### Authentication
- `POST /api/auth/login` — Authenticate and receive JWT access/refresh tokens
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Revoke active session
- `GET /api/auth/me` — Current authenticated user profile

### Live Data Stream
- `GET /api/live/search?q=Milk&platform=ALL&lat=12.9716&lon=77.5946` — Live product search
- `GET /api/live/item/{platform}/{item_id}` — Real-time product details
- `GET /api/live/eta/{platform}` — Live fulfillment SLA
- `POST /api/live/refresh` — Instant live refresh

### Snapshots & Catalogs
- `GET /api/products` — Audited product catalog
- `GET /api/products/{id}` — Time-series price and stock history
- `GET /api/prices` — Real price fluctuations and discount spreads
- `GET /api/inventory` — Darkstore stock signals
- `GET /api/delivery` — Platform fulfillment SLAs
- `GET /api/comparison?q=Milk` — Cross-platform pricing comparison

### Operations & Observability
- `GET /api/monitoring/summary` — Dynamically computed Dashboard KPIs
- `GET /api/monitoring/health` — Latency histograms and success rates
- `GET /api/data-quality` — Schema completeness and quality score
- `GET /api/alerts` — Incident feed
- `POST /api/alerts/{id}/resolve` — Resolve active alert
- `GET /api/sync/history` — Ingestion run logs
- `POST /api/sync/run` — Trigger live sync run
- `GET /api/sources` — Platform connection health
- `POST /api/sources/test` — Live provider ping test
- `GET /api/traceability/{request_id}` — View Source audit lineage
- `GET /api/settings` & `PUT /api/settings` — Configure API secrets and parameters
- `WS /api/ws/live` — Real-time WebSocket event broadcaster

---

## 🛡 License & Compliance

QuickSync connects strictly to authorized API endpoints using `X-API-Key` headers. It does not perform web scraping, CAPTCHA bypasses, OTP circumvention, or unauthorized proxying.
