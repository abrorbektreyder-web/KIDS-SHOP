const buckets = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-vercel-forwarded-for"] || req.headers["x-real-ip"] || req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || "").split(",")[0];
  return value.trim().slice(0, 64) || "unknown";
}

function takeRateLimit(req, scope, limit, windowMs) {
  const now = Date.now();
  const key = `${scope}:${clientIp(req)}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  if (bucket.count >= limit) {
    return { limited: true, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 10000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  return { limited: false, retryAfter: 0 };
}

function clearRateLimit(req, scope) {
  buckets.delete(`${scope}:${clientIp(req)}`);
}

function rateLimitResponse(res, retryAfter) {
  res.setHeader("Retry-After", String(retryAfter));
  res.setHeader("Cache-Control", "no-store");
  return res.status(429).json({ error: "too_many_requests" });
}

module.exports = { takeRateLimit, clearRateLimit, rateLimitResponse };
