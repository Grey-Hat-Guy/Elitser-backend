const { createClient } = require("@supabase/supabase-js");
const pool = require("./db");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

async function requireAdmin(req, res) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return null;
  }

  const token = authorization.substring(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
      return null;
    }

    const result = await pool.query(
      `SELECT id, email
       FROM admin_users
       WHERE id = $1 AND is_active = TRUE`,
      [data.user.id],
    );

    if (result.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: "Admin access denied",
      });
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Admin authentication error:", error.message);

    res.status(500).json({
      success: false,
      message: "Authentication service error",
    });

    return null;
  }
}

module.exports = { requireAdmin };
