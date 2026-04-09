const express = require('express');
const bcrypt  = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../config/db');
const { verifyJWT, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const router = express.Router();
router.use(verifyJWT, requireRole('admin'));

router.get('/stats', async (_, res, next) => {
  try {
    const [u,p,o,r] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM users WHERE role='customer'`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='approved') AS approved,
             COUNT(*) FILTER (WHERE status='pending') AS pending FROM partners`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE order_status='picked_up') AS completed,
             COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE) AS today FROM orders`),
      query(`SELECT COALESCE(SUM(total_amount),0) AS gmv, COALESCE(SUM(commission_amt),0) AS revenue
             FROM orders WHERE payment_status='paid'`),
    ]);
    res.json({ users:u.rows[0], partners:p.rows[0], orders:o.rows[0], revenue:r.rows[0] });
  } catch (err) { next(err); }
});

router.get('/partners', async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = status ? [status] : [];
    const sql = `SELECT p.*,u.phone,u.name AS owner_name FROM partners p JOIN users u ON u.id=p.user_id
                 ${status?'WHERE p.status=$1':''} ORDER BY p.created_at DESC`;
    const result = await query(sql, params);
    res.json({ partners: result.rows });
  } catch (err) { next(err); }
});

router.patch('/partners/:id/status',
  [body('status').isIn(['approved','suspended','pending'])], validate,
  async (req, res, next) => {
    try {
      const result = await query(
        `UPDATE partners SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`,
        [req.body.status,req.params.id]);
      res.json({ partner: result.rows[0] });
    } catch (err) { next(err); }
  }
);

router.get('/orders', async (_, res, next) => {
  try {
    const result = await query(
      `SELECT o.*,b.title AS bag_title,u.name AS customer_name,
       u.phone AS customer_phone,p.business_name
       FROM orders o JOIN bags b ON b.id=o.bag_id JOIN users u ON u.id=o.user_id
       JOIN partners p ON p.id=o.partner_id ORDER BY o.created_at DESC LIMIT 500`);
    res.json({ orders: result.rows });
  } catch (err) { next(err); }
});

router.post('/create-admin',
  [body('email').isEmail(), body('password').isLength({min:8})], validate,
  async (req, res, next) => {
    try {
      const hash = await bcrypt.hash(req.body.password, 12);
      const result = await query(
        `INSERT INTO users (firebase_uid,phone,email,password_hash,role)
         VALUES ($1,$2,$3,$4,'admin') RETURNING id,email,role`,
        [`admin_${Date.now()}`,req.body.phone||'admin',req.body.email,hash]);
      res.status(201).json({ user: result.rows[0] });
    } catch (err) { next(err); }
  }
);

module.exports = router;
