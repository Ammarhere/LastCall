# Last Call — Metrics & KPIs

> The numbers that tell us if Last Call is working, and what to do when they're not.

---

## North Star Metric

**Bags Saved Per Month**

This is the single number that captures both sides of the marketplace working together: bags only get sold if there are engaged partners (supply) AND engaged customers (demand). Everything else is in service of this number.

---

## Metrics Framework

Last Call tracks metrics across four areas:

```
SUPPLY          DEMAND           TRANSACTIONS         MISSION
(Partners)      (Customers)      (Marketplace)        (Impact)

Partner count   MAU              Bags sold/month       Meals saved
Active rate     DAU              Bag sell-through      CO₂ prevented
Time-to-list    Retention        GMV                   Partner food
Bag quality     NPS              Revenue               waste reduction
                CAC              Take rate
```

---

## Supply Metrics (Partners)

### 1. Total Active Partners
**Definition:** Partners with at least 1 bag sold in the last 30 days.

**Why it matters:** A registered partner who never lists is worthless to the platform. Active partners drive the supply side.

**Target:**
- Month 3: 50 active (Karachi pilot areas)
- Month 6: 200 active (Karachi-wide)
- Month 12: 500 active (Karachi + Lahore)

**Warning sign:** Active partner count drops week-over-week → investigate partner churn reasons.

---

### 2. Partner Activation Rate
**Definition:** % of approved partners who list at least one bag within their first 7 days.

**Why it matters:** If partners approve but never list, our onboarding experience has failed.

**Target:** > 70% within first 7 days.

**If below target:** Improve onboarding UX, add a "list your first bag" guided flow, have the field team call new partners proactively.

---

### 3. Partner Retention Rate
**Definition:** % of partners who were active last month who are also active this month.

**Target:** > 80% monthly retention.

**Leading indicator of churn:** Partners who didn't receive their payout on time, or who had bags expire without sales 3 weeks in a row.

---

### 4. Bags Listed Per Active Partner Per Week
**Definition:** Average number of bag listings per active partner per week.

**Why it matters:** More listings = more revenue per partner = lower churn.

**Target:** 5–7 bag listings per partner per week (roughly one per day on active days).

---

### 5. Bag Sell-Through Rate
**Definition:** % of listed bag units that are actually sold (not expired or cancelled).

```
Sell-through = (Total units sold) / (Total units listed) × 100
```

**Target:** > 75% sell-through.

**If below target:**
- Are bags priced too high? (Reduce to under Rs. 200)
- Is pickup window too short? (Extend to 2+ hours)
- Is the area not yet activated with enough customers?
- Is the bag photo missing or low quality?

---

### 6. Average Time to First Bag Listed (Partner Onboarding Speed)
**Definition:** Time from partner approval to first bag going live.

**Target:** < 24 hours.

**If slow:** Onboarding is too complex. Simplify bag creation form. Add nudge notifications ("Your account is approved! Create your first bag in 2 minutes →").

---

## Demand Metrics (Customers)

### 7. Monthly Active Users (MAU)
**Definition:** Unique customers who placed at least one order in the last 30 days.

**Target:**
- Month 3: 2,000 MAU
- Month 6: 15,000 MAU
- Month 12: 50,000 MAU

---

### 8. Customer Acquisition Cost (CAC)
**Definition:** Total marketing spend ÷ new customers acquired in that period.

**Target:** < Rs. 300 per customer (including referral credits, influencer costs, ads).

**Why it's important:** If CAC exceeds customer lifetime value (LTV), we're growing unprofitably.

---

### 9. Customer Lifetime Value (LTV)
**Definition:** Average total revenue generated per customer over their lifetime on the platform.

```
LTV = Average order value × Average orders per month × Average customer lifetime (months)
LTV = Rs. 36 (commission) × 4 orders/month × 18 months = Rs. 2,592
```

**LTV:CAC ratio target:** > 5:1 (meaning for every Rs. 300 spent acquiring a customer, we earn Rs. 1,500+ in commission over their lifetime).

---

### 10. 30-Day Customer Retention
**Definition:** % of new customers who make a second purchase within 30 days.

**Why it matters:** The first purchase is the hardest. If a customer buys once and loves it, they're likely to become regulars. Low D30 retention = product isn't delivering on its promise.

**Target:** > 45% of new customers make a second purchase within 30 days.

**If below target:** Post-purchase experience needs improvement. Common causes:
- First bag was disappointing (quality, quantity, or partner attitude)
- App notifications are not re-engaging users
- No good bags available in their area on return visits

---

### 11. 90-Day Customer Retention
**Definition:** % of customers still active 90 days after their first purchase.

**Target:** > 30% retention at 90 days.

---

### 12. Orders Per Active Customer Per Month
**Definition:** Average number of orders placed by an active customer in a given month.

**Target:** 3–5 orders per active customer per month.

