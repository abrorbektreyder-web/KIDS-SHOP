const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

// 1. Load .env.local
function loadEnv() {
  const envFiles = [".env.local", ".env.production.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          if (process.env[k] === undefined || process.env[k] === "") {
            process.env[k] = v;
          }
        }
      }
    }
  }
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    process.env.SUPER_ADMIN_PASSWORD = "admin123";
  }
}
loadEnv();

const PORT = 4173;
const PUBLIC_DIR = path.resolve(__dirname, "public");
const API_DIR = path.resolve(__dirname, "api");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// Enhance res with serverless helper methods
function enhanceResponse(res) {
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.setHeader("Content-Type", "application/json; charset=utf-8");
    this.end(JSON.stringify(data));
    return this;
  };
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Telegram Mini App CSP
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://webk.telegram.org https://webz.telegram.org;"
  );

  // =========================================================================
  // API ROUTING (/api/*)
  // =========================================================================
  if (pathname.startsWith("/api/")) {
    const apiRelative = pathname.slice(5); // e.g. "super-admin/auth" or "products"
    let handlerPath = path.resolve(API_DIR, `${apiRelative}.js`);

    if (!fs.existsSync(handlerPath)) {
      handlerPath = path.resolve(API_DIR, apiRelative, "index.js");
    }

    if (fs.existsSync(handlerPath)) {
      try {
        // Read body for POST / PATCH / PUT
        let bodyRaw = "";
        for await (const chunk of req) {
          bodyRaw += chunk;
        }

        req.query = parsedUrl.query;
        if (bodyRaw) {
          try {
            req.body = JSON.parse(bodyRaw);
          } catch {
            req.body = bodyRaw;
          }
        } else {
          req.body = {};
        }

        delete require.cache[require.resolve(handlerPath)];
        const handler = require(handlerPath);
        return await handler(req, res);
      } catch (err) {
        console.error("API Error at", pathname, err);
        return res.status(500).json({ error: "internal_server_error", message: err.message });
      }
    } else {
      return res.status(404).json({ error: "api_not_found" });
    }
  }

  // =========================================================================
  // STATIC FILES SERVING (/public/*)
  // =========================================================================
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(PUBLIC_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // 404
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 Sahifa topilmadi</h1><p><a href='/'>Bosh sahifaga qaytish</a></p>");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("=================================================");
  console.log(`🚀 KIDS-SHOP SaaS Local Server: http://127.0.0.1:${PORT}`);
  console.log(`👑 Super Admin Panel:          http://127.0.0.1:${PORT}/super-admin/`);
  console.log(`🔑 Super Admin Paroli:         ${process.env.SUPER_ADMIN_PASSWORD || "admin123"}`);
  console.log(`🏪 Vitrina (Do'kon Safari):     http://127.0.0.1:${PORT}/?store=kids-shop`);
  console.log("=================================================");
});
