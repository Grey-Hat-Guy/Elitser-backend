const pool = require("../../../lib/db");
const { requireAdmin } = require("../../../lib/auth");

const allowedFields = [
  "title",
  "department",
  "description",
  "location",
  "employment_type",
  "salary_range",
  "is_urgent",
  "status",
];

module.exports = async (req, res) => {
  if (!["PATCH", "DELETE"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID",
    });
  }

  try {
    // Delete a job
    if (req.method === "DELETE") {
      const result = await pool.query(
        `DELETE FROM jobs WHERE id = $1 RETURNING id`,
        [id],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Job deleted successfully",
      });
    }

    // Update a job
    const body = req.body || {};
    const fields = Object.keys(body).filter((field) =>
      allowedFields.includes(field),
    );

    if (fields.length === 0 || fields.length !== Object.keys(body).length) {
      return res.status(400).json({
        success: false,
        message: "No valid update fields provided",
      });
    }

    const requiredFields = [
      "title",
      "description",
      "location",
      "employment_type",
    ];

    for (const field of fields) {
      const value = body[field];

      if (requiredFields.includes(field)) {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be empty`,
          });
        }
      }

      if (
        ["department", "salary_range"].includes(field) &&
        value !== null &&
        typeof value !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string or null`,
        });
      }

      if (field === "is_urgent" && typeof value !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "is_urgent must be a boolean",
        });
      }

      if (
        field === "status" &&
        !["draft", "published", "closed"].includes(value)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid job status",
        });
      }
    }

    const values = fields.map((field) => {
      const value = body[field];
      return typeof value === "string" ? value.trim() : value;
    });

    const updates = fields.map((field, index) => `${field} = $${index + 1}`);

    if (body.status === "published") {
      updates.push("posted_at = NOW()");
    }

    updates.push("updated_at = NOW()");

    values.push(id);

    const result = await pool.query(
      `UPDATE jobs
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Job update API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update job",
    });
  }
};
