const crypto = require("node:crypto");
const { getSupabaseConfig, supabaseHeaders } = require("./_supabase");
const { takeRateLimit, clearRateLimit, rateLimitResponse } = require("./_rate-limit");

const SESSION_COOKIE = "kids_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const b64 = (value) => Buffer.from(value).toString("base64url");

function tokenFor(secret) {
  const payload = b64(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, scope: "admin" }));
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function validToken(token, secret) {
  try {
    const [payload, signature, extra] = String(token || "").split(".");
    if (!payload || !signature || extra) return false;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.scope === "admin" && Number.isFinite(data.exp) && data.exp > Date.now();
  } catch {
    return false;
  }
}

function sameSecret(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

function cookieToken(req) {
  const cookie = String(req.headers.cookie || "");
  const pair = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!pair) return "";
  try {
    return decodeURIComponent(pair.slice(SESSION_COOKIE.length + 1));
  } catch {
    return "";
  }
}

function setSessionCookie(req, res, token, maxAge) {
  const secure = req.headers["x-forwarded-proto"] === "https" || String(req.headers.host || "").endsWith(".vercel.app");
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Strict", "Path=/api/admin", `Max-Age=${maxAge}`];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const host = String(req.headers.host || "").toLowerCase();
    return parsed.host.toLowerCase() === host && ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Cookie, Origin");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: "invalid_origin" });

  const { url: projectUrl, key } = getSupabaseConfig();
  const { ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
  if (!projectUrl || !key || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET || ADMIN_SESSION_SECRET.length < 32) {
    return res.status(503).json({ error: "admin_not_configured" });
  }

  const body = req.body || {};
  const action = String(body.action || "");
  if (action === "login") {
    const limit = takeRateLimit(req, "admin-login", 5, 15 * 60 * 1000);
    if (limit.limited) return rateLimitResponse(res, limit.retryAfter);
    if (!sameSecret(body.password, ADMIN_PASSWORD)) return res.status(401).json({ error: "login_failed" });
    clearRateLimit(req, "admin-login");
    setSessionCookie(req, res, tokenFor(ADMIN_SESSION_SECRET), Math.floor(SESSION_TTL_MS / 1000));
    return res.status(200).json({ ok: true });
  }

  if (action === "logout") {
    setSessionCookie(req, res, "", 0);
    return res.status(200).json({ ok: true });
  }

  const { ADMIN_SESSION_SECRET: sessionSecret } = process.env;
  if (!validToken(cookieToken(req), sessionSecret)) return res.status(401).json({ error: "session_expired" });
  if (action === "session") return res.status(200).json({ ok: true });

  const base = new URL("/rest/v1/", projectUrl);
  const request = async (path, options = {}) => {
    const response = await fetch(new URL(path, base), {
      ...options,
      headers: supabaseHeaders(key, { "Content-Type": "application/json", ...(options.headers || {}) }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error("database_request_failed");
    return text ? JSON.parse(text) : null;
  };

  try {
    if (action === "products") return res.status(200).json({ products: await request("products?select=*&order=created_at.desc") });
    if (action === "orders") return res.status(200).json({ orders: await request("orders?select=*,order_items(*)&order=created_at.desc&limit=100") });
    if (action === "uploadImage") {
      const image = body.image || {};
      const mimeTypes = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
      const extension = mimeTypes[String(image.type || "")];
      const encoded = String(image.data || "");
      if (!extension || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length > 3000000) {
        return res.status(400).json({ error: "invalid_image" });
      }
      const bytes = Buffer.from(encoded, "base64");
      if (!bytes.length || bytes.length > 2200000) return res.status(413).json({ error: "image_too_large" });

      const storageHeaders = supabaseHeaders(key, { "Content-Type": "application/json" });
      const bucketResponse = await fetch(new URL("/storage/v1/bucket", projectUrl), {
        method: "POST",
        headers: storageHeaders,
        body: JSON.stringify({ id: "product-images", name: "product-images", public: true, file_size_limit: 2200000, allowed_mime_types: Object.keys(mimeTypes) }),
      });
      if (!bucketResponse.ok && bucketResponse.status !== 409) throw new Error("storage_bucket_unavailable");

      const fileName = `${crypto.randomUUID()}.${extension}`;
      const uploadResponse = await fetch(new URL(`/storage/v1/object/product-images/${fileName}`, projectUrl), {
        method: "POST",
        headers: supabaseHeaders(key, { "Content-Type": image.type, "Cache-Control": "public, max-age=31536000, immutable", "x-upsert": "false" }),
        body: bytes,
      });
      if (!uploadResponse.ok) throw new Error("storage_upload_failed");
      return res.status(201).json({ image_url: `${projectUrl.replace(/\/$/, "")}/storage/v1/object/public/product-images/${fileName}` });
    }
    if (action === "saveProduct") {
      const p = body.product || {};
      const id = String(p.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
      const price = Math.round(Number(p.price));
      const stock = Math.round(Number(p.stock));
      const oldPrice = p.old_price === "" || p.old_price == null ? null : Math.round(Number(p.old_price));
      const image = String(p.image_url || "");
      if (!id || !String(p.name_uz || "").trim() || !String(p.name_ru || "").trim() || !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0 || (oldPrice !== null && (!Number.isSafeInteger(oldPrice) || oldPrice < price))) {
        return res.status(400).json({ error: "invalid_product" });
      }
      const isLocalImage = /^\/images\/[A-Za-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(image);
      let isStoredImage = false;
      try {
        const parsedImage = new URL(image);
        const parsedProject = new URL(projectUrl);
        isStoredImage = parsedImage.origin === parsedProject.origin && /^\/storage\/v1\/object\/public\/product-images\/[a-f0-9-]+\.(?:webp|png|jpe?g)$/i.test(parsedImage.pathname) && !parsedImage.search && !parsedImage.hash;
      } catch {}
      if (!isLocalImage && !isStoredImage) return res.status(400).json({ error: "invalid_product_image" });
      const row = {
        id,
        name_uz: String(p.name_uz).trim().slice(0, 140),
        name_ru: String(p.name_ru).trim().slice(0, 140),
        category: p.category === "girls" ? "girls" : "boys",
        type: /^[a-z0-9_-]{1,32}$/i.test(String(p.type || "sets")) ? String(p.type || "sets") : "sets",
        price,
        old_price: oldPrice,
        age: String(p.age || "").slice(0, 40),
        colors: Array.isArray(p.colors) ? p.colors.slice(0, 8).filter((x) => /^#[0-9a-f]{6}$/i.test(String(x))).map(String) : [],
        image_url: image,
        badge: String(p.badge || "").slice(0, 32),
        tagline_uz: String(p.tagline_uz || "").slice(0, 180),
        tagline_ru: String(p.tagline_ru || "").slice(0, 180),
        sizes: Array.isArray(p.sizes) ? [...new Set(p.sizes.slice(0, 16).map((x) => String(x).trim().slice(0, 32)).filter(Boolean))] : [],
        stock,
        active: p.active !== false,
        updated_at: new Date().toISOString(),
      };
      const saved = await request("products?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(row) });
      return res.status(200).json({ product: saved?.[0] || row });
    }
    if (action === "hideProduct") {
      const id = String(body.id || "").replace(/[^a-z0-9-]/gi, "");
      if (!id) return res.status(400).json({ error: "invalid_product" });
      await request(`products?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }) });
      return res.status(200).json({ ok: true });
    }
    if (action === "updateOrder") {
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!/^[0-9a-f-]{36}$/i.test(id) || !["new", "confirmed", "packing", "sent", "completed", "cancelled"].includes(status)) return res.status(400).json({ error: "invalid_order_update" });
      await request(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status }) });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "unknown_action" });
  } catch (error) {
    console.error("admin_request_failed", error.message);
    return res.status(503).json({ error: "admin_service_unavailable" });
  }
};
