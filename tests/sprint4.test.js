// Test suite for Sprint 4 Telegram Webhook & Interactive Inline Buttons
const assert = require("node:assert");

process.env.TELEGRAM_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
process.env.TELEGRAM_BOT_USERNAME = "kids_shbot";
process.env.TELEGRAM_GROUP_ID = "-100123456789";
process.env.SUPABASE_URL = "https://mock-tenant.supabase.co";
process.env.SUPABASE_SECRET_KEY = "mock-secret-key-12345";
process.env.ORDERS_ENABLED = "true";

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    redirect(code, url) { this.statusCode = code; this.redirectUrl = url; return this; }
  };
  return res;
}

function mockReq(options = {}) {
  return {
    method: options.method || "GET",
    query: options.query || {},
    headers: options.headers || { "x-forwarded-for": "127.0.0.1", host: "kids-shop-six.vercel.app" },
    body: options.body || {}
  };
}

async function runTests() {
  console.log("=== SPRINT 4 TELEGRAM WEBHOOK TEST SUITE STARTING ===");

  // 1. Test api/telegram-launch.js deep link redirection
  const launchHandler = require("../api/telegram-launch.js");
  let res = mockRes();
  await launchHandler(mockReq({ method: "GET", query: { store: "safari-kids" } }), res);
  assert.strictEqual(res.statusCode, 302, "Should redirect 302");
  assert(res.redirectUrl.includes("startapp=safari-kids"), "Should deep link to safari-kids");
  console.log("✅ api/telegram-launch.js deep linking confirmed:", res.redirectUrl);

  // 2. Test api/telegram-webhook.js GET info
  const webhookHandler = require("../api/telegram-webhook.js");
  res = mockRes();
  await webhookHandler(mockReq({ method: "GET" }), res);
  assert.strictEqual(res.statusCode, 200, "Webhook GET info should return 200");
  assert(res.body.ok, "Webhook GET should be ok");
  console.log("✅ api/telegram-webhook.js GET status confirmed");

  // 3. Test api/telegram-webhook.js callback_query: order:confirm
  res = mockRes();
  await webhookHandler(mockReq({
    method: "POST",
    body: {
      callback_query: {
        id: "cq-12345",
        from: { id: 998877, username: "admin_operator", first_name: "Aziz" },
        data: "order:confirm:0c8f1854-3c66-4122-861c-8b8d96001234",
        message: {
          message_id: 5544,
          chat: { id: -100123456789 },
          text: "🛍 KIDS-SHOP · YANGI BUYURTMA\n№ 0C8F1854\n👤 Alisher\nJami: 219 000 so‘m"
        }
      }
    }
  }), res);
  assert.strictEqual(res.statusCode, 200, "Callback query should return 200");
  assert.strictEqual(res.body.processed, "callback_query");
  assert.strictEqual(res.body.action, "confirm");
  console.log("✅ api/telegram-webhook.js order:confirm processed");

  // 4. Test api/telegram-webhook.js callback_query: order:sent
  res = mockRes();
  await webhookHandler(mockReq({
    method: "POST",
    body: {
      callback_query: {
        id: "cq-12346",
        from: { id: 998877, username: "admin_operator" },
        data: "order:sent:0c8f1854-3c66-4122-861c-8b8d96001234",
        message: {
          message_id: 5544,
          chat: { id: -100123456789 },
          text: "🛍 KIDS-SHOP · YANGI BUYURTMA"
        }
      }
    }
  }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.action, "sent");
  console.log("✅ api/telegram-webhook.js order:sent processed");

  // 5. Test api/telegram-webhook.js callback_query: order:cancel
  res = mockRes();
  await webhookHandler(mockReq({
    method: "POST",
    body: {
      callback_query: {
        id: "cq-12347",
        from: { id: 998877, username: "admin_operator" },
        data: "order:cancel:0c8f1854-3c66-4122-861c-8b8d96001234",
        message: {
          message_id: 5544,
          chat: { id: -100123456789 },
          text: "🛍 KIDS-SHOP · YANGI BUYURTMA"
        }
      }
    }
  }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.action, "cancel");
  console.log("✅ api/telegram-webhook.js order:cancel processed");

  // 6. Test api/telegram-webhook.js /start message
  res = mockRes();
  await webhookHandler(mockReq({
    method: "POST",
    body: {
      message: {
        chat: { id: 998877 },
        text: "/start safari-kids"
      }
    }
  }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.processed, "start_message");
  assert.strictEqual(res.body.store, "safari-kids");
  console.log("✅ api/telegram-webhook.js /start message with deep link confirmed");

  console.log("=== ALL SPRINT 4 TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
