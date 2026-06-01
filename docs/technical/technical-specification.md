# Last Call — Technical Specification Document

**Version:** 1.0
**Last Updated:** June 2026
**Status:** Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Repository Structure](#4-repository-structure)
5. [Database Design](#5-database-design)
6. [API Specification](#6-api-specification)
7. [Authentication & Security](#7-authentication--security)
8. [Real-Time System](#8-real-time-system)
9. [File Storage](#9-file-storage)
10. [Notifications](#10-notifications)
11. [Payment System](#11-payment-system)
12. [Background Jobs](#12-background-jobs)
13. [Deployment & Infrastructure](#13-deployment--infrastructure)
14. [Environment Configuration](#14-environment-configuration)
15. [Data Flow Diagrams](#15-data-flow-diagrams)
16. [Error Handling](#16-error-handling)
17. [Caching Strategy](#17-caching-strategy)
18. [Security Model](#18-security-model)

---

## 1. System Overview

Last Call is a **multi-sided marketplace** with three distinct user types:

| Actor | App | Purpose |
|---|---|---|
| Customer | Last Call (iOS/Android) | Discover and reserve discounted food bags |
| Partner | Last Call Partner (iOS/Android) | List surplus food, manage orders, track earnings |
| Admin | Last Call Admin (Web) | Approve partners, monitor platform, manage payouts |

**Core transaction flow:**
```
Partner lists bag → Customer reserves → Customer pays →
Partner prepares → Customer picks up → Both notified →
Commission recorded → Partner paid weekly
```

---

## 2. Tech Stack

### Backend
| Component | Technology | Version | Reason |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Stable, excellent ecosystem |
| Framework | Express | 4.18 | Lightweight, well-understood |
| Language | TypeScript | 5.3 | Type safety, better DX |
| ORM | Prisma | 5.22 | Type-safe DB access, migration management |
| Validation | Zod | 3.22 | TypeScript-native, colocated schemas |
| Logging | Pino | 8.18 | Structured JSON, high performance |
| Process runner | tsx | 4.7 | Hot reload without compile step |

### Database & Cache
| Component | Technology | Provider | Notes |
|---|---|---|---|
| Primary DB | PostgreSQL 16 | Neon (Singapore) | Serverless, free 0.5GB |
| Cache / Rate limiting | Redis 8 | Upstash (Singapore) | Serverless, TLS required (`rediss://`) |

### Mobile Apps (Customer + Partner)
| Component | Technology | Version |
|---|---|---|
| Framework | React Native | 0.81.5 |
| Toolkit | Expo SDK | 54 |
| Navigation | Expo Router | 6.x (file-based) |
| Server state | TanStack Query | 5.17 |
| Local state | Zustand | 4.4 |
| Language | TypeScript | 5.3 |
| HTTP client | Axios | 1.6 |
| Secure storage | expo-secure-store | 15.x |
| Real-time | socket.io-client | 4.7 |

### Admin Dashboard
| Component | Technology |
|---|---|
| Build tool | Vite 5 |
| UI framework | React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| State | Zustand + TanStack Query |
| Routing | React Router v6 |
| Charts | Recharts |

### Infrastructure & Services
| Service | Provider | Purpose | Cost |
|---|---|---|---|
| API hosting | Render (free tier) | Backend deployment | $0 |
| Database | Neon | PostgreSQL | $0 |
| Cache | Upstash | Redis | $0 |
| File storage | Cloudinary | Photos, documents | $0 (25GB) |
| Email | Resend | Transactional email | $0 (3K/month) |
| Push notifications | Firebase FCM | Mobile push | $0 |
| Phone auth | Firebase Auth | SMS OTP | $0 (10K/month) |
| Keep-alive | UptimeRobot | Prevent Render sleep | $0 |
| CI/CD | GitHub → Render | Auto-deploy on push | $0 |

---

## 3. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                  │
├──────────────────┬──────────────────┬──────────────────────────────-┤
│  Customer App    │   Partner App    │        Admin Dashboard         │
│  React Native    │  React Native    │       Vite + React             │
│  Expo SDK 54     │  Expo SDK 54     │       Tailwind CSS             │
│  Expo Router 6   │  Expo Router 6   │       React Router v6          │
│  TanStack Query  │  TanStack Query  │       TanStack Query           │
└────────┬─────────┴────────┬─────────┴───────────────┬───────────────┘
         │                  │                          │
         │   HTTPS + WSS    │                          │   HTTPS
         └──────────────────┼──────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      Backend API (Render)                            │
│                  https://lastcall-api.onrender.com                   │
├─────────────────────────────────────────────────────────────────────┤
│  Express + TypeScript                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐                  │
│  │  REST API   │  │  Socket.io   │  │  Cron Jobs │                  │
│  │  /api/v1/   │  │  (real-time) │  │  (payouts, │                  │
│  │             │  │              │  │  templates)│                  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘                  │
│         │                │                │                          │
│  ┌──────▼────────────────▼────────────────▼──────┐                  │
│  │                   Prisma ORM                   │                  │
│  └──────────────────────┬─────────────────────────┘                  │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼────────┐
   │  PostgreSQL  │ │   Redis     │ │  Cloudinary  │
   │  (Neon)      │ │  (Upstash)  │ │  (Storage)   │
   │  Singapore   │ │  Singapore  │ │  (Global CDN)│
   └─────────────┘ └─────────────┘ └──────────────┘
```

### Request Lifecycle

```
Client Request
    │
    ▼
Express Router
    │
    ▼
Rate Limiter (Redis-backed, per IP per endpoint)
    │
    ▼
Auth Middleware (JWT verification)
    │
    ▼
Zod Validation (request body/query)
    │
    ▼
Route Handler
    │
    ├──► Prisma ORM ──► PostgreSQL (Neon)
    ├──► Redis (cache read/write)
    ├──► Cloudinary (file upload)
    ├──► Socket.io (real-time emit)
    └──► Services (FCM, Resend, WhatsApp)
    │
    ▼
JSON Response
```

### Clean Architecture Pattern

Each resource follows this layered structure:

```
api/v1/{resource}/
  └── {resource}.router.ts   ← HTTP routing + request/response handling
                               (validation, auth, calls service logic)
services/
  └── {service}.service.ts   ← External integrations (FCM, Resend, etc.)
config/
  └── {config}.ts            ← Service initialization (db, redis, etc.)
```

---

## 4. Repository Structure

```
LastCall/                          # Monorepo root
├── Dockerfile                     # Production container (node:20-slim)
├── .dockerignore                  # Excludes mobile apps from Docker build
├── turbo.json                     # Turborepo pipeline config
├── package.json                   # npm workspaces root + React 19 override
├── CLAUDE.md                      # LLM context file
├── README.md                      # Developer setup guide
│
├── packages/
│   └── shared/                    # @lastcall/shared
│       └── src/index.ts           # Enums, types, utils (shared across all apps)
│
├── backend/                       # Node.js API
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema — source of truth
│   │   └── migrations/            # Versioned SQL migrations
│   └── src/
│       ├── index.ts               # Server bootstrap
│       ├── config/                # db, redis, firebase, socket
│       ├── middleware/            # auth, validate, errorHandler, rateLimit, upload
│       ├── errors/                # Custom error classes
│       ├── api/v1/                # All route handlers
│       │   ├── auth/              # Login, dev-login, FCM token
│       │   ├── bags/              # CRUD + fan notifications
│       │   ├── orders/            # Place, track, verify, cancel
│       │   ├── payments/          # Initiate + webhook callbacks
│       │   │   └── gateways/      # JazzCash, Easypaisa, SadaPay, NayaPay, Raast
│       │   ├── partners/          # Profile, stats, analytics, templates
│       │   ├── users/             # Profile, favourites, impact, saved methods
│       │   ├── reviews/           # Submit, list, partner reply
│       │   ├── cities/            # City + area listing
│       │   ├── notifications/     # In-app notification centre
│       │   └── admin/             # Dashboard, partner mgmt, payouts, promos
│       └── services/
│           ├── fcm.service.ts     # Firebase push notifications
│           ├── email.service.ts   # Resend transactional email
│           ├── whatsapp.service.ts # Twilio WhatsApp (disabled until configured)
│           ├── socket.service.ts  # Socket.io emit helpers
│           └── payout.service.ts  # Weekly payout + template cron jobs
│
├── apps/
│   ├── customer/                  # Customer iOS/Android app
│   │   └── src/
│   │       ├── app/               # Expo Router file-based screens
│   │       │   ├── (auth)/        # Login screen
│   │       │   ├── (tabs)/        # Home, Explore, Orders, Profile
│   │       │   ├── bag/[id].tsx   # Bag detail + reserve
│   │       │   └── order/[id].tsx # Live order tracking
│   │       ├── components/        # CountdownTimer, etc.
│   │       ├── hooks/             # useSocket
│   │       ├── store/             # authStore (Zustand)
│   │       └── services/          # api.ts (Axios instance)
│   │
│   ├── partner/                   # Partner iOS/Android app
│   │   └── src/app/
│   │       ├── (auth)/            # Login screen
│   │       ├── (tabs)/            # Dashboard, Bags, Orders, Analytics, Profile
│   │       ├── bag/create.tsx     # Manual bag creation
│   │       ├── bag/templates.tsx  # Recurring bag templates
│   │       └── onboarding/        # 3-step partner onboarding
│   │
│   └── admin/                     # Web admin dashboard
│       └── src/
│           ├── pages/             # Dashboard, Partners, Orders, Bags, Users, Payouts, Impact
│           ├── components/        # Layout (sidebar nav)
│           └── lib/               # api.ts, auth.ts, queryClient.ts
│
└── docs/
    ├── product/                   # Business/PM documentation
    └── technical/                 # This document + future ADRs
```

---

## 5. Database Design

### Overview
- **19 tables**, 9 enums
- All IDs are UUID v4
- All timestamps use UTC
- Soft deletes via `isVisible`/`isActive` flags (no hard deletes on user data)
- Prisma migrations are versioned in `backend/prisma/migrations/`

### Entity Relationship Summary

```
User ──────── Partner ──────── BagTemplate
  │              │                  │
  │              └──── Bag ─────────┘ (auto-published)
  │                     │
  │              ┌──────┘
  ├──── Order ───┤
  │      │       └──── PaymentTransaction
  │      └──── Review ──── (partnerReply)
  │
  ├──── Favourite ──── Partner
  ├──── Notification
  ├──── SavedPaymentMethod
  └──── Referral
```

### Key Tables

#### `users`
```
id              UUID PK
firebase_uid    String UNIQUE     — Firebase Auth UID
phone           String UNIQUE     — Pakistani format +92xxxxxxxxxx
email           String?
role            CUSTOMER|PARTNER|ADMIN
password_hash   String?           — Admin only (bcrypt 14 rounds)
fcm_token       String?           — Firebase push token
referral_code   String UNIQUE     — 8-char hex
referred_by_id  UUID?             — Self-referential FK
is_active       Boolean
```

#### `bags`
```
id              UUID PK
partner_id      UUID FK
city_id         UUID FK
area_id         UUID? FK
title           String
original_price  Float
discounted_price Float
quantity_total  Int
quantity_left   Int               — decremented atomically on order
pickup_date     Date
pickup_start    Time
pickup_end      Time
status          DRAFT|AVAILABLE|SOLD_OUT|CANCELLED|EXPIRED
co2_saved_kg    Float             — quantityTotal × 2.5
meals_saved     Int               — = quantityTotal
```

#### `orders`
```
id              UUID PK
bag_id          UUID FK
user_id         UUID FK
partner_id      UUID FK
quantity        Int
unit_price      Float             — locked at order time
total_amount    Float
commission_amt  Float             — totalAmount × commissionPct/100
partner_payout  Float             — totalAmount - commissionAmt
payment_method  Enum
payment_status  PENDING|PAID|FAILED|REFUNDED
order_status    CONFIRMED|READY|PICKED_UP|CANCELLED|REFUNDED
pickup_code     String UNIQUE     — 8-char crypto random
```

#### `bag_templates`
```
id              UUID PK
partner_id      UUID FK
title, description, original_price, discounted_price, quantity_total
pickup_start    String            — "HH:MM"
pickup_end      String            — "HH:MM"
active_days     String[]          — ["MON","TUE","WED","THU","FRI"]
is_active       Boolean
```

### Indexes
```sql
-- Bag discovery (most common query)
bags(status, pickup_date)
bags(city_id, area_id, status)
bags(partner_id)

-- Order queries
orders(user_id, created_at)
orders(partner_id, created_at)
orders(order_status)
orders(pickup_code)          — unique, used for verification

-- Notifications
notifications(user_id, is_read)

-- Payouts
payouts(partner_id, period_start)

-- Templates
bag_templates(partner_id, is_active)
```

---

## 6. API Specification

**Base URL:** `https://lastcall-api.onrender.com/api/v1`
**Format:** JSON
**Auth:** Bearer JWT in `Authorization` header

### Response Format
```json
// Success
{ "success": true, "data": {...} }

// Paginated
{ "success": true, "data": [...], "total": 100, "page": 1, "limit": 20, "hasMore": true }

// Error
{ "success": false, "error": "Human readable message", "code": "ERROR_CODE" }
```

### Error Codes
| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated but wrong role/ownership |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Request body failed Zod validation |
| `CONFLICT` | 409 | Unique constraint violation |
| `RATE_LIMITED` | 429 | Too many requests |
| `BAG_UNAVAILABLE` | 400 | Bag sold out or partner suspended |
| `INVALID_TRANSITION` | 400 | Invalid order status change |
| `ALREADY_PICKED_UP` | 400 | Order already complete |
| `PROMO_EXHAUSTED` | 400 | Promo code used up |
| `PROMO_EXPIRED` | 400 | Promo code past valid date |

### Rate Limits
| Endpoint Group | Limit |
|---|---|
| Auth endpoints | 10 req/min |
| Payment initiate | 20 req/min |
| General API | 100 req/min |

### Key Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/firebase-login` | — | Firebase ID token → JWT |
| POST | `/auth/admin-login` | — | Email + password → JWT |
| POST | `/auth/dev-login` | — | Dev bypass (requires `ALLOW_DEV_LOGIN=true`) |
| GET | `/bags` | — | Browse bags (filter: city, area, date, category, priceMax) |
| POST | `/bags` | Partner | Create bag + notify fans |
| POST | `/orders` | Customer | Place order (atomic reservation) |
| PATCH | `/orders/:id/status` | Partner | CONFIRMED→READY→PICKED_UP |
| POST | `/orders/:id/verify-pickup` | Partner | Verify pickup code + confirm cash |
| POST | `/payments/initiate` | Customer | Start digital payment |
| POST | `/payments/callback/:gateway` | Webhook | Payment result from gateway |
| GET | `/partners/me/stats` | Partner | Dashboard stats incl. waiting customers |
| GET | `/partners/me/templates` | Partner | List recurring bag templates |
| PATCH | `/reviews/:id/reply` | Partner | Reply to customer review |
| GET | `/admin/stats` | Admin | Platform KPIs |
| PATCH | `/admin/partners/:id/status` | Admin | Approve/suspend partner |

*Full API reference in [README.md](../../README.md)*

---

## 7. Authentication & Security

### Auth Flow

```
Mobile (Phone OTP):
  Firebase Auth → phone OTP → getIdToken()
  → POST /auth/firebase-login { idToken }
  → Server: firebaseAdmin.verifyIdToken(idToken)
  → Create/find user in DB
  → Sign JWT { userId, role, partnerId }
  → Store JWT in expo-secure-store (encrypted on device)

Admin (Email/Password):
  POST /auth/admin-login { email, password }
  → bcrypt.compare(password, passwordHash) [14 rounds]
  → Sign JWT { userId, role }

JWT Payload:
  { userId: string, role: UserRole, partnerId?: string, iat, exp }
  Expiry: 7 days
  Secret: min 32 chars random string
```

### Current Auth Status
- **Production:** Dev bypass active (`ALLOW_DEV_LOGIN=true` on Render)
  - Any phone number + OTP `123456` logs in
  - Remove `ALLOW_DEV_LOGIN` once EAS build with real Firebase is set up
- **Full phone auth:** Requires EAS native build — `@react-native-firebase/auth` cannot run in Expo Go

### Security Measures
- **JWT** — short expiry (7d), invalidated on logout via FCM token clear
- **Zod validation** — all request bodies and env vars validated at startup
- **Rate limiting** — Redis-backed per-IP per-endpoint limits
- **Payment webhooks** — HMAC signature verified before processing
- **Webhook idempotency** — Redis key `webhook:{gateway}:{txnRef}` (24h TTL)
- **Payment amount validation** — gateway amount must match order total ±0.01
- **Atomic bag reservation** — `updateMany WHERE quantityLeft >= qty` prevents overselling
- **Socket.io auth** — JWT verified on connection via `io.use()` middleware
- **Room access control** — clients can only join own rooms (`user:id`, `partner:id`)
- **Bcrypt** — 14 rounds for admin passwords
- **Pickup code** — `crypto.randomBytes(5).toString('hex')` (8 chars, cryptographically random)
- **Timing-safe comparison** — `crypto.timingSafeEqual()` for pickup code verification
- **Status transitions enforced** — CONFIRMED→READY→PICKED_UP only (no skipping)
- **Partner category whitelist** — validated against enum, not free-text

---

## 8. Real-Time System

### Technology: Socket.io 4.x

### Authentication
Every socket connection requires a valid JWT in the handshake:
```typescript
socket.handshake.auth.token  // verified via io.use() middleware
```
Unauthenticated connections are rejected immediately.

### Room Structure
| Room | Joined By | Receives |
|---|---|---|
| `user:{userId}` | Customer on connect | Order status, bag new listing, notifications |
| `partner:{partnerId}` | Partner on connect | New orders, partner approved |
| `city:{cityId}` | All users in a city | New bag listings from nearby partners |
| `admin` | Admin users | Partner applications, alerts |

### Events Reference
| Event | Direction | Payload | Trigger |
|---|---|---|---|
| `order:status_changed` | Server → Customer | `{orderId, status, updatedAt}` | Partner marks ready/picked up |
| `order:new` | Server → Partner | `{orderId, bagTitle, customerName, pickupCode}` | Customer places order |
| `bag:sold_out` | Server → All | `{bagId}` | Last bag reserved |
| `bag:new_listing` | Server → City | `{bagId, title, price, partnerId, partnerName}` | Partner creates a bag |
| `partner:approved` | Server → Partner | `{partnerId}` | Admin approves partner |
| `notification:new` | Server → User | `{title, body, payload}` | Any notification created |

---

## 9. File Storage

### Technology: Cloudinary (free 25GB)

### Upload Flow
```
Client → POST /api/v1/bags (multipart/form-data)
    → multer (memoryStorage) — file in req.file.buffer
    → uploadToCloudinary(buffer, folder)
    → Cloudinary upload_stream
    → Returns secure_url
    → Saved to DB as photoUrl/logoUrl/etc.
```

### Folder Structure in Cloudinary
```
lastcall/
├── bags/           — bag photos
├── partners/
│   ├── logos/      — partner logo images
│   └── covers/     — partner cover images
├── documents/      — CNIC, business license PDFs
└── avatars/        — user profile photos
```

### Optimizations
- Images: `quality: auto, fetch_format: auto` — auto-compresses and converts to WebP
- PDFs: `resource_type: raw` — stored as-is
- All files served via Cloudinary's global CDN

---

## 10. Notifications

### Channels
| Channel | Provider | Status |
|---|---|---|
| Push (FCM) | Firebase Cloud Messaging | ✅ Active |
| Email | Resend | ✅ Active (sends to verified domain only until domain verified) |
| WhatsApp | Twilio | ⏳ Disabled (enabled when `TWILIO_*` env vars set) |
| In-app | DB (`notifications` table) | ✅ Active |

### Trigger Map
| Event | FCM | Email | WhatsApp | In-app |
|---|---|---|---|---|
| Bag listed (to fans) | ✅ Multicast | — | — | ✅ |
| Order placed (customer) | ✅ | ✅ Receipt | ✅ | ✅ |
| Order placed (partner) | ✅ | — | ✅ | — |
| Order ready | ✅ | — | ✅ | ✅ |
| Order picked up | ✅ | ✅ | ✅ | ✅ |
| Order cancelled | ✅ | ✅ | ✅ | ✅ |
| Partner approved | ✅ | ✅ | ✅ | — |
| Weekly payout | — | ✅ | ✅ | — |

---

## 11. Payment System

### Supported Gateways
| Gateway | Method | Signature | File |
|---|---|---|---|
| JazzCash | HMAC-SHA256 form POST | `pp_SecureHash` | `gateways/jazzcash.ts` |
| Easypaisa | MD5 form redirect | `encryptedHashRequest` | `gateways/easypaisa.ts` |
| SadaPay | Stripe-compatible REST | `sadapay-signature` header | `gateways/sadapay.ts` |
| NayaPay | Hosted checkout | `x-nayapay-signature` header | `gateways/nayapay.ts` |
| Raast | Manual IBAN transfer | — | `gateways/raast.ts` |
| Cash | Physical at pickup | Pickup code verification | — |

### Payment Flow
```
Phase 1 — Initiation:
  POST /payments/initiate { orderId, method }
  → Create PaymentTransaction (status: PENDING, txnRef: LC-XXXXXXXX)
  → Build gateway-specific payload
  → Return payload to client

Phase 2 — Callback (gateway → server):
  POST /payments/callback/{gateway}
  → Verify HMAC signature
  → Check Redis idempotency key (24h TTL)
  → Validate: gateway amount ≈ transaction amount (±0.01)
  → Update PaymentTransaction status
  → If PAID: update Order.paymentStatus = PAID

Cash flow:
  → Order created with paymentStatus: PENDING
  → Partner verifies pickup code (verify-pickup endpoint)
  → Partner confirms cash received
  → paymentStatus → PAID
```

### Commission Calculation
```typescript
commissionPct   = partner.commissionPct  // default 20%, locked at order creation
commissionAmt   = totalAmount × (commissionPct / 100)
partnerPayout   = totalAmount - commissionAmt

// Example: Rs. 150 bag, 20% commission
commissionAmt   = 150 × 0.20 = Rs. 30
partnerPayout   = 150 - 30   = Rs. 120
```

---

## 12. Background Jobs

### Weekly Payout Cron
```
Schedule:  Every Monday 9:00 AM PKT (04:00 UTC)
Function:  startPayoutCron() in payout.service.ts

For each APPROVED partner:
  1. Sum all PICKED_UP orders from previous Mon–Sun
  2. gross    = sum(order.totalAmount)
  3. commission = sum(order.commissionAmt)
  4. net      = sum(order.partnerPayoutAmt)
  5. Create Payout record (status: PENDING)
  6. Send WhatsApp + Email to partner
```

### Daily Template Cron
```
Schedule:  Every day 2:00 PM PKT (09:00 UTC)
Function:  startTemplateCron() in payout.service.ts

For each active BagTemplate where today ∈ activeDays:
  1. Check if bag already exists today for this partner
  2. If not: create Bag from template (status: AVAILABLE)
  3. Fan notifications fire automatically from bags.router
```

---

## 13. Deployment & Infrastructure

### Deployment Pipeline
```
Developer pushes to main branch
    │
    ▼
GitHub (source of truth)
    │
    ▼ (webhook trigger)
Render Build
    │
    ├── Docker build (node:20-slim)
    │   ├── npm install --legacy-peer-deps
    │   ├── npx prisma generate
    │   └── Start: tsx backend/src/index.ts
    │
    ▼
Render Deploy (Singapore region preferred, Frankfurt actual)
    │
    ▼
Live at: https://lastcall-api.onrender.com
```

### Dockerfile Strategy
- Base: `node:20-slim` (Debian) — required for Prisma's OpenSSL dependency
- No TypeScript compile step — runs via `tsx` directly (faster builds, less memory)
- `.dockerignore` excludes: `apps/` (mobile), `docs/`, `node_modules/`, `.env`

### Keep-Alive
Render free tier suspends after 15 min of inactivity.
UptimeRobot pings `GET /health` every 5 minutes → server never sleeps.

### Scaling Path
All config is environment-variable driven — scaling requires only env var changes:

| Current (Free) | Scaled (Paid) | Change Required |
|---|---|---|
| Render free | AWS ECS Fargate | New `fly.toml` or ECS task def |
| Neon free (0.5GB) | AWS RDS PostgreSQL | Change `DATABASE_URL` |
| Upstash free | AWS ElastiCache | Change `REDIS_URL` |
| Cloudinary free | AWS S3 | Update `upload.ts` (20 lines) |

---

## 14. Environment Configuration

All environment variables validated by Zod at startup (`backend/src/config/env.ts`). Server exits with clear error if required vars are missing.

### Required Variables
```
NODE_ENV          development | production | test
PORT              Default: 4000
DATABASE_URL      PostgreSQL connection string
REDIS_URL         Redis URL (use rediss:// for TLS/Upstash)
JWT_SECRET        Min 32 chars
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY   Single line with \n escape sequences
FIREBASE_CLIENT_EMAIL
```

### Optional Variables (Feature Flags)
```
ALLOW_DEV_LOGIN=true     Enable /auth/dev-login bypass (dev/staging only)
CLOUDINARY_CLOUD_NAME    File uploads enabled when set
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY           Email enabled when set
RESEND_FROM_EMAIL
TWILIO_ACCOUNT_SID       WhatsApp enabled when set
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
JAZZCASH_MERCHANT_ID     JazzCash payments enabled when set
EASYPAISA_STORE_ID       Easypaisa payments enabled when set
```

---

## 15. Data Flow Diagrams

### Order Placement Flow
```
Customer taps "Reserve Bag"
    │
    ▼
POST /api/v1/orders
    │
    ├── Validate: bag status = AVAILABLE, partner status = APPROVED
    ├── Validate: quantityLeft >= quantity  (atomic updateMany)
    ├── Decrement quantityLeft
    ├── If quantityLeft = 0 → bag status = SOLD_OUT → emit bag:sold_out
    │
    ├── Apply promo code (if any):
    │   ├── Check isActive, validFrom/validUntil
    │   ├── Check maxUses not exceeded
    │   ├── Check user hasn't used this promo before
    │   └── Calculate discount
    │
    ├── Calculate: totalAmount, commissionAmt, partnerPayoutAmt
    ├── Generate: pickupCode (crypto.randomBytes(5).hex)
    ├── Create Order record
    │
    ├── If CASH: order confirmed immediately
    └── If DIGITAL: client calls /payments/initiate next
    │
    ├── Emit: order:new → partner room (Socket.io)
    ├── Push: FCM to customer + partner
    ├── WhatsApp: to customer + partner (if configured)
    └── Invalidate: Redis cache for bag

Response: { order, pickupCode }
```

### Fan Notification Flow
```
Partner creates bag (POST /api/v1/bags)
    │
    ▼
Bag saved to DB
    │
    ├── Query: Favourite WHERE partnerId = partner.id
    │   (get all users who favourited this partner)
    │
    ├── Get: FCM tokens for all those users
    │
    ├── FCM multicast → all fan devices
    │   "🛍️ Ali's Bakery just listed bags for tonight!"
    │
    ├── Create: Notification records for each fan (in-app)
    │
    └── Socket.io emit: bag:new_listing → city:{cityId} room
        (updates home screen for anyone browsing)
```

---

## 16. Error Handling

### Error Class Hierarchy
```typescript
AppError (base)
├── NotFoundError       (404, NOT_FOUND)
├── UnauthorizedError   (401, UNAUTHORIZED)
├── ForbiddenError      (403, FORBIDDEN)
├── ValidationError     (422, VALIDATION_ERROR)
└── ConflictError       (409, CONFLICT)
```

### Global Error Handler (`middleware/errorHandler.ts`)
```
AppError          → { success: false, error: message, code }
Prisma P2002      → 409 Conflict (unique constraint)
Prisma P2025      → 404 Not Found
Unhandled Error   → 500 (message hidden in production)
```

### Frontend Error Handling
- TanStack Query: `retry: 1-2` on network errors
- Axios interceptor: clears token on 401, redirects to login
- Socket.io: reconnects automatically (5 attempts, 2s delay)

---

## 17. Caching Strategy

All caching via ioredis. Keys use colon-separated namespacing.

| Key Pattern | Content | TTL | Invalidated By |
|---|---|---|---|
| `bag:{id}` | Single bag detail | 5 min | Bag update/cancel |
| `bags:list:{city}:{area}:{date}` | Bag listing | 2 min | Any bag update in city |
| `partner:{id}` | Partner profile | 10 min | Profile update |
| `cities:all` | City list | 24 hours | City add/update |
| `rate:{ip}:{path}` | Request count | 60 sec | Auto-expires |
| `webhook:{gw}:{txnRef}` | Idempotency flag | 24 hours | Never (expires naturally) |

---

## 18. Security Model

### Threat Model
| Threat | Mitigation |
|---|---|
| Fake payment webhooks | HMAC signature verification per gateway |
| Double payment processing | Redis idempotency key per txnRef |
| Bag overbooking | Atomic `updateMany` with DB-level condition |
| Pickup code brute force | 8-char crypto-random code + timing-safe compare |
| Unauthorized socket rooms | JWT auth on connect + room allowlist per role |
| SQL injection | Prisma ORM (parameterized queries only) |
| XSS | React Native (no HTML rendering) |
| Rate abuse | Per-endpoint Redis rate limits |
| Credential exposure | All secrets in env vars, gitignored `.env` files |
| Fake promo usage | Per-user deduplication in `promotion_uses` table |
| Status manipulation | Server-side transition validation (no client trust) |

### PCI Compliance Notes
- Last Call does **not** store card numbers — all card payments via hosted gateways
- Payment callbacks are processed server-side, not client-side
- Gateway payloads in DB are sanitized (secrets stripped before storage)

---

*This document covers the technical implementation as of June 2026. See [docs/product/](../product/) for business/product documentation.*
