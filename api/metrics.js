const client = require('prom-client');

// Collect default metrics — CPU, memory, event loop lag
// This gives you free Node.js health metrics with zero extra work
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'devops_api_' });

// Counter — tracks total number of HTTP requests
// Counters only go up — perfect for counting requests, errors
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Histogram — tracks how long requests take
// Splits into buckets: how many requests took <10ms, <50ms, <200ms etc.
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000],
});

// Gauge — tracks current value, can go up and down
// Perfect for active connections, queue size, cache hit rate
const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests being processed',
});

module.exports = {
  client,
  httpRequestsTotal,
  httpRequestDuration,
  activeRequests,
};
