const express  = require('express');
const { body } = require('express-validator');
const db = require('../config/db');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendWhatsApp, orderConfirmationMessage, partnerNewOrderMessage } = require('../services/whatsapp');

const router = express.Router();
const genCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

const DIGITAL_METHODS = ['jazzcash', 'easypaisa', 'sadapay', 'nayapay', 'raast', 'bank_transfer'];
const ALL_METHODS      = [...DIGITAL_METHODS, 'cash'];

// POST / — Create order
router.post('/', verifyJWT, requireRole('customer'),
  [
    body('bag_id').notEmpty(),
    body('quantity').isInt({ min: 1 }),
    body('payment_method').isIn(ALL_METHODS),
  ], validate,
  async (req, res, next) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { bag_id, quantity, payment_method } = req.body;

      const bagRes = await client.query(
        `SELECT b.*, p.commission_pct, p.business_name, p.area,
                u2.phone AS partner_user_phone
         FROM bags b
         JOIN partners p ON p.id = b.partner_id
         JOIN users u2   ON u2.id = p.user_id
         WHERE b.id = $1 AND b.status = 'available'
         FOR UPDATE`,
        [bag_id]
      );
      const bag = bagRes.rows[0];
      if (!bag) throw Object.assign(new Error('Bag not available'), { status: 400 });
      if (bag.quantity_left < quantity)
        throw Object.assign(new Error('Not enough bags left'), { status: 400 });

      const total  = parseFloat(bag.discounted_price) * quantity;
      const comm   = parseFloat((total * bag.commission_pct / 100).toFixed(2));
      const payout = parseFloat((total - comm).toFixed(2));
      const paymentStatus = DIGITAL_METHODS.includes(payment_method) ? 'paid' : 'pending';

      await client.query(
        `UPDATE bags SET quantity_left = quantity_left - $1, updated_at = NOW(),
         status = CASE WHEN quantity_left - $1 = 0 THEN 'sold_out'::bag_status ELSE status END
         WHERE id = $2`,
        [quantity, bag_id]
      );

      const orderRes = await client.query(
        `INSERT INTO orders
           (bag_id, user_id, partner_id, quantity, total_amount, commission_amt,
            partner_payout, payment_method, payment_status, order_status, pickup_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10) RETURNING *`,
        [bag_id, req.user.id, bag.partner_id, quantity, total, comm, payout,
         payment_method, paymentStatus, genCode()]
      );
      const order = orderRes.rows[0];

      const userRes = await client.query(
        `SELECT name, phone FROM users WHERE id = $1`, [req.user.id]
      );
      const customer = userRes.rows[0];

      await client.query('COMMIT');

      // WhatsApp to customer
      if (customer?.phone) {
        sendWhatsApp(customer.phone, orderConfirmationMessage({
          customerName:  customer.name,
          businessName:  bag.business_name,
          area:          bag.area,
          pickupCode:    order.pickup_code,
          pickupStart:   bag.pickup_start,
          pickupEnd:     bag.pickup_end,
          totalAmount:   total,
          paymentMethod: payment_method,
        })).catch(() => {});
      }

      // WhatsApp to partner
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

      res.status(201).json({ order });
    } catch (err) { await client.query('ROLLBACK'); next(err); }
    finally { client.release(); }
  }
);

// GET / — List orders (role-aware)
router.get('/', verifyJWT, async (req, res, next) => {
  try {
    let sql, params;
    if (req.user.role === 'customer') {
      sql = `SELECT o.*,b.title AS bag_title,p.business_name,p.area
             FROM orders o JOIN bags b ON b.id=o.bag_id JOIN partners p ON p.id=o.partner_id
             WHERE o.user_id=$1 ORDER BY o.created_at DESC`;
      params = [req.user.id];
    } else if (req.user.role === 'partner') {
      const pRes = await db.query(`SELECT id FROM partners WHERE user_id=$1`,[req.user.id]);
      if (!pRes.rows.length) return res.json({orders:[]});
      sql = `SELECT o.*,b.title AS bag_title,u.name AS customer_name,u.phone AS customer_phone
             FROM orders o JOIN bags b ON b.id=o.bag_id JOIN users u ON u.id=o.user_id
             WHERE o.partner_id=$1 ORDER BY o.created_at DESC`;
      params = [pRes.rows[0].id];
    } else {
      sql = `SELECT o.*,b.title AS bag_title,u.name AS customer_name,p.business_name
             FROM orders o JOIN bags b ON b.id=o.bag_id JOIN users u ON u.id=o.user_id
             JOIN partners p ON p.id=o.partner_id ORDER BY o.created_at DESC LIMIT 500`;
      params = [];
    }
    const result = await db.query(sql, params);
    res.json({ orders: result.rows });
  } catch (err) { next(err); }
});

// GET /:id — Single order
router.get('/:id', verifyJWT, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT o.*,b.title AS bag_title,b.pickup_start,b.pickup_end,
       p.business_name,p.address,p.latitude,p.longitude
       FROM orders o JOIN bags b ON b.id=o.bag_id JOIN partners p ON p.id=o.partner_id
       WHERE o.id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({error:'Order not found'});
    res.json({ order: result.rows[0] });
  } catch (err) { next(err); }
});

// PATCH /:id/status — Partner advances order status
router.patch('/:id/status', verifyJWT, requireRole('partner','admin'),
  [body('status').isIn(['ready','picked_up','cancelled'])], validate,
  async (req, res, next) => {
    try {
      const extra = req.body.status==='picked_up' ? ',picked_up_at=NOW()' : '';
      const result = await db.query(
        `UPDATE orders SET order_status=$1${extra},updated_at=NOW() WHERE id=$2 RETURNING *`,
        [req.body.status, req.params.id]);
      if (!result.rows.length) return res.status(404).json({error:'Order not found'});
      res.json({ order: result.rows[0] });
    } catch (err) { next(err); }
  }
);

// POST /:id/verify-pickup — Two-step cash verification
router.post('/:id/verify-pickup', verifyJWT, requireRole('partner','admin'),
  [
    body('pickup_code').notEmpty(),
    body('confirm_cash').optional().isBoolean(),
  ], validate,
  async (req, res, next) => {
    try {
      const { pickup_code, confirm_cash } = req.body;

      const result = await db.query(
        `SELECT o.*, b.title AS bag_title, u.name AS customer_name, u.phone AS customer_phone
         FROM orders o JOIN bags b ON b.id=o.bag_id JOIN users u ON u.id=o.user_id
         WHERE o.id = $1`, [req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
      const order = result.rows[0];

      if (order.pickup_code.toUpperCase() !== pickup_code.toUpperCase()) {
        return res.status(400).json({ error: 'Invalid pickup code', verified: false });
      }

      if (order.order_status === 'picked_up') {
        return res.json({ verified: true, needs_cash_confirm: false, order });
      }

      const isCash = order.payment_method === 'cash';

      if (isCash && confirm_cash === true) {
        const updated = await db.query(
          `UPDATE orders SET order_status='picked_up', payment_status='paid',
           picked_up_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`,
          [order.id]
        );
        return res.json({ verified: true, needs_cash_confirm: false, order: updated.rows[0] });
      }

      if (isCash) {
        return res.json({ verified: true, needs_cash_confirm: true, order });
      } else {
        const updated = await db.query(
          `UPDATE orders SET order_status='picked_up', picked_up_at=NOW(),
           updated_at=NOW() WHERE id=$1 RETURNING *`, [order.id]
        );
        return res.json({ verified: true, needs_cash_confirm: false, order: updated.rows[0] });
      }
    } catch (err) { next(err); }
  }
);

module.exports = router;