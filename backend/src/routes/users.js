const express = require('express');
const { query } = require('../config/db');
const { verifyJWT } = require('../middleware/auth');
const router = express.Router();

router.get('/me', verifyJWT, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id,phone,name,email,role,avatar_url,created_at FROM users WHERE id=$1`,[req.user.id]);
    if (!result.rows.length) return res.status(404).json({error:'User not found'});
    res.json({ user: result.rows[0] });
  } catch (err) { next(err); }
});

router.patch('/me', verifyJWT, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const result = await query(
      `UPDATE users SET name=$1,email=$2,updated_at=NOW() WHERE id=$3 RETURNING id,phone,name,email,role`,
      [name,email,req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/me/favourites', verifyJWT, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.* FROM favourites f JOIN partners p ON p.id=f.partner_id WHERE f.user_id=$1`,[req.user.id]);
    res.json({ favourites: result.rows });
  } catch (err) { next(err); }
});

router.post('/me/favourites/:partnerId', verifyJWT, async (req, res, next) => {
  try {
    await query(`INSERT INTO favourites (user_id,partner_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id,req.params.partnerId]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/me/favourites/:partnerId', verifyJWT, async (req, res, next) => {
  try {
    await query(`DELETE FROM favourites WHERE user_id=$1 AND partner_id=$2`,[req.user.id,req.params.partnerId]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
