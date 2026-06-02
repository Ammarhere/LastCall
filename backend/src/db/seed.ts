/**
 * Last Call — Demo Seed Script
 * Creates realistic Karachi restaurant data for demos and testing.
 *
 * Run: cd backend && npx tsx src/db/seed.ts
 *
 * Demo accounts (all use OTP 123456):
 *   Partners: 0300-1234567 (Burns Road Biryani House)
 *             0321-9876543 (Shezan Bakehouse)
 *   Customers: 0312-1111111, 0312-2222222, 0312-3333333
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phone(n: string) {
  return `+92${n.replace(/^0/, '')}`;
}

function refCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function pickupCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
}

/** Returns a Date object with today's date and the given HH:MM time */
function todayAt(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** Returns a Date N days ago */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Last Call demo data for Karachi...\n');

  // ── 1. City + Areas ──────────────────────────────────────────────────────────

  const karachi = await prisma.city.upsert({
    where:  { slug: 'karachi' },
    update: {},
    create: {
      name: 'Karachi', slug: 'karachi', country: 'PK',
      isActive: true, latitude: 24.8607, longitude: 67.0011, radiusKm: 50,
    },
  });

  const areaSeeds = [
    { slug: 'burns-road',      name: 'Burns Road'       },
    { slug: 'dha',             name: 'DHA'              },
    { slug: 'clifton',         name: 'Clifton'          },
    { slug: 'gulshan',         name: 'Gulshan-e-Iqbal'  },
    { slug: 'saddar',          name: 'Saddar'           },
    { slug: 'north-nazimabad', name: 'North Nazimabad'  },
    { slug: 'pechs',           name: 'PECHS'            },
    { slug: 'malir',           name: 'Malir'            },
    { slug: 'bahria-town',     name: 'Bahria Town'      },
  ];

  for (const a of areaSeeds) {
    await prisma.area.upsert({
      where:  { cityId_slug: { cityId: karachi.id, slug: a.slug } },
      create: { cityId: karachi.id, ...a, isActive: true },
      update: {},
    });
  }

  const areas   = await prisma.area.findMany({ where: { cityId: karachi.id } });
  const areaMap = Object.fromEntries(areas.map(a => [a.slug, a]));
  console.log('✅ Karachi + 9 areas');

  // ── 2. Partner User Accounts ──────────────────────────────────────────────────

  const partnerSeeds = [
    {
      phone: '0300-1234567', name: 'Amir Biryani Wala',
      email: 'amir@burnsbiryani.pk',
    },
    {
      phone: '0321-9876543', name: 'Nadia Shezan',
      email: 'nadia@shezanbakehouse.pk',
    },
    {
      phone: '0333-5544332', name: 'Khalid Butt',
      email: 'khalid@buttkarahi.pk',
    },
    {
      phone: '0345-7788991', name: 'Sara Espresso',
      email: 'sara@cafeespresso.pk',
    },
    {
      phone: '0311-2233445', name: 'Hassan Savour',
      email: 'hassan@savourfoods.pk',
    },
    {
      phone: '0322-9900112', name: 'Hina Pies',
      email: 'hina@piesociety.pk',
    },
  ];

  const partnerUsers: Record<string, any> = {};
  for (const p of partnerSeeds) {
    const u = await prisma.user.upsert({
      where:  { phone: phone(p.phone) },
      update: {},
      create: {
        phone: phone(p.phone), name: p.name, email: p.email,
        role: 'PARTNER', referralCode: refCode(),
      },
    });
    partnerUsers[p.phone] = u;
  }
  console.log(`✅ ${partnerSeeds.length} partner users`);

  // ── 3. Partner Profiles ───────────────────────────────────────────────────────

  const partnerProfiles = [
    {
      userId:       partnerUsers['0300-1234567'].id,
      businessName: 'Burns Road Biryani House',
      slug:         'burns-road-biryani-house',
      category:     'Biryani',
      description:  'Karachi ki mashoor Burns Road ka asli biryani. 30 saal se zyada ka tajurba, ek lajawaab zaiqa.',
      area:         'Burns Road',
      areaSlug:     'burns-road',
      address:      'Shop 12, Burns Road Food Street, Saddar, Karachi',
      latitude:     24.8726, longitude: 67.0270,
      commissionPct: 20,
      status:       'APPROVED' as const,
      rating:       4.7,
      reviewCount:  142,
      totalBagsListed: 89,
      totalBagsSold:   81,
      isFeatured:   true,
      pickupInstructions: 'Counter number 3 pe aayein, code batayein',
      logoUrl:      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&h=200&fit=crop',
    },
    {
      userId:       partnerUsers['0321-9876543'].id,
      businessName: 'Shezan Bakehouse',
      slug:         'shezan-bakehouse',
      category:     'Bakery',
      description:  'DHA ki premium bakery. Daily fresh pastries, cakes, and breads. Jo bik nahi ta, aap ko discount pe milta hai.',
      area:         'DHA',
      areaSlug:     'dha',
      address:      'Plot 5-C, Lane 7, DHA Phase 6, Karachi',
      latitude:     24.8079, longitude: 67.0602,
      commissionPct: 18,
      status:       'APPROVED' as const,
      rating:       4.5,
      reviewCount:  93,
      totalBagsListed: 67,
      totalBagsSold:   62,
      isFeatured:   true,
      pickupInstructions: 'Main entrance se andar aayein, billing counter pe code batayein',
      logoUrl:      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
    },
    {
      userId:       partnerUsers['0333-5544332'].id,
      businessName: 'Butt Karahi & BBQ',
      slug:         'butt-karahi-bbq',
      category:     'Restaurant',
      description:  'Authentic Punjabi karahi aur bbq. Burns Road pe 15 saalon se. Raat ko closing time pe fresh karahi ki bags available.',
      area:         'Burns Road',
      areaSlug:     'burns-road',
      address:      'Near Radio Pakistan, Burns Road, Karachi',
      latitude:     24.8720, longitude: 67.0265,
      commissionPct: 20,
      status:       'APPROVED' as const,
      rating:       4.6,
      reviewCount:  78,
      totalBagsListed: 45,
      totalBagsSold:   40,
      isFeatured:   false,
      pickupInstructions: 'Bahar se awaz den, bags ready hain',
      logoUrl:      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop',
    },
    {
      userId:       partnerUsers['0345-7788991'].id,
      businessName: 'Café Espresso',
      slug:         'cafe-espresso',
      category:     'Café',
      description:  'Clifton ka cozy cafe. Fresh sandwiches, pastries, aur coffee. Daily closing time pe surplus items heavily discounted.',
      area:         'Clifton',
      areaSlug:     'clifton',
      address:      'Block 5, Clifton, Karachi',
      latitude:     24.8254, longitude: 67.0291,
      commissionPct: 20,
      status:       'APPROVED' as const,
      rating:       4.3,
      reviewCount:  56,
      totalBagsListed: 34,
      totalBagsSold:   30,
      isFeatured:   false,
      pickupInstructions: 'Counter pe code show karein',
      logoUrl:      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop',
    },
    {
      userId:       partnerUsers['0311-2233445'].id,
      businessName: 'Savour Foods',
      slug:         'savour-foods-gulshan',
      category:     'Restaurant',
      description:  'Gulshan ka famous family restaurant. Desi khana, Chinese, fast food — sab kuch. Dinner ke baad bachne wala khana ab aap ka.',
      area:         'Gulshan-e-Iqbal',
      areaSlug:     'gulshan',
      address:      'Block 14, Gulshan-e-Iqbal, Karachi',
      latitude:     24.9296, longitude: 67.1031,
      commissionPct: 20,
      status:       'APPROVED' as const,
      rating:       4.2,
      reviewCount:  44,
      totalBagsListed: 28,
      totalBagsSold:   24,
      isFeatured:   false,
      pickupInstructions: 'Restaurant ke side door se aayein',
      logoUrl:      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
    },
    {
      userId:       partnerUsers['0322-9900112'].id,
      businessName: 'Pie Society',
      slug:         'pie-society-pechs',
      category:     'Bakery',
      description:  'PECHS ki artisan bakery. Handmade pies, quiches, tarts aur breads. Closing time pe fresh baked goodness at 70% off.',
      area:         'PECHS',
      areaSlug:     'pechs',
      address:      'PECHS Block 2, Karachi',
      latitude:     24.8722, longitude: 67.0599,
      commissionPct: 20,
      status:       'APPROVED' as const,
      rating:       4.8,
      reviewCount:  67,
      totalBagsListed: 52,
      totalBagsSold:   49,
      isFeatured:   true,
      pickupInstructions: 'Buzzer bajao, hum bags le aayein ge',
      logoUrl:      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200&h=200&fit=crop',
    },
  ];

  const createdPartners: Record<string, any> = {};
  for (const p of partnerProfiles) {
    const existing = await prisma.partner.findFirst({ where: { userId: p.userId } });
    if (existing) {
      createdPartners[p.businessName] = existing;
      continue;
    }
    const { areaSlug, ...data } = p;
    const partner = await prisma.partner.create({
      data: {
        ...data,
        cityId: karachi.id,
      },
    });
    createdPartners[p.businessName] = partner;
  }
  console.log(`✅ ${Object.keys(createdPartners).length} partner profiles`);

  // ── 4. Customer Accounts ──────────────────────────────────────────────────────

  const customerSeeds = [
    { phone: '0312-1111111', name: 'Ahmed Hassan',   email: 'ahmed.hassan@gmail.com'  },
    { phone: '0312-2222222', name: 'Sara Khan',      email: 'sara.khan@gmail.com'     },
    { phone: '0312-3333333', name: 'Usman Siddiqui', email: 'usman.s@gmail.com'       },
    { phone: '0312-4444444', name: 'Fatima Malik',   email: 'fatima.malik@gmail.com'  },
    { phone: '0312-5555555', name: 'Bilal Ahmed',    email: 'bilal.ahmed@gmail.com'   },
    { phone: '0312-6666666', name: 'Zara Hussain',   email: 'zara.hussain@gmail.com'  },
  ];

  const customers: Record<string, any> = {};
  for (const c of customerSeeds) {
    const u = await prisma.user.upsert({
      where:  { phone: phone(c.phone) },
      update: {},
      create: {
        phone: phone(c.phone), name: c.name, email: c.email,
        role: 'CUSTOMER', referralCode: refCode(),
      },
    });
    customers[c.phone] = u;
  }
  console.log(`✅ ${customerSeeds.length} customer accounts`);

  // ── 5. Favourites ────────────────────────────────────────────────────────────

  const biryaniPartner  = createdPartners['Burns Road Biryani House'];
  const shezanPartner   = createdPartners['Shezan Bakehouse'];
  const buttPartner     = createdPartners['Butt Karahi & BBQ'];
  const cafePartner     = createdPartners['Café Espresso'];
  const savourPartner   = createdPartners['Savour Foods'];
  const piePartner      = createdPartners['Pie Society'];

  const favouritePairs = [
    { userId: customers['0312-1111111'].id, partnerId: biryaniPartner.id },
    { userId: customers['0312-1111111'].id, partnerId: shezanPartner.id  },
    { userId: customers['0312-1111111'].id, partnerId: piePartner.id     },
    { userId: customers['0312-2222222'].id, partnerId: biryaniPartner.id },
    { userId: customers['0312-2222222'].id, partnerId: cafePartner.id    },
    { userId: customers['0312-3333333'].id, partnerId: buttPartner.id    },
    { userId: customers['0312-3333333'].id, partnerId: biryaniPartner.id },
    { userId: customers['0312-4444444'].id, partnerId: piePartner.id     },
    { userId: customers['0312-4444444'].id, partnerId: shezanPartner.id  },
    { userId: customers['0312-5555555'].id, partnerId: savourPartner.id  },
    { userId: customers['0312-6666666'].id, partnerId: cafePartner.id    },
    { userId: customers['0312-6666666'].id, partnerId: piePartner.id     },
  ];

  for (const f of favouritePairs) {
    await prisma.favourite.upsert({
      where:  { userId_partnerId: f },
      create: f,
      update: {},
    });
  }
  console.log(`✅ ${favouritePairs.length} favourites`);

  // ── 6. Bags ───────────────────────────────────────────────────────────────────

  const today     = new Date();
  today.setUTCHours(0, 0, 0, 0);  // Always use UTC midnight — matches Render's timezone
  const todayStr  = today.toISOString().split('T')[0];

  // Helper: pickup time stored as 1970 date with time
  function pt(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(1970, 0, 1, h, m, 0);
  }

  const bagSeeds = [
    // AVAILABLE TODAY
    {
      partnerId:       biryaniPartner.id,
      cityId:          karachi.id,
      title:           'Biryani Surprise Box',
      description:     'Raat ke bachey hue chicken ya mutton biryani ka mix. Rs. 400+ ki value, aap ko Rs. 130 mein.',
      originalPrice:   420,
      discountedPrice: 130,
      quantityTotal:   6,
      quantityLeft:    4,
      pickupDate:      today,
      pickupStart:     pt('20:30'),
      pickupEnd:       pt('22:00'),
      status:          'AVAILABLE' as const,
      tags:            ['biryani', 'rice', 'chicken', 'mutton'],
      category:        'Biryani',
      co2SavedKg:      6 * 2.5,
      mealsSaved:      6,
      photoUrl:        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    },
    {
      partnerId:       shezanPartner.id,
      cityId:          karachi.id,
      title:           'Bakery Mix Box',
      description:     'Aaj ki fresh baked items — croissants, cookies, muffins, pastries ka surprise mix. Rs. 650+ ki value.',
      originalPrice:   650,
      discountedPrice: 195,
      quantityTotal:   4,
      quantityLeft:    3,
      pickupDate:      today,
      pickupStart:     pt('19:00'),
      pickupEnd:       pt('21:00'),
      status:          'AVAILABLE' as const,
      tags:            ['bakery', 'pastry', 'sweet', 'bread'],
      category:        'Bakery',
      co2SavedKg:      4 * 2.5,
      mealsSaved:      4,
      photoUrl:        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    },
    {
      partnerId:       buttPartner.id,
      cityId:          karachi.id,
      title:           'Karahi & Naan Box',
      description:     'Aaj ki fresh chicken karahi + 4 naan. Ghar wali taste, bazaar ka price. Rs. 700 ki karahi sirf Rs. 220 mein.',
      originalPrice:   700,
      discountedPrice: 220,
      quantityTotal:   3,
      quantityLeft:    2,
      pickupDate:      today,
      pickupStart:     pt('21:00'),
      pickupEnd:       pt('23:00'),
      status:          'AVAILABLE' as const,
      tags:            ['karahi', 'naan', 'chicken', 'desi'],
      category:        'Restaurant',
      co2SavedKg:      3 * 2.5,
      mealsSaved:      3,
      photoUrl:        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    },
    {
      partnerId:       cafePartner.id,
      cityId:          karachi.id,
      title:           'Café Snack Bag',
      description:     'Aaj ke unsold sandwiches, wraps, aur pastries. Perfect evening snack. Normally Rs. 500+.',
      originalPrice:   500,
      discountedPrice: 150,
      quantityTotal:   5,
      quantityLeft:    5,
      pickupDate:      today,
      pickupStart:     pt('18:30'),
      pickupEnd:       pt('20:30'),
      status:          'AVAILABLE' as const,
      tags:            ['sandwich', 'cafe', 'snack', 'pastry'],
      category:        'Café',
      co2SavedKg:      5 * 2.5,
      mealsSaved:      5,
      photoUrl:        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    },
    {
      partnerId:       savourPartner.id,
      cityId:          karachi.id,
      title:           'Family Desi Box',
      description:     'Mixed desi khana — dal, sabzi, roti, aur kuch khwab. Jo bhi aaj bana, us ka best selection.',
      originalPrice:   550,
      discountedPrice: 165,
      quantityTotal:   4,
      quantityLeft:    4,
      pickupDate:      today,
      pickupStart:     pt('21:30'),
      pickupEnd:       pt('22:30'),
      status:          'AVAILABLE' as const,
      tags:            ['desi', 'dal', 'roti', 'mixed'],
      category:        'Restaurant',
      co2SavedKg:      4 * 2.5,
      mealsSaved:      4,
      photoUrl:        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    },
    {
      partnerId:       piePartner.id,
      cityId:          karachi.id,
      title:           'Artisan Pie Box',
      description:     'Today\'s leftover pies aur quiches. Chicken pie, vegetable quiche, and seasonal tart. Handmade aur fully fresh.',
      originalPrice:   800,
      discountedPrice: 240,
      quantityTotal:   3,
      quantityLeft:    2,
      pickupDate:      today,
      pickupStart:     pt('19:30'),
      pickupEnd:       pt('21:30'),
      status:          'AVAILABLE' as const,
      tags:            ['pie', 'quiche', 'artisan', 'fresh'],
      category:        'Bakery',
      co2SavedKg:      3 * 2.5,
      mealsSaved:      3,
      photoUrl:        'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80',
    },
    // SOLD OUT (for realism)
    {
      partnerId:       biryaniPartner.id,
      cityId:          karachi.id,
      title:           'Biryani Family Pack',
      description:     'Aaj subah wali biryani ka pack. Sold out ho gaya!',
      originalPrice:   800,
      discountedPrice: 250,
      quantityTotal:   4,
      quantityLeft:    0,
      pickupDate:      today,
      pickupStart:     pt('13:00'),
      pickupEnd:       pt('15:00'),
      status:          'SOLD_OUT' as const,
      tags:            ['biryani', 'family'],
      category:        'Biryani',
      co2SavedKg:      4 * 2.5,
      mealsSaved:      4,
      photoUrl:        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    },
    {
      partnerId:       shezanPartner.id,
      cityId:          karachi.id,
      title:           'Morning Bread Box',
      description:     'Fresh morning breads — sold out in 20 minutes!',
      originalPrice:   400,
      discountedPrice: 120,
      quantityTotal:   5,
      quantityLeft:    0,
      pickupDate:      today,
      pickupStart:     pt('09:00'),
      pickupEnd:       pt('11:00'),
      status:          'SOLD_OUT' as const,
      tags:            ['bread', 'morning'],
      category:        'Bakery',
      co2SavedKg:      5 * 2.5,
      mealsSaved:      5,
      photoUrl:        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    },
  ];

  const createdBags: any[] = [];
  for (const b of bagSeeds) {
    // Check if similar bag exists today for this partner
    const existing = await prisma.bag.findFirst({
      where: { partnerId: b.partnerId, title: b.title, pickupDate: today },
    });
    if (existing) { createdBags.push(existing); continue; }
    const bag = await prisma.bag.create({ data: b });
    createdBags.push(bag);
  }
  console.log(`✅ ${createdBags.length} bags (${createdBags.filter(b => b.status === 'AVAILABLE').length} available, ${createdBags.filter(b => b.status === 'SOLD_OUT').length} sold out)`);

  // ── 7. Past orders (PICKED_UP) for stats + reviews ───────────────────────────

  const availableBiryani = createdBags.find(b => b.title === 'Biryani Surprise Box' && b.status === 'AVAILABLE')!;
  const availableShezan  = createdBags.find(b => b.title === 'Bakery Mix Box')!;
  const availablePie     = createdBags.find(b => b.title === 'Artisan Pie Box')!;
  const soldOutBiryani   = createdBags.find(b => b.status === 'SOLD_OUT' && b.partnerId === biryaniPartner.id)!;
  const soldOutShezan    = createdBags.find(b => b.status === 'SOLD_OUT' && b.partnerId === shezanPartner.id)!;

  const pastOrderSeeds = [
    // Customer 1 — Ahmed Hassan (multiple orders, has reviews)
    {
      bagId: soldOutBiryani.id, userId: customers['0312-1111111'].id,
      partnerId: biryaniPartner.id, quantity: 1,
      unitPrice: 130, totalAmount: 130,
      commissionAmt: 26, partnerPayoutAmt: 104,
      paymentMethod: 'JAZZCASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(1),
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      bagId: soldOutShezan.id, userId: customers['0312-1111111'].id,
      partnerId: shezanPartner.id, quantity: 1,
      unitPrice: 195, totalAmount: 195,
      commissionAmt: 35, partnerPayoutAmt: 160,
      paymentMethod: 'CASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(2),
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    // Customer 2 — Sara Khan
    {
      bagId: soldOutBiryani.id, userId: customers['0312-2222222'].id,
      partnerId: biryaniPartner.id, quantity: 1,
      unitPrice: 130, totalAmount: 130,
      commissionAmt: 26, partnerPayoutAmt: 104,
      paymentMethod: 'EASYPAISA' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(1),
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      bagId: soldOutShezan.id, userId: customers['0312-2222222'].id,
      partnerId: shezanPartner.id, quantity: 1,
      unitPrice: 195, totalAmount: 195,
      commissionAmt: 35, partnerPayoutAmt: 160,
      paymentMethod: 'CASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(3),
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    // Customer 3 — Usman
    {
      bagId: soldOutBiryani.id, userId: customers['0312-3333333'].id,
      partnerId: biryaniPartner.id, quantity: 1,
      unitPrice: 130, totalAmount: 130,
      commissionAmt: 26, partnerPayoutAmt: 104,
      paymentMethod: 'CASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(2),
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    // Customer 4 — Fatima
    {
      bagId: soldOutShezan.id, userId: customers['0312-4444444'].id,
      partnerId: shezanPartner.id, quantity: 1,
      unitPrice: 195, totalAmount: 195,
      commissionAmt: 35, partnerPayoutAmt: 160,
      paymentMethod: 'JAZZCASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(1),
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    // Customer 5 — Bilal
    {
      bagId: soldOutBiryani.id, userId: customers['0312-5555555'].id,
      partnerId: biryaniPartner.id, quantity: 1,
      unitPrice: 130, totalAmount: 130,
      commissionAmt: 26, partnerPayoutAmt: 104,
      paymentMethod: 'CASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'PICKED_UP' as const,
      pickupCode: pickupCode(), pickedUpAt: daysAgo(4),
      createdAt: daysAgo(4), updatedAt: daysAgo(4),
    },
    // Today's active orders (CONFIRMED)
    {
      bagId: availableBiryani.id, userId: customers['0312-6666666'].id,
      partnerId: biryaniPartner.id, quantity: 1,
      unitPrice: 130, totalAmount: 130,
      commissionAmt: 26, partnerPayoutAmt: 104,
      paymentMethod: 'JAZZCASH' as const, paymentStatus: 'PAID' as const,
      orderStatus: 'CONFIRMED' as const,
      pickupCode: pickupCode(),
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      bagId: availableShezan.id, userId: customers['0312-1111111'].id,
      partnerId: shezanPartner.id, quantity: 1,
      unitPrice: 195, totalAmount: 195,
      commissionAmt: 35, partnerPayoutAmt: 160,
      paymentMethod: 'CASH' as const, paymentStatus: 'PENDING' as const,
      orderStatus: 'READY' as const,
      pickupCode: pickupCode(),
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      bagId: availablePie.id, userId: customers['0312-2222222'].id,
      partnerId: piePartner.id, quantity: 1,
      unitPrice: 240, totalAmount: 240,
      commissionAmt: 48, partnerPayoutAmt: 192,
      paymentMethod: 'CASH' as const, paymentStatus: 'PENDING' as const,
      orderStatus: 'CONFIRMED' as const,
      pickupCode: pickupCode(),
      createdAt: new Date(), updatedAt: new Date(),
    },
  ];

  const createdOrders: any[] = [];
  for (const o of pastOrderSeeds) {
    try {
      const order = await prisma.order.create({ data: o });
      createdOrders.push(order);
    } catch (e: any) {
      if (e.code !== 'P2002') throw e; // ignore unique constraint (duplicate)
    }
  }
  console.log(`✅ ${createdOrders.length} orders (${createdOrders.filter(o => o.orderStatus === 'PICKED_UP').length} picked up, ${createdOrders.filter(o => o.orderStatus === 'CONFIRMED').length} confirmed)`);

  // ── 8. Reviews ────────────────────────────────────────────────────────────────

  const pickedUpOrders = createdOrders.filter(o => o.orderStatus === 'PICKED_UP');

  const reviewData = [
    {
      rating: 5,
      comment: 'Masha Allah! Itni sasti biryani aur itni achi quality! 5 star. Last Call ne meri life badal di. Kal bhi aaunga.',
      partnerReply: 'Jazak Allah khair Ahmed bhai! Aap ki tarah ke customers se himmat milti hai. Kal zaroor aayein!',
    },
    {
      rating: 5,
      comment: 'Shezan ki bakery best hai Karachi mein. Rs. 195 mein croissants, muffins aur cake slice — yaar ye toh band hi nahi hona chahiye!',
      partnerReply: 'Shukriya Sara ji! Aap ki satisfaction hamari mehnat ka sabse bada reward hai.',
    },
    {
      rating: 4,
      comment: 'Biryani achi thi, quantity thodi aur hoti toh 5 star deta. Overall value for money excellent.',
    },
    {
      rating: 5,
      comment: 'Kya tha wow! Ye bag service Karachi ke liye game changer hai. Bakery items bilkul fresh the.',
    },
    {
      rating: 4,
      comment: 'Good value. Biryani mein kuch items expected se different the but sab kuch fresh aur tasty tha.',
      partnerReply: 'Shukriya Usman bhai! Hum try karte hain ke agle baar aur acha surprise ho!',
    },
    {
      rating: 5,
      comment: 'Amazing! Pie Society ki pies simply outstanding hain. Rs. 240 mein 3 pies — total steal!',
    },
    {
      rating: 5,
      comment: 'Yaar ye last call app bohot achi cheez hai. Khana waste hone se bachta hai aur hum ko sasta milta hai. Win win!',
    },
  ];

  let reviewCount = 0;
  for (let i = 0; i < Math.min(pickedUpOrders.length, reviewData.length); i++) {
    const order = pickedUpOrders[i];
    const rv    = reviewData[i];
    const existingReview = await prisma.review.findUnique({ where: { orderId: order.id } });
    if (existingReview) continue;
    await prisma.review.create({
      data: {
        orderId:         order.id,
        userId:          order.userId,
        partnerId:       order.partnerId,
        rating:          rv.rating,
        comment:         rv.comment,
        partnerReply:    rv.partnerReply,
        partnerRepliedAt: rv.partnerReply ? daysAgo(0) : undefined,
        isVisible:       true,
        createdAt:       new Date(order.createdAt),
      },
    });
    reviewCount++;
  }
  console.log(`✅ ${reviewCount} reviews`);

  // ── 9. Update partner ratings ─────────────────────────────────────────────────

  for (const partner of Object.values(createdPartners)) {
    const agg = await prisma.review.aggregate({
      where: { partnerId: partner.id, isVisible: true },
      _avg: { rating: true }, _count: true,
    });
    if (agg._count > 0) {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
      });
    }
  }
  console.log('✅ Partner ratings updated');

  // ── 10. Weekly payout record ──────────────────────────────────────────────────

  const biryaniPickedUp = createdOrders.filter(o =>
    o.orderStatus === 'PICKED_UP' && o.partnerId === biryaniPartner.id
  );
  if (biryaniPickedUp.length > 0) {
    const gross      = biryaniPickedUp.reduce((s, o) => s + o.totalAmount, 0);
    const commission = biryaniPickedUp.reduce((s, o) => s + o.commissionAmt, 0);
    const net        = biryaniPickedUp.reduce((s, o) => s + o.partnerPayoutAmt, 0);
    const existing   = await prisma.payout.findFirst({ where: { partnerId: biryaniPartner.id } });
    if (!existing) {
      await prisma.payout.create({
        data: {
          partnerId:          biryaniPartner.id,
          periodStart:        daysAgo(7),
          periodEnd:          daysAgo(1),
          orderCount:         biryaniPickedUp.length,
          grossAmount:        gross,
          commissionDeducted: commission,
          netAmount:          net,
          status:             'COMPLETED',
          method:             'JAZZCASH',
          txnRef:             `LC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          processedAt:        daysAgo(0),
        },
      });
    }
  }
  console.log('✅ Sample payout record');

  // ── 11. Impact stats ──────────────────────────────────────────────────────────

  const totalPickedUp = createdOrders.filter(o => o.orderStatus === 'PICKED_UP').length;
  await prisma.impactStat.upsert({
    where:  { date: today },
    update: {},
    create: {
      date:             today,
      bagsSaved:        totalPickedUp,
      mealsSaved:       totalPickedUp,
      co2SavedKg:       totalPickedUp * 2.5,
      waterSavedLiters: totalPickedUp * 100,
      partnerCount:     Object.keys(createdPartners).length,
      customerCount:    customerSeeds.length,
    },
  });
  console.log('✅ Impact stats');

  // ── 12. Bag templates for demo partner ────────────────────────────────────────

  const templateExists = await prisma.bagTemplate.findFirst({ where: { partnerId: biryaniPartner.id } });
  if (!templateExists) {
    await prisma.bagTemplate.create({
      data: {
        partnerId:       biryaniPartner.id,
        title:           'Biryani Surprise Box',
        description:     'Raat ke bachey hue chicken ya mutton biryani ka mix. Rs. 400+ ki value.',
        originalPrice:   420,
        discountedPrice: 130,
        quantityTotal:   5,
        pickupStart:     '20:30',
        pickupEnd:       '22:00',
        activeDays:      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        isActive:        true,
        tags:            ['biryani', 'rice', 'chicken'],
        category:        'Biryani',
        photoUrl:        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
      },
    });
  }

  const shezanTemplateExists = await prisma.bagTemplate.findFirst({ where: { partnerId: shezanPartner.id } });
  if (!shezanTemplateExists) {
    await prisma.bagTemplate.create({
      data: {
        partnerId:       shezanPartner.id,
        title:           'Bakery Mix Box',
        description:     'Daily fresh baked items — croissants, cookies, muffins, pastries.',
        originalPrice:   650,
        discountedPrice: 195,
        quantityTotal:   4,
        pickupStart:     '19:00',
        pickupEnd:       '21:00',
        activeDays:      ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        isActive:        true,
        tags:            ['bakery', 'pastry', 'sweet'],
        category:        'Bakery',
        photoUrl:        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
    });
  }
  console.log('✅ Bag templates');

  // ── 13. Notifications ─────────────────────────────────────────────────────────

  const notifData = [
    {
      userId: customers['0312-1111111'].id,
      title:  '✅ Order Confirmed!',
      body:   'Aap ka order Burns Road Biryani House se confirm ho gaya. Pickup code: ready hai.',
      channel: 'PUSH' as const,
    },
    {
      userId: customers['0312-1111111'].id,
      title:  '🛍️ New bag from Shezan Bakehouse!',
      body:   'Aap ki favourite bakery ne naya bag list kiya hai — sirf Rs. 195 mein!',
      channel: 'PUSH' as const,
    },
    {
      userId: customers['0312-2222222'].id,
      title:  '🎉 Pickup Confirmed!',
      body:   'Enjoy karein! Aap ne ek meal waste hone se bachaya. 2.5 kg CO₂ saved!',
      channel: 'PUSH' as const,
    },
    {
      userId: customers['0312-3333333'].id,
      title:  '⭐ Leave a Review',
      body:   'Burns Road Biryani House kesa tha? Apna review dein!',
      channel: 'IN_APP' as const,
    },
  ];

  for (const n of notifData) {
    await prisma.notification.create({ data: { ...n, isRead: false } });
  }
  console.log('✅ Sample notifications\n');

  // ── Summary ───────────────────────────────────────────────────────────────────

  const summary = await Promise.all([
    prisma.partner.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.bag.count({ where: { status: 'AVAILABLE' } }),
    prisma.order.count(),
    prisma.order.aggregate({ where: { orderStatus: 'PICKED_UP' }, _sum: { totalAmount: true } }),
  ]);

  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 Last Call demo data seeded successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📊 Platform stats:`);
  console.log(`   ${summary[0]} active partners`);
  console.log(`   ${summary[1]} customers`);
  console.log(`   ${summary[2]} bags available today`);
  console.log(`   ${summary[3]} total orders`);
  console.log(`   Rs. ${summary[4]._sum.totalAmount?.toFixed(0) ?? 0} total GMV`);
  console.log('');
  console.log('📱 Demo partner logins (OTP: 123456):');
  console.log('   Burns Road Biryani House → 0300-1234567');
  console.log('   Shezan Bakehouse         → 0321-9876543');
  console.log('');
  console.log('👤 Demo customer logins (OTP: 123456):');
  console.log('   Ahmed Hassan  → 0312-1111111 (has orders + reviews)');
  console.log('   Sara Khan     → 0312-2222222');
  console.log('   Usman Siddiqui → 0312-3333333');
  console.log('═══════════════════════════════════════════════════');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
