const { randomUUID } = require("crypto");
const pool = require("../../lib/db");
const supabaseAdmin = require("../../lib/supabaseAdmin");
const { applyCors } = require("../../lib/cors");

const BUCKET = "career-resumes-temp";

const allowedTypes = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { jobId, fileName, fileSize, fileType } = req.body || {};

    if (!jobId || !fileName || !fileSize || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Missing upload information",
      });
    }

    const extension = fileName.split(".").pop().toLowerCase();

    if (!allowedTypes[extension] || allowedTypes[extension] !== fileType) {
      return res.status(400).json({
        success: false,
        message: "Unsupported resume file type",
      });
    }

    if (fileSize <= 0 || fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Resume must be between 1 byte and 5 MB",
      });
    }

    const jobResult = await pool.query(
      `SELECT id FROM jobs WHERE id = $1 AND status = 'published'`,
      [jobId],
    );

    if (jobResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This vacancy is no longer available",
      });
    }

    const path = `${randomUUID()}.${extension}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      path,
      token: data.token,
    });
  } catch (error) {
    console.error("Resume upload URL error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to prepare resume upload",
    });
  }
};
