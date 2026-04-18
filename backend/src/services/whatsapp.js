const twilio = require('twilio');

const client = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

async function sendWhatsApp(phone, message) {
  if (!client) {
    console.warn('[WhatsApp] Twilio not configured — skipped');
    return;
  }
  const normalised = normalisePK(phone);
  if (!normalised) return;
  try {
    const msg = await client.messages.create({
      from: FROM,
      to:   `whatsapp:${normalised}`,
      body: message,
    });
    console.log(`[WhatsApp] Sent to ${normalised} — SID: ${msg.sid}`);
  } catch (err) {
    console.error(`[WhatsApp] Failed:`, err.message);
  }
}

function normalisePK(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0')  && digits.length === 11)  return `+92${digits.slice(1)}`;
  if (digits.length === 10)                              return `+92${digits}`;
  return null;
}

function orderConfirmationMessage({ customerName, businessName, area, pickupCode, pickupStart, pickupEnd, totalAmount, paymentMethod }) {
  const paymentNote = paymentMethod === 'cash'
    ? `💵 Payment: Cash at pickup (PKR ${totalAmount})`
    : `✅ Payment: PKR ${totalAmount} paid digitally`;

  return `🎉 *Order Confirmed — LastCall*

Assalam-o-Alaikum ${customerName || 'there'}! Your bag is reserved.

🏪 *${businessName}*, ${area}
🎫 Pickup Code: *${pickupCode}*
🕐 Pickup: ${pickupStart} – ${pickupEnd}
${paymentNote}

Show this code at the counter. No internet needed. 📱

_Rescue food. Save money. 🛍️_`;
}

function partnerNewOrderMessage({ businessName, customerName, customerPhone, bagTitle, pickupCode, totalAmount, partnerPayout }) {
  return `📦 *New Order — LastCall*

${businessName}, you have a new order!

👤 Customer: ${customerName || 'Customer'}
📞 Phone: ${customerPhone || 'N/A'}
🎒 Bag: ${bagTitle}
🎫 Code: *${pickupCode}*
💰 Total: PKR ${totalAmount}
💵 Your share: PKR ${partnerPayout}

Verify their code in the Partner App when they arrive. ✅`;
}

module.exports = { sendWhatsApp, orderConfirmationMessage, partnerNewOrderMessage };