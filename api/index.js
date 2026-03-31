require('dotenv').config();
const express = require('express');
const pool = require('./db');
const cache = require('./cache');

const app = express();
app.use(express.json()); // lets us read JSON request bodies

// ─── Health check ────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1'); // ping the DB
    res.json({ status: 'healthy', database: 'connected', cache: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// ─── GET all products (with Redis cache) ─────────────────
app.get('/products', async (req, res) => {
  try {
    // 1. Check Redis cache first
    const cached = await cache.get('products');
    if (cached) {
      console.log('⚡ Served from cache');
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    // 2. Cache miss — query the database
    console.log('🔍 Cache miss — querying database');
    const result = await pool.query('SELECT * FROM products ORDER BY id');

    // 3. Store in cache for 60 seconds
    await cache.setEx('products', 60, JSON.stringify(result.rows));

    res.json({ source: 'database', data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create a product ────────────────────────────────
app.post('/products', async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
      [name, price]
    );
    // Invalidate cache so next GET fetches fresh data
    await cache.del('products');
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
