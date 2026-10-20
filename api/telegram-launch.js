module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const username = String(process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) {
    return res.status(503).send("Telegram Mini App link is not configured yet.");
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.redirect(302, `https://t.me/${encodeURIComponent(username)}?startapp`);
};
