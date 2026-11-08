const pool = require("../lib/db");
const { applyCors } = require("../lib/cors");

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
        id,
        job_reference,
        title,
        department,
        description,
        location,
        employment_type,
        salary_range,
        is_urgent,
        posted_at
      FROM jobs
      WHERE status = 'published'
      ORDER BY posted_at DESC`,
    );

    return res.status(200).json({
      success: true,
      jobs: result.rows,
    });
  } catch (error) {
    console.error("Public API jobs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch job openings",
    });
  }
};
