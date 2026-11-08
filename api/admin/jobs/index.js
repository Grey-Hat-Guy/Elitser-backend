const pool = require("../../../lib/db");
const { requireAdmin } = require("../../../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const admin = await requireAdmin(req, res);

  if (!admin) return;

  try {
    const result = await req.query(
      `SELECT * FROM jobs ORDER BY created_at DESC`,
    );

    return res.status(200).json({
      success: true,
      jobs: result.rows,
    });
  } catch (error) {
    console.error("Admin jobs API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch jobs",
    });
  }
};
