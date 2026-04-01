require('dotenv').config();
const express = require('express');
const pool = require('./db');
const cache = require('./cache');
const { client, httpRequestsTotal, httpRequestDuration, activeRequests } = require('./metrics');

const app = express();
app.use(express.json());

// ─── Metrics middleware ───────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  activeRequests.inc();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route: route, status_code: res.statusCode },
      duration
    );

    activeRequests.dec();
  });

  next();
});

// ─── Metrics endpoint ─────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected', cache: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// ─── GET all products ─────────────────────────────────────
app.get('/products', async (req, res) => {
  try {
    const cached = await cache.get('products');
    if (cached) {
      console.log('⚡ Served from cache');
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }
    console.log('🔍 Cache miss — querying database');
    const result = await pool.query('SELECT * FROM products ORDER BY id');
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
    await cache.del('products');
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
