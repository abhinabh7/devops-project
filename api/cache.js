const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  }
});

client.on('error', (err) => console.error('❌ Redis error:', err));
client.on('connect', () => console.log('✅ Connected to Redis'));

// Connect immediately
client.connect();

module.exports = client;
