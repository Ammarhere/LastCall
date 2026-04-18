require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const { query } = require('./config/db');
const { existsSync, mkdirSync } = require('fs');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
if (!existsSync('uploads')) mkdirSync('uploads');

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bags',     require('./routes/bags'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/health', async (_, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch { res.status(500).json({ status: 'error', db: 'disconnected' }); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ LastCall API running on :${PORT}`));
