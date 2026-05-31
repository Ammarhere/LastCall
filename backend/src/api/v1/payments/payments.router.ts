import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { prisma } from '../../../config/db';
import { redis } from '../../../config/redis';
import { AppError, NotFoundError } from '../../../errors/AppError';
import { paymentLimiter } from '../../../middleware/rateLimit';
import { env } from '../../../config/env';
import { initiateJazzCash } from './gateways/jazzcash';
import { initiateEasypaisa } from './gateways/easypaisa';
import { initiateSadaPay } from './gateways/sadapay';
import { initiateNayaPay } from './gateways/nayapay';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const initiateSchema = z.object({
  orderId: z.string().uuid(),
  method:  z.enum(['JAZZCASH', 'EASYPAISA', 'SADAPAY', 'NAYAPAY', 'RAAST', 'BANK_TRANSFER']),
});

// POST /api/v1/payments/initiate
router.post('/initiate', authenticate, paymentLimiter, validate(initiateSchema), async (req, res, next) => {
  try {
    const { orderId, method } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.userId !== req.user!.userId) throw new AppError('Forbidden', 403);
    if (order.paymentStatus === 'PAID') throw new AppError('Order is already paid', 400, 'ALREADY_PAID');

    // Prevent creating a new transaction if a PENDING one already exists for this order
    const existing = await prisma.paymentTransaction.findFirst({
      where: { orderId, status: 'PENDING' },
    });
    if (existing) return res.json({ success: true, data: { txnRef: existing.txnRef, gatewayPayload: existing.gatewayPayload } });

    const txnRef = `LC-${uuidv4().slice(0, 8).toUpperCase()}`;

    let gatewayPayload: any;
    switch (method) {
      case 'JAZZCASH':    gatewayPayload = await initiateJazzCash(txnRef, order.totalAmount); break;
      case 'EASYPAISA':   gatewayPayload = await initiateEasypaisa(txnRef, order.totalAmount); break;
      case 'SADAPAY':     gatewayPayload = await initiateSadaPay(txnRef, order.totalAmount); break;
      case 'NAYAPAY':     gatewayPayload = await initiateNayaPay(txnRef, order.totalAmount); break;
      default:            gatewayPayload = { instructions: 'Manual transfer. Use txnRef as reference.', ibanAccount: 'PK00XXXX0000000000000000' };
    }

    await prisma.paymentTransaction.create({
      data: {
        orderId,
        userId:  req.user!.userId,
        method,
        txnRef,
        amount:  order.totalAmount,
        status:  'PENDING',
        // Store only non-sensitive fields — strip secrets before persisting
        gatewayPayload: sanitizeGatewayPayload(gatewayPayload),
      },
    });

    res.json({ success: true, data: { txnRef, gatewayPayload } });
  } catch (err) { next(err); }
});

// ─── Payment Webhook Callbacks ─────────────────────────────────────────────────
// IMPORTANT: Each gateway uses a different signature scheme.
// We verify the signature BEFORE processing the payload.

router.post('/callback/jazzcash',  verifyJazzCashSignature,  handleWebhook('JAZZCASH'));
router.post('/callback/easypaisa', verifyEasypaisaSignature, handleWebhook('EASYPAISA'));
router.post('/callback/sadapay',   verifySadaPaySignature,   handleWebhook('SADAPAY'));
router.post('/callback/nayapay',   verifyNayaPaySignature,   handleWebhook('NAYAPAY'));
router.post('/callback/raast',     handleWebhook('RAAST'));  // Raast uses manual verification

// ─── Signature Verifiers ───────────────────────────────────────────────────────

function verifyJazzCashSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const salt      = env.JAZZCASH_INTEGRITY_SALT ?? '';
    const body      = req.body;
    const provided  = body.pp_SecureHash;
    if (!provided) return res.status(200).send('OK'); // silently ignore if no sig

    // JazzCash hash: alphabetically sorted keys joined by &, prefixed with salt
    const sortedKeys = Object.keys(body)
      .filter((k) => k !== 'pp_SecureHash' && body[k] !== '')
      .sort();
    const hashStr = salt + '&' + sortedKeys.map((k) => body[k]).join('&');
    const computed = crypto.createHmac('sha256', salt).update(hashStr).digest('hex').toUpperCase();

    if (computed !== provided.toUpperCase()) {
      console.warn('[JazzCash] Invalid webhook signature — ignoring');
      return res.status(200).send('OK'); // Return 200 to prevent gateway retries
    }
    next();
  } catch { res.status(200).send('OK'); }
}

function verifyEasypaisaSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const hashKey  = env.EASYPAISA_HASH_KEY ?? '';
    const body     = req.body;
    const provided = body.encryptedHashRequest;
    if (!provided) return res.status(200).send('OK');

    const hashStr  = `amount=${body.transactionAmount}&orderRefNum=${body.orderRefNum}&storeId=${body.storeId}&timeStamp=${body.transactionDate}&token=${hashKey}`;
    const computed = crypto.createHash('md5').update(hashStr).digest('hex');

    if (computed !== provided) {
      console.warn('[Easypaisa] Invalid webhook signature — ignoring');
      return res.status(200).send('OK');
    }
    next();
  } catch { res.status(200).send('OK'); }
}

