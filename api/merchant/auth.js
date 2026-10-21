const { getSupabaseConfig, supabaseHeaders } = require("../_supabase");
const { takeRateLimit, clearRateLimit, rateLimitResponse } = require("../_rate-limit");
const {
  MERCHANT_COOKIE,
  SESSION_TTL_MS,
  hashPassword,
  createMerchantToken,
  verifyMerchantToken,
  extractMerchantToken,
} = require("./_auth-helper");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = req.body || {};
  const action = body.action || "login";

  // =========================================================================
  // 1. VERIFY SESSION
  // =========================================================================
  if (action === "verify") {
    const token = extractMerchantToken(req);
    const session = verifyMerchantToken(token);
    if (!session) {
      return res.status(401).json({ error: "unauthorized", valid: false });
    }

    const { url, key } = getSupabaseConfig();
    if (!url || !key) {
      return res.status(200).json({ ok: true, valid: true, store: { id: session.storeId, name: session.storeId } });
    }

    try {
      const storeRes = await fetch(
        new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(session.storeId)}&select=id,name,logo_url,theme_color,status,plan,plan_expires_at,owner_phone`, url),
        { headers: supabaseHeaders(key) }
      );
      if (storeRes.ok) {
        const rows = await storeRes.json();
        if (rows && rows.length) {
          const store = rows[0];
          if (store.status !== "active") {
            return res.status(403).json({ error: "store_suspended", message: "Do‘koningiz faoliyati vaqtincha to‘xtatilgan." });
          }
          return res.status(200).json({ ok: true, valid: true, store });
        }
      }
    } catch {}

    return res.status(200).json({ ok: true, valid: true, store: { id: session.storeId, name: session.storeId } });
  }

  // =========================================================================
  // 2. LOGOUT
  // =========================================================================
  if (action === "logout") {
    const isHttps = req.headers["x-forwarded-proto"] === "https";
    const cookieParts = [
      `${MERCHANT_COOKIE}=`,
      "Path=/; Max-Age=0",
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (isHttps) cookieParts.push("Secure");
    res.setHeader("Set-Cookie", cookieParts.join("; "));
    return res.status(200).json({ ok: true, message: "logged_out" });
  }

  // =========================================================================
  // 3. LOGIN
  // =========================================================================
  if (action === "login") {
    const limit = takeRateLimit(req, "merchant_auth", 6, 10 * 60 * 1000);
    if (limit.limited) return rateLimitResponse(res, limit.retryAfter);

    const rawStore = String(body.storeId || body.store || "").trim().toLowerCase();
    const phone = String(body.phone || "").replace(/[^+\d]/g, "").trim();
    const password = String(body.password || "").trim();

    if (!password) {
      return res.status(400).json({ error: "missing_password", message: "Parol kiritilishi shart." });
    }

    const { url, key } = getSupabaseConfig();
    if (!url || !key) {
      // Fallback agar Supabase ulanmagan bo'lsa
      if (password === (process.env.ADMIN_PASSWORD || "admin123") || password === "Shop2026!") {
        const token = createMerchantToken(rawStore || "kids-shop", phone);
        return res.status(200).json({
          ok: true,
          token,
          store: { id: rawStore || "kids-shop", name: "KIDS-SHOP" },
        });
      }
      return res.status(401).json({ error: "invalid_credentials" });
    }

    try {
      // Do'konni slug yoki telefon orqali topish
      let storeEndpoint = "";
      if (rawStore) {
        storeEndpoint = `/rest/v1/stores?id=eq.${encodeURIComponent(rawStore)}&select=*`;
      } else if (phone) {
        storeEndpoint = `/rest/v1/stores?owner_phone=eq.${encodeURIComponent(phone)}&select=*`;
      } else {
        return res.status(400).json({ error: "missing_login_identifier", message: "Do‘kon identifikatori yoki telefon raqami kiritilishi shart." });
      }

      const storeRes = await fetch(new URL(storeEndpoint, url), {
        headers: supabaseHeaders(key),
      });

      if (!storeRes.ok) throw new Error("database_error");
      const rows = await storeRes.json();

      if (!rows || !rows.length) {
        return res.status(404).json({ error: "store_not_found", message: "Bunday do‘kon topilmadi." });
      }

      const store = rows[0];

      // Faollik holatini tekshirish
      if (store.status !== "active") {
        return res.status(403).json({
          error: "store_suspended",
          message: "Do‘koningiz obunasi to‘xtatilgan. Iltimos, administrator bilan bog‘laning.",
        });
      }

      // Parolni tekshirish (hash, ADMIN_PASSWORD yoki default ruxsat)
      const inputHash = hashPassword(password);
      const isHashMatch = Boolean(store.owner_password_hash && store.owner_password_hash === inputHash);
      const adminPass = (process.env.ADMIN_PASSWORD || "").trim();
      const isAdminPassMatch = Boolean(adminPass && password === adminPass);

      // Agar do'konda hali parol belgilanmagan bo'lsa (default kids-shop yoki bo'sh holat)
      const isDefaultAllowed =
        (!store.owner_password_hash || store.id === "kids-shop") &&
        ["Shop2026!", "admin123", "admin"].includes(password);

      if (!isHashMatch && !isAdminPassMatch && !isDefaultAllowed) {
        return res.status(401).json({ error: "invalid_credentials", message: "Parol noto‘g‘ri kiritildi." });
      }

      // Agar paroli hali saqlanmagan bo'lsa yoki kids-shop bo'lsa, xeshni bazada yangilab qo'yamiz
      if (!store.owner_password_hash || store.id === "kids-shop") {
        try {
          await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(store.id)}`, url), {
            method: "PATCH",
            headers: supabaseHeaders(key, { "Content-Type": "application/json" }),
            body: JSON.stringify({ owner_password_hash: inputHash }),
          });
        } catch {}
      }

      clearRateLimit(req, "merchant_auth");

      const token = createMerchantToken(store.id, store.owner_phone);
      const isHttps = req.headers["x-forwarded-proto"] === "https";
      const cookieParts = [
        `${MERCHANT_COOKIE}=${encodeURIComponent(token)}`,
        "Path=/; HttpOnly; SameSite=Lax",
        `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
      ];
      if (isHttps) cookieParts.push("Secure");
      res.setHeader("Set-Cookie", cookieParts.join("; "));

      return res.status(200).json({
        ok: true,
        token,
        store: {
          id: store.id,
          name: store.name,
          owner_phone: store.owner_phone,
          theme_color: store.theme_color || "#285ae8",
          plan: store.plan,
          plan_expires_at: store.plan_expires_at,
          telegram_chat_id: store.telegram_chat_id,
        },
      });
    } catch (err) {
      console.error("merchant_auth_error", err);
      return res.status(500).json({ error: "auth_server_error" });
    }
  }

  return res.status(400).json({ error: "invalid_action" });
};
