import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { formatPKR } from '@lastcall/shared';

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

async function send(to: string, subject: string, html: string) {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) return;
  try {
    await sgMail.send({ to, from: env.SENDGRID_FROM_EMAIL, subject, html });
  } catch (err) {
    console.error('Email send failed:', (err as any).message);
  }
}

export async function sendOrderReceiptEmail(to: string, order: any) {
  const html = `
    <h2>🎉 Order Confirmed — Last Call</h2>
    <p>Hi there! Here is your order receipt.</p>
    <table>
      <tr><td><b>Bag</b></td><td>${order.bag?.title}</td></tr>
      <tr><td><b>Partner</b></td><td>${order.partner?.businessName}</td></tr>
      <tr><td><b>Pickup Code</b></td><td><b>${order.pickupCode}</b></td></tr>
      <tr><td><b>Total Paid</b></td><td>${formatPKR(order.totalAmount)}</td></tr>
      <tr><td><b>Payment</b></td><td>${order.paymentMethod}</td></tr>
    </table>
    <p>Thank you for saving food with Last Call! 🇵🇰</p>
  `;
  await send(to, '🎉 Your Last Call Order Confirmation', html);
}

export async function sendPayoutEmail(to: string, payout: any) {
  const html = `
    <h2>💸 Weekly Payout — Last Call</h2>
    <p>Your payout for ${payout.periodStart} – ${payout.periodEnd} has been processed.</p>
    <table>
      <tr><td><b>Orders</b></td><td>${payout.orderCount}</td></tr>
      <tr><td><b>Gross Revenue</b></td><td>${formatPKR(payout.grossAmount)}</td></tr>
      <tr><td><b>Commission (20%)</b></td><td>${formatPKR(payout.commissionDeducted)}</td></tr>
      <tr><td><b>Net Payout</b></td><td><b>${formatPKR(payout.netAmount)}</b></td></tr>
    </table>
    <p>Thank you for being a Last Call partner! 🙌</p>
  `;
  await send(to, `💸 Your Last Call Payout — ${formatPKR(payout.netAmount)}`, html);
}

export async function sendPartnerApprovedEmail(to: string, businessName: string) {
  const html = `
    <h2>🎉 Welcome to Last Call, ${businessName}!</h2>
    <p>Your partner account has been approved. You can now start creating bags and connecting with customers who want to save food — and money.</p>
    <p><a href="${env.FRONTEND_URL}">Open the Partner App →</a></p>
  `;
  await send(to, '🎉 Your Last Call Partner Account is Approved', html);
}
