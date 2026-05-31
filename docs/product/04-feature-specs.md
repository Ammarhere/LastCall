# Last Call — Feature Specifications

> A complete description of every feature in the product, written for product managers and business stakeholders.

---

## Customer App Features

### 1. Phone OTP Authentication
**What it does:** Customers sign up and log in using their Pakistani mobile number. A 6-digit OTP is sent via SMS, which they enter to verify their identity. No passwords or email addresses required.

**Why it matters:** Pakistani consumers are conditioned to this flow from JazzCash, Easypaisa, and banking apps. Removing the password barrier eliminates the #1 signup drop-off point.

**Key behaviour:**
- New users are auto-registered on first login — no separate sign-up step
- Returning users get straight to their home screen
- Works with any Pakistani mobile number (Jazz, Zong, Ufone, Telenor, Warid)

---

### 2. Bag Discovery — Home Feed
**What it does:** The main screen shows available food bags near the customer, updated in real time. Bags are filterable by area using chips at the top of the screen.

**Area chips (Karachi launch):** All | Burns Road | DHA | Clifton | Gulshan | Saddar | North Nazimabad | Malir | PECHS

**Each bag card shows:**
- Restaurant name and logo
- Bag title
- Original price (struck through)
- Discounted price (highlighted in green)
- Number of bags remaining
- Pickup time window

**Real-time behaviour:** If a bag sells out while you're browsing, it automatically greys out and shows "Sold Out" — no stale data.

---

### 3. Bag Discovery — Explore & Search
**What it does:** A search and filter screen that lets customers discover bags by:
- Keyword (restaurant name or bag title)
- Category (Restaurant, Bakery, Café, Sweet Shop, Biryani, BBQ, Fast Food, Snacks)
- Maximum price (e.g. "show me everything under Rs. 200")

**Why it matters:** Home feed serves daily regulars. Explore serves new users discovering the platform for the first time, or curious users expanding their range.

---

### 4. Featured Bags
**What it does:** A curated section on the home screen showcasing bags from top-rated or highlighted partner restaurants.

**Curation logic:** Partners marked as "Featured" by the admin team appear in this section. Typically used for:
- New restaurants joining the platform
- Restaurants with consistently high ratings
- Promotional partnerships

---

### 5. Bag Detail Page
**What it does:** Full information page for a specific bag before purchase.

**Shows:**
- Bag photo (uploaded by partner)
- Bag title and description
- Partner name, logo, star rating, area
- Original vs. discounted price with % savings
- Exact pickup window (e.g. 8:30 PM – 9:30 PM)
- Full pickup address
- Pickup instructions from the partner
- Environmental impact: CO₂ saved (in kg) and meals rescued
- Tags (e.g. "biryani", "rice", "spicy")
- Bags remaining (live count)
- Reserve button (disabled if sold out)

---

### 6. Order Placement
**What it does:** Reserves a bag for the customer. The process is:
1. Customer taps "Reserve Bag"
2. Selects payment method
3. If cash: order is confirmed immediately
4. If digital payment: redirected to payment gateway, order confirmed on successful payment
5. Order confirmation screen with pickup code

**Atomic reservation:** When a customer places an order, the bag's available quantity is decremented in real time. This prevents two customers from reserving the same last bag.

**Promo code support:** Customer can enter a promo code at checkout for an additional discount.

---

### 7. Payment Methods
**What it does:** Last Call supports 7 payment methods, covering virtually every Pakistani consumer:

| Method | Type | Best for |
|---|---|---|
| Cash | Pay at pickup | Customers without mobile wallets |
| JazzCash | Mobile wallet | Most popular in Pakistan |
| Easypaisa | Mobile wallet | Telco-linked wallet |
| SadaPay | Neobank | Urban, tech-savvy customers |
| NayaPay | Neobank | Urban customers |
| Raast | Bank transfer | Customers with bank accounts |
| Bank Transfer | Manual IBFT | Fallback for anyone |

---

### 8. Live Order Tracking
**What it does:** After ordering, the customer sees their order's real-time status on a progress stepper:

```
CONFIRMED → READY → PICKED UP
```

- **CONFIRMED:** Order placed, restaurant notified
- **READY:** Restaurant has packed the bag and it's waiting for you
- **PICKED UP:** Order complete

Status updates arrive via push notification AND update live on screen (via real-time Socket.io connection) — the page updates itself without the customer needing to refresh.

---

### 9. Pickup Code
**What it does:** Every order gets a unique 6-character alphanumeric code (e.g. `H7K2M9`). The customer shows this at the restaurant counter. The partner app verifies it.

**Why a code and not a QR:** QR codes require the restaurant to have a scanner pointed correctly. A 6-character code is faster, works without perfect lighting, and is more natural for a counter transaction.

