// Test suite for Sprint 2 Super Admin Panel APIs
const assert = require("node:assert");

process.env.SUPER_ADMIN_PASSWORD = "test-super-secret-password-2026";
process.env.SUPER_ADMIN_SECRET = "test-secret-key-at-least-32-chars-long-12345";
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
  console.log("=== SPRINT 2 TEST SUITE STARTING ===");

  // 1. Test _auth-helper.js
  const authHelper = require("../api/super-admin/_auth-helper.js");
  const token = authHelper.createToken();
  assert(typeof token === "string" && token.includes("."), "Token must be formatted with payload.sig");
  assert.strictEqual(authHelper.verifyToken(token), true, "Fresh token should verify as true");
  assert.strictEqual(authHelper.verifyToken("invalid.token"), false, "Tampered token should return false");
  assert.strictEqual(authHelper.checkPassword("test-super-secret-password-2026"), true, "Correct password must match");
  assert.strictEqual(authHelper.checkPassword("wrong-pass"), false, "Wrong password must not match");

  // 2. Test api/super-admin/auth.js
  const authHandler = require("../api/super-admin/auth.js");

  // Wrong password
  let res = mockRes();
  await authHandler(mockReq({ method: "POST", body: { action: "login", password: "wrong" } }), res);
  assert.strictEqual(res.statusCode, 401, "Wrong password should return 401");
  assert.strictEqual(res.body.error, "invalid_credentials");

  // Correct password
  res = mockRes();
  await authHandler(mockReq({ method: "POST", body: { action: "login", password: "test-super-secret-password-2026" } }), res);
  assert.strictEqual(res.statusCode, 200, "Correct password should return 200");
  assert(res.body.token, "Should return token on login");
  const validToken = res.body.token;

  // Verify action
  res = mockRes();
  await authHandler(mockReq({
    method: "POST",
    headers: { authorization: `Bearer ${validToken}`, "x-forwarded-for": "127.0.0.1" },
    body: { action: "verify" }
  }), res);
  assert.strictEqual(res.statusCode, 200, "Verify with valid token should return 200");
  assert.strictEqual(res.body.valid, true);

  // 3. Test api/super-admin/stores.js
  const storesHandler = require("../api/super-admin/stores.js");

  // Unauthorized without token
  res = mockRes();
  await storesHandler(mockReq({ method: "GET" }), res);
  assert.strictEqual(res.statusCode, 401, "GET without token should return 401");

  // POST with invalid slug
  res = mockRes();
  await storesHandler(mockReq({
    method: "POST",
    headers: { authorization: `Bearer ${validToken}`, "x-forwarded-for": "127.0.0.1" },
    body: { id: "a", name: "Short slug test" }
  }), res);
  assert.strictEqual(res.statusCode, 400, "Invalid slug should return 400");
  assert.strictEqual(res.body.error, "invalid_store_slug");

  // POST with missing telegram_chat_id
  res = mockRes();
  await storesHandler(mockReq({
    method: "POST",
    headers: { authorization: `Bearer ${validToken}`, "x-forwarded-for": "127.0.0.1" },
    body: { id: "test-shop", name: "Test Shop", owner_phone: "+998901234567", telegram_chat_id: "" }
  }), res);
  assert.strictEqual(res.statusCode, 400, "Missing telegram chat id should return 400");
  assert.strictEqual(res.body.error, "missing_telegram_chat_id");

  console.log("=== ALL SPRINT 2 TESTS PASSED SUCCESSFULLY! ===");
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Sprint 2 Test failed:", err);
  process.exit(1);
});
