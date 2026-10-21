const crypto = require("node:crypto");
const { getSupabaseConfig, supabaseHeaders } = require("../_supabase");
const { verifyToken, extractToken } = require("./_auth-helper");

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password || "")).digest("hex");
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 1. Super Admin autentifikatsiyasini tekshirish
  const token = extractToken(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return res.status(503).json({ error: "database_not_configured" });
  }

  const method = req.method;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "kids_shbot";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "kids-shop-six.vercel.app";
  const origin = `${proto}://${host}`;

  // =========================================================================
  // GET: Barcha do'konlar ro'yxati va global analitika
  // =========================================================================
  if (method === "GET") {
    try {
      // 1. Do'konlarni yuklash
      const storesRes = await fetch(
        new URL("/rest/v1/stores?select=*&order=created_at.desc", url),
        { headers: supabaseHeaders(key) }
      );
      if (!storesRes.ok) throw new Error("failed_fetch_stores");
      const stores = await storesRes.json();

      // 2. Buyurtmalar statistikasini hisoblash
      let orders = [];
      try {
        const ordersRes = await fetch(
          new URL("/rest/v1/orders?select=store_id,total,status", url),
          { headers: supabaseHeaders(key) }
        );
        if (ordersRes.ok) orders = await ordersRes.json();
      } catch {}

      // Do'konlar bo'yicha buyurtmalar xaritasi
      const statsByStore = new Map();
      let totalPlatformRevenue = 0;
      for (const order of orders) {
        const sId = order.store_id || "kids-shop";
        const current = statsByStore.get(sId) || { count: 0, revenue: 0 };
        current.count += 1;
        current.revenue += Number(order.total || 0);
        statsByStore.set(sId, current);
        totalPlatformRevenue += Number(order.total || 0);
      }

      const now = new Date();
      const enrichedStores = stores.map((s) => {
        const sStats = statsByStore.get(s.id) || { count: 0, revenue: 0 };
        const expiresAt = new Date(s.plan_expires_at || s.created_at);
        const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        return {
          id: s.id,
          name: s.name,
          owner_phone: s.owner_phone,
          custom_domain: s.custom_domain,
          theme_color: s.theme_color || "#285ae8",
          plan: s.plan,
          status: s.status,
          plan_expires_at: s.plan_expires_at,
          days_left: daysLeft,
          is_expired: daysLeft <= 0,
          telegram_chat_id: s.telegram_chat_id,
          has_bot_token: Boolean(s.telegram_bot_token),
          created_at: s.created_at,
          order_count: sStats.count,
          total_revenue: sStats.revenue,
          links: {
            web: s.custom_domain ? `https://${s.custom_domain}` : `${origin}/?store=${encodeURIComponent(s.id)}`,
            telegram: `https://t.me/${botUsername}?startapp=${encodeURIComponent(s.id)}`,
            admin: `${origin}/admin/?store=${encodeURIComponent(s.id)}`,
          },
        };
      });

      // Global SaaS KPI ko'rsatkichlari
      const totalStores = enrichedStores.length;
      const activeStores = enrichedStores.filter((s) => s.status === "active").length;
      const suspendedStores = enrichedStores.filter((s) => s.status === "suspended").length;
      const expiringSoon = enrichedStores.filter((s) => s.days_left > 0 && s.days_left <= 7).length;

      // Taxminiy oylik tushum (MRR): Basic ~100k UZS, Pro ~250k UZS
      const estimatedMRR = enrichedStores
        .filter((s) => s.status === "active" && !s.is_expired)
        .reduce((sum, s) => sum + (s.plan === "pro" ? 250000 : s.plan === "basic" ? 100000 : 0), 0);

      return res.status(200).json({
        ok: true,
        stats: {
          totalStores,
          activeStores,
          suspendedStores,
          expiringSoon,
          totalOrders: orders.length,
          totalPlatformRevenue,
          estimatedMRR,
        },
        stores: enrichedStores,
      });
    } catch (err) {
      console.error("super_admin_stores_get_error", err);
      return res.status(500).json({ error: "failed_to_load_stores" });
    }
  }

  // =========================================================================
  // POST: Yangi do'kon yaratish
  // =========================================================================
  if (method === "POST") {
    try {
      const body = req.body || {};
      const rawSlug = String(body.id || body.slug || "").trim().toLowerCase();
      const slug = rawSlug.replace(/[^a-z0-9-]/g, "").slice(0, 50);

      const name = String(body.name || "").trim().slice(0, 100);
      const phone = String(body.owner_phone || "").replace(/[^+\d]/g, "").slice(0, 20);
      const rawPassword = String(body.owner_password || "123456").trim();
      const telegramChatId = String(body.telegram_chat_id || "").trim();
      const themeColor = /^#[0-9a-f]{6}$/i.test(body.theme_color) ? body.theme_color : "#285ae8";
      const plan = ["trial", "basic", "pro"].includes(body.plan) ? body.plan : "basic";
      const days = Number.isInteger(Number(body.days)) && Number(body.days) > 0 ? Number(body.days) : (plan === "pro" ? 365 : 30);

      if (!slug || slug.length < 3) {
        return res.status(400).json({ error: "invalid_store_slug", message: "Do'kon identifikatori (slug) kamida 3 ta belgidan iborat bo'lishi kerak" });
      }
      if (!name || name.length < 2) {
        return res.status(400).json({ error: "invalid_store_name", message: "Do'kon nomi kiritilishi shart" });
      }
      if (!phone || phone.replace(/\D/g, "").length < 9) {
        return res.status(400).json({ error: "invalid_owner_phone", message: "To'g'ri telefon raqami kiritilishi shart" });
      }
      if (!telegramChatId) {
        return res.status(400).json({ error: "missing_telegram_chat_id", message: "Do'konning Telegram guruh/kanal ID si shart" });
      }

      const planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const passwordHash = hashPassword(rawPassword);

      const newStoreData = {
        id: slug,
        name,
        owner_phone: phone,
        owner_password_hash: passwordHash,
        telegram_chat_id: telegramChatId,
        theme_color: themeColor,
        plan,
        status: "active",
        plan_expires_at: planExpiresAt,
        logo_url: "/images/look-safari.webp",
      };

      const createRes = await fetch(new URL("/rest/v1/stores", url), {
        method: "POST",
        headers: supabaseHeaders(key, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify(newStoreData),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({}));
        if (createRes.status === 409 || errorData.code === "23505") {
          return res.status(409).json({ error: "slug_already_exists", message: "Bunday identifikatorli do'kon allaqachon mavjud!" });
        }
        throw new Error(errorData.message || "store_creation_failed");
      }

      const createdRows = await createRes.json();
      const store = createdRows[0] || newStoreData;

      return res.status(201).json({
        ok: true,
        store,
        links: {
          web: `${origin}/?store=${encodeURIComponent(slug)}`,
          telegram: `https://t.me/${botUsername}?startapp=${encodeURIComponent(slug)}`,
          admin: `${origin}/admin/?store=${encodeURIComponent(slug)}`,
        },
        credentials: {
          login: phone,
          password: rawPassword,
        },
      });
    } catch (err) {
      console.error("super_admin_create_store_error", err);
      return res.status(500).json({ error: "failed_to_create_store" });
    }
  }

  // =========================================================================
  // PATCH: Do'kon holatini yangilash (Bloklash, Muddat uzaytirish, Tahrirlash)
  // =========================================================================
  if (method === "PATCH") {
    try {
      const body = req.body || {};
      const storeId = String(body.storeId || body.id || "").trim().toLowerCase();
      const action = body.action || "update";

      if (!storeId) {
        return res.status(400).json({ error: "missing_store_id" });
      }

      let patchPayload = { updated_at: new Date().toISOString() };

      if (action === "toggle_status") {
        const newStatus = body.status === "active" ? "active" : "suspended";
        patchPayload.status = newStatus;
      } else if (action === "extend_plan") {
        const addDays = Number.isInteger(Number(body.days)) && Number(body.days) > 0 ? Number(body.days) : 30;
        // Boshlang'ich muddatni olish
        const curRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=plan_expires_at`, url), {
          headers: supabaseHeaders(key),
        });
        const curData = await curRes.json();
        const baseDate = curData && curData[0]?.plan_expires_at ? new Date(curData[0].plan_expires_at) : new Date();
        const startFrom = baseDate > new Date() ? baseDate : new Date();
        const newExpiry = new Date(startFrom.getTime() + addDays * 24 * 60 * 60 * 1000).toISOString();
        patchPayload.plan_expires_at = newExpiry;
        patchPayload.status = "active"; // avtomatik faollashtirish
      } else if (action === "update") {
        if (body.name) patchPayload.name = String(body.name).trim().slice(0, 100);
        if (body.owner_phone) patchPayload.owner_phone = String(body.owner_phone).trim();
        if (body.telegram_chat_id) patchPayload.telegram_chat_id = String(body.telegram_chat_id).trim();
        if (body.theme_color && /^#[0-9a-f]{6}$/i.test(body.theme_color)) patchPayload.theme_color = body.theme_color;
        if (["trial", "basic", "pro"].includes(body.plan)) patchPayload.plan = body.plan;
        if (body.custom_domain !== undefined) patchPayload.custom_domain = body.custom_domain ? String(body.custom_domain).trim().toLowerCase() : null;
      } else {
        return res.status(400).json({ error: "invalid_patch_action" });
      }

      const updateRes = await fetch(new URL(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}`, url), {
        method: "PATCH",
        headers: supabaseHeaders(key, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify(patchPayload),
      });

      if (!updateRes.ok) throw new Error("update_failed");
      const updatedRows = await updateRes.json();

      return res.status(200).json({ ok: true, store: updatedRows[0] });
    } catch (err) {
      console.error("super_admin_update_store_error", err);
      return res.status(500).json({ error: "failed_to_update_store" });
    }
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  return res.status(405).json({ error: "method_not_allowed" });
};
