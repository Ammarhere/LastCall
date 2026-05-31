import cron from 'node-cron';
import { prisma } from '../config/db';
import { sendPayoutWhatsApp } from './whatsapp.service';
import { sendPayoutEmail } from './email.service';
import { logger } from '../middleware/requestLogger';

/**
 * Runs every Monday at 9am PKT (UTC+5 = 4am UTC).
 * Calculates each partner's earnings from the previous Mon–Sun and creates Payout records.
 */
export function startPayoutCron() {
  cron.schedule('0 4 * * 1', async () => {
    logger.info('Starting weekly payout run');

    const now       = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(now.getDate() - 1); // last Sunday
    periodEnd.setHours(23, 59, 59, 999);

    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodEnd.getDate() - 6); // last Monday
    periodStart.setHours(0, 0, 0, 0);

    const partners = await prisma.partner.findMany({ where: { status: 'APPROVED' }, include: { user: true } });

    for (const partner of partners) {
      const result = await prisma.order.aggregate({
        where: {
          partnerId:   partner.id,
          orderStatus: 'PICKED_UP',
          pickedUpAt:  { gte: periodStart, lte: periodEnd },
        },
        _sum:   { totalAmount: true, commissionAmt: true, partnerPayoutAmt: true },
        _count: true,
      });

      const gross      = result._sum.totalAmount      ?? 0;
      const commission = result._sum.commissionAmt    ?? 0;
      const net        = result._sum.partnerPayoutAmt ?? 0;

      if (net <= 0) continue;

      const payout = await prisma.payout.create({
        data: {
          partnerId:          partner.id,
          periodStart,
          periodEnd,
          orderCount:         result._count,
          grossAmount:        gross,
          commissionDeducted: commission,
          netAmount:          net,
          status:             'PENDING',
        },
      });

      logger.info({ partnerId: partner.id, net }, 'Payout created');

      // Notify partner
      await Promise.allSettled([
        partner.user.phone && sendPayoutWhatsApp(partner.user.phone, net, `${periodStart.toDateString()} – ${periodEnd.toDateString()}`),
        partner.user.email && sendPayoutEmail(partner.user.email, payout),
      ]);
    }

    logger.info('Weekly payout run complete');
  }, { timezone: 'Asia/Karachi' });
}

/**
 * Runs every day at 2:00 PM PKT.
 * For each active BagTemplate, creates a Bag listing for today if one doesn't already exist.
 * This lets partners "set it and forget it" — bags auto-publish every evening without manual work.
 */
export function startTemplateCron() {
  // 14:00 PKT = 09:00 UTC
  cron.schedule('0 9 * * *', async () => {
    logger.info('Starting daily template auto-publish run');

    const DAY_MAP: Record<number, string> = {
      0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
    };
    const todayKey = DAY_MAP[new Date().getDay()];
    const today    = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active templates that run today
    const templates = await prisma.bagTemplate.findMany({
      where: {
        isActive:   true,
        activeDays: { has: todayKey },
        partner:    { status: 'APPROVED' },
      },
      include: { partner: true },
    });

    let created = 0;

    for (const template of templates) {
      // Check if a bag from this template already exists today (avoid duplicates)
      const alreadyExists = await prisma.bag.findFirst({
        where: {
          partnerId: template.partnerId,
          pickupDate: today,
          title:      template.title,
          status:     { in: ['DRAFT', 'AVAILABLE'] },
        },
      });

      if (alreadyExists) continue;

      await prisma.bag.create({
        data: {
          partnerId:       template.partnerId,
          cityId:          template.partner.cityId,
          title:           template.title,
          description:     template.description,
          originalPrice:   template.originalPrice,
          discountedPrice: template.discountedPrice,
          quantityTotal:   template.quantityTotal,
          quantityLeft:    template.quantityTotal,
          pickupDate:      today,
          pickupStart:     new Date(`1970-01-01T${template.pickupStart}:00`),
          pickupEnd:       new Date(`1970-01-01T${template.pickupEnd}:00`),
          status:          'AVAILABLE',
          photoUrl:        template.photoUrl,
          tags:            template.tags,
          category:        template.category,
          mealsSaved:      template.quantityTotal,
          co2SavedKg:      template.quantityTotal * 2.5,
        },
      });

      created++;
    }

    logger.info({ created, totalTemplates: templates.length }, 'Template auto-publish complete');
  }, { timezone: 'Asia/Karachi' });
}
