const crypto = require("node:crypto");

const SUPER_ADMIN_COOKIE = "saas_super_admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret() {
  return (
    process.env.SUPER_ADMIN_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    "fallback-saas-super-secret-key-32chars-min"
  );
}

function getExpectedPassword() {
  return process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "admin123";
}

function createToken() {
  const secret = getSecret();
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, role: "super_admin" })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return false;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return false;
    const secret = getSecret();
    const expected = crypto.createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.role === "super_admin" && Number.isFinite(data.exp) && data.exp > Date.now();
  } catch {
    return false;
  }
}

function extractToken(req) {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1].trim();
    }
  }

  // 2. Cookie fallback
  const cookie = String(req.headers.cookie || "");
  const pair = cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SUPER_ADMIN_COOKIE}=`));
  if (pair) {
    try {
      return decodeURIComponent(pair.slice(SUPER_ADMIN_COOKIE.length + 1));
    } catch {
      return "";
    }
  }

  return "";
}

function checkPassword(inputPassword) {
  const expected = getExpectedPassword();
  const left = Buffer.from(String(inputPassword || ""));
  const right = Buffer.from(String(expected || ""));
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

module.exports = {
  SUPER_ADMIN_COOKIE,
  SESSION_TTL_MS,
  createToken,
  verifyToken,
  extractToken,
  checkPassword,
};
