# Last Call 🛍️

> **Pakistan's food waste rescue platform.** Last Call connects restaurants, bakeries, and cafés with customers through discounted surplus food bags — saving food, saving money, saving the planet. Launching in Karachi, scaling across Pakistan.

---

## What is Last Call?

Every day, thousands of restaurants and bakeries across Pakistan throw away perfectly good food at closing time. Last Call solves this with a simple marketplace: partners list their surplus as discounted "magic bags", customers reserve and pick them up. Everyone wins — partners recover lost revenue, customers save up to 70%, and tonnes of food stay out of landfills.

**Similar to:** Too Good To Go (Europe) — built specifically for the Pakistani market with local payment gateways, WhatsApp-first notifications, and cash-first UX.

---

## Table of Contents

- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Real-Time Events](#real-time-events)
- [Payment Gateways](#payment-gateways)
- [Notifications](#notifications)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Apps](#running-the-apps)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Last Call Platform                        │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Customer App │ Partner App  │  Admin SPA   │  Backend API       │
│ React Native │ React Native │  Vite+React  │  Node.js+Express   │
│ Expo Router  │ Expo Router  │  Tailwind    │  TypeScript        │
│ TanStack Q.  │ TanStack Q.  │  TanStack Q. │  Prisma ORM        │
└──────────────┴──────────────┴──────────────┴────────────────────┤
                                               PostgreSQL + Redis  │
                                               Socket.io (RT)      │
                                               S3 (files)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
LastCall/
├── CLAUDE.md                         # LLM context file — read this first
├── turbo.json                        # Turborepo pipeline config
├── package.json                      # npm workspaces root
├── docker-compose.yml                # PostgreSQL 16 + Redis 7
│
├── packages/
│   └── shared/                       # @lastcall/shared — TypeScript types, enums & utils
│       └── src/index.ts              # UserRole, OrderStatus, PaymentMethod, SocketEvents…
│
├── backend/                          # Node.js + Express + TypeScript API
│   ├── prisma/
│   │   └── schema.prisma             # Single source of truth for database (19 tables)
│   └── src/
│       ├── index.ts                  # Express server bootstrap
│       ├── config/                   # db, redis, firebase, s3, socket
│       ├── middleware/               # auth, validate, errorHandler, rateLimit, upload, logger
│       ├── errors/                   # Custom error classes (AppError, NotFoundError…)
│       ├── api/v1/                   # Versioned API — router per resource
│       │   ├── auth/
│       │   ├── bags/
│       │   ├── orders/
│       │   ├── payments/
│       │   │   └── gateways/         # JazzCash, Easypaisa, SadaPay, NayaPay, Raast
│       │   ├── partners/
│       │   │   └── templates.router.ts  # Recurring bag template CRUD
│       │   ├── users/
│       │   ├── reviews/
│       │   ├── cities/
│       │   ├── notifications/
│       │   └── admin/
│       └── services/                 # whatsapp, fcm, email, payout+template (cron), socket
│
├── apps/
│   ├── customer/                     # React Native + Expo (customer-facing)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/           # Login with Firebase phone OTP
│   │       │   ├── (tabs)/           # Home, Explore, Orders, Profile
│   │       │   ├── bag/[id].tsx      # Bag detail + reserve + tappable address
│   │       │   └── order/[id].tsx    # Live order tracking (real-time)
│   │       └── components/
│   │           └── CountdownTimer.tsx  # Live "Closes in Xh Ym" on bag cards
│   │
│   ├── partner/                      # React Native + Expo (partner-facing)
│   │   └── src/app/
│   │       ├── (auth)/               # Login with Firebase phone OTP
│   │       ├── (tabs)/               # Dashboard, Bags, Orders, Analytics, Profile+Reviews
│   │       ├── bag/create.tsx        # Create new bag manually
│   │       ├── bag/templates.tsx     # Recurring bag templates (auto-publish daily)
│   │       └── onboarding/           # 3-step partner onboarding
│   │
│   └── admin/                        # Vite + React + Tailwind CSS (web)
│       └── src/
│           ├── pages/                # Dashboard, Partners, Orders, Bags, Users, Payouts, Impact
│           ├── components/           # Layout, shared UI
│           └── lib/                  # api, queryClient, auth (zustand)
│
└── docs/
    └── product/                      # Product documentation (PM-readable)
        ├── README.md                 # Index
        ├── 01-product-overview.md
        ├── 02-user-personas.md
        ├── 03-user-journeys.md
        ├── 04-feature-specs.md
        ├── 05-business-model.md
        ├── 06-go-to-market.md
        ├── 07-metrics-and-kpis.md
        └── 08-product-roadmap.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL 16 (via Prisma ORM) |
| **Cache** | Redis 7 (ioredis) |
| **Real-time** | Socket.io 4 (JWT-authenticated rooms) |
| **Authentication** | Firebase Auth (phone OTP) + JWT |
| **File Storage** | AWS S3 / Cloudflare R2 |
| **Customer App** | React Native, Expo SDK 51, Expo Router, TanStack Query, Zustand |
| **Partner App** | React Native, Expo SDK 51, Expo Router, TanStack Query, Zustand |
| **Admin Dashboard** | Vite, React 18, TypeScript, Tailwind CSS, TanStack Query |
| **WhatsApp** | Twilio Messaging API |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Email** | SendGrid |
| **Validation** | Zod |
| **Logging** | Pino (structured JSON + request IDs) |
| **Monorepo** | npm workspaces + Turborepo |
| **Containerization** | Docker Compose |

---

## Features

### Customer App
- Firebase phone OTP authentication (no password needed)
- Discover bags by area, category, price range
- **Live countdown timers** on every bag card ("Closes in 1h 23m", red under 60 min)
- Featured bags and partner listings
- Bag detail with **tappable address → Google Maps**, pickup time, CO₂ impact, tags
- Reserve & purchase (cash + 6 digital payment methods)
- Live order tracking with real-time status updates (Socket.io)
- 8-character cryptographically random pickup code
- Order history with review prompts
- Post-pickup ratings & reviews
- Favourite partners — **instant push notification when a favourited partner lists a bag**
- Personal food impact stats (meals saved, CO₂ prevented)
- **Shareable impact card** — one tap shares to WhatsApp/Instagram with referral code
- Promo code validation at checkout
- Saved payment methods
- Referral system (unique code → discount + reward)
- Push notifications + WhatsApp confirmations

### Partner App
- Firebase phone OTP authentication
- 3-step onboarding with document upload (CNIC, business license)
- Dashboard with today's stats: orders, revenue, active bags
- **"Waiting Customers" count** — see how many fans will be notified on next listing
- **Recurring bag templates** — create once, bags auto-publish every evening at 2 PM PKT
- Create and manage magic bags manually (price, pickup window, photos, tags)
- Real-time incoming order notifications (Socket.io)
- Order management: mark Ready → Verify Pickup (two-step code verification)
- Analytics tab: revenue charts, top-performing bags, order history
- **Partner reply to reviews** — respond to customer reviews publicly
- Payout history
- Partner profile management

### Admin Dashboard
- Email + password admin login
- KPI dashboard: GMV, orders, commission, pending approvals
- Partner management: approve/suspend, view CNIC/documents
- Order monitoring with status filters and pagination
- Bag inventory tracking across all partners
- Customer management
- Payout management: trigger weekly runs, mark as paid
- Platform impact: meals saved, CO₂ prevented
- City and area management (multi-city support)
- Promo code & banner management

### Platform Infrastructure
- Versioned REST API: `/api/v1/`
- Real-time events via Socket.io (authenticated rooms — JWT required to connect)
- Atomic bag reservation — race-condition safe (`updateMany WHERE quantityLeft >= qty`)
- Payment webhook signature verification (HMAC) + idempotency (Redis)
- Redis caching for bag listings, partner profiles, city data
- Per-endpoint rate limiting (Redis-backed)
- Weekly automated payout cron (Monday 9am PKT)
- **Daily template auto-publish cron** (2pm PKT) — creates bags from active templates
- Structured logging with Pino + request IDs
- AWS S3 / R2 for images and documents
- Zod-validated environment variables at startup

---

## Database Schema

19 tables, 9 enums. Full schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

### Enums
```
UserRole:      CUSTOMER | PARTNER | ADMIN
PartnerStatus: PENDING | APPROVED | SUSPENDED
BagStatus:     DRAFT | AVAILABLE | SOLD_OUT | CANCELLED | EXPIRED
OrderStatus:   CONFIRMED | READY | PICKED_UP | CANCELLED | REFUNDED
PaymentStatus: PENDING | PAID | FAILED | REFUNDED
PaymentMethod: CASH | JAZZCASH | EASYPAISA | SADAPAY | NAYAPAY | RAAST | BANK_TRANSFER
PayoutStatus:  PENDING | PROCESSING | COMPLETED | FAILED
DocumentType:  CNIC | BUSINESS_LICENSE | BANK_STATEMENT | UTILITY_BILL
NotifChannel:  PUSH | WHATSAPP | EMAIL | IN_APP
```

### Tables

| Table | Purpose |
|---|---|
| `users` | All platform users (customer/partner/admin) |
| `cities` | Multi-city support (Karachi, Lahore, Islamabad…) |
| `areas` | Neighbourhoods within cities |
| `partners` | Restaurant/café business profiles |
| `partner_documents` | Onboarding docs (CNIC, license) |
| `bags` | Magic bag listings |
| `bag_templates` | Recurring bag templates — auto-publish daily at 2 PM |
| `orders` | Customer orders (atomic with bag quantity) |
| `payment_transactions` | All payment gateway records |
| `saved_payment_methods` | Customer saved payment methods |
| `reviews` | Post-pickup ratings, comments, and partner replies |
| `favourites` | Customer → Partner favourites |
| `payouts` | Weekly partner settlements |
| `referrals` | Referral tracking |
| `promotions` | Promo codes and homepage banners |
| `promotion_uses` | Per-user promo code usage |
| `notifications` | In-app notification log |
| `impact_stats` | Daily platform-wide food waste impact |
| `audit_logs` | Admin action log (with before/after state) |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/firebase-login` | — | Exchange Firebase ID token → LastCall JWT |
| POST | `/auth/admin-login` | — | Email + password → Admin JWT |
| POST | `/auth/fcm-token` | JWT | Update FCM push token |
| POST | `/auth/logout` | JWT | Logout + clear FCM token |

### Bags
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/bags` | — | List available bags (filter: city, area, date, category, priceMax) |
| GET | `/bags/featured` | — | Featured bags |
| GET | `/bags/:id` | — | Single bag detail |
| POST | `/bags` | Partner | Create bag + notifies all fans via FCM |
| PATCH | `/bags/:id` | Partner/Admin | Update bag |
| DELETE | `/bags/:id` | Partner/Admin | Cancel bag |

### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Customer | Place order (atomic bag reservation, promo validation) |
| GET | `/orders` | JWT | Scoped list with pagination (customer=own, partner=business, admin=all) |
| GET | `/orders/:id` | JWT | Order detail |
| PATCH | `/orders/:id/status` | Partner | Advance status (CONFIRMED→READY→PICKED_UP only) |
| POST | `/orders/:id/verify-pickup` | Partner | Two-step cash verification |
| POST | `/orders/:id/cancel` | Customer/Admin | Cancel + initiate refund |

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/initiate` | Customer | Start digital payment |
| POST | `/payments/callback/jazzcash` | Webhook+HMAC | JazzCash result |
| POST | `/payments/callback/easypaisa` | Webhook+MD5 | Easypaisa result |
| POST | `/payments/callback/sadapay` | Webhook+HMAC | SadaPay result |
| POST | `/payments/callback/nayapay` | Webhook+HMAC | NayaPay result |
| POST | `/payments/callback/raast` | Webhook | Raast result |

### Partners
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/partners` | — | Approved partners (filter: city, area, category) |
| GET | `/partners/:id` | — | Partner detail + current bags |
| POST | `/partners/register` | JWT | Start onboarding |
| GET | `/partners/me` | Partner | Own profile |
| PATCH | `/partners/me` | Partner | Update profile |
| POST | `/partners/me/documents` | Partner | Upload onboarding document |
| GET | `/partners/me/stats` | Partner | Today's stats (incl. waitingCustomers, activeTemplates) |
| GET | `/partners/me/analytics` | Partner | Revenue + bag analytics |
| GET | `/partners/me/payouts` | Partner | Payout history |
| GET | `/partners/me/templates` | Partner | List bag templates |
| POST | `/partners/me/templates` | Partner | Create bag template |
| PATCH | `/partners/me/templates/:id` | Partner | Update bag template |
| PATCH | `/partners/me/templates/:id/toggle` | Partner | Activate / pause template |
| DELETE | `/partners/me/templates/:id` | Partner | Delete template |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Own profile |
| PATCH | `/users/me` | JWT | Update name/email |
| PATCH | `/users/me/avatar` | JWT | Upload avatar |
| GET | `/users/me/orders` | Customer | Order history |
| GET | `/users/me/favourites` | Customer | Favourite partners |
| POST | `/users/me/favourites/:id` | Customer | Add favourite |
| DELETE | `/users/me/favourites/:id` | Customer | Remove favourite |
| GET | `/users/me/impact` | JWT | Personal food impact stats |
| GET | `/users/me/saved-payment-methods` | JWT | Saved payment methods |
| POST | `/users/me/saved-payment-methods` | JWT | Save payment method |
| DELETE | `/users/me/saved-payment-methods/:id` | JWT | Remove saved method |

### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reviews` | Customer | Submit review (after PICKED_UP only) |
| GET | `/reviews/partner/:id` | — | Partner's reviews (includes partner replies) |
| PATCH | `/reviews/:id/reply` | Partner | Add/edit a reply to a customer review |
| DELETE | `/reviews/:id` | Admin | Hide review |

### Cities
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cities` | — | Active cities |
| GET | `/cities/:cityId/areas` | — | Areas in a city |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | JWT | User's notifications |
| PATCH | `/notifications/:id/read` | JWT | Mark read |
| PATCH | `/notifications/read-all` | JWT | Mark all read |

### Promotions
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/promotions/validate` | Customer | Validate promo code |
| GET | `/promotions/banners` | — | Active homepage banners |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Platform KPIs |
| GET | `/admin/partners` | Admin | All partners |
| PATCH | `/admin/partners/:id/status` | Admin | Approve/suspend (+ optional commissionPct) |
| GET | `/admin/partners/:id/documents` | Admin | View onboarding docs |
| PATCH | `/admin/partners/:id/documents/:docId` | Admin | Verify document |
| GET | `/admin/orders` | Admin | All orders (paginated) |
| GET | `/admin/users` | Admin | All customers |
| POST | `/admin/users/admin` | Admin | Create admin user |
| GET | `/admin/payouts` | Admin | All payouts |
| POST | `/admin/payouts/run` | Admin | Trigger payout run |
| PATCH | `/admin/payouts/:id` | Admin | Update payout status |
| POST | `/admin/promotions` | Admin | Create promo/banner |
| PATCH | `/admin/promotions/:id` | Admin | Update promo |
| GET | `/admin/impact` | Admin | Platform impact stats |
| POST | `/admin/cities` | Admin | Add city |
| PATCH | `/admin/cities/:id` | Admin | Update city |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | DB + Redis connection status |

---

## Real-Time Events

Socket.io requires a valid JWT in the handshake (`auth: { token }`). Clients can only join rooms they are authorised for.

| Room | Who Joins |
|---|---|
| `user:{userId}` | Customer — auto-joined on connect |
| `partner:{partnerId}` | Partner — auto-joined on connect |
| `city:{cityId}` | All users in a city (for new bag announcements) |
| `admin` | Admin dashboard |

| Event | Direction | Payload |
|---|---|---|
| `order:status_changed` | Server → Customer | `{ orderId, status, updatedAt }` |
| `order:new` | Server → Partner | `{ orderId, bagTitle, customerName, pickupCode }` |
| `bag:sold_out` | Server → All | `{ bagId }` |
| `bag:new_listing` | Server → City | `{ bagId, title, price, partnerId, partnerName }` |
| `partner:approved` | Server → Partner | `{ partnerId }` |
| `notification:new` | Server → User | `{ title, body, payload }` |

---

## Payment Gateways

All webhooks verify the gateway's HMAC signature before processing. Idempotency is enforced via Redis (24h TTL per `txnRef`). Payment amount is validated against the order total before marking as PAID.

| Gateway | Signature | Notes |
|---|---|---|
| **JazzCash** | HMAC-SHA256 (sorted keys) | Most popular in Pakistan |
| **Easypaisa** | MD5 hash | Telco-based wallet |
| **SadaPay** | HMAC-SHA256 header | Neobank, Stripe-compatible API |
| **NayaPay** | HMAC-SHA256 header | Neobank, hosted checkout |
| **Raast** | — | SBP instant rail, manual IBAN |
| **Bank Transfer** | — | Manual IBFT, fallback |
| **Cash** | — | Verified at pickup via pickup code |

### Commission Model
- Last Call takes **20%** per order (configurable per partner via `commissionPct`)
- Partners receive **80%**
- Cash: partner collects full amount; Last Call's 20% deducted from Monday payout
- Digital: Last Call holds full amount; partner receives 80% every Monday

---

## Notifications

| Event | Push (FCM) | WhatsApp | Email |
|---|---|---|---|
| Bag listed by favourited partner | ✓ (fan multicast) | — | — |
| Order placed (customer) | ✓ | ✓ | ✓ (receipt) |
| Order placed (partner) | ✓ | ✓ | — |
| Order ready for pickup | ✓ | ✓ | — |
| Order picked up | ✓ | ✓ | ✓ |
| Order cancelled | ✓ | ✓ | ✓ |
| Partner approved | ✓ | ✓ | ✓ |
| Weekly payout sent | — | ✓ | ✓ |
| New review received | ✓ | — | — |
| Referral used | ✓ | — | — |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- Expo CLI: `npm install -g expo-cli`
- A Firebase project with phone authentication enabled

### 1. Clone & Install

```bash
git clone https://github.com/Ammarhere/LastCall.git
cd LastCall
npm install --legacy-peer-deps
```

### 2. Start Database & Redis

**With Docker:**
```bash
docker-compose up -d
```

**Without Docker (macOS via Homebrew):**
```bash
# Install if needed
git clone https://github.com/Homebrew/brew ~/.homebrew
eval "$(~/.homebrew/bin/brew shellenv)"
brew install postgresql@16 redis

# Start services
pg_ctl -D ~/Library/Application\ Support/Homebrew/var/postgresql@16 start
redis-server --daemonize yes

# Create DB
createdb lastcall
psql postgres -c "CREATE USER lastcall WITH PASSWORD 'lastcall_dev_pw' CREATEDB;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE lastcall TO lastcall;"
```

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
# Minimum required: DATABASE_URL, REDIS_URL, JWT_SECRET
# Firebase vars optional in dev — backend starts in stub mode without them

# Mobile apps — use your Mac's local IP (not localhost)
echo "EXPO_PUBLIC_API_URL=http://$(ipconfig getifaddr en0):4000" > apps/customer/.env
echo "EXPO_PUBLIC_SOCKET_URL=http://$(ipconfig getifaddr en0):4000" >> apps/customer/.env
cp apps/customer/.env apps/partner/.env
```

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Create First Admin

```bash
# Start backend first, then:
curl -X POST http://localhost:4000/api/v1/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lastcall.pk","password":"Admin@123456"}'
```

Or create directly in the DB (see CLAUDE.md for the full psql command).

### 6. Run Everything

```bash
# Backend (port 4000):
npm run backend

# Admin dashboard (port 5173) — new tab:
npm run admin

# Customer app (Expo Go) — new tab:
cd apps/customer && npx expo start --tunnel --clear

# Partner app (Expo Go) — new tab:
cd apps/partner && npx expo start --tunnel --clear
```

### 7. Login (Development Mode)

Firebase phone auth requires a native development build. For **Expo Go testing**, use the built-in dev login:
- Enter any phone number
- Enter OTP: `123456`
- You're logged in

> This dev login is blocked in production (`NODE_ENV=production`).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✓ | `development` / `production` / `test` |
| `PORT` | ✓ | API server port (default: 4000) |
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `REDIS_URL` | ✓ | Redis connection string |
| `JWT_SECRET` | ✓ | Min 32 chars random string |
| `JWT_EXPIRES_IN` | ✓ | Token expiry (e.g. `7d`) |
| `FIREBASE_PROJECT_ID` | — | Firebase project ID (optional in dev) |
| `FIREBASE_PRIVATE_KEY` | — | Firebase Admin private key |
| `FIREBASE_CLIENT_EMAIL` | — | Firebase Admin client email |
| `AWS_ACCESS_KEY_ID` | — | S3/R2 access key |
| `AWS_SECRET_ACCESS_KEY` | — | S3/R2 secret |
| `AWS_BUCKET_NAME` | — | S3 bucket name |
| `AWS_REGION` | — | S3 region (default: `ap-south-1`) |
| `TWILIO_ACCOUNT_SID` | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | — | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | — | WhatsApp sender number |
| `SENDGRID_API_KEY` | — | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | — | Sender email address |
| `JAZZCASH_MERCHANT_ID` | — | JazzCash merchant ID |
| `JAZZCASH_PASSWORD` | — | JazzCash password |
| `JAZZCASH_INTEGRITY_SALT` | — | JazzCash HMAC salt |
| `EASYPAISA_STORE_ID` | — | Easypaisa store ID |
| `EASYPAISA_HASH_KEY` | — | Easypaisa hash key |
| `SADAPAY_SECRET_KEY` | — | SadaPay secret key |
| `SADAPAY_WEBHOOK_SECRET` | — | SadaPay webhook HMAC secret |
| `NAYAPAY_API_KEY` | — | NayaPay API key |
| `NAYAPAY_WEBHOOK_SECRET` | — | NayaPay webhook HMAC secret |
| `RAAST_API_KEY` | — | Raast API key |
| `FRONTEND_URL` | ✓ | Customer app URL (CORS whitelist) |
| `ADMIN_URL` | ✓ | Admin dashboard URL (CORS whitelist) |

### Mobile Apps (`.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:4000`) |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.io server URL |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |

### Admin Dashboard (`apps/admin/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |

---

## Running the Apps

### Backend (Port 4000)
```bash
cd backend && npm run dev
# tsx watch — hot reloads on TypeScript changes
```

### Admin Dashboard (Port 5173)
```bash
cd apps/admin && npm run dev
# Vite dev server with HMR
```

### Customer App
```bash
cd apps/customer && npx expo start
# Scan QR with Expo Go
```

### Partner App
```bash
cd apps/partner && npx expo start
```

---

## Project Background

Pakistan wastes approximately **40% of its food supply** annually. Last Call bridges restaurants and consumers with a win-win marketplace:

- **Restaurants** sell surplus bags at 50–70% off instead of throwing food away
- **Customers** eat well for a fraction of the normal price
- **Last Call** takes 20% commission — only charged on successful sales
- **The planet** benefits (2.5 kg CO₂ saved per meal rescued)

Launch city: **Karachi**. Next: Lahore, Islamabad.

---

*Built with ❤️ for Pakistan*
