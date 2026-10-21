const crypto = require("node:crypto");

const MERCHANT_COOKIE = "saas_merchant_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPER_ADMIN_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    "saas-merchant-session-secret-key-32chars"
  );
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password || "")).digest("hex");
}

function createMerchantToken(storeId, phone) {
  const secret = getSecret();
  const payload = Buffer.from(
    JSON.stringify({
      storeId: String(storeId).toLowerCase(),
      phone: String(phone || ""),
      role: "merchant",
      exp: Date.now() + SESSION_TTL_MS,
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyMerchantToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const secret = getSecret();
    const expected = crypto.createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.role === "merchant" && Number.isFinite(data.exp) && data.exp > Date.now()) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function extractMerchantToken(req) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1].trim();
    }
  }

  // 2. Cookie
  const cookie = String(req.headers.cookie || "");
  const pair = cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${MERCHANT_COOKIE}=`));
  if (pair) {
    try {
      return decodeURIComponent(pair.slice(MERCHANT_COOKIE.length + 1));
    } catch {
      return "";
    }
  }

  return "";
}

module.exports = {
  MERCHANT_COOKIE,
  SESSION_TTL_MS,
  hashPassword,
  createMerchantToken,
  verifyMerchantToken,
  extractMerchantToken,
};
