const { messaging } = require('../config/firebase');
const { query } = require('../config/db');

const sendPush = async (userId, title, body, data = {}) => {
  try {
    const res = await query(`SELECT fcm_token FROM users WHERE id=$1`,[userId]);
    const token = res.rows[0]?.fcm_token;
    if (!token) return;
    await messaging.send({
      token, notification: { title, body }, data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) { console.error('Push error:', err.message); }
};

const sendOrderConfirmation = async (order, bag) =>
  sendPush(order.user_id, '✅ Order Confirmed!',
    `Your ${bag.title} is ready. Pickup code: ${order.pickup_code}`,
    { order_id: order.id, type: 'order_confirmed' });

module.exports = { sendPush, sendOrderConfirmation };
