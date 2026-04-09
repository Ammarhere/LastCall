const jwt  = require('jsonwebtoken');
const { auth } = require('../config/firebase');

const verifyFirebase = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.firebaseUser = await auth.verifyIdToken(header.split(' ')[1]);
    next();
  } catch { res.status(401).json({ error: 'Invalid Firebase token' }); }
};

const verifyJWT = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { verifyFirebase, verifyJWT, requireRole };
