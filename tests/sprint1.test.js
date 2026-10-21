// Test suite for Sprint 1 Multi-Tenant Core APIs
const assert = require("node:assert");

process.env.ORDERS_ENABLED = "true";
process.env.SUPABASE_URL = "https://mock-tenant.supabase.co";
process.env.SUPABASE_SECRET_KEY = "mock-secret-key-12345";
process.env.TELEGRAM_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
process.env.TELEGRAM_GROUP_ID = "-100123456789";

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
  return res;
}

function mockReq(options = {}) {
  return {
    method: options.method || "GET",
    query: options.query || {},
    headers: options.headers || { "x-forwarded-for": "127.0.0.1" },
    body: options.body || {}
  };
}

async function runTests() {
  console.log("=== SPRINT 1 TEST SUITE STARTING ===");

  // 1. Test api/products.js
  const productsHandler = require("../api/products.js");
  
  // Method not allowed check
  let res = mockRes();
  await productsHandler(mockReq({ method: "POST" }), res);
  assert.strictEqual(res.statusCode, 405, "POST should be 405 Method Not Allowed");

  // GET demo check
  res = mockRes();
  await productsHandler(mockReq({ method: "GET", query: { store: "kids-shop" } }), res);
  console.log("productsHandler (kids-shop) status:", res.statusCode);
  assert(res.statusCode === 200 || res.statusCode === 503, "Should return 200 or 503");

  // 2. Test api/orders.js input validation
  const ordersHandler = require("../api/orders.js");

  // Invalid customer name or phone
  res = mockRes();
  await ordersHandler(mockReq({
    method: "POST",
    body: {
      customer: { name: "", phone: "12" },
      items: []
    }
  }), res);
  assert.strictEqual(res.statusCode, 400, "Should return 400 for empty customer data");
  assert.strictEqual(res.body.error, "invalid_order");

  // Invalid items
  res = mockRes();
  await ordersHandler(mockReq({
    method: "POST",
    body: {
      customer: { name: "Ali Valiyev", phone: "+998901234567", region: "Toshkent", district: "Chilonzor", address: "1-mavze" },
      items: []
    }
  }), res);
  assert.strictEqual(res.statusCode, 400, "Should return 400 for empty items");
  assert.strictEqual(res.body.error, "invalid_order");

  // 3. Test api/subscribe.js validation
  const subscribeHandler = require("../api/subscribe.js");
  res = mockRes();
  await subscribeHandler(mockReq({ method: "POST", body: { phone: "123" } }), res);
  assert.strictEqual(res.statusCode, 400, "Invalid phone should return 400");
  assert.strictEqual(res.body.error, "invalid_phone");

  console.log("=== ALL SPRINT 1 TESTS PASSED SUCCESSFULLY! ===");
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
