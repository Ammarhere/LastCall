# LastCall 🎒

> Pakistan's first surplus food rescue platform — connecting restaurants, bakeries, and cafés with customers through discounted "magic bags" of unsold food. Launching in Karachi.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Backend](#backend)
- [Customer App](#customer-app)
- [Partner App](#partner-app)
- [Admin Dashboard](#admin-dashboard)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Project Overview

LastCall is a **monorepo** containing three applications and one shared backend:

| App | Platform | Audience | Tech Stack |
|-----|----------|----------|------------|
| **Customer App** | iOS + Android | End users buying bags | React Native (Expo) |
| **Partner App** | iOS + Android | Restaurant/cafe owners | React Native (Expo) |
| **Admin Dashboard** | Web browser | LastCall ops team | Vanilla HTML/CSS/JS |
| **Backend API** | Server | All apps | Node.js + Express + PostgreSQL |

---

## Repository Structure

```
lastcall/
│
├── package.json               # Root workspace config — runs all apps via npm scripts
├── docker-compose.yml         # PostgreSQL 16 + Redis 7 local dev containers
├── .gitignore                 # Excludes node_modules, .env, uploads, build artifacts
│
├── backend/                   # Express REST API
│   ├── package.json           # Backend dependencies (pg, express, firebase-admin, jwt…)
│   ├── .env.example           # Copy to .env and fill in secrets
│   └── src/
│       ├── index.js           # App entry point — mounts all routes, starts server on :4000
│       │
│       ├── config/
│       │   ├── db.js          # PostgreSQL connection pool (pg.Pool)
│       │   ├── redis.js       # Redis client connection
│       │   └── firebase.js    # Firebase Admin SDK init (for phone auth + FCM push)
│       │
│       ├── middleware/
│       │   ├── auth.js        # verifyJWT, verifyFirebase, requireRole(...roles)
│       │   ├── validate.js    # express-validator error handler middleware
│       │   └── upload.js      # Multer config — image uploads, 5MB limit, saved to /uploads
│       │
│       ├── models/
│       │   └── schema.sql     # Full DB schema — all tables, enums, indexes (run once via Docker)
│       │
│       ├── routes/
│       │   ├── auth.js        # POST /api/auth/firebase-login, /admin-login, /refresh, PATCH /fcm-token
│       │   ├── bags.js        # GET /api/bags, GET /api/bags/:id, POST, PATCH, DELETE
│       │   ├── orders.js      # POST /api/orders, GET list, GET/:id, PATCH/:id/status, POST/:id/verify-pickup
│       │   ├── partners.js    # GET /api/partners, /me, /:id, POST /register, PATCH /me, GET /me/stats
│       │   ├── users.js       # GET/PATCH /api/users/me, GET/POST/DELETE /favourites, GET /orders
│       │   └── admin.js       # GET /stats, /partners, /orders, /bags, /users — PATCH partner status — POST seed-admin
│       │
│       └── services/
│           └── notification.js # sendNotification(token, title, body, data) + sendMulticast(tokens…)
│
├── apps/
│   │
│   ├── customer/              # React Native — customer-facing mobile app
│   │   ├── package.json       # Expo + React Navigation + Zustand + Axios + Firebase
│   │   ├── app.json           # Expo config (name: "LastCall", bundle: pk.lastcall.customer)
│   │   ├── .env.example       # EXPO_PUBLIC_API_URL, EXPO_PUBLIC_FIREBASE_* keys
│   │   ├── App.js             # Root component — NavigationContainer + SafeAreaProvider
│   │   └── src/
│   │       ├── services/
│   │       │   └── api.js     # Axios instance — baseURL from env, JWT interceptor, 401 auto-logout
│   │       │
│   │       ├── store/
│   │       │   └── authStore.js  # Zustand store — { user, token, setAuth(), logout(), setLoading() }
│   │       │
│   │       ├── navigation/
│   │       │   ├── RootNavigator.js  # Auth gate — shows Login or Tab navigator based on token
│   │       │   └── TabNavigator.js   # Bottom tabs: Home | Orders | Profile + BagDetail stack
│   │       │
│   │       └── screens/
│   │           ├── LoginScreen.js      # Phone number input → Firebase OTP → JWT → Zustand
│   │           ├── HomeScreen.js       # Browse bags by area/category, search, favourites toggle
│   │           ├── BagDetailScreen.js  # Bag info, partner details, Place Order button
│   │           ├── OrdersScreen.js     # Customer order history with status badges
│   │           └── ProfileScreen.js    # User info, favourites count, sign out
│   │
│   ├── partner/               # React Native — restaurant/partner-facing mobile app
│   │   ├── package.json       # Same Expo stack as customer
│   │   ├── app.json           # Expo config (name: "LastCall Partner", bundle: pk.lastcall.partner)
│   │   ├── .env.example       # Same env vars as customer
│   │   ├── App.js             # Root component
│   │   └── src/
│   │       ├── services/
│   │       │   └── api.js     # Axios instance — same pattern as customer, JWT auto-attach
│   │       │
│   │       ├── store/
│   │       │   └── authStore.js  # Zustand store — identical shape to customer store
│   │       │
│   │       ├── navigation/
│   │       │   ├── RootNavigator.js  # Auth gate — Login or Tab navigator
│   │       │   └── TabNavigator.js   # Bottom tabs: Dashboard | Bags (stack) | Orders | Profile
│   │       │
│   │       └── screens/
│   │           ├── LoginScreen.js      # Phone auth — same Firebase flow as customer
│   │           ├── DashboardScreen.js  # Today's stats (orders, earnings, active bags) + recent orders + quick actions
│   │           ├── BagsScreen.js       # List own bags with status/qty, cancel action, pull-to-refresh
│   │           ├── CreateBagScreen.js  # Form: title, description, prices, qty, pickup time, date, tags — validates before POST
│   │           ├── OrdersScreen.js     # Today's orders with advance-status buttons (confirmed→ready→picked_up)
│   │           └── ProfileScreen.js    # Partner info, commission rate, payout schedule, sign out
│   │
│   └── admin/
│       └── lastcall-admin.html  # Single-file admin dashboard — open directly in browser
│                                # Sections: Login, Dashboard KPIs, Partners (approve/suspend),
│                                # Orders (filter by status), Today's Bags, Customers
│                                # Connects to backend API via fetch() with JWT Bearer token
```

---

## Backend

**Entry point:** `backend/src/index.js`
**Port:** `4000`

### Route Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/firebase-login` | None | Exchange Firebase ID token → LastCall JWT |
| POST | `/api/auth/admin-login` | None | Email + password → JWT (admin only) |
| POST | `/api/auth/refresh` | None | Refresh expired JWT |
| PATCH | `/api/auth/fcm-token` | JWT | Save device push token |
| GET | `/api/bags` | None | Browse available bags (filter: area, category, date) |
| GET | `/api/bags/:id` | None | Single bag detail |
| POST | `/api/bags` | Partner JWT | Create new magic bag |
| PATCH | `/api/bags/:id` | Partner/Admin JWT | Update bag quantity or status |
| DELETE | `/api/bags/:id` | Partner/Admin JWT | Cancel a bag |
| POST | `/api/orders` | Customer JWT | Place an order (atomic with bag decrement) |
| GET | `/api/orders` | JWT | List orders (scoped by role) |
| GET | `/api/orders/:id` | JWT | Single order detail |
| PATCH | `/api/orders/:id/status` | Partner/Admin JWT | Advance: confirmed→ready→picked_up |
| POST | `/api/orders/:id/verify-pickup` | Partner JWT | Verify pickup code |
| GET | `/api/partners` | None | Public approved partner list |
| GET | `/api/partners/me` | Partner JWT | Own partner profile |
| GET | `/api/partners/me/stats` | Partner JWT | Today orders, total earnings, active bags |
| GET | `/api/partners/:id` | None | Single partner + available bags |
| POST | `/api/partners/register` | Partner JWT | Submit partner registration |
| PATCH | `/api/partners/me` | Partner JWT | Update own partner profile |
| GET | `/api/users/me` | JWT | Own user profile |
| PATCH | `/api/users/me` | JWT | Update name, email, avatar |
| GET | `/api/users/favourites` | Customer JWT | List favourite partners |
| POST | `/api/users/favourites/:id` | Customer JWT | Add favourite |
| DELETE | `/api/users/favourites/:id` | Customer JWT | Remove favourite |
| GET | `/api/admin/stats` | Admin JWT | Dashboard KPIs |
| GET | `/api/admin/partners` | Admin JWT | All partners with revenue stats |
| PATCH | `/api/admin/partners/:id/status` | Admin JWT | Approve / suspend partner |
| GET | `/api/admin/orders` | Admin JWT | All orders paginated |
| GET | `/api/admin/bags` | Admin JWT | All bags for a date |
| GET | `/api/admin/users` | Admin JWT | All customers |
| POST | `/api/admin/seed-admin` | Secret | One-time admin user creation |
| GET | `/health` | None | Health check — DB connection status |

---

## Customer App

**Tech:** React Native + Expo SDK 52 + React Navigation 6 + Zustand + Axios + Firebase Auth

### User Flow
```
Launch → LoginScreen (phone OTP) → HomeScreen (browse bags by area)
       → BagDetailScreen (view + order) → OrdersScreen (track status)
       → ProfileScreen (account + favourites)
```

### State Management
- `authStore.js` — global auth state via Zustand: `{ user, token, setAuth, logout }`
- `api.js` — Axios instance with auto-attach JWT and 401→logout interceptor

---

## Partner App

**Tech:** Same stack as Customer App

### User Flow
```
Launch → LoginScreen (phone OTP) → DashboardScreen (today's summary)
       → BagsScreen → CreateBagScreen (new bag form)
       → OrdersScreen (advance order status + pickup code)
       → ProfileScreen (settings + sign out)
```

### Key Logic
- `CreateBagScreen` validates: discounted price < original price, time format HH:MM, date format YYYY-MM-DD
- `OrdersScreen` allows advancing: `confirmed → ready → picked_up` with confirmation alert
- `DashboardScreen` fetches `/api/partners/me/stats` + `/api/orders` in parallel

---

## Admin Dashboard

**File:** `apps/admin/lastcall-admin.html`
**How to use:** Open the HTML file directly in any browser. No server needed.

### Features
- **Login** — email + password → calls `/api/auth/admin-login`
- **Dashboard** — 7 KPI cards (today orders, total revenue, partners, customers, pending approvals, bags)
- **Partners** — filter by status, search, approve/suspend with one click
- **Orders** — filter by status, search by partner/customer name, full order table
- **Bags** — today's bags across all partners with inventory status
- **Customers** — all registered customers with order count

---

## Database Schema

**File:** `backend/src/models/schema.sql`

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | All app users | `firebase_uid`, `phone`, `role` (customer/partner/admin) |
| `partners` | Partner profiles | `business_name`, `area`, `status` (pending/approved/suspended), `commission_pct` |
| `bags` | Magic bag listings | `partner_id`, `discounted_price`, `quantity_left`, `pickup_date`, `status` |
| `orders` | Customer orders | `pickup_code`, `order_status`, `total_amount`, `partner_payout` |
| `favourites` | Customer favourites | `(user_id, partner_id)` composite PK |

### ENUMs
- `user_role`: `customer`, `partner`, `admin`
- `partner_status`: `pending`, `approved`, `suspended`
- `bag_status`: `available`, `sold_out`, `cancelled`
- `order_status`: `confirmed`, `ready`, `picked_up`, `cancelled`
- `payment_status`: `pending`, `paid`, `refunded`

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Docker Desktop
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_ORG/lastcall.git
cd lastcall
npm install
```

### 2. Start Databases
```bash
docker compose up -d
# PostgreSQL on :5432  |  Redis on :6379
# Schema auto-runs from schema.sql on first boot
```

### 3. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET, Firebase credentials
cp apps/customer/.env.example apps/customer/.env
cp apps/partner/.env.example  apps/partner/.env
```

### 4. Create First Admin User
```bash
curl -X POST http://localhost:4000/api/admin/seed-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lastcall.pk",
    "password": "Admin123!",
    "name": "LastCall Admin",
    "secret": "YOUR_JWT_SECRET_VALUE"
  }'
```

### 5. Run All Apps
Open **4 separate terminals:**

```bash
# Terminal 1 — Backend API
npm run backend:dev
# → http://localhost:4000

# Terminal 2 — Admin Dashboard
# Open apps/admin/lastcall-admin.html in your browser

# Terminal 3 — Customer App
npm run customer
# → Scan QR code with Expo Go

# Terminal 4 — Partner App
npm run partner
# → Scan QR code with Expo Go
```

### 6. Verify Backend
```bash
curl http://localhost:4000/health
# → {"status":"ok","db":"connected","ts":"..."}
```

---

## Environment Variables

### `backend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://lastcall:pw@localhost:5432/lastcall` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `a_long_random_string_here` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `lastcall-karachi` |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | `firebase-adminsdk@project.iam.gserviceaccount.com` |

### `apps/customer/.env` and `apps/partner/.env`

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend URL (`http://localhost:4000` for dev) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |

---

## Branch Strategy

```
main        ← production-ready code only
develop     ← integration branch (all features merge here first)
feature/*   ← e.g. feature/bag-listing, feature/otp-auth
fix/*       ← e.g. fix/order-status-bug
release/*   ← e.g. release/v1.0.0
```

---

## Commission Model

- LastCall takes **10%** of each order total
- Partners receive **90%** (`partner_payout` column in orders table)
- Payouts processed every Monday via bank transfer
- Commission rate is configurable per partner (`commission_pct` in partners table)

---

*Built for Karachi 🇵🇰 — scaling to all of Pakistan.*