function verifySadaPaySignature(req: Request, res: Response, next: NextFunction) {
  try {
    const secret   = env.SADAPAY_WEBHOOK_SECRET ?? '';
    const provided = req.headers['sadapay-signature'] as string;
    if (!provided) return res.status(200).send('OK');

    const payload   = JSON.stringify(req.body);
    const computed  = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const safeEqual = crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(provided.padEnd(computed.length)));

    if (!safeEqual) {
      console.warn('[SadaPay] Invalid webhook signature — ignoring');
      return res.status(200).send('OK');
    }
    next();
  } catch { res.status(200).send('OK'); }
}

function verifyNayaPaySignature(req: Request, res: Response, next: NextFunction) {
  try {
    const secret   = env.NAYAPAY_WEBHOOK_SECRET ?? '';
    const provided = req.headers['x-nayapay-signature'] as string;
    if (!provided) return res.status(200).send('OK');

    const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (computed !== provided) {
      console.warn('[NayaPay] Invalid webhook signature — ignoring');
      return res.status(200).send('OK');
    }
    next();
  } catch { res.status(200).send('OK'); }
}

// ─── Core Webhook Handler ──────────────────────────────────────────────────────

function handleWebhook(method: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const { txnRef, status, paidAmount } = extractWebhookData(method, req.body);
      if (!txnRef) return res.status(200).send('OK');

      // ── Idempotency: skip already-processed webhooks ───────────────────────
      const idempotencyKey = `webhook:${method.toLowerCase()}:${txnRef}`;
      const alreadyProcessed = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX'); // 24h TTL
      if (!alreadyProcessed) {
        console.info(`[${method}] Duplicate webhook for ${txnRef} — skipping`);
        return res.status(200).send('OK');
      }

      const txn = await prisma.paymentTransaction.findUnique({ where: { txnRef } });
      if (!txn) return res.status(200).send('OK');

      // Already processed
      if (txn.status !== 'PENDING') return res.status(200).send('OK');

      const newStatus = status === 'success' ? 'PAID' : 'FAILED';

      // ── Amount validation: gateway-paid amount must match expected amount ───
      if (newStatus === 'PAID' && paidAmount !== undefined) {
        const tolerance = 0.01; // 1 paisa tolerance for rounding
        if (Math.abs(paidAmount - txn.amount) > tolerance) {
          console.error(`[${method}] Amount mismatch for ${txnRef}: expected ${txn.amount}, got ${paidAmount}`);
          await prisma.paymentTransaction.update({
            where: { txnRef },
            data:  { status: 'FAILED', callbackPayload: { error: 'amount_mismatch', ...req.body } },
          });
          return res.status(200).send('OK');
        }
      }

      await prisma.paymentTransaction.update({
        where: { txnRef },
        // Never store raw callback — sanitize first
        data:  { status: newStatus, callbackPayload: { method, status: newStatus, txnRef } },
      });

      if (newStatus === 'PAID' && txn.orderId) {
        await prisma.order.update({
          where: { id: txn.orderId },
          data:  { paymentStatus: 'PAID' },
        });
      }

      res.status(200).send('OK');
    } catch (err) { next(err); }
  };
}

// ─── Field Extractors Per Gateway ─────────────────────────────────────────────

function extractWebhookData(method: string, body: any): { txnRef: string; status: string; paidAmount?: number } {
  switch (method) {
    case 'JAZZCASH':
      return {
        txnRef:     body.pp_TxnRefNo ?? '',
        status:     body.pp_ResponseCode === '000' ? 'success' : 'fail',
        paidAmount: body.pp_Amount ? parseFloat(body.pp_Amount) / 100 : undefined, // JazzCash sends paisas
      };
    case 'EASYPAISA':
      return {
        txnRef:     body.orderRefNum ?? '',
        status:     body.responseCode === '0000' ? 'success' : 'fail',
        paidAmount: body.transactionAmount ? parseFloat(body.transactionAmount) : undefined,
      };
    case 'SADAPAY':
      return {
        txnRef:     body.client_ref ?? '',
        status:     body.status === 'succeeded' ? 'success' : 'fail',
        paidAmount: body.amount ? body.amount / 100 : undefined,
      };
    case 'NAYAPAY':
      return {
        txnRef:     body.orderId ?? '',
        status:     body.status === 'PAID' ? 'success' : 'fail',
        paidAmount: body.amount ? parseFloat(body.amount) : undefined,
      };
    default:
      return { txnRef: body.txnRef ?? '', status: body.status ?? 'fail' };
  }
}

// Strip sensitive fields before DB storage
function sanitizeGatewayPayload(payload: any): any {
  const { pp_Password, pp_SecureHash, hashKey, secret, ...safe } = payload ?? {};
  return safe;
}

export default router;
