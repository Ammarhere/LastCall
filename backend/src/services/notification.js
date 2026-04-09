const { messaging } = require('../config/firebase');

/**
 * Send a single FCM push notification
 * @param {string} token  — device FCM token
 * @param {string} title
 * @param {string} body
 * @param {object} data   — extra key/value payload
 */
const sendNotification = async (token, title, body, data = {}) => {
  if (!token) return;
  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { sound: 'default', channelId: 'lastcall_default' } },
      apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    const result = await messaging.send(message);
    return result;
  } catch (err) {
    console.error('FCM send error:', err.message);
  }
};

/**
 * Send to multiple tokens (multicast)
 * @param {string[]} tokens
 */
const sendMulticast = async (tokens, title, body, data = {}) => {
  if (!tokens?.length) return;
  const validTokens = tokens.filter(Boolean);
  if (!validTokens.length) return;
  try {
    const message = {
      tokens: validTokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
    };
    const result = await messaging.sendEachForMulticast(message);
    return result;
  } catch (err) {
    console.error('FCM multicast error:', err.message);
  }
};

module.exports = { sendNotification, sendMulticast };
