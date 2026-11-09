const allowedOrigins = new Set([
  "https://www.elitser-me.com",
  "https://elitser-me.com",
  "https://elitser-webapp.vercel.app",
  "http://127.0.0.1:5500",
]);

function applyCors(req, res) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }

  return true;
}

module.exports = { applyCors };