**If low:** The selection or convenience isn't compelling enough for habitual use. May indicate supply-side problem (not enough partners, bags expire too early).

---

### 13. Net Promoter Score (NPS)
**Definition:** "How likely are you to recommend Last Call to a friend?" (0–10 scale)
Score = % Promoters (9–10) − % Detractors (0–6)

**Target:** > 50 (this would be excellent for a Pakistani consumer app)

**When to measure:** Send NPS survey after customer's 3rd order (enough experience to give meaningful feedback).

---

## Transaction Metrics (Marketplace)

### 14. Gross Merchandise Value (GMV)
**Definition:** Total value of all bags sold (customer payment × quantity) — before any deductions.

**Target:**
- Month 3: Rs. 500,000/month
- Month 6: Rs. 3,000,000/month
- Month 12: Rs. 15,000,000/month

---

### 15. Net Revenue
**Definition:** GMV × 20% commission rate.

**Target:**
- Month 3: Rs. 100,000/month
- Month 6: Rs. 600,000/month
- Month 12: Rs. 3,000,000/month

---

### 16. Average Order Value (AOV)
**Definition:** Total GMV ÷ Total orders.

**Target:** Rs. 160–200 per order.

**If too low (< Rs. 120):** Partners are under-pricing bags; they won't find it worthwhile.
**If too high (> Rs. 250):** Customers may hesitate; sell-through will drop.

---

### 17. Bags Sold Per Day
**Definition:** Total bags sold platform-wide on a given day.

**Daily targets:**
- Month 3: 200 bags/day
- Month 6: 1,000 bags/day
- Month 12: 3,500 bags/day

---

### 18. Cancellation Rate
**Definition:** % of confirmed orders that are subsequently cancelled (by customer or partner).

**Target:** < 5%.

**If high:** Investigate root cause. Common issues:
- Customers ordering speculatively without intending to pick up
- Partners cancelling bags because food ran out before they updated the app
- Pickup window too tight

---

### 19. No-Show Rate
**Definition:** % of orders where customer never picks up and the order expires.

**Target:** < 3%.

**Mitigation:** Send reminder push notification + WhatsApp 30 mins before pickup window closes.

---

## Mission Metrics (Food Waste Impact)

### 20. Meals Saved
**Definition:** Total bags picked up (each bag = 1 meal rescued from waste).

**Why it matters:** This is the public-facing metric that tells Last Call's story. Used in press releases, investor decks, social media milestones.

**Target:**
- Month 6: 50,000 meals saved (total)
- Month 12: 200,000 meals saved (total)

---

### 21. CO₂ Prevented (kg)
**Definition:** Meals saved × 2.5 kg CO₂ equivalent (average food waste emission factor).

**Target:**
- Month 12: 500,000 kg CO₂ prevented (= 500 tonnes)

---

### 22. Partner Food Waste Reduction Rate
**Definition:** For active partners, estimated % of daily surplus that is sold via Last Call vs. going to waste.

**Measurement:** Survey of partner managers quarterly. Self-reported.

**Target:** > 60% of surplus food sold through Last Call (remaining 40% may still be given to staff, donated, or unfortunately wasted).

---

## Operational Metrics

### 23. Payout Accuracy Rate
**Definition:** % of Monday payouts issued with zero discrepancy between calculated and sent amount.

**Target:** 100%. Any error damages trust irreparably.

---

### 24. Partner Approval Time
**Definition:** Average time from partner application submission to admin approval decision.

**Target:** < 48 hours.

---

### 25. App Rating (App Store / Play Store)
**Definition:** Average star rating on Google Play and Apple App Store.

**Target:** > 4.3 stars.

**If below target:** Monitor review content for specific complaints (bugs, missing features, partner issues).

---

## Dashboard — Weekly Metrics Review

Every Monday, the Last Call team reviews:

| Metric | Last Week | This Week | Trend |
|---|---|---|---|
| Bags sold | | | |
| GMV | | | |
| Revenue | | | |
| New partners (approved) | | | |
| Active partners | | | |
| New customers | | | |
| MAU | | | |
| D30 retention (cohort) | | | |
| Sell-through rate | | | |
| Cancellation rate | | | |
| Payout accuracy | | | |

**Red flags that trigger immediate investigation:**
- Sell-through drops below 60% for 2 consecutive weeks
- Partner active count drops > 10% week-over-week
- Cancellation rate exceeds 8%
- Any payout error

---

## Metric Relationships (How They Connect)

```
Partner count × Bags listed/partner/week
    → Total bags available
        × Sell-through rate
            → Bags sold per month  ← NORTH STAR
                × AOV
                    → GMV
                        × Take rate (20%)
                            → Revenue

Customer count × Orders/customer/month
    → Total orders
        × Retention rate
            → Long-term GMV growth
```

If bags sold are declining, diagnose whether it's a supply problem (fewer bags listed) or a demand problem (bags listed but not selling). Each has different fixes.
