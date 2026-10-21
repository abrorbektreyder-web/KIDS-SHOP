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
  // GET: Do'kon buyurtmalari (shu do'kon uchun)
  // =========================================================================
  if (method === "GET") {
    try {
      const ordersRes = await fetch(
        new URL(
          `/rest/v1/orders?store_id=eq.${encodeURIComponent(storeId)}&select=*,order_items(*)&order=created_at.desc`,
          url
        ),
        { headers: supabaseHeaders(key) }
      );

      if (!ordersRes.ok) throw new Error("orders_fetch_failed");
      const orders = await ordersRes.json();

      return res.status(200).json({ ok: true, orders });
    } catch (err) {
      console.error("merchant_orders_get_error", err);
      return res.status(500).json({ error: "failed_to_fetch_orders" });
    }
  }

  // =========================================================================
  // PATCH: Buyurtma holatini yangilash (Status: confirmed, sent, completed, cancelled)
  // =========================================================================
  if (method === "PATCH") {
    try {
      const body = req.body || {};
      const orderId = String(body.orderId || body.id || "").trim();
      const nextStatus = String(body.status || "").trim();

      const validStatuses = ["new", "confirmed", "packing", "sent", "completed", "cancelled"];
      if (!orderId || !validStatuses.includes(nextStatus)) {
        return res.status(400).json({ error: "invalid_order_status_update" });
      }

      const updateRes = await fetch(
        new URL(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&store_id=eq.${encodeURIComponent(storeId)}`, url),
        {
          method: "PATCH",
          headers: supabaseHeaders(key, {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          }),
          body: JSON.stringify({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateRes.ok) throw new Error("update_failed");
      const updatedRows = await updateRes.json();

      return res.status(200).json({ ok: true, order: updatedRows[0] });
    } catch (err) {
      console.error("merchant_order_patch_error", err);
      return res.status(500).json({ error: "failed_to_update_order" });
    }
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "method_not_allowed" });
};
