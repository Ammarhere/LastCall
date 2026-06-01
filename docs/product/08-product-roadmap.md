# Last Call — Product Roadmap

> What we're building, when, and why. This roadmap reflects our current thinking and will evolve as we learn from the market.

---

## Roadmap Philosophy

Last Call follows a **supply-first, then experience** sequencing:

1. First, make sure partners can list bags and get paid reliably
2. Then, make sure customers can find and buy bags frictionlessly
3. Then, layer on experience improvements that drive retention
4. Finally, add growth features (referrals, social, partnerships)

Every feature decision comes back to: **does this help more bags get sold, or does it keep more customers and partners active?**

---

## Phase 0 — Foundation (Complete)

Everything needed for the first transaction to happen end-to-end.

| Feature | Status |
|---|---|
| Phone OTP authentication (customer + partner) | ✅ Done |
| Bag creation by partners | ✅ Done |
| Bag browsing by customers (home feed + area filter) | ✅ Done |
| Order placement (cash + digital payment) | ✅ Done |
| Pickup code system (8-char cryptographically random) | ✅ Done |
| Two-step cash verification at pickup | ✅ Done |
| WhatsApp order notifications (Twilio) | ✅ Done |
| FCM push notifications | ✅ Done |
| Partner dashboard (today's stats) | ✅ Done |
| Admin dashboard (approve/suspend partners) | ✅ Done |
| Payment gateways: JazzCash, Easypaisa, SadaPay, NayaPay, Raast | ✅ Done |
| **Payment webhook signature verification (all gateways)** | ✅ Done |
| **Payment webhook idempotency (Redis-based)** | ✅ Done |
| **Payment amount validation against order total** | ✅ Done |
| Weekly automated payouts (Monday cron) | ✅ Done |
| Order status transitions (CONFIRMED→READY→PICKED_UP, enforced) | ✅ Done |
| Partner onboarding (3-step + document upload) | ✅ Done |
| Real-time order updates (Socket.io, authenticated rooms) | ✅ Done |
| Ratings & reviews | ✅ Done |
| Partner analytics tab | ✅ Done |
| Referral system (codes + tracking) | ✅ Done |
| Food waste impact stats (CO₂, meals) | ✅ Done |
| Multi-city DB schema | ✅ Done |
| Promo codes + banners (DB model + validation) | ✅ Done |
| **Atomic bag reservation (race-condition safe)** | ✅ Done |
| **Suspended partner bags blocked from ordering** | ✅ Done |
| **Partner category enum validation** | ✅ Done |
| **Bag time range validation (start < end)** | ✅ Done |
| **Fan notification on bag listing (push + socket)** | ✅ Done (June 2026) |
| **Countdown timers on bag cards** | ✅ Done (June 2026) |
| **Tappable address → Google Maps** | ✅ Done (June 2026) |
| **"Waiting Customers" count on partner dashboard** | ✅ Done (June 2026) |
| **Partner reply to reviews** | ✅ Done (June 2026) |
| **Recurring bag templates (auto-publish 2PM daily)** | ✅ Done (June 2026) |
| **Shareable impact card with referral code** | ✅ Done (June 2026) |
| **All missing screens** (review, favourites, notifications, payment-methods, partner profile, payouts, documents, edit-profile x2) | ✅ Done (June 2026) |
| **Navigation headers + back buttons on all screens** | ✅ Done (June 2026) |
| **Admin dashboard deployed** (Cloudflare Pages) | ✅ Done (June 2026) |
| **Backend deployed live** (Render) | ✅ Done (June 2026) |

---

## Phase 1 — Launch Readiness (Months 1–2)

Getting the product ready for real users in the real world. These are polish, reliability, and operational needs — not new features.

### P1.1 — App Store Submission
**What:** Submit Last Call (customer) and Last Call Partner to Google Play and Apple App Store.
**Why:** Required before any public launch.
**Owner:** Engineering + Product

### P1.2 — Firebase Phone Auth Production Setup
**What:** Move Firebase from sandbox to production. Configure SMS templates in Urdu + English.
**Why:** OTP must work reliably on all Pakistani networks (Jazz, Zong, Ufone, Telenor).

### P1.3 — Payment Gateway Production Keys
**What:** Get production (live) API keys for JazzCash, Easypaisa. Test with real transactions.
**Why:** Sandbox keys don't process real money. Must test full payment + webhook flow with real accounts.

### P1.4 — WhatsApp Business API Go-Live
**What:** Move Twilio WhatsApp from sandbox to approved WhatsApp Business API.
**Why:** Sandbox requires recipients to opt-in manually. Production works immediately.

### P1.5 — Admin Operations Runbook
**What:** Document the daily/weekly/monthly admin tasks in plain language for the ops team.
**Why:** Bilal (ops) needs to know exactly what to do Monday morning, how to handle disputes, and how to process payouts.

### P1.6 — Partner Support Channel
**What:** Set up a WhatsApp Business number that partners can message with issues. Assign someone to monitor it.
**Why:** When a partner has a problem (app not working, payout question), they need to reach a human. A WhatsApp number is how Pakistani businesses expect to get support.

### P1.7 — Seed Karachi Cities & Areas Data
**What:** Add Karachi to the cities table. Add Burns Road, DHA, Clifton, Gulshan, Saddar, North Nazimabad, PECHS, Malir, Bahria Town as areas.
**Why:** The app uses the cities/areas from the database. Without this, area chips won't work.

---

## Phase 2 — Core Experience (Months 2–4)

Features that make the product more delightful and reliable for early users.

### P2.1 — Map View for Bag Discovery
**What:** A map screen showing bags as pins on a map, so customers can see what's available near them visually.
**Why:** Area chips are functional but a map is more discoverable. Users in a new area don't know which area chip to select.
**Note:** Basic map using device location + React Native Maps. No need for custom mapping initially.

### P2.2 — Promo Banner Display (Customer Home Screen)
**What:** Show admin-created banners on the customer home screen.
**Why:** The DB model and admin management screen are built, but the customer app doesn't yet show banners.
**Effort:** Low (frontend only — API already exists).

### P2.3 — Promo Code Application at Checkout
**What:** Connect the promo code validation API to the checkout flow in the customer app.
**Why:** The DB tracking and API exist, but promo codes can't actually be applied at checkout yet.
**Effort:** Medium (frontend + test promo scenarios).

### P2.4 — Referral Discount Application
**What:** When a referred user places their first order, automatically apply their referral discount.
**Why:** The referral tracking exists, but discount application logic is not connected to checkout.
**Effort:** Medium (backend logic + frontend display).

### P2.5 — Push Notification for Review Prompt
**What:** After an order reaches PICKED_UP status, send a push notification 30 minutes later: "How was your Last Call? Leave a review 🌟"
**Why:** Review prompts must come at the right moment. Too immediate (while eating) or too late (hours later) reduces conversion.
**Effort:** Low (backend hook on status change).

### P2.6 — Order Cancellation Deadline
**What:** Customers can only cancel up to 30 minutes after ordering (or 1 hour before pickup window, whichever comes first).
**Why:** No-show cancellations waste partner prep time. A clear policy with a deadline reduces abuse.
**Effort:** Low (add time check to cancel endpoint).

### P2.7 — Partner Cover Photo
**What:** Partners can upload a cover photo (wide banner image) for their profile page.
**Why:** The DB column exists (`coverUrl`), but the upload UI isn't in the partner app yet.
**Effort:** Low.

---

## Phase 3 — Growth Features (Months 4–6)

Features that bring new users to the platform and keep existing users engaged.

### P3.1 — "Bags Near Me" (Geolocation Sort)
**What:** Sort the bag discovery feed by distance from the customer's current location.
**Why:** The most relevant bags for a customer are the closest ones. Currently sorted by newest.
**Effort:** Medium (requires location permission + distance calculation).

### P3.2 — Loyalty Programme ("Save 10, Earn 1")
**What:** After every 10 bags purchased, customers earn a free bag voucher (up to Rs. 150).
**Why:** Loyalty programmes create habitual behaviour. The 10th bag feels like a reward, making bags 8–9 feel like "almost there."
**Effort:** Medium (new DB model + frontend display of progress).

### ~~P3.3 — Scheduled Bag Listings (Partner)~~ ✅ DONE (June 2026)
Implemented as **Bag Templates**. Partners create once, bags auto-publish at 2 PM every selected day.
See: `backend/src/api/v1/partners/templates.router.ts`, `apps/partner/src/app/bag/templates.tsx`

### P3.4 — In-App Notifications Centre (Customer)
**What:** A notification inbox in the customer app where all past notifications are listed and can be marked as read.
**Why:** Important messages (order ready, payout sent) should be retrievable, not just a flash notification.
**Effort:** Low (DB model exists, just needs frontend).

### P3.5 — Admin: Promo Code Generation Wizard
**What:** Admin can create promo campaigns with specific rules (first 100 uses, valid this weekend, only in DHA).
**Why:** The current promo API is basic. For growth campaigns, admin needs more targeting control.
**Effort:** Medium (admin UI improvements + backend rule evaluation).

### P3.6 — Partner Payout Method Choice
**What:** Partners can choose to receive payouts via Easypaisa, Raast, or bank transfer, not just JazzCash.
**Why:** Not all partners have JazzCash. Especially older restaurant owners who use Easypaisa or bank accounts.
**Effort:** Medium (partner profile UI + payout service logic).

---

## Phase 4 — Scale Features (Months 7–12)

Features required to operate at hundreds of partners and tens of thousands of daily active users.

### P4.1 — Lahore City Launch
**What:** Add Lahore to the cities table, configure Lahore-specific areas (Gulberg, DHA, Johar Town, etc.), hire Lahore field team, run Lahore launch marketing.
**Why:** After Karachi stabilises, Lahore is the obvious next market.

### P4.2 — Islamabad City Launch
**What:** Same as above but for Islamabad (F-7, F-10, I-8, Blue Area).

### P4.3 — Bag Subscription for Power Users
**What:** Customers can subscribe to a specific restaurant's daily bag. They are automatically reserved the bag every day without having to open the app.
**Why:** Power users who buy from the same 2–3 restaurants daily should not have to repeat the same action each time.
**Effort:** High (subscription management, auto-reservation cron, cancellation flow).

### P4.4 — NGO / Food Bank Integration
**What:** Unclaimed bags (no-shows after pickup window) can be automatically offered to registered NGOs (Rizq, Edhi) for free pickup instead of going to waste.
**Why:** Currently, unclaimed bags are still wasted. This closes the loop on Last Call's impact promise.
**Effort:** High (NGO partner onboarding, auto-notification flow, separate verification).

### P4.5 — Partner App in Urdu
**What:** Full Urdu translation of the Partner app interface.
**Why:** Many small restaurant and bakery owners in non-DHA areas are more comfortable in Urdu. This unlocks a significant new segment of potential partners.
**Effort:** Medium (translation + RTL layout adjustments).

### P4.6 — Corporate Meal Plans
**What:** Companies can purchase Last Call credit in bulk (e.g. Rs. 50,000/month) for their employees. Employees use the credit for purchases.
**Why:** Adds a B2B revenue stream and drives predictable, high-volume orders from specific areas near corporate offices.
**Effort:** High (new pricing model, billing system, employee account linking).

### P4.7 — Fraud Detection & Auto-Suspension
**What:** Automated flags for suspicious behaviour: same customer claiming promo codes multiple times, partner marking orders complete without real pickups, unusually high cancellation rates.
**Why:** At scale, manual fraud monitoring is not scalable.
**Effort:** High (rules engine + admin review queue).

---

## Feature Parking Lot (Evaluated, Not Scheduled)

These features have been discussed but are not yet committed to a phase:

| Feature | Why Parked |
|---|---|
| Delivery option | Fundamentally changes the unit economics. Last Call's model works because there's no delivery cost. Adding delivery would require a different commission structure and logistics partner. |
| Customer chat with partners | High support overhead, opens platform to customer service disputes. Partners prefer WhatsApp for direct comms. |
| Group ordering | Added complexity with low clear demand signal. Could revisit once individual ordering is at scale. |
| Bag reservation slots (specific pickup times) | Adds friction for customers. Current pickup window is sufficient for most cases. |
| In-app Urdu keyboard/interface | Heavy engineering effort. Lower priority until non-English market segment is proven. |
| Bag reviews with photos | Nice-to-have. Text reviews + star rating is sufficient for v1. |

---

## Roadmap Timeline Summary

```
Month 1–2: Phase 1 (Launch Readiness)
  → App Store submission, payment production, WhatsApp go-live

Month 2–4: Phase 2 (Core Experience)
  → Map view, promo codes live, referral discounts, cover photos

Month 4–6: Phase 3 (Growth Features)
  → Geolocation, loyalty programme, scheduled listings, notifications centre

Month 7–9: Phase 4a (Lahore Launch)
  → City expansion with full partner acquisition + marketing

Month 10–12: Phase 4b (Islamabad + Scale Features)
  → Islamabad launch, NGO integration, corporate plans, fraud detection
```

---

## How We Prioritise Features

Every feature request goes through a simple scoring framework:

| Criterion | Weight | Question |
|---|---|---|
| **Bag sales impact** | 40% | Does this directly lead to more bags sold? |
| **Partner retention** | 25% | Does this keep partners active and listing? |
| **Customer retention** | 20% | Does this bring customers back more often? |
| **Operational efficiency** | 10% | Does this reduce team time/cost? |
| **Mission alignment** | 5% | Does this advance the food waste reduction mission? |

A feature scoring 3.5+ out of 5 across these criteria is a strong candidate for inclusion. Features scoring below 2.5 go to the parking lot regardless of how much someone wants them.
