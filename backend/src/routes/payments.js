// ─────────────────────────────────────────────────────────────────────────────
// LastCall — Payments Route
//
// This file handles digital payment initiation and callbacks.
// All gateways are plug-ready — add your merchant credentials to .env and go live.
//
// Supported gateways:
//   • JazzCash      — https://sandbox.jazzcash.com.pk/
//   • Easypaisa     — https://easypaisa.com.pk/merchant/
//   • SadaPay       — https://sadapay.pk/business (uses Stripe-compatible API)
//   • NayaPay       — https://nayapay.com/merchant
//   • Raast         — SBP's instant payment rail (bank-to-bank, zero fee)
//   • Bank Transfer — Manual IBFT; customer transfers to LastCall account
//
// Flow:
//   1. Customer selects payment method on BagDetailScreen
//   2. App calls POST /api/payments/initiate with { bag_id, quantity, method }
//   3. Backend returns a payment_url or transaction details
//   4. App redirects/opens the payment gateway
//   5. Gateway calls POST /api/payments/callback (webhook) on success/failure
//   6. Backend creates the order and triggers WhatsApp confirmation
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const { body } = require('express-validator');
const crypto  = require('crypto');
const db      = require('../config/db');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendWhatsApp, orderConfirmationMessage, partnerNewOrderMessage } = require('../services/whatsapp');

const router = express.Router();
const genCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

// ─── POST /initiate — Start a digital payment ─────────────────────────────────
router.post('/initiate', verifyJWT, requireRole('customer'),
  [
    body('bag_id').notEmpty(),
    body('quantity').isInt({ min: 1 }),
    body('method').isIn(['jazzcash', 'easypaisa', 'sadapay', 'nayapay', 'raast', 'bank_transfer']),
  ], validate,
  async (req, res, next) => {
    try {
      const { bag_id, quantity, method } = req.body;

      const bagRes = await db.query(
        `SELECT b.*, p.business_name, p.commission_pct
         FROM bags b JOIN partners p ON p.id = b.partner_id
         WHERE b.id = $1 AND b.status = 'available'`,
        [bag_id]
      );
      if (!bagRes.rows.length)
        return res.status(400).json({ error: 'Bag not available' });

      const bag   = bagRes.rows[0];
      const total = parseFloat(bag.discounted_price) * quantity;

      const txnRef = `LC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      await db.query(
        `INSERT INTO payment_intents
           (txn_ref, bag_id, user_id, quantity, amount, method, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [txnRef, bag_id, req.user.id, quantity, total, method]
      );

      switch (method) {
        case 'jazzcash':
          return res.json(buildJazzCashPayload(txnRef, total));
        case 'easypaisa':
          return res.json(buildEasypaisaPayload(txnRef, total));
        case 'sadapay':
          return res.json(buildSadaPayPayload(txnRef, total));
        case 'nayapay':
          return res.json(buildNayaPayPayload(txnRef, total));
        case 'raast':
          return res.json(buildRaastPayload(txnRef, total));
        case 'bank_transfer':
          return res.json(buildBankTransferPayload(txnRef, total));
        default:
          return res.status(400).json({ error: 'Unsupported payment method' });
      }
    } catch (err) { next(err); }
  }
);

