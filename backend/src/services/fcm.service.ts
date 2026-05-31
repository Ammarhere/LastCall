import { firebaseMessaging } from '../config/firebase';
import { prisma } from '../config/db';

async function sendToToken(token: string, title: string, body: string, data?: Record<string, string>) {
  try {
    await firebaseMessaging.send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err) {
    console.error('FCM send failed:', (err as any).message);
  }
}

export async function sendOrderPush(userId: string, orderId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
  if (!user?.fcmToken) return;

  await sendToToken(user.fcmToken, title, body, { orderId, type: 'order' });

  // Persist in-app notification
  await prisma.notification.create({
    data: { userId, title, body, channel: 'PUSH', payload: { orderId } },
  });
}

export async function sendPartnerApprovedNotif(fcmToken: string) {
  await sendToToken(
    fcmToken,
    '🎉 You\'re approved!',
    'Your Last Call partner account has been approved. Start listing bags now!',
    { type: 'partner_approved' },
  );
}

export async function sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  if (!tokens.length) return;
  try {
    await firebaseMessaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err) {
    console.error('FCM multicast failed:', (err as any).message);
  }
}

/**
 * Notify all customers who have favourited a partner that a new bag is live.
 * Called immediately after a partner creates a bag.
 */
export async function sendNewBagListingToFans(partnerId: string, bag: {
  id: string; title: string; discountedPrice: number; quantityTotal: number;
}) {
  // Get all users who favourited this partner and have an FCM token
  const favourites = await prisma.favourite.findMany({
    where:   { partnerId },
    include: { user: { select: { id: true, fcmToken: true } } },
  });

  const tokens = favourites
    .map((f) => f.user.fcmToken)
    .filter((t): t is string => !!t);

  if (!tokens.length) return;

  const title = '🛍️ A bag just dropped!';
  const body  = `${bag.title} is available now — only ${bag.quantityTotal} left.`;

  await sendMulticast(tokens, title, body, {
    type:  'bag_new_listing',
    bagId: bag.id,
  });

  // Persist in-app notification for each fan
  const userIds = favourites.map((f) => f.user.id).filter(Boolean);
  if (userIds.length) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        body,
        channel: 'PUSH' as const,
        payload: { bagId: bag.id, type: 'bag_new_listing' },
      })),
      skipDuplicates: true,
    });
  }
}
