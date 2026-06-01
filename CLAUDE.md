# Last Call — LLM Context File

> Read this file first. It contains everything needed to work on this codebase without asking the developer for background.

---

## Standing Instruction — Keep All Docs in Sync

**After completing ANY change to this codebase, always update every affected document before the task is considered done.**

The documents that must stay current are:

| Document | Update when... |
|---|---|
| `CLAUDE.md` (this file) | Architecture, tech stack, DB schema, API routes, feature status, or conventions change |
| `README.md` | Repo structure, setup steps, env variables, API reference, or run commands change |
| `docs/product/04-feature-specs.md` | A feature is added, changed, or removed |
| `docs/product/08-product-roadmap.md` | Something moves from "upcoming" to "done", or new work is added to the backlog |
| `docs/product/05-business-model.md` | Commission rate, payout logic, or pricing changes |
| `docs/product/03-user-journeys.md` | A user flow changes significantly |
| `docs/product/01-product-overview.md` | Product scope, vision, or positioning changes |
| `docs/product/07-metrics-and-kpis.md` | New metrics added or targets updated |

**Minimum always-touched on any code change:** `CLAUDE.md` + `README.md` + the most relevant product doc.

Never mark a task complete if the docs still describe the old state.

---

## What is Last Call?

Last Call is a **food waste rescue marketplace for Pakistan** — functionally equivalent to [Too Good To Go](https://toogoodtogo.com) (Europe's leading food waste app), but built specifically for the Pakistani market.

**The core loop:**
1. Restaurants, bakeries, and cafés have unsold food at closing time
2. They list it as a discounted "magic bag" on Last Call (e.g. Rs. 500 worth of food for Rs. 150)
3. Customers browse, reserve, pay, and pick up before closing
4. Last Call takes 20% commission; partner keeps 80%

**Why Pakistan specifically:**
- Pakistan wastes ~40% of its food supply annually (one of the world's highest rates)
- Millions cannot afford restaurant prices, but can afford 50–70% discounted bags
- Local payment rails (JazzCash, Easypaisa, Raast) are essential — no Stripe
- WhatsApp is the primary communication channel, not email
- Phone OTP (not email/password) is the expected auth flow for consumers

**Current launch city:** Karachi. Next: Lahore, Islamabad.

---

## Project Status

This codebase was **fully re-architected in May 2026** from a prototype (vanilla JS, raw SQL) into a production-ready monorepo. The rewrite introduced:
- TypeScript across backend and all apps
- Prisma ORM (replaces raw SQL `schema.sql`)
- Expo Router (replaces hand-wired React Navigation)
- TanStack Query (replaces manual useState data fetching)
- Vite + React admin SPA (replaces single-file HTML dashboard)
- Socket.io for real-time order updates
- Clean architecture on the backend (router → service pattern)
- 23 new features vs the original prototype

---

## Monorepo Structure

```
LastCall/
├── turbo.json                        # Turborepo pipeline
├── package.json                      # npm workspaces root
├── docker-compose.yml                # PostgreSQL 16 + Redis 7
├── CLAUDE.md                         # ← you are here
├── README.md                         # user-facing documentation
│
├── packages/
│   └── shared/                       # @lastcall/shared
│       └── src/index.ts              # Shared enums, types, utils
│
├── backend/                          # Node.js API
│   ├── prisma/schema.prisma          # Database schema (source of truth)
│   └── src/
│       ├── index.ts                  # Express server bootstrap
│       ├── config/                   # db, redis, firebase, s3, socket
│       ├── middleware/               # auth, validate, errorHandler, rateLimit, upload, logger
│       ├── errors/AppError.ts        # Custom error classes
│       ├── api/v1/                   # All routes (versioned)
│       │   ├── auth/
│       │   ├── bags/
│       │   ├── orders/
│       │   ├── payments/
│       │   │   └── gateways/         # jazzcash, easypaisa, sadapay, nayapay, raast
│       │   ├── partners/
│       │   ├── users/
│       │   ├── reviews/
│       │   ├── cities/
│       │   ├── notifications/
│       │   └── admin/
│       └── services/                 # whatsapp, fcm, email, payout (cron), socket
│
├── apps/
│   ├── customer/                     # React Native — end customers
│   │   └── src/app/
│   │       ├── (auth)/login.tsx      # Firebase phone OTP
│   │       ├── (tabs)/               # Home, Explore, Orders, Profile
│   │       ├── bag/[id].tsx          # Bag detail + reserve
│   │       ├── order/[id].tsx        # Live order tracking
│   │       └── partner/[id].tsx      # Partner page + reviews
│   │
│   ├── partner/                      # React Native — restaurant/café owners
│   │   └── src/app/
│   │       ├── (auth)/login.tsx
│   │       ├── (tabs)/               # Dashboard, Bags, Orders, Analytics, Profile
│   │       ├── bag/create.tsx
│   │       └── onboarding/           # 3-step: business → documents → pending
│   │
│   └── admin/                        # Vite + React — internal operations team
│       └── src/
│           ├── pages/                # Dashboard, Partners, Orders, Bags, Users, Payouts, Impact
│           └── components/Layout.tsx # Sidebar nav
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend language | TypeScript (Node.js 20+) | `tsx` for dev, `tsc` for prod |
| HTTP framework | Express 4 | Not Fastify, not NestJS |
| ORM | Prisma 5 | `backend/prisma/schema.prisma` is the DB source of truth |
| Database | PostgreSQL 16 | Run via Docker |
| Cache | Redis 7 (ioredis) | Run via Docker |
| Real-time | Socket.io 4 | Order status, new orders, bag sold-out events |
| Auth | Firebase Auth (phone OTP) + JWT | Firebase verifies OTP → backend issues JWT |
| File storage | AWS S3 / Cloudflare R2 | Bag photos, partner logos, CNIC uploads |
| Validation | Zod | All request bodies and env vars |
| Logging | Pino | Structured JSON, request IDs |
| Email | SendGrid | Order receipts, payout reports, partner approvals |
| WhatsApp | Twilio | Order confirmations — primary notification channel |
| Push notifications | Firebase FCM | Secondary notification channel |
| Customer app | React Native + Expo SDK 51 | Expo Router (file-based navigation) |
| Partner app | React Native + Expo SDK 51 | Expo Router, react-native-chart-kit for analytics |
| Admin dashboard | Vite + React 18 + Tailwind CSS | SPA, React Router v6, Recharts |
| Monorepo tooling | Turborepo + npm workspaces | `@lastcall/shared` package |
| Containerization | Docker Compose | postgres + redis only; backend runs locally |

---

## Key Architectural Decisions

### 1. Single versioned API
All endpoints live at `/api/v1/`. Never add unversioned routes.

### 2. Backend file layout per resource
Each resource (`bags`, `orders`, etc.) has its own folder under `backend/src/api/v1/` with a single `*.router.ts` file. No separate controller/repository files were created — logic lives in the router file for now. If a resource grows large, split into `router → service → repository`.

### 3. Prisma is the only way to touch the database
No raw SQL queries. No `pg` pool. All DB access goes through `prisma` client imported from `backend/src/config/db.ts`.

### 4. Environment variables are Zod-validated at startup
`backend/src/config/env.ts` validates all env vars with Zod on boot. If a required var is missing, the server exits with a clear error message. Never access `process.env` directly elsewhere — always import `env` from this file.

### 5. Error handling is centralised
Throw `AppError` subclasses (`NotFoundError`, `UnauthorizedError`, etc.) anywhere in route handlers. The global `errorHandler` middleware in `backend/src/middleware/errorHandler.ts` catches them and returns consistent JSON responses.

### 6. Real-time via Socket.io rooms
- `user:{userId}` — customer's private room
- `partner:{partnerId}` — partner's private room
- `admin` — admin dashboard room
All emit helpers are in `backend/src/services/socket.service.ts`.

### 7. Redis caching strategy
| Key | TTL | Invalidation |
|---|---|---|
| `bags:list:{city}:{area}:{date}` | 2 min | On bag update/cancel |
| `bag:{id}` | 5 min | On bag update |
| `partner:{id}` | 10 min | On profile update |
| `cities:all` | 24 hours | On city add/update |
| `rate:{ip}:{endpoint}` | 60 sec | Rate limit window |

### 8. Payment flow (two-phase)
1. Customer calls `POST /payments/initiate` → gets gateway payload/redirect URL
2. Gateway calls our webhook `POST /payments/callback/{gateway}` → we create/update order on success
Cash orders skip this flow entirely.

### 9. Payout cron
`backend/src/services/payout.service.ts` runs every Monday at 9am PKT (4am UTC). It calculates each approved partner's net earnings from the previous Mon–Sun, creates a `Payout` record, and sends WhatsApp + email notifications.

### 10. Mobile auth flow
```
Firebase phone OTP → confirm() → getIdToken()
  → POST /api/v1/auth/firebase-login { idToken }
  → receive LastCall JWT
  → store in expo-secure-store
  → attach as Authorization: Bearer <token> on all requests
```

### 11. Partner onboarding states
New partner → `status: PENDING` → admin approves → `status: APPROVED` → can create bags
The partner app's root `index.tsx` redirects based on this status:
- No partner record → `/onboarding/step1-business`
- `PENDING` → `/onboarding/step3-review` (waiting screen)
- `APPROVED` → `/(tabs)/dashboard`

### 12. Security hardening applied (May 2026)
The following security fixes were applied after a full audit:
- **Payment webhooks** — all gateways now verify HMAC/signature before processing (JazzCash: SHA-256, Easypaisa: MD5, SadaPay/NayaPay: HMAC-SHA256 via header)
- **Webhook idempotency** — Redis key `webhook:{gateway}:{txnRef}` with 24h TTL prevents double-processing

### 13. New Features — Partner Pitch Sprint (June 2026)
Seven high-impact features added to amaze restaurant partners and improve customer UX:

1. **Fan Notifications on Bag Listing** — When a partner creates a bag, all favouriting users get instant FCM push + `bag:new_listing` socket event. `fcm.service.ts` → `sendNewBagListingToFans()`, `socket.service.ts` → `emitNewBagListing()`.

2. **Countdown Timers** — Live "Closes in 1h 23m" on every bag card (red under 60 min). Component: `apps/customer/src/components/CountdownTimer.tsx`.

3. **Tappable Address → Google Maps** — Bag detail address opens Google Maps via `Linking.openURL()`.

4. **"Customers Waiting for You"** — Partner stats include `waitingCustomers` count + `activeTemplates`. Dashboard shows these + a template setup banner.

5. **Partner Reply to Reviews** — `Review` model now has `partnerReply` + `partnerRepliedAt`. API: `PATCH /reviews/:id/reply`. UI: "Reviews" tab in partner profile.

6. **Recurring Bag Templates** — New `BagTemplate` model. Partners create templates → bags auto-publish daily at 2 PM PKT via `startTemplateCron()`. API: `/api/v1/partners/me/templates`. UI: `apps/partner/src/app/bag/templates.tsx`.

7. **Shareable Impact Card** — Native `Share` API on customer profile with referral code embedded in share text.

**New socket event:** `BAG_NEW_LISTING = 'bag:new_listing'`
**Schema changes:** `Review` (partnerReply, partnerRepliedAt) + new `BagTemplate` model (requires `prisma migrate dev`)
- **Payment amount validation** — gateway-reported amount must match `PaymentTransaction.amount` within Rs. 0.01 tolerance before marking PAID
- **Bag reservation** — uses `updateMany` with `WHERE quantityLeft >= quantity AND status = AVAILABLE AND partner.status = APPROVED` — atomic at DB level, no race condition
- **Pickup code** — upgraded from `Math.random().toString(36)` to `crypto.randomBytes(5).toString('hex').toUpperCase()` (8 chars, cryptographically random)
- **Socket.io rooms** — JWT verified on connect via `io.use()` middleware; clients can only join rooms they are authorised for (own `user:id`, own `partner:id`, `admin`)
- **Promo codes** — `maxUses` checked before applying, per-user deduplication enforced, promo code normalised to uppercase before lookup
- **Status transitions** — order status change validates allowed transitions: CONFIRMED→READY→PICKED_UP only
- **Partner category** — validated against an enum whitelist (not free-text)
- **Bag times** — `pickupEnd` must be after `pickupStart`, `discountedPrice` must be less than `originalPrice`
- **Admin user creation** — bcrypt rounds increased to 14; phone placeholder is deterministic hash of email
- **Promotion schema** — Zod validation added to `POST/PATCH /admin/promotions`; `discountPct` capped at 100%
- **Stale JS files** — removed `api.js` and `authStore.js` duplicates in mobile apps
- **Audit logs** — now store `before`/`after` state and `ipAddress`

### 14. Running Environment & Mobile Compatibility (June 2026)

**Runtime stack confirmed working:**
- Node.js 20 via nvm (no system install needed)
- PostgreSQL 16 via Homebrew (user home directory, no sudo)
- Redis 8 via Homebrew
- Expo SDK 54 / React Native 0.81.5 / React 19.1.0 / expo-router 6.x

**`@react-native-firebase` removed from mobile apps** — requires native binary, cannot run in Expo Go. Replaced with a `POST /api/v1/auth/dev-login` endpoint (development only, blocked in production) that accepts any phone number and returns a JWT. Real Firebase auth will be re-added when building a development build via EAS.

**Dev login flow (Expo Go testing only):**
```
Enter phone → tap Send OTP → enter any code → hits /auth/dev-login → JWT returned
```
Only active when `NODE_ENV=development`. Returns 404 in production.

**Tab bar icons** — Added `@expo/vector-icons/Ionicons` to both customer and partner tab layouts. Was showing `▼` triangles due to missing `tabBarIcon` prop.

**Chip layout fix** — Horizontal ScrollView area/category chips were stretching to full screen height. Fixed by adding explicit `height: 36`, `alignItems: 'center'`, `flexDirection: 'row'` to `contentContainerStyle`.

**React 19 workspace deduplication** — Root `package.json` has `overrides.react: "19.1.0"` to prevent React 18/19 dual-instance crash (`ReactSharedInternals.S undefined`).

**Environment files needed to run locally:**
- `backend/.env` — copy from `.env.example`, set credentials (see section 15 below)
- `apps/customer/.env` — `EXPO_PUBLIC_API_URL=http://{MAC_IP}:4000` for local, or `https://lastcall-api.onrender.com` for prod
- `apps/partner/.env` — same as customer

**Start sequence (local dev):**
```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
eval "$(~/.homebrew/bin/brew shellenv)"
# 1. Postgres (local only — skip if using Neon)
pg_ctl -D ~/Library/Application\ Support/Homebrew/var/postgresql@16 start
# 2. Redis (local only — skip if using Upstash)
redis-server --daemonize yes
# 3. Backend
cd backend && npm run dev
# 4. Admin (new tab)
cd apps/admin && npm run dev
# 5. Customer (new tab)
cd apps/customer && npx expo start --tunnel --clear
# 6. Partner (new tab)
cd apps/partner && npx expo start --tunnel --clear
```

### 15. Production Deployment (June 2026)

**Live infrastructure — all free, $0/month:**

| Service | Provider | URL/Endpoint |
|---|---|---|
| Backend API | Render (free tier) | `https://lastcall-api.onrender.com` |
| Admin Dashboard | Cloudflare Pages (free) | `https://lastcall-admin.pages.dev` |
| PostgreSQL | Neon (free 0.5GB) | Singapore region |
| Redis | Upstash (free 10K req/day) | Singapore region, TLS (`rediss://`) |
| File Storage | Cloudinary (free 25GB) | cloudinary.com |
| Email | Resend (free 3K/month) | Sender: `onboarding@resend.dev` (until domain verified) |
| Push Notifications | Firebase FCM | Free forever |
| Keep-alive | UptimeRobot | Pings `/health` every 5 min to prevent Render sleep |

**Deployment:**
- Backend: GitHub → Render auto-deploys on push to `main`
- Admin: GitHub → Cloudflare Pages auto-deploys on push to `main`

**Admin credentials (production):**
- Email: `admin@lastcall.pk`
- Password: stored securely — do not commit to git

**Auth in current state:**
- Phone OTP is bypassed via `POST /api/v1/auth/dev-login`
- Requires `ALLOW_DEV_LOGIN=true` env var on Render
- Any phone + OTP `123456` logs in
- Real Firebase phone auth requires EAS native build — not yet set up

**To deploy a new version:** just `git push origin main` — Render picks it up automatically.

**Key Render environment variables** (set in Render dashboard → Environment):
```
NODE_ENV=production
ALLOW_DEV_LOGIN=true          ← remove when real Firebase auth is set up
FIREBASE_PRIVATE_KEY=...      ← single line with \n escape sequences
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
DATABASE_URL=postgresql://... ← Neon connection string
REDIS_URL=rediss://...        ← Upstash TLS URL
CLOUDINARY_CLOUD_NAME=...     ← from cloudinary.com dashboard
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...            ← from resend.com dashboard
RESEND_FROM_EMAIL=...
```

**Upstash Redis note:** URL must use `rediss://` (double-s) for TLS. ioredis config has `tls: { rejectUnauthorized: false }` when URL starts with `rediss://`.

**Cloudinary note:** Images are auto-optimized (`quality: auto, fetch_format: auto`) for fast loading on Pakistani mobile connections. PDFs uploaded as `resource_type: raw`.

---

## Database Schema Summary

18 tables → **19 tables** (+ `bag_templates`), 9 enums. Full schema in `backend/prisma/schema.prisma`.

### Core tables
| Table | Purpose |
|---|---|
| `users` | All users. `role`: CUSTOMER / PARTNER / ADMIN |
| `partners` | Business profiles. `status`: PENDING / APPROVED / SUSPENDED |
| `partner_documents` | CNIC, business license uploads for onboarding |
| `cities` | Karachi, Lahore, Islamabad, etc. |
| `areas` | Neighbourhoods within cities (e.g. DHA, Clifton, Gulshan) |
| `bags` | Magic bag listings. `status`: DRAFT / AVAILABLE / SOLD_OUT / CANCELLED / EXPIRED |
| `orders` | Customer reservations. `status`: CONFIRMED / READY / PICKED_UP / CANCELLED / REFUNDED |
| `payment_transactions` | Gateway-level payment records (separate from orders) |
| `saved_payment_methods` | Customer's stored payment methods |
| `reviews` | Post-pickup star ratings + comment |
| `favourites` | Customer ↔ Partner many-to-many |
| `payouts` | Weekly settlement records per partner |
| `referrals` | Referral code usage tracking |
| `promotions` | Promo codes + homepage banners |
| `promotion_uses` | Per-user promo usage (prevents reuse) |
| `notifications` | In-app notification log |
| `impact_stats` | Daily platform-wide food waste impact (meals, CO₂) |
| `audit_logs` | Admin action history |

### Key business rules encoded in schema
- `bags.quantityLeft` is decremented atomically in a Prisma `$transaction` when an order is placed
- `reviews.orderId` is `@unique` — one review per order
- `referrals.referredId` is `@unique` — one referral per user (cannot be referred twice)
- `bags.co2SavedKg = quantityTotal * 2.5` (set at creation)

---

## Commission & Payout Model

```
Order totalAmount = bag.discountedPrice × quantity - promoDiscount
commissionAmt     = totalAmount × (partner.commissionPct / 100)   // default 20%
partnerPayoutAmt  = totalAmount - commissionAmt                    // default 80%
```

- **Digital payments** (JazzCash, Easypaisa, etc.): money collected by Last Call; partner payout sent weekly
- **Cash**: customer pays partner directly at pickup; partner owes Last Call their 20% — deducted from weekly payout
- Default commission: **20%** (configurable per partner via `partner.commissionPct`)
- Payout day: **every Monday** via JazzCash transfer to partner's phone number

---

## Payment Gateways

All Pakistani. No Stripe (except SadaPay which uses a Stripe-compatible API).

| Gateway | Integration type | File |
|---|---|---|
| JazzCash | HMAC-SHA256 signed HTML form POST | `gateways/jazzcash.ts` |
| Easypaisa | MD5 signed form redirect | `gateways/easypaisa.ts` |
| SadaPay | Stripe-compatible REST API | `gateways/sadapay.ts` |
| NayaPay | Hosted checkout URL | `gateways/nayapay.ts` |
| Raast | IBAN manual transfer (SBP instant rail) | `gateways/raast.ts` |
| Cash | No gateway — verified at pickup | handled in orders router |

Webhook callbacks land at `POST /api/v1/payments/callback/{gateway}`. Each gateway uses different field names and signature methods — normalised in `extractWebhookData()` in `payments.router.ts`.

---

## Notification Triggers

| Event | WhatsApp | FCM Push | Email |
|---|---|---|---|
| Order placed → customer | ✓ | ✓ | ✓ (receipt) |
| Order placed → partner | ✓ | ✓ | — |
| Order marked ready | ✓ | ✓ | — |
| Order picked up | ✓ | ✓ | ✓ |
| Order cancelled | ✓ | ✓ | ✓ |
| Partner approved | ✓ | ✓ | ✓ |
| Weekly payout sent | ✓ | — | ✓ |
| New review received | — | ✓ | — |

WhatsApp messages use Pakistani phone number format (`+92xxxxxxxxxx`). `normalizePKPhone()` in `packages/shared/src/index.ts` handles the normalisation.

---

## Shared Package (`@lastcall/shared`)

Located at `packages/shared/src/index.ts`. Imported by backend, customer app, and partner app.

Exports:
- All enums: `UserRole`, `PartnerStatus`, `BagStatus`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `PayoutStatus`, `DocumentType`, `NotifChannel`
- `SocketEvents` — constant map of all Socket.io event names
- `ApiResponse<T>`, `PaginatedResponse<T>` — standard response shapes
- `normalizePKPhone(phone)` — normalise to `+92xxxxxxxxxx`
- `formatPKR(amount)` — format as `Rs. 1,500`
- `calcCO2Saved(meals)` — returns `meals × 2.5` kg

---

## Running Locally

```bash
# 1. Start DB + Redis
docker-compose up -d

# 2. Install all dependencies (from root)
npm install

# 3. Set up backend env
cp backend/.env.example backend/.env
# Edit backend/.env — minimum required: DATABASE_URL, REDIS_URL, JWT_SECRET, Firebase vars

# 4. Run DB migrations
cd backend && npx prisma migrate dev --name init && npx prisma generate

# 5. Start backend (port 4000)
npm run backend

# 6. Start admin dashboard (port 5173)
npm run admin

# 7. Start customer or partner app
npm run customer   # opens Expo — scan QR with Expo Go
npm run partner
```

---

## Common Tasks

### Add a new API endpoint
1. Find or create the resource folder: `backend/src/api/v1/{resource}/`
2. Add the route to `{resource}.router.ts`
3. Register the router in `backend/src/index.ts`

### Add a new database table or column
1. Edit `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name your_migration_name`
3. Run `npx prisma generate` to update the TypeScript client

### Add a new screen to customer/partner app
1. Create a `.tsx` file in the appropriate Expo Router folder under `src/app/`
2. Expo Router auto-discovers it — no manual registration needed
3. Use `router.push('/your/path')` or `<Link href="/your/path">` to navigate

### Add a new Socket.io event
1. Add the event name to `SocketEvents` in `packages/shared/src/index.ts`
2. Add emit helper in `backend/src/services/socket.service.ts`
3. Listen for it in `useSocket.ts` in the relevant mobile app

### Add a new payment gateway
1. Create `backend/src/api/v1/payments/gateways/{name}.ts`
2. Export an `initiate{Name}(txnRef, amount)` function
3. Import and add a `case` in the `switch` in `payments.router.ts`
4. Add the callback route `router.post('/callback/{name}', handleWebhook('{NAME}'))`
5. Add normalisation logic in `extractWebhookData()`
6. Add the method to `PaymentMethod` enum in `packages/shared/src/index.ts`
7. Add the method to `PaymentMethod` enum in `backend/prisma/schema.prisma` and run a migration

---

## Code Conventions

- **TypeScript everywhere** — no `.js` files in new code
- **Zod for validation** — use `validate(schema)` middleware, never trust `req.body` directly
- **Always throw AppError subclasses** — never `res.status(x).json(...)` directly in error paths
- **Import `env` not `process.env`** — always from `backend/src/config/env.ts`
- **Import `prisma` not `new PrismaClient()`** — always from `backend/src/config/db.ts`
- **Invalidate Redis cache** after any write that changes a cached resource
- **Use `$transaction` for atomic operations** — especially bag quantity decrements on order placement
- **All money values are in PKR (Pakistani Rupees)** — stored as `Float` in DB, displayed via `formatPKR()`
- **Phone numbers always normalised to `+92xxxxxxxxxx`** before storage or sending

---

## What Does NOT Exist Yet (Future Work)

These features are planned but not yet built:
- Map view with geolocation-based bag discovery (`/explore` tab is list-only for now)
- Partner cover photo upload (schema has `coverUrl`, UI not wired)
- Promo banner display on customer home screen (DB model exists, frontend not wired)
- Admin city/area management pages (API exists, admin pages not added)
- Referral discount application at checkout (tracking exists, discount logic not applied)
- Full refund flow per gateway (structure exists, gateway-specific refund calls not implemented)
- Push notification for review received (FCM service ready, not wired to review creation)
- Multi-language / Urdu support
- Web version of customer app (mobile-only for now)

---

## Key People / Context

- **Product:** Pakistani startup, pre-launch, Karachi-first
- **Target users:** Urban Pakistani consumers aged 18–35, restaurant/café owners
- **Business model:** 20% commission on every transaction
- **Competitive moat vs Too Good To Go:** Local payment gateways, WhatsApp-first, Pakistani city/area UX, Urdu-friendly branding planned

---

*Last updated: May 2026. If you're reading this and something feels stale, check `git log` and `backend/prisma/schema.prisma` for the latest truth.*
