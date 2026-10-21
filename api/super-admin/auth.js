const { takeRateLimit, clearRateLimit, rateLimitResponse } = require("../_rate-limit");
const {
  SUPER_ADMIN_COOKIE,
  SESSION_TTL_MS,
  createToken,
  verifyToken,
  extractToken,
  checkPassword,
} = require("./_auth-helper");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = req.body || {};
  const action = body.action || "login";

  // 1. Verify session
  if (action === "verify") {
    const token = extractToken(req);
    const valid = verifyToken(token);
    if (!valid) {
      return res.status(401).json({ error: "unauthorized", valid: false });
    }
    return res.status(200).json({ ok: true, valid: true });
  }

  // 2. Logout
  if (action === "logout") {
    const isHttps = req.headers["x-forwarded-proto"] === "https";
    const cookieParts = [
      `${SUPER_ADMIN_COOKIE}=`,
      "Path=/; Max-Age=0",
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (isHttps) cookieParts.push("Secure");
    res.setHeader("Set-Cookie", cookieParts.join("; "));
    return res.status(200).json({ ok: true, message: "logged_out" });
  }

  // 3. Login
  if (action === "login") {
    const limit = takeRateLimit(req, "super_admin_auth", 5, 10 * 60 * 1000);
    if (limit.limited) return rateLimitResponse(res, limit.retryAfter);

    const password = String(body.password || "").trim();
    if (!password || !checkPassword(password)) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    clearRateLimit(req, "super_admin_auth");

    const token = createToken();
    const isHttps = req.headers["x-forwarded-proto"] === "https";
    const cookieParts = [
      `${SUPER_ADMIN_COOKIE}=${encodeURIComponent(token)}`,
      "Path=/; HttpOnly; SameSite=Lax",
      `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    ];
    if (isHttps) cookieParts.push("Secure");
    res.setHeader("Set-Cookie", cookieParts.join("; "));

    return res.status(200).json({
      ok: true,
      token,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  }

  return res.status(400).json({ error: "invalid_action" });
};