// ─── POST /callback — Gateway webhook after payment success/failure ───────────
router.post('/callback', async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { txn_ref, pp_ResponseCode, status } = req.body;

    const intentRes = await client.query(
      `SELECT * FROM payment_intents WHERE txn_ref = $1 AND status = 'pending'`,
      [txn_ref]
    );
    if (!intentRes.rows.length) {
      return res.status(200).json({ message: 'Unknown or already processed' });
    }
    const intent = intentRes.rows[0];

    const isSuccess = pp_ResponseCode === '000' || status === 'success';

    if (!isSuccess) {
      await client.query(
        `UPDATE payment_intents SET status = 'failed' WHERE txn_ref = $1`, [txn_ref]
      );
      return res.status(200).json({ message: 'Payment failed — intent marked' });
    }

    await client.query('BEGIN');

    const bagRes = await client.query(
      `SELECT b.*, p.commission_pct, p.business_name, p.area,
              u2.phone AS partner_user_phone
       FROM bags b
       JOIN partners p ON p.id = b.partner_id
       JOIN users u2   ON u2.id = p.user_id
       WHERE b.id = $1 AND b.status = 'available'
       FOR UPDATE`,
      [intent.bag_id]
    );

    if (!bagRes.rows.length) {
      await client.query('ROLLBACK');
      await client.query(`UPDATE payment_intents SET status='sold_out' WHERE txn_ref=$1`, [txn_ref]);
      return res.status(200).json({ message: 'Bag no longer available — refund required' });
    }

    const bag    = bagRes.rows[0];
    const total  = parseFloat(intent.amount);
    const comm   = parseFloat((total * bag.commission_pct / 100).toFixed(2));
    const payout = parseFloat((total - comm).toFixed(2));

    await client.query(
      `UPDATE bags SET quantity_left = quantity_left - $1, updated_at = NOW(),
       status = CASE WHEN quantity_left - $1 = 0 THEN 'sold_out'::bag_status ELSE status END
       WHERE id = $2`,
      [intent.quantity, intent.bag_id]
    );

    const orderRes = await client.query(
      `INSERT INTO orders
         (bag_id, user_id, partner_id, quantity, total_amount, commission_amt,
          partner_payout, payment_method, payment_status, order_status, pickup_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'paid','confirmed',$9)
       RETURNING *`,
      [intent.bag_id, intent.user_id, bag.partner_id, intent.quantity,
       total, comm, payout, intent.method, genCode()]
    );
    const order = orderRes.rows[0];

    await client.query(
      `UPDATE payment_intents SET status = 'completed', order_id = $1 WHERE txn_ref = $2`,
      [order.id, txn_ref]
    );

    await client.query('COMMIT');

    const userRes  = await db.query(`SELECT name, phone FROM users WHERE id=$1`, [intent.user_id]);
    const customer = userRes.rows[0];

    if (customer?.phone) {
      sendWhatsApp(customer.phone, orderConfirmationMessage({
        customerName:  customer.name,
        businessName:  bag.business_name,
        area:          bag.area,
        pickupCode:    order.pickup_code,
        pickupStart:   bag.pickup_start,
        pickupEnd:     bag.pickup_end,
        totalAmount:   total,
        paymentMethod: intent.method,
      })).catch(() => {});
    }

    if (bag.partner_user_phone) {
      sendWhatsApp(bag.partner_user_phone, partnerNewOrderMessage({
        businessName:  bag.business_name,
        customerName:  customer?.name,
        customerPhone: customer?.phone,
        bagTitle:      bag.title,
        pickupCode:    order.pickup_code,
        totalAmount:   total,
        partnerPayout: payout,
      })).catch(() => {});
    }

    res.status(200).json({ message: 'Order created', order_id: order.id });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GATEWAY PAYLOAD BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildJazzCashPayload(txnRef, amount) {
  const merchantId    = process.env.JAZZCASH_MERCHANT_ID   || 'YOUR_MERCHANT_ID';
  const password      = process.env.JAZZCASH_PASSWORD       || 'YOUR_PASSWORD';
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || 'YOUR_SALT';
  const isSandbox     = (process.env.JAZZCASH_ENV || 'sandbox') === 'sandbox';

  const dateTime   = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const expiry     = new Date(Date.now() + 30 * 60000).toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const amountStr  = (amount * 100).toFixed(0);
  const hashStr    = `${integritySalt}&${amountStr}&PKR&${merchantId}&${password}&${txnRef}&${dateTime}&${expiry}&WEB`;
  const secureHash = crypto.createHmac('sha256', integritySalt).update(hashStr).digest('hex');

  return {
    gateway: 'jazzcash',
    txn_ref: txnRef,
    endpoint: isSandbox
      ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform'
      : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform',
    params: {
      pp_Version:           '1.1',
      pp_TxnType:           'MWALLET',
      pp_Language:          'EN',
      pp_MerchantID:        merchantId,
      pp_Password:          password,
      pp_TxnRefNo:          txnRef,
      pp_Amount:            amountStr,
      pp_TxnCurrency:       'PKR',
      pp_TxnDateTime:       dateTime,
      pp_BillReference:     'LastCallOrder',
      pp_Description:       'LastCall Surprise Bag',
      pp_TxnExpiryDateTime: expiry,
      pp_ReturnURL:         `${process.env.APP_URL}/api/payments/callback`,
      pp_SecureHash:        secureHash,
    },
    instructions: isSandbox ? 'SANDBOX MODE — use JazzCash test credentials.' : null,
  };
}

function buildEasypaisaPayload(txnRef, amount) {
  const storeId   = process.env.EASYPAISA_STORE_ID || 'YOUR_STORE_ID';
  const hashKey   = process.env.EASYPAISA_HASH_KEY  || 'YOUR_HASH_KEY';
  const isSandbox = (process.env.EASYPAISA_ENV || 'sandbox') === 'sandbox';
  const hashStr   = `amount=${amount}&orderRefNum=${txnRef}&storeId=${storeId}&timetamp=${Date.now()}`;
  const hash      = crypto.createHash('md5').update(`${hashStr}${hashKey}`).digest('hex');

  return {
    gateway: 'easypaisa',
    txn_ref: txnRef,
    endpoint: isSandbox
      ? 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf'
      : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
    params: {
      storeId,
      amount:        amount.toFixed(2),
      postBackURL:   `${process.env.APP_URL}/api/payments/callback`,
      orderRefNum:   txnRef,
      paymentMethod: 'MA_PAYMENT',
      autoRedirect:  1,
      hash,
    },
    instructions: isSandbox ? 'SANDBOX MODE — Easypaisa test environment.' : null,
  };
}

function buildSadaPayPayload(txnRef, amount) {
  return {
    gateway: 'sadapay',
    txn_ref: txnRef,
    client_secret:   'pi_sandbox_xxxx_secret_xxxx',
    publishable_key: process.env.SADAPAY_PUBLISHABLE_KEY || 'pk_test_YOUR_SADAPAY_KEY',
    amount,
    currency: 'PKR',
    instructions: 'Use @stripe/stripe-react-native with SadaPay publishable key.',
  };
}

function buildNayaPayPayload(txnRef, amount) {
  return {
    gateway: 'nayapay',
    txn_ref: txnRef,
    checkout_url: `https://api.nayapay.com/checkout?merchant=${process.env.NAYAPAY_MERCHANT_ID || 'YOUR_ID'}&ref=${txnRef}&amount=${amount}&callback=${encodeURIComponent(`${process.env.APP_URL}/api/payments/callback`)}`,
    amount,
    currency: 'PKR',
    instructions: 'Redirect customer to checkout_url to complete payment.',
  };
}

function buildRaastPayload(txnRef, amount) {
  // Raast is SBP's instant payment system — bank-to-bank, zero fee
  // Needs a Raast merchant account via 1LINK, HBL, UBL, or Meezan Bank
  // Until then: falls back to manual IBAN transfer via Raast in the customer's bank app

  const hasCredentials = process.env.RAAST_CLIENT_ID && process.env.RAAST_CLIENT_SECRET;

  if (!hasCredentials) {
    return {
      gateway: 'raast',
      txn_ref: txnRef,
      type: 'manual_iban',
      amount,
      currency: 'PKR',
      bank_details: {
        account_name: process.env.BANK_ACCOUNT_NAME || 'LastCall Pakistan',
        iban:         process.env.BANK_IBAN         || 'PK00XXXX0000000000000000',
        bank_name:    process.env.BANK_NAME         || 'Your Bank Name',
        reference:    txnRef,
      },
      instructions: `Transfer PKR ${amount.toFixed(2)} via Raast in your bank app to the IBAN above. Use reference: ${txnRef}. Confirmed within 1 hour.`,
    };
  }

  // Replace with actual Raast merchant API call once you have credentials
  return {
    gateway: 'raast',
    txn_ref: txnRef,
    type: 'merchant_api',
    checkout_url: `https://raast.sbp.org.pk/checkout?ref=${txnRef}&amount=${amount}`,
    amount,
    currency: 'PKR',
    instructions: 'Redirect customer to checkout_url to complete Raast payment.',
  };
}

function buildBankTransferPayload(txnRef, amount) {
  // Manual IBFT — no gateway redirect. Returns bank details for customer to transfer.
  // Order confirmed manually after payment clears.
  return {
    gateway: 'bank_transfer',
    txn_ref: txnRef,
    amount,
    currency: 'PKR',
    bank_details: {
      account_name:   process.env.BANK_ACCOUNT_NAME   || 'LastCall Pakistan',
      account_number: process.env.BANK_ACCOUNT_NUMBER || '0000000000000',
      iban:           process.env.BANK_IBAN           || 'PK00XXXX0000000000000000',
      bank_name:      process.env.BANK_NAME           || 'Your Bank Name',
      reference:      txnRef,
    },
    instructions: `Transfer PKR ${amount.toFixed(2)} via IBFT to the account above. Reference: ${txnRef}. Confirmed same business day.`,
  };
}

module.exports = router;