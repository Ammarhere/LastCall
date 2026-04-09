const express  = require('express');
const { body } = require('express-validator');
const { query } = require('../config/db');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const router = express.Router();

// Public: list available bags (optionally filter by area)
router.get('/', async (req, res, next) => {
  try {
    const { area, date } = req.query;
    const params = [date || new Date().toISOString().split('T')[0]];
    let sql = `SELECT b.*,p.business_name,p.logo_url,p.area,p.address,p.rating
               FROM bags b JOIN partners p ON p.id=b.partner_id
               WHERE b.status='available' AND b.quantity_left>0
               AND b.pickup_date=$1 AND p.status='approved'`;
    if (area) { sql += ` AND p.area ILIKE $${params.length+1}`; params.push(`%${area}%`); }
    sql += ` ORDER BY b.pickup_start ASC`;
    const result = await query(sql, params);
    res.json({ bags: result.rows });
  } catch (err) { next(err); }
});

// Public: single bag detail
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*,p.business_name,p.logo_url,p.area,p.address,p.latitude,p.longitude,p.rating
       FROM bags b JOIN partners p ON p.id=b.partner_id WHERE b.id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Bag not found' });
    res.json({ bag: result.rows[0] });
  } catch (err) { next(err); }
});

// Partner: create bag
router.post('/', verifyJWT, requireRole('partner'),
  [body('title').notEmpty(), body('original_price').isFloat({min:0.01}),
   body('discounted_price').isFloat({min:0.01}), body('quantity_total').isInt({min:1})], validate,
  async (req, res, next) => {
    try {
      const { title,description,original_price,discounted_price,quantity_total,pickup_start,pickup_end,pickup_date } = req.body;
      const pRes = await query(`SELECT id FROM partners WHERE user_id=$1 AND status='approved'`, [req.user.id]);
      if (!pRes.rows.length) return res.status(403).json({ error: 'Partner account not approved' });
      const result = await query(
        `INSERT INTO bags (partner_id,title,description,original_price,discounted_price,
         quantity_total,quantity_left,pickup_start,pickup_end,pickup_date)
         VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9) RETURNING *`,
        [pRes.rows[0].id,title,description,original_price,discounted_price,quantity_total,
         pickup_start||'18:00',pickup_end||'21:00',pickup_date||new Date().toISOString().split('T')[0]]);
      res.status(201).json({ bag: result.rows[0] });
    } catch (err) { next(err); }
  }
);

// Partner/Admin: update bag
router.patch('/:id', verifyJWT, requireRole('partner','admin'), async (req, res, next) => {
  try {
    const allowed = ['title','description','quantity_total','quantity_left','status','pickup_start','pickup_end'];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map((k,i) => `${k}=$${i+2}`).join(', ');
    const result = await query(
      `UPDATE bags SET ${setClauses},updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id, ...updates.map(k => req.body[k])]);
    if (!result.rows.length) return res.status(404).json({ error: 'Bag not found' });
    res.json({ bag: result.rows[0] });
  } catch (err) { next(err); }
});

// Partner/Admin: cancel bag
router.delete('/:id', verifyJWT, requireRole('partner','admin'), async (req, res, next) => {
  try {
    await query(`UPDATE bags SET status='cancelled',updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
