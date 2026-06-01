/**
 * Email Service — uses Resend (free: 3,000/month, 100/day)
 * To enable: set RESEND_API_KEY in environment variables.
 * Sign up free at resend.com
 *
 * To switch to SendGrid in future: change this file only. All callers stay the same.
 */

import { env } from '../config/env';
import { formatPKR } from '@lastcall/shared';

const EMAIL_ENABLED = !!env.RESEND_API_KEY && !!env.RESEND_FROM_EMAIL;

async function send(to: string, subject: string, html: string) {
  if (!EMAIL_ENABLED) return; // Silently skip — email not configured

  try {
    const { Resend } = require('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from:    env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', (err as any).message);
  }
}

export async function sendOrderReceiptEmail(to: string, order: any) {
  await send(to, '🎉 Your Last Call Order Confirmation', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
      <h2 style="color:#16A34A">🎉 Order Confirmed</h2>
      <p>Here is your receipt.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Bag</b></td><td style="padding:8px;border-bottom:1px solid #eee">${order.bag?.title}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Partner</b></td><td style="padding:8px;border-bottom:1px solid #eee">${order.partner?.businessName}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Pickup Code</b></td><td style="padding:8px;border-bottom:1px solid #eee"><b style="font-size:20px;letter-spacing:4px">${order.pickupCode}</b></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Total Paid</b></td><td style="padding:8px;border-bottom:1px solid #eee">${formatPKR(order.totalAmount)}</td></tr>
        <tr><td style="padding:8px"><b>Payment</b></td><td style="padding:8px">${order.paymentMethod}</td></tr>
      </table>
      <p style="color:#6b7280;margin-top:24px">Thank you for saving food with Last Call 🇵🇰</p>
    </div>
  `);
}

export async function sendPayoutEmail(to: string, payout: any) {
  await send(to, `💸 Your Last Call Payout — ${formatPKR(payout.netAmount)}`, `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
      <h2 style="color:#1d4ed8">💸 Weekly Payout</h2>
      <p>Your payout has been processed.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Period</b></td><td style="padding:8px;border-bottom:1px solid #eee">${new Date(payout.periodStart).toDateString()} – ${new Date(payout.periodEnd).toDateString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Orders</b></td><td style="padding:8px;border-bottom:1px solid #eee">${payout.orderCount}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Gross Revenue</b></td><td style="padding:8px;border-bottom:1px solid #eee">${formatPKR(payout.grossAmount)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Commission (20%)</b></td><td style="padding:8px;border-bottom:1px solid #eee">-${formatPKR(payout.commissionDeducted)}</td></tr>
        <tr><td style="padding:8px"><b>Net Payout</b></td><td style="padding:8px"><b style="color:#16A34A;font-size:18px">${formatPKR(payout.netAmount)}</b></td></tr>
      </table>
      <p style="color:#6b7280;margin-top:24px">Thank you for being a Last Call partner 🙌</p>
    </div>
  `);
}

export async function sendPartnerApprovedEmail(to: string, businessName: string) {
  await send(to, '🎉 Your Last Call Partner Account is Approved', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
      <h2 style="color:#16A34A">🎉 Welcome to Last Call, ${businessName}!</h2>
      <p>Your partner account has been approved. You can now start listing bags and connecting with customers who want to save food — and money.</p>
      <p style="color:#6b7280">Open the Last Call Partner app to get started.</p>
    </div>
  `);
}