---

### 10. Order History
**What it does:** A chronological list of all past and active orders. Each entry shows:
- Restaurant name
- Bag title
- Order status with colour-coded badge
- Total paid
- Pickup code (for active orders)
- Date

Tapping an order shows full detail including the review prompt (if picked up and not yet reviewed).

---

### 11. Ratings & Reviews
**What it does:** After an order is marked PICKED UP, the customer can leave a 1–5 star rating and optional text comment for the restaurant.

**Rules:**
- Can only review after PICKED UP status — prevents fake reviews
- One review per order
- Reviews are visible on the partner's public profile

**Why it matters:** Reviews build trust for new customers discovering a restaurant. They also give partners actionable feedback and incentivise quality.

---

### 12. Favourite Partners
**What it does:** Customers can save restaurants they love as Favourites (heart icon on partner profile). Favourites appear in a dedicated section on the Profile screen.

**Why it matters:** Reduces time-to-purchase for repeat customers. A customer who favourites a restaurant will check it first when opening the app.

---

### 13. Personal Impact Stats
**What it does:** Every customer's profile shows:
- Total meals saved (= total bags picked up)
- Total CO₂ prevented (= meals × 2.5 kg)

These stats grow with every purchase and serve as a personal environmental scoreboard.

**Why it matters:** Environmental impact is one of Last Call's core emotional hooks. Making it personal and visible increases retention and word-of-mouth sharing.

---

### 14. Referral System
**What it does:** Every customer gets a unique referral code (e.g. `HAMZA7`). When a new user signs up with their code:
- The new user gets a discount on their first order
- The referrer receives a reward (discount credit on next order)

**Why it matters:** Referrals are the most cost-effective acquisition channel in markets where digital ad costs are rising. A happy customer bringing in 2–3 friends is the foundation of growth.

---

### 15. Promo Codes & Banners
**What it does:**
- **Banners:** Admin-managed promotional banners displayed on the home screen (e.g. Ramadan deals, city launch announcements)
- **Promo codes:** Alphanumeric codes customers enter at checkout for a flat or percentage discount (e.g. `KARACHI20` for 20% off)

---

### 16. Saved Payment Methods
**What it does:** Customers can save their preferred payment method for faster checkout on repeat orders. When checking out, saved methods appear first.

---

### 17. Push Notifications
**What it does:** Last Call sends contextual push notifications at key moments:
- Order confirmed
- Bag ready for pickup
- Order picked up (receipt)
- Order cancelled
- Referral reward earned
- New featured bags in your area

**Controlled:** Customers can manage notification preferences. We do not send marketing spam.

---

## Partner App Features

### 18. Partner Onboarding (3 Steps)
**Step 1 — Business Information:**
- Business name, category (Restaurant/Bakery/Café/etc.)
- City and area
- Full address
- Pickup instructions

**Step 2 — Document Upload:**
- CNIC photo (required)
- Business license (optional but encouraged)
- Bank statement (optional)
Documents are reviewed by the Last Call admin team.

**Step 3 — Pending Review:**
- Partner sees a clear "Your application is under review" screen
- Notified via WhatsApp + push when approved (within 24–48 hours)

---

### 19. Partner Dashboard
**What it does:** The partner's home screen. Shows today's key numbers at a glance:
- Today's orders (count)
- Pending orders (awaiting pickup)
- Active bags (currently listed and available)
- Total earnings (lifetime)

Also shows a list of the 5 most recent orders with customer name, bag, amount, and status.

**Quick action:** "Create New Bag" button prominently placed.

---

### 20. Bag Creation
**What it does:** Partners create a "magic bag" listing in under 2 minutes:
- Bag title (e.g. "Surprise Biryani Box")
- Description (optional)
- Original price (what it would normally cost)
- Discounted price (what Last Call sells it for)
- Quantity (how many bags available)
- Pickup date
- Pickup start and end time
- Photo upload
- Tags

**Validation:** Discounted price cannot exceed original price. Pickup time must be in the future.

---

### 21. Bag Management
**What it does:** Partners see all their current and past bags in a list. For each active bag they can:
- See how many are remaining vs. total
- See current status (Available, Sold Out, Cancelled)
- Cancel the bag (removes it from customer listings, restores quantity)

---

### 22. Incoming Orders Management
**What it does:** Partners see all orders for their business. For each order they can:
- See customer name and pickup code
- See payment method (Cash or digital)
- Mark order as **Ready** (bag is packed and waiting)
- Verify pickup (see feature 23)

**Real-time:** New orders appear instantly via push notification AND in the app without needing to refresh (Socket.io).

---

