module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).send("Telegram bot is not configured.");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const result = await response.json();
    const username = result?.result?.username;
    if (!response.ok || !result.ok || !username) {
      return res.status(502).send("Telegram Mini App is temporarily unavailable.");
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const target = result.result.has_main_web_app
      ? `https://t.me/${encodeURIComponent(username)}?startapp`
      : `https://t.me/${encodeURIComponent(username)}`;
    return res.redirect(302, target);
  } catch {
    return res.status(502).send("Telegram Mini App is temporarily unavailable.");
  }
};
