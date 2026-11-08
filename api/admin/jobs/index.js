const pool = require("../../../lib/db");
const { requireAdmin } = require("../../../lib/auth");
const { applyCors } = require("../../../lib/cors");

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    // Fetch all jobs
    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT * FROM jobs ORDER BY created_at DESC`,
      );

      return res.status(200).json({
        success: true,
        jobs: result.rows,
      });
    }

    // Create a Job
    const {
      job_reference,
      title,
      department,
      description,
      location,
      employment_type,
      salary_range,
      is_urgent = false,
      status = "draft",
    } = req.body || {};

    if (
      !job_reference.trim() ||
      !title?.trim() ||
      !description?.trim() ||
      !location?.trim() ||
      !employment_type?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job reference, title, description, location and employment type are required",
      });
    }

    if (typeof is_urgent !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_urgent must be a boolean",
      });
    }

    if (!["draft", "published", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job status",
      });
    }

    const result = await pool.query(
      `INSERT INTO jobs (
        job_reference,
        title,
        department,
        description,
        location,
        employment_type,
        salary_range,
        is_urgent,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        job_reference.trim(),
        title.trim(),
        department?.trim() || null,
        description.trim(),
        location.trim(),
        employment_type.trim(),
        salary_range?.trim() || null,
        is_urgent,
        status,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Admin jobs API error:", error.message);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "This job reference already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to process job request",
    });
  }
};
