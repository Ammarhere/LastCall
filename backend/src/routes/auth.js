const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../config/db');
const { verifyFirebase, verifyJWT } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const router = express.Router();

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Customer/Partner login via Firebase Phone Auth
router.post('/firebase-login', verifyFirebase, async (req, res, next) => {
  try {
    const { uid, phone_number } = req.firebaseUser;
    const result = await query(
      `INSERT INTO users (firebase_uid, phone) VALUES ($1,$2)
       ON CONFLICT (firebase_uid) DO UPDATE SET updated_at=NOW()
       RETURNING id, firebase_uid, phone, name, role, is_active`,
      [uid, phone_number]
    );
    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ error: 'Account suspended.' });
    res.json({ token: signToken({ id: user.id, role: user.role, phone: user.phone }), user });
  } catch (err) { next(err); }
});

// Admin email/password login
router.post('/admin-login',
  [body('email').isEmail(), body('password').notEmpty()], validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await query(
        `SELECT id,email,password_hash,role FROM users WHERE email=$1 AND role='admin'`, [email]);
      const admin = result.rows[0];
      if (!admin || !(await bcrypt.compare(password, admin.password_hash)))
        return res.status(401).json({ error: 'Invalid email or password' });
      res.json({ token: signToken({ id: admin.id, role: admin.role, email: admin.email }), user: { id: admin.id, role: admin.role } });
    } catch (err) { next(err); }
  }
);

// Update FCM push token
router.post('/update-fcm-token', verifyJWT,
  [body('fcm_token').notEmpty()], validate,
  async (req, res, next) => {
    try {
      await query(`UPDATE users SET fcm_token=$1 WHERE id=$2`, [req.body.fcm_token, req.user.id]);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

module.exports = router;
