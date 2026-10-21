const { getSupabaseConfig, supabaseHeaders } = require("../_supabase");
const { verifyMerchantToken, extractMerchantToken } = require("./_auth-helper");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

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

  try {
    // 1. Shu do'konning barcha buyurtmalarini olish
    const ordersRes = await fetch(
      new URL(
        `/rest/v1/orders?store_id=eq.${encodeURIComponent(storeId)}&select=id,total,status,created_at,order_items(product_name,quantity,unit_price)`,
        url
      ),
      { headers: supabaseHeaders(key) }
    );

    if (!ordersRes.ok) throw new Error("failed_fetch_orders");
    const orders = await ordersRes.json();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayRev = 0, todayCount = 0;
    let weekRev = 0, weekCount = 0;
    let monthRev = 0, monthCount = 0;
    let totalRev = 0, totalCount = orders.length;

    const productSalesMap = new Map();

    for (const ord of orders) {
      if (ord.status === "cancelled") continue; // bekor qilinganlar tushumga kirmaydi
      const total = Number(ord.total || 0);
      const createdAt = new Date(ord.created_at).getTime();

      totalRev += total;

      if (createdAt >= startOfToday) {
        todayRev += total;
        todayCount += 1;
      }
      if (createdAt >= startOfWeek) {
        weekRev += total;
        weekCount += 1;
      }
      if (createdAt >= startOfMonth) {
        monthRev += total;
        monthCount += 1;
      }

      // Top tovarlarni hisoblash
      const items = ord.order_items || [];
      for (const item of items) {
        const name = item.product_name || "Noma’lum tovar";
        const qty = Number(item.quantity || 1);
        const cur = productSalesMap.get(name) || { name, qty: 0, revenue: 0 };
        cur.qty += qty;
        cur.revenue += qty * Number(item.unit_price || 0);
        productSalesMap.set(name, cur);
      }
    }

    const topProducts = [...productSalesMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return res.status(200).json({
      ok: true,
      stats: {
        today: { revenue: todayRev, orders: todayCount },
        week: { revenue: weekRev, orders: weekCount },
        month: { revenue: monthRev, orders: monthCount },
        total: { revenue: totalRev, orders: totalCount },
        topProducts,
      },
    });
  } catch (err) {
    console.error("merchant_analytics_error", err);
    return res.status(500).json({ error: "failed_to_calculate_analytics" });
  }
};
