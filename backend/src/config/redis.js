const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });
client.on('error', err => console.error('Redis error:', err.message));
client.connect().then(() => console.log('✅ Redis connected')).catch(console.error);
module.exports = client;
