const express  = require('express');
const { body } = require('express-validator');
const { query } = require('../config/db');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const router = express.Router();

router.post('/register', verifyJWT,
  [body('business_name').notEmpty(), body('address').notEmpty(), body('category').notEmpty()], validate,
  async (req, res, next) => {
    try {
      const { business_name,category,address,area,latitude,longitude,description } = req.body;
      const dup = await query(`SELECT id FROM partners WHERE user_id=$1`,[req.user.id]);
      if (dup.rows.length) return res.status(409).json({error:'Partner already exists'});
      const result = await query(
        `INSERT INTO partners (user_id,business_name,category,address,area,latitude,longitude,description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.user.id,business_name,category,address,area,latitude,longitude,description]);
      await query(`UPDATE users SET role='partner' WHERE id=$1`,[req.user.id]);
      res.status(201).json({ partner: result.rows[0] });
    } catch (err) { next(err); }
  }
);

router.get('/me', verifyJWT, requireRole('partner'), async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM partners WHERE user_id=$1`,[req.user.id]);
    if (!result.rows.length) return res.status(404).json({error:'Partner not found'});
    res.json({ partner: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/me/stats', verifyJWT, requireRole('partner'), async (req, res, next) => {
  try {
    const pRes = await query(`SELECT id FROM partners WHERE user_id=$1`,[req.user.id]);
    if (!pRes.rows.length) return res.json({});
    const pid = pRes.rows[0].id;
    const [o,b,r] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE order_status='picked_up') AS completed FROM orders WHERE partner_id=$1`,[pid]),
      query(`SELECT COUNT(*) AS total, COALESCE(SUM(quantity_total-quantity_left),0) AS sold FROM bags WHERE partner_id=$1`,[pid]),
      query(`SELECT COALESCE(SUM(partner_payout),0) AS total_earnings,
             COALESCE(SUM(partner_payout) FILTER (WHERE DATE(created_at)=CURRENT_DATE),0) AS today_earnings
             FROM orders WHERE partner_id=$1 AND payment_status='paid'`,[pid]),
    ]);
    res.json({ orders:o.rows[0], bags:b.rows[0], revenue:r.rows[0] });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM partners WHERE id=$1 AND status='approved'`,[req.params.id]);
    if (!result.rows.length) return res.status(404).json({error:'Partner not found'});
    res.json({ partner: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
