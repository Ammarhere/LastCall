import twilio from 'twilio';
import { env } from '../config/env';
import { normalizePKPhone, formatPKR } from '@lastcall/shared';
import { prisma } from '../config/db';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

async function send(to: string, body: string) {
  const c = getClient();
  if (!c || !env.TWILIO_WHATSAPP_FROM) return;
  try {
    await c.messages.create({
      from: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
      to:   `whatsapp:${normalizePKPhone(to)}`,
      body,
    });
  } catch (err) {
    console.error('WhatsApp send failed:', (err as any).message);
  }
}

export async function sendOrderConfirmationWhatsApp(order: any) {
  const customer = await prisma.user.findUnique({ where: { id: order.userId }, select: { phone: true, name: true } });
  const partner  = await prisma.partner.findUnique({ where: { id: order.partnerId }, select: { businessName: true, address: true } });

  if (customer) {
    await send(
      customer.phone,
      `🎉 *Last Call* - Order Confirmed!\n\nHi ${customer.name ?? 'there'}! Your order from *${partner?.businessName}* is confirmed.\n\n📍 Pickup: ${partner?.address}\n🔑 Pickup Code: *${order.pickupCode}*\n💰 Total: ${formatPKR(order.totalAmount)}\n\nSave food. Save money. 🇵🇰`,
    );
  }

  const partnerUser = await prisma.user.findFirst({
    where: { partner: { id: order.partnerId } },
    select: { phone: true },
  });
  if (partnerUser) {
    await send(
      partnerUser.phone,
      `🔔 *New Order!*\n\nYou have a new Last Call order.\n\n🎒 Bag: ${order.bag?.title ?? 'Bag'}\n👤 Customer Code: *${order.pickupCode}*\n💰 Amount: ${formatPKR(order.totalAmount)}\n\nPrepare the bag for pickup!`,
    );
  }
}

export async function sendPayoutWhatsApp(phone: string, amount: number, period: string) {
  await send(
    phone,
    `💸 *Last Call Payout*\n\nYour weekly payout of ${formatPKR(amount)} for ${period} has been processed.\n\nThank you for being a Last Call partner! 🙌`,
  );
}