### 23. Two-Step Pickup Verification
**What it does:** When a customer arrives, the partner verifies their identity and completes the transaction in two steps:

**Step 1 — Code Verification:** Partner taps "Verify Pickup" and enters the customer's 6-digit code. System confirms the code matches.

**Step 2 — Cash Confirmation (for cash orders):** Partner confirms that cash has been received.

Once both steps are done, the order is marked PICKED UP and the transaction is complete.

**Why two steps:** Prevents fraud (someone claiming an order without the code) and ensures cash is confirmed before closing the transaction.

---

### 24. Partner Analytics
**What it does:** A dedicated analytics tab showing performance over the last 30 days:
- Total orders
- Total revenue earned
- Bar chart: orders by bag type (which bags sell most)
- Table: each bag with units sold and revenue

**What partners learn from it:**
- Which bag types perform best → list more of those
- Which days are slow → reduce listing quantity on those days
- Whether price point affects sales → experiment and compare

---

### 25. Partner Profile Management
**What it does:** Partners can update their business profile:
- Business name, description, category
- Logo and cover photo upload
- Pickup instructions
- Area/address

---

### 26. Payout History
**What it does:** Partners can see all their weekly payouts:
- Payout period (e.g. Mon 4 Nov – Sun 10 Nov)
- Number of orders in that period
- Gross revenue
- Commission deducted (20%)
- Net amount paid out
- Status (Pending / Processing / Completed)

**Why transparency matters:** Partners trust platforms that show them exactly how their money is calculated. Hidden fees are the #1 reason restaurants leave platforms.

---

## Admin Dashboard Features

### 27. KPI Dashboard
A real-time overview of platform health:
- Today's orders and GMV
- Total GMV (all-time) and commission earned
- Active approved partners
- Registered customers
- Pending partner approvals (action required)
- Active bags currently live

---

### 28. Partner Management
**List view:** All partners with filters by status (Pending / Approved / Suspended). Shows name, category, city, rating, total orders, commission rate.

**Actions per partner:**
- Approve (opens the platform to them)
- Suspend (removes their bags from listings immediately)
- View uploaded documents (CNIC, license)
- Verify individual documents

---

### 29. Order Management
Full paginated list of all orders across all partners. Filterable by status. Shows customer, partner, bag, amount, payment method, and date.

**Used for:** Investigating disputes, monitoring for fraud patterns, checking payout accuracy.

---

### 30. Payout Management
**List view:** All partner payouts with status (Pending / Processing / Completed / Failed).

**Actions:**
- Trigger weekly payout run manually (in addition to automatic Monday cron)
- Mark individual payouts as Processing or Completed after transferring money
- View partner bank/JazzCash details for manual transfers if needed

---

### 31. Impact Dashboard
Platform-wide food waste impact stats:
- Total meals saved (all-time)
- Total CO₂ prevented
- Total bags rescued
- Partner count
- Customer count

**Use case:** Marketing material, investor updates, press releases. These numbers tell the story of Last Call's environmental mission.

---

### 32. Promo Code & Banner Management
**Promo codes:** Admin creates discount codes with:
- Code name (e.g. `KARACHI20`)
- Discount type: percentage or flat amount
- Minimum order amount
- Maximum uses
- Valid from / until dates
- City-specific (optional)

**Banners:** Upload promotional images for the customer app home screen. Time-limited. City-specific.

---

### 33. City & Area Management
Admin adds new cities (as Last Call expands beyond Karachi) and manages neighbourhoods within each city. The customer app's area chips are driven by this data.

---

## Feature Priority Matrix

| Feature | Customer Value | Business Value | Launch Critical |
|---|---|---|---|
| Phone OTP login | ★★★★★ | ★★★★ | ✓ |
| Bag discovery (home feed) | ★★★★★ | ★★★★★ | ✓ |
| Order placement + payment | ★★★★★ | ★★★★★ | ✓ |
| Pickup code system | ★★★★ | ★★★★★ | ✓ |
| Partner bag creation | N/A | ★★★★★ | ✓ |
| WhatsApp notifications | ★★★★ | ★★★★★ | ✓ |
| Live order tracking | ★★★★ | ★★★ | ✓ |
| Ratings & reviews | ★★★★ | ★★★★ | Post-launch |
| Partner analytics | N/A | ★★★★ | Post-launch |
| Referral system | ★★★★ | ★★★★★ | Post-launch |
| Personal impact stats | ★★★ | ★★★★ | Post-launch |
| Promo codes | ★★★★ | ★★★★ | Post-launch |
| Partner onboarding docs | N/A | ★★★ | ✓ (admin) |
| Multi-city support | ★★★ | ★★★★★ | Month 6+ |
