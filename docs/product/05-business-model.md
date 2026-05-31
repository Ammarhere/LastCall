# Last Call — Business Model

> How Last Call makes money, how partners get paid, and the economics of each transaction.

---

## Revenue Model

Last Call operates a **commission-based marketplace model**. We charge restaurants and cafés a percentage of every successful sale. There are no subscription fees, no listing fees, and no upfront costs for partners.

**Last Call only makes money when partners make money.**

---

## Commission Structure

### Standard Commission: 20%

For every bag sold through Last Call:

```
Customer pays:     Rs. 150  (the discounted price)
Last Call takes:   Rs. 30   (20% commission)
Partner receives:  Rs. 120  (80% of sale)
```

### Why 20%?

| Platform | Commission | Notes |
|---|---|---|
| Foodpanda | 25–30% + delivery | Plus customer delivery fee |
| Careem Food | 25–28% | Plus delivery |
| **Last Call** | **20%** | No delivery, no listing fee |
| Too Good To Go (Europe) | ~33% | Marketplace model |

We are meaningfully cheaper than food delivery platforms because:
1. We don't provide delivery (customer picks up)
2. We're selling food that would otherwise be wasted — so even 80% of Rs. 150 is pure upside for the partner

### Variable Commission (Partner-Level)

The commission rate can be configured per partner. This allows Last Call to:
- Offer 15% commission to high-volume or marquee partners as an incentive
- Charge up to 25% to partners who require extra support or premium features
- Default remains 20% for all new partners

---

## Transaction Economics

### Example Transaction — Cash Order

| Item | Amount |
|---|---|
| Customer pays at pickup | Rs. 200 |
| Last Call commission (20%) | Rs. 40 |
| Partner keeps immediately | Rs. 200 |
| Partner owes Last Call | Rs. 40 |
| Net partner payout on Monday | Rs. 200 - Rs. 40 = Rs. 160 settlement |

For cash orders, the partner collects the full amount. Last Call's commission is deducted from the **weekly payout** (see Payout section below).

### Example Transaction — Digital Payment (JazzCash)

| Item | Amount |
|---|---|
| Customer pays via JazzCash | Rs. 200 |
| Money received by Last Call | Rs. 200 |
| Last Call commission (20%) | Rs. 40 |
| Amount owed to partner | Rs. 160 |
| Paid out on Monday | Rs. 160 |

For digital payments, Last Call holds the money and pays the partner their 80% in the weekly payout.

---

## Payout Model

### Weekly Settlement (Every Monday)

Partners receive their earnings every **Monday by 9 AM PKT** for the previous Monday–Sunday period.

**Payout calculation per partner:**

```
Payout Amount = Sum of all PICKED_UP orders in the period
              - Last Call's commission (20%)
              - Unpaid cash order commissions from that week
```

**Payout method:** JazzCash transfer to the partner's registered mobile number. (Future: Easypaisa, Raast, bank transfer as alternatives.)

**Example weekly payout:**

| Order # | Type | Customer Paid | Partner Payout |
|---|---|---|---|
| 1 | JazzCash | Rs. 150 | Rs. 120 |
| 2 | Cash | Rs. 200 | Rs. 160 |
| 3 | Cash | Rs. 150 | Rs. 120 |
| 4 | JazzCash | Rs. 200 | Rs. 160 |
| 5 | Cash | Rs. 150 | Rs. 120 |
| **Total** | | **Rs. 850** | **Rs. 680** |

Last Call retains: Rs. 170 (20% of Rs. 850)

---

## Unit Economics

### Per Bag Economics (Platform Level)

Assuming an average bag price of **Rs. 180**:

| Metric | Value |
|---|---|
| Average bag price | Rs. 180 |
| Last Call commission (20%) | Rs. 36 |
| Partner receives | Rs. 144 |
| Payment processing cost (est.) | ~Rs. 4 |
| **Last Call net per bag** | **~Rs. 32** |

### Monthly Economics at Scale

At **100,000 bags/month** with **Rs. 180 average price:**

| Metric | Monthly |
|---|---|
| Gross Merchandise Value (GMV) | Rs. 18,000,000 |
| Last Call Revenue (20%) | Rs. 3,600,000 |
| Payment Processing (~2%) | Rs. 360,000 |
| WhatsApp/SMS costs | Rs. 100,000 |
| **Gross Profit** | **Rs. 3,140,000** |

### Break-Even Estimate

At current infrastructure costs and assuming a 5-person team:

| Cost | Monthly |
|---|---|
| Team (5 people) | Rs. 1,500,000 |
| Tech infrastructure | Rs. 200,000 |
| Payment processing | Rs. 360,000 |
| Marketing | Rs. 500,000 |
| Misc/ops | Rs. 150,000 |
| **Total costs** | **Rs. 2,710,000** |

**Break-even:** ~75,000 bags/month at Rs. 180 average.

---

## Revenue Diversification (Future)

Beyond the core 20% commission, Last Call will explore:

### 1. Featured Partner Slots
Restaurants pay a monthly fee to appear in the "Featured" section on the home screen. A premium placement product similar to sponsored listings.

**Estimated price:** Rs. 5,000–15,000/month per partner.

### 2. Promotional Partnerships
Brands (drinks, condiments, packaged foods) pay to be included in partner bags or to sponsor a week of discounts.

### 3. Corporate Meal Plans
Companies buy Last Call credit in bulk for employees — a subsidised "cheap lunch" benefit. Particularly appealing to startups and BPOs.

### 4. Data & Insights (B2B)
Anonymised, aggregated data on food waste patterns, popular cuisines, and peak demand times sold to F&B operators, urban planners, and sustainability organisations.

### 5. White-Label Platform
License the Last Call platform to other cities, countries, or organisations (NGOs, government food banks) wanting to run a similar food rescue marketplace.

---

## Pricing Strategy

### For Partners: Why Low Commission Wins

Partners have three options for end-of-day surplus food:
1. **Throw it away:** Rs. 0 revenue, 100% loss
2. **Discount themselves:** Requires staff time, no marketing reach
3. **List on Last Call:** Rs. 120 on a Rs. 150 bag, zero effort

Even at 20% commission, Last Call delivers near-pure-profit revenue on food that would otherwise generate zero. This is our core sales argument.

### For Customers: Why 50–70% Off Works

Last Call bags are priced at **50–70% off** the restaurant's normal menu price. This is calibrated to:
- Be compelling enough to drive impulse purchases
- Still generate meaningful revenue for the partner
- Be significantly cheaper than any delivery alternative (even with fees)

**Target price range:** Rs. 100 – Rs. 300 per bag.

Partners who price bags above Rs. 300 tend to see lower sell-through rates. Our onboarding guidance recommends keeping bags under Rs. 250 for maximum conversion.

---

## Cash Flow Dynamics

### Last Call's Float

For digital payments, Last Call receives the customer's payment immediately but holds the partner's 80% until Monday. This creates a **cash float** — at scale, Last Call always holds 3–7 days of partner payouts as working capital.

At 100,000 bags/month and Rs. 144 average partner payout:
- Average daily payout obligation: Rs. 480,000
- Average float (3–7 days): Rs. 1.4M – Rs. 3.4M

This float is non-interest-bearing liability to partners and should never be used for operating expenses.

### Partner Trust = Payout Reliability

The single biggest risk to partner retention is a **late or incorrect payout**. Every payout error, delay, or shortfall damages trust irreparably. Last Call's payout system must be:
- On time every Monday, without exception
- Transparent — partners must see exactly how the number was calculated
- Auditable — every order contributing to a payout must be traceable
