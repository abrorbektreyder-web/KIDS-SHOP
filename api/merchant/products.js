const { getSupabaseConfig, supabaseHeaders } = require("../_supabase");
const { verifyMerchantToken, extractMerchantToken } = require("./_auth-helper");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const token = extractMerchantToken(req);
  const session = verifyMerchantToken(token);
  if (!session) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return res.status(503).json({ error: "database_not_configured" });
  }

  const storeId = session.storeId;
  const method = req.method;

  // =========================================================================
  // GET: Do'kon tovarlari ro'yxati (shu do'kon uchun)
  // =========================================================================
  if (method === "GET") {
    try {
      const endpoint = new URL(
        `/rest/v1/products?store_id=eq.${encodeURIComponent(storeId)}&select=*&order=created_at.desc`,
        url
      );
      const dbRes = await fetch(endpoint, { headers: supabaseHeaders(key) });
      if (!dbRes.ok) throw new Error("products_fetch_failed");

      const rows = await dbRes.json();
      return res.status(200).json({ ok: true, products: rows });
    } catch (err) {
      console.error("merchant_products_get_error", err);
      return res.status(500).json({ error: "failed_to_fetch_products" });
    }
  }

  // =========================================================================
  // POST: Yangi tovar qo'shish
  // =========================================================================
  if (method === "POST") {
    try {
      const p = req.body || {};
      const rawId = String(p.id || "").trim().toLowerCase();
      const id = rawId.replace(/[^a-z0-9-]/g, "").slice(0, 80) || `prod-${Date.now().toString().slice(-6)}`;

      const nameUz = String(p.name_uz || "").trim().slice(0, 150);
      const nameRu = String(p.name_ru || nameUz).trim().slice(0, 150);
      const price = Number.parseInt(p.price, 10);
      const oldPrice = p.old_price ? Number.parseInt(p.old_price, 10) : null;
      const category = ["boys", "girls"].includes(p.category) ? p.category : "boys";
      const type = String(p.type || "sets").trim().slice(0, 50);
      const age = String(p.age || "").trim().slice(0, 50);
      const stock = Number.isInteger(Number(p.stock)) && Number(p.stock) >= 0 ? Number(p.stock) : 10;
      const imageUrl = String(p.image_url || "/images/look-safari.webp").trim();
      const badge = String(p.badge || "").trim().slice(0, 20);
      const taglineUz = String(p.tagline_uz || "").trim().slice(0, 150);
      const taglineRu = String(p.tagline_ru || taglineUz).trim().slice(0, 150);

      // Colors & Sizes array normalization
      const colors = Array.isArray(p.colors)
        ? p.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(String(c)))
        : [];
      const sizes = Array.isArray(p.sizes)
        ? p.sizes.map((s) => String(s).trim()).filter(Boolean)
        : ["2–3 yosh", "3–4 yosh", "5–6 yosh"];

      if (!nameUz || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: "invalid_product_data", message: "Tovar nomi va narxi to‘g‘ri kiritilishi shart." });
      }

      const newProduct = {
        id,
        store_id: storeId,
        name_uz: nameUz,
        name_ru: nameRu,
        category,
        type,
        price,
        old_price: oldPrice,
        age,
        colors,
        sizes,
        stock,
        image_url: imageUrl,
        badge,
        tagline_uz: taglineUz,
        tagline_ru: taglineRu,
        active: p.active !== false,
      };

      const insertRes = await fetch(new URL("/rest/v1/products", url), {
        method: "POST",
        headers: supabaseHeaders(key, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify(newProduct),
      });

      if (!insertRes.ok) {
        const errJson = await insertRes.json().catch(() => ({}));
        throw new Error(errJson.message || "insert_failed");
      }

      const created = await insertRes.json();
      return res.status(201).json({ ok: true, product: created[0] || newProduct });
    } catch (err) {
      console.error("merchant_products_create_error", err);
      return res.status(500).json({ error: "failed_to_create_product", message: err.message });
    }
  }

  // =========================================================================
  // PATCH: Tovarni tahrirlash
  // =========================================================================
  if (method === "PATCH" || method === "PUT") {
    try {
      const p = req.body || {};
      const id = String(p.id || req.query.id || "").trim();

      if (!id) {
        return res.status(400).json({ error: "missing_product_id" });
      }

      const patchPayload = { updated_at: new Date().toISOString() };
      if (p.name_uz !== undefined) patchPayload.name_uz = String(p.name_uz).trim().slice(0, 150);
      if (p.name_ru !== undefined) patchPayload.name_ru = String(p.name_ru).trim().slice(0, 150);
      if (p.price !== undefined) patchPayload.price = Number.parseInt(p.price, 10);
      if (p.old_price !== undefined) patchPayload.old_price = p.old_price ? Number.parseInt(p.old_price, 10) : null;
      if (p.category !== undefined) patchPayload.category = p.category;
      if (p.type !== undefined) patchPayload.type = String(p.type).trim();
      if (p.age !== undefined) patchPayload.age = String(p.age).trim();
      if (p.stock !== undefined) patchPayload.stock = Math.max(0, Number.parseInt(p.stock, 10) || 0);
      if (p.active !== undefined) patchPayload.active = Boolean(p.active);
      if (p.image_url !== undefined) patchPayload.image_url = String(p.image_url).trim();
      if (p.badge !== undefined) patchPayload.badge = String(p.badge).trim();
      if (p.tagline_uz !== undefined) patchPayload.tagline_uz = String(p.tagline_uz).trim();
      if (p.tagline_ru !== undefined) patchPayload.tagline_ru = String(p.tagline_ru).trim();
      if (Array.isArray(p.colors)) patchPayload.colors = p.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(String(c)));
      if (Array.isArray(p.sizes)) patchPayload.sizes = p.sizes.map((s) => String(s).trim()).filter(Boolean);

      const updateRes = await fetch(
        new URL(`/rest/v1/products?id=eq.${encodeURIComponent(id)}&store_id=eq.${encodeURIComponent(storeId)}`, url),
        {
          method: "PATCH",
          headers: supabaseHeaders(key, {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          }),
          body: JSON.stringify(patchPayload),
        }
      );

      if (!updateRes.ok) throw new Error("update_failed");
      const updatedRows = await updateRes.json();

      return res.status(200).json({ ok: true, product: updatedRows[0] });
    } catch (err) {
      console.error("merchant_products_update_error", err);
      return res.status(500).json({ error: "failed_to_update_product" });
    }
  }

  // =========================================================================
  // DELETE: Tovarni o'chirish (Faqat o'z do'koni uchun)
  // =========================================================================
  if (method === "DELETE") {
    try {
      const id = String(req.query.id || req.body?.id || "").trim();
      if (!id) return res.status(400).json({ error: "missing_product_id" });

      const delRes = await fetch(
        new URL(`/rest/v1/products?id=eq.${encodeURIComponent(id)}&store_id=eq.${encodeURIComponent(storeId)}`, url),
        {
          method: "DELETE",
          headers: supabaseHeaders(key, { "Content-Type": "application/json" }),
        }
      );

      if (!delRes.ok) throw new Error("delete_failed");
      return res.status(200).json({ ok: true, deletedId: id });
    } catch (err) {
      console.error("merchant_products_delete_error", err);
      return res.status(500).json({ error: "failed_to_delete_product" });
    }
  }

  res.setHeader("Allow", "GET, POST, PATCH, PUT, DELETE");
  return res.status(405).json({ error: "method_not_allowed" });
};
