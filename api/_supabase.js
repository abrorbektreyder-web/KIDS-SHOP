function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function supabaseHeaders(key, extra = {}) {
  const headers = { apikey: key, ...extra };
  // New Supabase secret keys are opaque API keys, not JWTs. Legacy service_role
  // keys still need the Authorization header to establish the Postgres role.
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}

module.exports = { getSupabaseConfig, supabaseHeaders };
