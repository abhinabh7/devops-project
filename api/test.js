const http = require('http');

// Simple test runner — no extra libraries needed
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

// Test 1 — health endpoint
function testHealth() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        console.log('\n🧪 Testing /health endpoint:');
        assert(res.statusCode === 200, 'returns 200 status');
        assert(body.status === 'healthy', 'status is healthy');
        assert(body.database === 'connected', 'database is connected');
        resolve();
      });
    }).on('error', (err) => {
      console.log(`\n❌ Could not connect: ${err.message}`);
      failed++;
      resolve();
    });
  });
}

// Test 2 — products endpoint
function testProducts() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/products', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        console.log('\n🧪 Testing /products endpoint:');
        assert(res.statusCode === 200, 'returns 200 status');
        assert(Array.isArray(body.data), 'data is an array');
        assert(body.data.length > 0, 'has at least one product');
        assert(body.source === 'database' || body.source === 'cache',
          'source is database or cache');
        resolve();
      });
    }).on('error', (err) => {
      console.log(`\n❌ Could not connect: ${err.message}`);
      failed++;
      resolve();
    });
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Running API tests...');
  await testHealth();
  await testProducts();

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1); // exit code 1 = failure — CI will catch this
  } else {
    process.exit(0); // exit code 0 = success
  }
}

runTests();
