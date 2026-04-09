const express  = require('express');
const { body } = require('express-validator');
const db = require('../config/db');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const router = express.Router();
const genCode = () => Math.random().toString(36).substr(2,6).toUpperCase();

// Create order (atomic — uses DB transaction)
router.post('/', verifyJWT, requireRole('customer'),
  [body('bag_id').notEmpty(), body('quantity').isInt({min:1}),
   body('payment_method').isIn(['jazzcash','easypaisa','cash'])], validate,
  async (req, res, next) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const { bag_id, quantity, payment_method } = req.body;
      const bagRes = await client.query(
        `SELECT b.*,p.commission_pct FROM bags b JOIN partners p ON p.id=b.partner_id
         WHERE b.id=$1 AND b.status='available' FOR UPDATE`, [bag_id]);
      const bag = bagRes.rows[0];
      if (!bag) throw Object.assign(new Error('Bag not available'), {status:400});
      if (bag.quantity_left < quantity) throw Object.assign(new Error('Not enough bags left'), {status:400});
      const total  = parseFloat(bag.discounted_price) * quantity;
      const comm   = parseFloat((total * bag.commission_pct / 100).toFixed(2));
      const payout = parseFloat((total - comm).toFixed(2));
      await client.query(
        `UPDATE bags SET quantity_left=quantity_left-$1,updated_at=NOW(),
         status=CASE WHEN quantity_left-$1=0 THEN 'sold_out'::bag_status ELSE status END
         WHERE id=$2`, [quantity, bag_id]);
      const orderRes = await client.query(
        `INSERT INTO orders (bag_id,user_id,partner_id,quantity,total_amount,commission_amt,
         partner_payout,payment_method,payment_status,order_status,pickup_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10) RETURNING *`,
        [bag_id,req.user.id,bag.partner_id,quantity,total,comm,payout,payment_method,
         payment_method==='cash'?'pending':'paid', genCode()]);
      await client.query('COMMIT');
      res.status(201).json({ order: orderRes.rows[0] });
    } catch (err) { await client.query('ROLLBACK'); next(err); }
    finally { client.release(); }
  }
);

// List orders (role-aware)
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

// Single order
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

// Partner: update order status
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

module.exports = router;
