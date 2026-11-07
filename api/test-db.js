const pool = require("../lib/db");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const result = await pool.query("SELECT NOW() AS connected_at");

    return res.status(200).json({
      success: true,
      message: "DB Connected successfully",
      connectedAt: result.rows[0].connectedAt,
    });
  } catch (error) {
    console.error("DB Connection failed: ", error.message);

    return res.status(500).json({
      success: false,
      message: "DB connection failed",
    });
  }
};
