// Test suite for Sprint 3 Merchant Dashboard APIs
const assert = require("node:assert");

process.env.ADMIN_SESSION_SECRET = "test-secret-key-at-least-32-chars-long-12345";
process.env.SUPABASE_URL = "https://mock-tenant.supabase.co";
process.env.SUPABASE_SECRET_KEY = "mock-secret-key-12345";

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
  console.log("=== SPRINT 3 TEST SUITE STARTING ===");

  // 1. Test _auth-helper.js
  const authHelper = require("../api/merchant/_auth-helper.js");
  const token = authHelper.createMerchantToken("safari-kids", "+998901234567");
  assert(typeof token === "string" && token.includes("."), "Token must be formatted with payload.sig");
  const verified = authHelper.verifyMerchantToken(token);
  assert(verified && verified.storeId === "safari-kids", "Fresh merchant token should verify and contain storeId");
  assert.strictEqual(authHelper.verifyMerchantToken("invalid.token"), null, "Tampered token should return null");

  // 2. Test api/merchant/auth.js
  const authHandler = require("../api/merchant/auth.js");

  // Missing password
  let res = mockRes();
  await authHandler(mockReq({ method: "POST", body: { action: "login", storeId: "safari-kids", password: "" } }), res);
  assert.strictEqual(res.statusCode, 400, "Missing password should return 400");

  // 3. Test api/merchant/products.js
  const productsHandler = require("../api/merchant/products.js");

  // Unauthorized without token
  res = mockRes();
  await productsHandler(mockReq({ method: "GET" }), res);
  assert.strictEqual(res.statusCode, 401, "GET without token should return 401");

  // POST with invalid price
  res = mockRes();
  await productsHandler(mockReq({
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "x-forwarded-for": "127.0.0.1" },
    body: { name_uz: "Test Product", price: -500 }
  }), res);
  assert.strictEqual(res.statusCode, 400, "Negative price should return 400");

  // 4. Test api/merchant/orders.js
  const ordersHandler = require("../api/merchant/orders.js");

  // Unauthorized without token
  res = mockRes();
  await ordersHandler(mockReq({ method: "GET" }), res);
  assert.strictEqual(res.statusCode, 401, "GET without token should return 401");

  // PATCH with invalid status
  res = mockRes();
  await ordersHandler(mockReq({
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "x-forwarded-for": "127.0.0.1" },
    body: { orderId: "123", status: "invalid_status" }
  }), res);
  assert.strictEqual(res.statusCode, 400, "Invalid status should return 400");

  // 5. Test api/merchant/settings.js
  const settingsHandler = require("../api/merchant/settings.js");
  res = mockRes();
  await settingsHandler(mockReq({ method: "GET" }), res);
  assert.strictEqual(res.statusCode, 401, "Settings without token should return 401");

  // 6. Test api/merchant/analytics.js
  const analyticsHandler = require("../api/merchant/analytics.js");
  res = mockRes();
  await analyticsHandler(mockReq({ method: "GET" }), res);
  assert.strictEqual(res.statusCode, 401, "Analytics without token should return 401");

  console.log("=== ALL SPRINT 3 TESTS PASSED SUCCESSFULLY! ===");
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Sprint 3 Test failed:", err);
  process.exit(1);
});
