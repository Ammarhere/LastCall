import { getIO } from '../config/socket';
import { SocketEvents } from '@lastcall/shared';

export function emitOrderStatusChanged(userId: string, orderId: string, status: string) {
  try {
    getIO().to(`user:${userId}`).emit(SocketEvents.ORDER_STATUS_CHANGED, { orderId, status, updatedAt: new Date() });
  } catch {}
}

export function emitNewOrderToPartner(partnerId: string, order: any) {
  try {
    getIO().to(`partner:${partnerId}`).emit(SocketEvents.ORDER_NEW, {
      orderId:      order.id,
      bagTitle:     order.bag?.title,
      customerName: order.user?.name,
      pickupCode:   order.pickupCode,
    });
  } catch {}
}

export function emitBagSoldOut(bagId: string) {
  try {
    getIO().emit(SocketEvents.BAG_SOLD_OUT, { bagId });
  } catch {}
}

export function emitPartnerApproved(partnerId: string) {
  try {
    getIO().to(`partner:${partnerId}`).emit(SocketEvents.PARTNER_APPROVED, { partnerId });
    getIO().to('admin').emit(SocketEvents.PARTNER_APPROVED, { partnerId });
  } catch {}
}

export function emitNotification(userId: string, notification: { title: string; body: string; payload?: any }) {
  try {
    getIO().to(`user:${userId}`).emit(SocketEvents.NOTIFICATION_NEW, notification);
  } catch {}
}

/**
 * Emit to all connected customers in the city when a partner lists a new bag.
 * Customers subscribed to this event can show an in-app banner/toast.
 */
export function emitNewBagListing(bag: {
  id: string; title: string; discountedPrice: number;
  partnerId: string; partnerName: string; cityId: string;
}) {
  try {
    // Broadcast city-wide so any customer browsing can react
    getIO().to(`city:${bag.cityId}`).emit(SocketEvents.BAG_NEW_LISTING, {
      bagId:       bag.id,
      title:       bag.title,
      price:       bag.discountedPrice,
      partnerId:   bag.partnerId,
      partnerName: bag.partnerName,
    });
  } catch {}
}
